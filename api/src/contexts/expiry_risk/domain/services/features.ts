import { dayNumber, weekday } from './iso-date';
import type { OperatingCalendar } from './operating-calendar';

/**
 * Raw inputs of one lot review → the 18 model features.
 *
 * Port of `training/src/features.py` with the operations in the same order, so
 * both give the same values; `features.spec.ts` checks it against rows Python
 * exported. Missing values are `NaN`, as in training.
 */
export interface LotReviewInput {
  family: string;
  receivedOn: string;
  expiresOn: string;
  reviewedOn: string;
  initialQuantity: number;
  remainingQuantity: number;
  stockAhead: number;
  usage7d: number | null;
  usage28d: number | null;
}

export const MAX_COVERAGE_DAYS = 999;

export const FAMILIES = ['dairy', 'cold_cuts', 'bakery', 'produce', 'eggs'] as const;
export type Family = (typeof FAMILIES)[number];

export const FEATURES = [
  'days_to_expiry',
  'age_days',
  'shelf_life_days',
  'remaining_share',
  'usage_7d',
  'usage_28d',
  'usage_trend',
  'coverage_days',
  'slack_days',
  'share_ahead_fefo',
  'class_share_until_expiry',
  'class_share_last_7d',
  'weekday',
  ...FAMILIES.map((family) => `family_${family}`),
];

const COVERAGE_INDEX = FEATURES.indexOf('coverage_days');
const SLACK_INDEX = FEATURES.indexOf('slack_days');

export function buildFeatures(review: LotReviewInput, calendar: OperatingCalendar): number[] {
  const received = dayNumber(review.receivedOn);
  const expires = dayNumber(review.expiresOn);
  const reviewed = dayNumber(review.reviewedOn);

  const daysToExpiry = expires - reviewed;
  const age = reviewed - received;
  const shelfLife = expires - received;

  const remaining = review.remainingQuantity;
  const ahead = review.stockAhead;
  const usage7d = review.usage7d ?? Number.NaN;
  const usage28d = review.usage28d ?? Number.NaN;

  const remainingShare = remaining / review.initialQuantity;

  const noTrend = Number.isNaN(usage28d) || usage28d === 0 || Number.isNaN(usage7d);
  const trend = noTrend ? Number.NaN : usage7d / usage28d;

  // Days the FEFO queue up to and including this lot lasts at the recent pace.
  let coverage: number;
  if (Number.isNaN(usage7d)) coverage = Number.NaN;
  else if (usage7d <= 0) coverage = MAX_COVERAGE_DAYS;
  else coverage = Math.min((ahead + remaining) / usage7d, MAX_COVERAGE_DAYS);

  // The lot can still be used on its expiry day, hence the +1.
  const slack = Number.isNaN(coverage) ? Number.NaN : daysToExpiry + 1 - coverage;

  const queue = ahead + remaining;
  const shareAhead = queue > 0 ? ahead / queue : 0;

  const classUntilExpiry = calendar.classDayShare(reviewed, expires);
  const classLast7d = calendar.classDayShare(reviewed - 7, reviewed - 1);

  const familyFlags = FAMILIES.map((family) => (review.family === family ? 1 : 0));

  return [
    daysToExpiry,
    age,
    shelfLife,
    remainingShare,
    usage7d,
    usage28d,
    trend,
    coverage,
    slack,
    shareAhead,
    classUntilExpiry,
    classLast7d,
    weekday(reviewed),
    ...familyFlags,
  ];
}

export function coverageDays(features: readonly number[]): number | null {
  const value = features[COVERAGE_INDEX];
  return Number.isNaN(value) ? null : value;
}

/**
 * Baseline (coverage rule): at last week's pace, the FEFO queue up to this lot
 * is not used up before it expires. `null` when there is no usage data.
 */
export function coverageRule(features: readonly number[]): boolean | null {
  const slack = features[SLACK_INDEX];
  return Number.isNaN(slack) ? null : slack < 0;
}
