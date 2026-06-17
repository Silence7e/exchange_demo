import Decimal from 'decimal.js';
import { toDecimal, type DecimalValue } from '../decimal.js';

const formatWithSeparators = (value: Decimal, precision: number): string => {
  const rounded = value.toDecimalPlaces(precision, Decimal.ROUND_HALF_UP);
  const [intPart, decPart] = rounded.toFixed(precision).split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (!decPart || precision === 0) return withCommas;
  const trimmed = decPart.replace(/0+$/, '');
  return trimmed ? `${withCommas}.${trimmed}` : withCommas;
};

export const formatPrice = (value: DecimalValue, precision: number): string =>
  formatWithSeparators(toDecimal(value), precision);

export const formatQuantity = (value: DecimalValue, precision: number): string =>
  formatWithSeparators(toDecimal(value), precision);

export const formatPercent = (value: DecimalValue): string => {
  const num = toDecimal(value).times(100);
  const sign = num.gte(0) ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
};

export const formatVolume = (value: DecimalValue): string => {
  const num = toDecimal(value);
  if (num.gte(1_000_000)) return `${num.div(1_000_000).toFixed(2)}M`;
  if (num.gte(1_000)) return `${num.div(1_000).toFixed(2)}K`;
  return formatWithSeparators(num, 2);
};
