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

/** Узел схемы решения: коробка на инфографике и её расшифровка в раскрытом виде. */
export type FlowNode = {
  /** Подпись в коробке. 2–4 слова: длиннее ломает схему на узкой колонке. */
  label: string;
  /** Цифра над подписью, если у шага она есть. Условная, как и всё в демо. */
  value?: string;
  /** Что происходит на шаге. Видно только когда блок раскрыт. */
  detail: string;
};

export type Demo = {
  id: DemoId;
  /** Короткий тег над заголовком: тот же, что на карточке решения выше. */
  tag: string;
  title: string;
  text: string;
  /** Схема решения. Ровно четыре узла: пятый не читается в строке. */
  flow: readonly FlowNode[];
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
