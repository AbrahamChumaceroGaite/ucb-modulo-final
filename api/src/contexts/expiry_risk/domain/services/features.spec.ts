import { parityRows, pythonFeatures, readModelFile, toInput } from '../../testing/model-files';
import { buildFeatures, coverageDays, coverageRule, FEATURES, MAX_COVERAGE_DAYS, type LotReviewInput } from './features';
import { OperatingCalendar, type CalendarDefinition } from './operating-calendar';

const calendar = new OperatingCalendar(readModelFile<CalendarDefinition>('calendar.json'));

const lot: LotReviewInput = {
  family: 'dairy',
  receivedOn: '2026-03-02',
  expiresOn: '2026-03-12',
  reviewedOn: '2026-03-05',
  initialQuantity: 12000,
  remainingQuantity: 6000,
  stockAhead: 2000,
  usage7d: 1000,
  usage28d: 800,
};

describe('buildFeatures', () => {
  it('reproduces, bit for bit, the features Python computed for every exported row', () => {
    for (const row of parityRows) {
      expect(buildFeatures(toInput(row), calendar)).toEqual(pythonFeatures(row));
    }
    expect(parityRows.length).toBeGreaterThan(400);
  });

  it('agrees with the coverage rule Python applied wherever usage is known', () => {
    const known = parityRows.filter((row) => row.input.usage_7d !== null);
    for (const row of known) {
      expect(coverageRule(buildFeatures(toInput(row), calendar))).toBe(row.rule === 1);
    }
    expect(known.length).toBeGreaterThan(400);
  });

  it('answers "unknown", not "no risk", when there is no usage history', () => {
    const features = buildFeatures({ ...lot, usage7d: null, usage28d: null }, calendar);
    expect(coverageRule(features)).toBeNull();
    expect(coverageDays(features)).toBeNull();
  });

  it('caps coverage when nothing was used last week', () => {
    const features = buildFeatures({ ...lot, usage7d: 0 }, calendar);
    expect(coverageDays(features)).toBe(MAX_COVERAGE_DAYS);
    expect(coverageRule(features)).toBe(true);
  });

  it('flags a lot whose FEFO queue outlasts its expiry', () => {
    // 8000 to get through at 1000 a day is 8 days; the lot is usable for 8 (days 5 to 12).
    expect(coverageRule(buildFeatures(lot, calendar))).toBe(false);
    expect(coverageRule(buildFeatures({ ...lot, stockAhead: 2001 }, calendar))).toBe(true);
  });

  it('builds one value per declared feature, family as one-hot', () => {
    const features = buildFeatures(lot, calendar);
    expect(features).toHaveLength(FEATURES.length);
    expect(features[FEATURES.indexOf('family_dairy')]).toBe(1);
    expect(features[FEATURES.indexOf('family_bakery')]).toBe(0);
  });
});
