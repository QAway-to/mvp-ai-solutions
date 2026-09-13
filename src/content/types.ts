/** Типы контента лендинга. Все тексты лежат в offer.ts, разметка их только рисует. */

export type Pain = {
  title: string;
  text: string;
};

export type Service = {
  /** Короткий тег над заголовком карточки: чем это является по сути. */
  tag: string;
  title: string;
  text: string;
  /** Что конкретно снимается с людей. 2–3 пункта, иначе карточка распухает. */
  bullets: readonly string[];
};

/** Идентификатор демо-экрана: связывает данные вкладки с её компонентом. */
export type DemoId = 'bot' | 'leads' | 'sync' | 'content' | 'report' | 'funnel';

/**
 * Схема решения. Координаты задаются руками в системе 1120×360: авто-раскладка
 * на шести разных сюжетах даёт кашу, а сцены рисуются один раз и живут годами.
 */
export type NodeKind =
  /** Откуда приходит работа: канал, площадка, система. */
  | 'source'
  /** То, что мы внедряем. На сцене ровно одно — иначе непонятно, что покупают. */
  | 'core'
  /** Данные, которыми ядро пользуется: база знаний, выгрузки, правила. */
  | 'store'
  /** Результат для бизнеса. */
  | 'out'
  /** Человек в контуре. Белая плашка: видно, что решение остаётся за людьми. */
  | 'human';

export type DiagramIcon =
  | 'chat'
  | 'phone'
  | 'globe'
  | 'bot'
  | 'book'
  | 'user'
  | 'store'
  | 'table'
  | 'chart'
  | 'doc'
  | 'clock'
  | 'alert';

export type DiagramNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: NodeKind;
  /** Подпись. До ~22 знаков: SVG не переносит текст, длинное вылезет из рамки. */
  label: string;
  /** Вторая строка: цифра, уточнение, статус. */
  sub?: string;
  icon?: DiagramIcon;
};

export type DiagramEdge = {
  from: string;
  to: string;
  /** Подпись на стрелке. Без неё связь читается как «как-то связано». */
  label?: string;
  /** Пунктир — для чтения данных, а не передачи работы дальше. */
  dashed?: boolean;
  /** Сдвиг подписи от середины связи, когда она наезжает на соседнюю. */
  labelDy?: number;
};

export type Diagram = {
  /**
   * Что показывает картинка — словами. Единственный канал для скринридера:
   * сама сцена для него закрыта (role="img"), поэтому узел или цифра, которых
   * нет в этом тексте, для незрячего читателя не существуют. Меняете сцену —
   * меняйте и alt.
   */
  alt: string;
  /** Высота сцены, если сюжету не нужны все 360: пустая полоса читается как брак. */
  height?: number;
  nodes: readonly DiagramNode[];
  edges: readonly DiagramEdge[];
};

export type Demo = {
  id: DemoId;
  /** Короткий тег над заголовком: тот же, что на карточке решения выше. */
  tag: string;
  title: string;
  text: string;
  diagram: Diagram;
  /** Что система делает сама. Три-четыре пункта в раскрытом виде. */
  steps: readonly string[];
};

export type ProcessStep = {
  /** Номер шага показывается табличными цифрами, поэтому строка, а не число. */
  no: string;
  title: string;
  duration: string;
  text: string;
};

export type Outcome = {
  title: string;
  text: string;
};

export type PricingTier = {
  name: string;
  price: string;
  priceNote: string;
  text: string;
  features: readonly string[];
  cta: string;
  /** Тёмная карточка по центру — приём дизайн-системы, ровно одна на блок. */
  featured: boolean;
};

export type FaqItem = {
  q: string;
  a: string;
};

export type Testimonial = {
  name: string;
  role: string;
  text: string;
};
