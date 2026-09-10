import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sirv from 'sirv';

/**
 * HTTP-сервер лендинга: раздаёт собранную статику из `dist/` и принимает
 * заявки на POST /api/lead, пересылая их в Telegram.
 *
 * Почему форма ходит сюда, а не в Telegram напрямую: у Bot API нет способа
 * отправить сообщение, не предъявив токен бота. Отправка из браузера означала
 * бы токен в исходниках страницы — то есть у любого посетителя. Здесь токен
 * читается из переменных окружения и наружу не выходит.
 *
 * Отсюда же следует, что сайт должен быть развёрнут на Render как Web Service,
 * а не Static Site: у статики нет процесса, который принял бы форму.
 */

const PORT = Number(process.env.PORT) || 10000;
const HOST = '0.0.0.0';
const ROOT = join(import.meta.dirname, 'dist');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!existsSync(ROOT)) {
  throw new Error(`Каталог ${ROOT} не найден — сначала выполните npm run build`);
}

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  // Не падаем: страница должна открываться и без настроенного бота, иначе
  // одна забытая переменная роняет весь сайт. Но предупреждаем в логах.
  process.stderr.write(
    'TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы — заявки приниматься не будут\n',
  );
}

/** Адреса без слеша: канонический вид страницы — со слешем (trailingSlash: always). */
const REDIRECTS = new Map([['/index.html', '/']]);

/** Хешированные ассеты кэшируются навсегда, HTML — никогда. */
const IMMUTABLE_PATH = /^\/(?:_astro|img|fonts)\//;

/** Больше этого в заявке быть не может: поля формы ограничены maxlength. */
const MAX_BODY_BYTES = 8 * 1024;

// Записаны кодами, а не литералами: так в исходнике не появляется
// невидимых символов, которые незаметно переживают копирование.
const NEWLINE = String.fromCharCode(10);
const CARRIAGE_RETURN = String.fromCharCode(13);

const LIMITS = { name: 80, contact: 120, message: 1500, source: 400, referrer: 400 };

/**
 * Ограничение частоты заявок. Считается в двух разрезах, и это не избыточность.
 *
 * Адрес отправителя берётся из X-Forwarded-For, который проставляет прокси
 * Render. Заголовок приходит от клиента и может быть подделан: если прокси
 * не перезаписывает его целиком, а дописывает свой хоп, то первое значение
 * в списке — то, что прислал сам отправитель. Поэтому лимит на адрес честно
 * считается «лучшим приближением», а рядом стоит общий лимит на весь сервис,
 * который подделкой заголовка не обходится: сколько бы адресов ни выдумал
 * скрипт, суммарный поток заявок упрётся в потолок.
 *
 * Оба счётчика живут в памяти процесса: при рестарте обнуляются, на нескольких
 * инстансах каждый считает своё. Задача — отсечь скрипт, который льёт заявки
 * пачками, а не построить точную квоту.
 */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const PER_IP_LIMIT = 5;
const GLOBAL_LIMIT = 60;

// Потолок на число отслеживаемых адресов: иначе поток выдуманных значений
// X-Forwarded-For раздувает карту до отказа по памяти.
const MAX_TRACKED_IPS = 5000;

const hits = new Map();
let globalHits = [];

const withinWindow = (times, now) => times.filter((at) => now - at < RATE_WINDOW_MS);

const forgetOldestIps = () => {
  // Map отдаёт ключи в порядке вставки, поэтому первые — самые давние.
  const excess = Math.ceil(MAX_TRACKED_IPS / 10);
  let removed = 0;

  for (const ip of hits.keys()) {
    if (removed >= excess) break;
    hits.delete(ip);
    removed += 1;
  }
};

const isRateLimited = (ip) => {
  const now = Date.now();

  globalHits = withinWindow(globalHits, now);
  if (globalHits.length >= GLOBAL_LIMIT) return true;

  const perIp = withinWindow(hits.get(ip) ?? [], now);

  if (perIp.length >= PER_IP_LIMIT) {
    hits.set(ip, perIp);
    return true;
  }

  if (!hits.has(ip) && hits.size >= MAX_TRACKED_IPS) forgetOldestIps();

  hits.set(ip, [...perIp, now]);
  globalHits = [...globalHits, now];
  return false;
};

// Счётчики не должны расти бесконечно на живущем неделями процессе.
setInterval(() => {
  const now = Date.now();
  globalHits = withinWindow(globalHits, now);

  for (const [ip, times] of hits) {
    const recent = withinWindow(times, now);
    if (recent.length === 0) hits.delete(ip);
    else hits.set(ip, recent);
  }
}, RATE_WINDOW_MS).unref();

const clientIp = (req) => {
  // См. комментарий к лимитам: значение подделываемо, поэтому оно только
  // разделяет добросовестных посетителей, а не защищает само по себе.
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (raw?.split(',')[0] ?? req.socket.remoteAddress ?? 'unknown').trim();
};

/**
 * CSP оставляет 'unsafe-inline' для скриптов и стилей: Astro вкладывает
 * небольшие бандлы прямо в HTML, и без этого страница просто не поедет.
 * Ценность правила в другом — оно запрещает подгружать скрипты и отправлять
 * формы куда-либо, кроме своего же домена.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const setSecurityHeaders = (res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Content-Security-Policy', CSP);
  // По HTTP браузер этот заголовок игнорирует, так что локальной разработке
  // он не мешает; на Render, где TLS терминируется прокси, он работает.
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
};

const sendJson = (res, status, payload) => {
  // Соединение могло оборваться, пока готовился ответ: писать в закрытый
  // сокет бессмысленно и приводит к ошибке на ровном месте.
  if (res.writableEnded || res.headersSent) return;

  setSecurityHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;

      if (size > MAX_BODY_BYTES) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

/**
 * Обрезка и чистка.
 *
 * Управляющие символы заменяются пробелом: иначе одна заявка нарисует в чате
 * мусор или спрячет часть текста. Вместе с ними убираются символы категории
 * Cf — невидимые «форматирующие», среди которых U+202E: им можно развернуть
 * строку и показать получателю не то, что отправлено на самом деле.
 * Перевод строки сохраняется — без него описание задачи слипнется в кашу.
 */
const FORMAT_CHAR = /\p{Cf}/u;

const isPrintable = (char) => {
  const code = char.codePointAt(0) ?? 0;
  if (char === NEWLINE) return true;
  return code > 31 && code !== 127 && !FORMAT_CHAR.test(char);
};

const clean = (value, limit) =>
  typeof value === 'string'
    ? Array.from(value.replaceAll(CARRIAGE_RETURN, ''))
        .map((char) => (isPrintable(char) ? char : ' '))
        .join('')
        .trim()
        .slice(0, limit)
    : '';

const sendToTelegram = async (text) => {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // parse_mode намеренно не задан: текст заявки пишет посторонний человек,
    // и любая разметка в нём при разборе ломала бы сообщение целиком.
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    // Тело ответа Telegram содержит токен только в URL, но на всякий случай
    // в лог уходит статус, а не сырой ответ.
    throw new Error(`Telegram ответил ${response.status}`);
  }
};

const handleLead = async (req, res) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return sendJson(res, 503, { ok: false });
  }

  if (isRateLimited(clientIp(req))) {
    return sendJson(res, 429, { ok: false });
  }

  let payload;

  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    return sendJson(res, 400, { ok: false });
  }

  if (typeof payload !== 'object' || payload === null) {
    return sendJson(res, 400, { ok: false });
  }

  // Ловушка для ботов заполнена — отвечаем как при успехе, чтобы скрипт
  // не понял, что его отсеяли, и не начал подбирать обход.
  if (clean(payload.company, 80) !== '') {
    return sendJson(res, 200, { ok: true });
  }

  const name = clean(payload.name, LIMITS.name);
  const contact = clean(payload.contact, LIMITS.contact);

  if (!name || !contact) {
    return sendJson(res, 400, { ok: false });
  }

  const message = clean(payload.message, LIMITS.message);
  const source = clean(payload.source, LIMITS.source);
  const referrer = clean(payload.referrer, LIMITS.referrer);

  const text = [
    'Заявка с лендинга',
    '',
    `Имя: ${name}`,
    `Контакт: ${contact}`,
    message ? `Задача: ${message}` : 'Задача: не указана',
    '',
    `Страница: ${source || '/'}`,
    referrer ? `Источник: ${referrer}` : 'Источник: прямой заход',
  ].join('\n');

  try {
    await sendToTelegram(text);
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    // Клиенту — только факт неудачи: подробности отправки наружу не нужны.
    process.stderr.write(`Не удалось отправить заявку: ${error.message}\n`);
    return sendJson(res, 502, { ok: false });
  }
};

const notFoundPage = existsSync(join(ROOT, '404.html'))
  ? readFileSync(join(ROOT, '404.html'))
  : null;

const sendNotFound = (res) => {
  setSecurityHeaders(res);
  res.setHeader('Cache-Control', 'no-cache');

  if (notFoundPage) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(notFoundPage);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404');
};

const serveStatic = sirv(ROOT, {
  etag: true,
  // Отдаём заранее сжатые .br/.gz из scripts/precompress.mjs: за web service
  // никто не сжимает ответы, в отличие от CDN у статики.
  brotli: true,
  gzip: true,
  setHeaders(res, pathname) {
    setSecurityHeaders(res);
    res.setHeader(
      'Cache-Control',
      IMMUTABLE_PATH.test(pathname) ? 'public, max-age=31536000, immutable' : 'no-cache',
    );
  },
  onNoMatch(_req, res) {
    sendNotFound(res);
  },
});

const server = createServer((req, res) => {
  // Оборванное соединение — обычное дело: посетитель закрыл вкладку, не дождавшись
  // ответа. Без слушателей такая ошибка всплывает наверх и роняет весь процесс,
  // то есть сайт для всех, из-за одного ушедшего человека.
  req.on('error', () => {});
  res.on('error', () => {});

  // Режем по первому знаку вопроса: метки рекламных кампаний должны доезжать
  // целиком, даже если внутри значения попался ещё один такой знак.
  const url = req.url ?? '/';
  const separator = url.indexOf('?');
  const pathname = separator === -1 ? url : url.slice(0, separator);
  const query = separator === -1 ? '' : url.slice(separator + 1);

  if (pathname === '/api/lead') {
    if (req.method !== 'POST') {
      setSecurityHeaders(res);
      res.writeHead(405, { Allow: 'POST' });
      res.end();
      return;
    }

    handleLead(req, res).catch((error) => {
      process.stderr.write(`Необработанная ошибка в /api/lead: ${error?.message}\n`);
      if (res.headersSent) res.destroy();
      else sendJson(res, 500, { ok: false });
    });
    return;
  }

  const target = REDIRECTS.get(pathname);

  if (target) {
    setSecurityHeaders(res);
    res.writeHead(301, { Location: query ? `${target}?${query}` : target });
    res.end();
    return;
  }

  serveStatic(req, res);
});

// Форма отправляет несколько килобайт JSON. Дефолтные пять минут на запрос
// позволяют держать соединение открытым, отдавая тело по байту в минуту —
// дешёвый способ занять единственный инстанс ничем.
server.requestTimeout = 15000;
server.headersTimeout = 10000;

server.listen(PORT, HOST, () => {
  process.stdout.write(`Лендинг из ${ROOT} отдаётся на http://${HOST}:${PORT}\n`);
});

// Без этого Render ждёт таймаута на каждом деплое.
const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
