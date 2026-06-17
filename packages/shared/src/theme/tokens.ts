export const COLOR_CONVENTION = 'green-up' as const;

export const SEMANTIC_COLORS = {
  priceUp: 'var(--color-price-up)',
  priceDown: 'var(--color-price-down)',
  priceNeutral: 'var(--color-price-neutral)',
  bid: 'var(--color-bid)',
  ask: 'var(--color-ask)',
} as const;

export type ColorConvention = typeof COLOR_CONVENTION;
