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
