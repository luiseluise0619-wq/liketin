const { secondsUntilMidnight, nextMidnight, dateKey } = require('../src/utils/time');

describe('time utils', () => {
  it('returns seconds until the next midnight (positive, < 1 day)', () => {
    const noon = new Date(2026, 0, 15, 12, 0, 0);
    const secs = secondsUntilMidnight(noon);
    expect(secs).toBe(12 * 60 * 60);
  });

  it('never returns zero or negative', () => {
    const almostMidnight = new Date(2026, 0, 15, 23, 59, 59, 999);
    expect(secondsUntilMidnight(almostMidnight)).toBeGreaterThan(0);
  });

  it('nextMidnight rolls to the following day', () => {
    const iso = nextMidnight(new Date(2026, 0, 15, 8, 0, 0));
    expect(new Date(iso).getDate()).toBe(16);
  });

  it('dateKey formats as YYYY-MM-DD', () => {
    expect(dateKey(new Date(2026, 0, 5, 8, 0, 0))).toBe('2026-01-05');
  });
});
