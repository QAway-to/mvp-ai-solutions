import type { DemoId, Diagram } from './types';

/**
 * Сцены решений. Координаты — в системе 1120×360, одной для всех шести:
 * источники слева, ядро в середине, результаты справа. Общая сетка держит
 * шесть картинок как один визуальный язык, а не шесть разных рисунков.
 *
 * Цифры на связях — иллюстрация того, что система считает, а не результаты
 * клиентов. Не переносить их в заголовки и обещания лендинга.
 */
export const diagrams: Record<DemoId, Diagram> = {
  bot: {
    alt:
      'Вопросы из Telegram, WhatsApp и формы на сайте приходят к ИИ-агенту поддержки. Агент читает ' +
      'базу знаний, отвечает клиенту за 4 секунды, а сложное передаёт менеджеру с историей диалога.',
    nodes: [
      { id: 'tg', kind: 'source', icon: 'chat', label: 'Telegram', x: 0, y: 30, w: 210, h: 64 },
      { id: 'wa', kind: 'source', icon: 'phone', label: 'WhatsApp', x: 0, y: 148, w: 210, h: 64 },
      { id: 'web', kind: 'source', icon: 'globe', label: 'Форма на сайте', x: 0, y: 266, w: 210, h: 64 },
      {
        id: 'core',
        kind: 'core',
        icon: 'bot',
        label: 'ИИ-агент поддержки',
        sub: 'отвечает круглосуточно',
        x: 400,
        y: 136,
        w: 260,
        h: 88,
      },
      {
        id: 'kb',
        kind: 'store',
        icon: 'book',
        label: 'База знаний',
        sub: 'прайс, документы, переписки',
        x: 400,
        y: 282,
        w: 260,
        h: 64,
      },
      {
        id: 'answer',
        kind: 'out',
        icon: 'chat',
        label: 'Ответ клиенту',
        sub: '4 секунды, на его языке',
        x: 840,
        y: 70,
        w: 260,
        h: 72,
      },
      {
        id: 'human',
        kind: 'out',
        icon: 'user',
        label: 'Менеджеру',
        sub: 'с историей диалога',
        x: 840,
        y: 218,
        w: 260,
        h: 72,
      },
    ],
    edges: [
      { from: 'tg', to: 'core', label: 'вопрос' },
      { from: 'wa', to: 'core' },
      { from: 'web', to: 'core' },
      { from: 'kb', to: 'core', label: 'читает', dashed: true },
      { from: 'core', to: 'answer', label: 'отвечает сам' },
      { from: 'core', to: 'human', label: 'сложное', labelDy: 18 },
    ],
  },

  leads: {
    alt:
      'Робот обходит биржи, каналы и чаты, отбирает по вашим критериям три запроса из сорока семи, ' +
      'пишет черновик отклика и отдаёт его вам: без вашего подтверждения ничего не уходит.',
    nodes: [
      { id: 'boards', kind: 'source', icon: 'globe', label: 'Биржи и площадки', x: 0, y: 30, w: 220, h: 64 },
      { id: 'channels', kind: 'source', icon: 'chat', label: 'Telegram-каналы', x: 0, y: 148, w: 220, h: 64 },
      { id: 'chats', kind: 'source', icon: 'doc', label: 'Чаты и рассылки', x: 0, y: 266, w: 220, h: 64 },
      {
        id: 'core',
        kind: 'core',
        icon: 'bot',
        label: 'Робот поиска',
        sub: '47 запросов в день',
        x: 380,
        y: 136,
        w: 240,
        h: 88,
      },
      {
        id: 'rules',
        kind: 'store',
        icon: 'table',
        label: 'Ваши критерии',
        sub: 'ниша, бюджет, стоп-слова',
        x: 380,
        y: 282,
        w: 240,
        h: 64,
      },
      {
        id: 'draft',
        kind: 'out',
        icon: 'doc',
        label: 'Черновик отклика',
        sub: 'под конкретный запрос',
        x: 700,
        y: 144,
        w: 210,
        h: 72,
      },
      { id: 'tap', kind: 'human', icon: 'user', label: 'Ваш тап', sub: 'в Telegram', x: 950, y: 144, w: 160, h: 72 },
    ],
    edges: [
      { from: 'boards', to: 'core' },
      { from: 'channels', to: 'core', label: '47 в день' },
      { from: 'chats', to: 'core' },
      { from: 'rules', to: 'core', label: 'фильтрует по', dashed: true },
      { from: 'core', to: 'draft', label: '3 подходят' },
      { from: 'draft', to: 'tap', label: 'отправка' },
    ],
  },

  sync: {
    alt:
      'Магазин, CRM, склад и таблицы связаны через шину синхронизации: изменения едут между системами ' +
      'каждые две минуты, каждое попадает в лог, а при расхождении система зовёт человека.',
    nodes: [
      { id: 'shop', kind: 'source', icon: 'store', label: 'Магазин', x: 0, y: 60, w: 200, h: 64 },
      { id: 'crm', kind: 'source', icon: 'table', label: 'CRM', x: 0, y: 240, w: 200, h: 64 },
      {
        id: 'core',
        kind: 'core',
        icon: 'bot',
        label: 'Шина синхронизации',
        sub: 'проход каждые 2 минуты',
        x: 430,
        y: 150,
        w: 260,
        h: 88,
      },
      { id: 'alert', kind: 'out', icon: 'alert', label: 'Расхождение — человеку', x: 430, y: 16, w: 260, h: 56 },
      { id: 'log', kind: 'store', icon: 'doc', label: 'Лог: что и почему', x: 430, y: 294, w: 260, h: 56 },
      { id: 'stock', kind: 'out', icon: 'store', label: 'Склад', x: 920, y: 60, w: 200, h: 64 },
      { id: 'sheets', kind: 'out', icon: 'table', label: 'Таблицы', x: 920, y: 240, w: 200, h: 64 },
    ],
    edges: [
      { from: 'shop', to: 'core', label: 'заказы' },
      { from: 'crm', to: 'core', label: 'сделки', labelDy: 16 },
      { from: 'core', to: 'stock', label: 'остатки' },
      { from: 'core', to: 'sheets', label: 'статусы', labelDy: 16 },
      { from: 'core', to: 'alert', label: 'сверяет' },
      { from: 'core', to: 'log', label: 'пишет', dashed: true },
    ],
  },

  content: {
    alt:
      'Контент-агент берёт ваш тон голоса и рубрики, готовит посты, короткие видео и рассылки, ' +
      'а выходит всё это только после вашего согласования.',
    nodes: [
      {
        id: 'voice',
        kind: 'store',
        icon: 'book',
        label: 'Тон голоса и рубрики',
        sub: 'настраивается один раз',
        x: 0,
        y: 148,
        w: 250,
        h: 72,
      },
      {
        id: 'core',
        kind: 'core',
        icon: 'bot',
        label: 'Контент-агент',
        sub: '5 выходов в неделю',
        x: 350,
        y: 140,
        w: 240,
        h: 88,
      },
      { id: 'posts', kind: 'out', icon: 'doc', label: 'Посты', x: 690, y: 24, w: 190, h: 60 },
      { id: 'video', kind: 'out', icon: 'phone', label: 'Короткие видео', x: 690, y: 154, w: 190, h: 60 },
      { id: 'mail', kind: 'out', icon: 'chat', label: 'Рассылки', x: 690, y: 284, w: 190, h: 60 },
      {
        id: 'ok',
        kind: 'human',
        icon: 'user',
        label: 'Ваше «ок»',
        sub: 'и выход по расписанию',
        x: 920,
        y: 148,
        w: 200,
        h: 72,
      },
    ],
    edges: [
      { from: 'voice', to: 'core', label: 'пишет как вы', dashed: true },
      { from: 'core', to: 'posts' },
      { from: 'core', to: 'video' },
      { from: 'core', to: 'mail' },
      { from: 'posts', to: 'ok' },
      { from: 'video', to: 'ok', label: 'на согласование' },
      { from: 'mail', to: 'ok' },
    ],
  },

  report: {
    alt:
      'Вопрос текстом попадает аналитику, тот считает по рекламным кабинетам, заказам и платежам ' +
      'и возвращает ответ с разбивкой и ссылкой на данные, из которых он собран.',
    nodes: [
      { id: 'ads', kind: 'store', icon: 'chart', label: 'Рекламные кабинеты', x: 0, y: 40, w: 240, h: 64 },
      { id: 'orders', kind: 'store', icon: 'store', label: 'Заказы', x: 0, y: 150, w: 240, h: 64 },
      { id: 'pays', kind: 'store', icon: 'doc', label: 'Платежи', x: 0, y: 260, w: 240, h: 64 },
      {
        id: 'ask',
        kind: 'human',
        icon: 'user',
        label: 'Вопрос текстом',
        sub: '«что просело в августе?»',
        x: 410,
        y: 8,
        w: 270,
        h: 72,
      },
      {
        id: 'core',
        kind: 'core',
        icon: 'bot',
        label: 'Аналитик',
        sub: 'считает по вашим данным',
        x: 410,
        y: 170,
        w: 270,
        h: 88,
      },
      {
        id: 'answer',
        kind: 'out',
        icon: 'chart',
        label: 'Ответ с разбивкой',
        sub: 'по каналам и периодам',
        x: 860,
        y: 120,
        w: 250,
        h: 72,
      },
      {
        id: 'source',
        kind: 'store',
        icon: 'doc',
        label: 'Ссылка на данные',
        sub: 'ответ можно проверить',
        x: 860,
        y: 268,
        w: 250,
        h: 72,
      },
    ],
    edges: [
      { from: 'ask', to: 'core', label: 'человеческим языком' },
      { from: 'ads', to: 'core', dashed: true },
      { from: 'orders', to: 'core', label: 'читает', dashed: true },
      { from: 'pays', to: 'core', dashed: true },
      { from: 'core', to: 'answer', label: 'минута вместо дня' },
      { from: 'answer', to: 'source', label: 'прикладывает', dashed: true },
    ],
  },

  funnel: {
    height: 300,
    alt:
      'Путь клиента собран целиком: из 2400 зашедших заявку оставляют 312, до бота доходят 286, ' +
      'оплачивают 74 — и видно, что 26 человек теряются между заявкой и ботом.',
    nodes: [
      { id: 'traffic', kind: 'source', icon: 'globe', label: 'Трафик', sub: '2 400 за месяц', x: 0, y: 40, w: 190, h: 72 },
      { id: 'landing', kind: 'out', icon: 'doc', label: 'Лендинг', x: 250, y: 46, w: 170, h: 64 },
      { id: 'lead', kind: 'out', icon: 'chat', label: 'Заявка', sub: '312', x: 480, y: 40, w: 160, h: 72 },
      {
        id: 'core',
        kind: 'core',
        icon: 'bot',
        label: 'Бот доводит до оплаты',
        sub: 'отвечает, выдаёт, принимает',
        x: 700,
        y: 36,
        w: 250,
        h: 88,
      },
      { id: 'paid', kind: 'out', icon: 'store', label: 'Оплата', sub: '74', x: 1000, y: 40, w: 120, h: 72 },
      { id: 'drop', kind: 'store', icon: 'alert', label: 'Теряются 26', sub: 'между заявкой и ботом', x: 480, y: 200, w: 240, h: 64 },
    ],
    edges: [
      { from: 'traffic', to: 'landing' },
      { from: 'landing', to: 'lead', label: 'заявка' },
      { from: 'lead', to: 'core', label: '286 дошли' },
      { from: 'core', to: 'paid', label: '74 оплатили' },
      { from: 'lead', to: 'drop', label: 'отвал', dashed: true },
    ],
  },
};
