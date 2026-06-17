import Decimal from 'decimal.js';

export { Decimal };

export type DecimalValue = string | number | Decimal;

export const toDecimal = (value: DecimalValue): Decimal => new Decimal(value);

export const add = (a: string, b: string): string => toDecimal(a).plus(b).toString();
export const sub = (a: string, b: string): string => toDecimal(a).minus(b).toString();
export const mul = (a: string, b: string): string => toDecimal(a).times(b).toString();
export const isGte = (a: string, b: string): boolean => toDecimal(a).gte(b);
export const isGt = (a: string, b: string): boolean => toDecimal(a).gt(b);
export const isLte = (a: string, b: string): boolean => toDecimal(a).lte(b);
