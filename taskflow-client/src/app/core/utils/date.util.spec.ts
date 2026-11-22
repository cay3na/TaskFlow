import { asUtc } from './date.util';
 
describe('asUtc', () => {
  it('adds a trailing Z when the time has no timezone', () => {
    expect(asUtc('2026-11-22T11:05:30.123')).toBe('2026-11-22T11:05:30.123Z');
  });
 
  it('leaves a time that already ends with Z unchanged', () => {
    expect(asUtc('2026-11-22T11:05:30Z')).toBe('2026-11-22T11:05:30Z');
  });
 
  it('leaves a time with a +hh:mm or -hh:mm offset unchanged', () => {
    expect(asUtc('2026-11-22T12:05:30+01:00')).toBe('2026-11-22T12:05:30+01:00');
    expect(asUtc('2026-11-22T06:05:30-05:00')).toBe('2026-11-22T06:05:30-05:00');
  });
 
  it('returns an empty string for null, undefined or empty input', () => {
    expect(asUtc(null)).toBe('');
    expect(asUtc(undefined)).toBe('');
    expect(asUtc('')).toBe('');
  });
 
  it('makes the browser read the time as UTC, whatever the computer time zone is', () => {
    expect(new Date(asUtc('2026-11-22T11:05:30')).toISOString()).toBe('2026-11-22T11:05:30.000Z');
  });
});
