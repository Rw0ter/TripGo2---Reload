import { beijingDateKey } from './checkin.service';

// 签到日界必须按广东（UTC+8）划分，而非 UTC。旧实现 new Date().toISOString()
// 直接取 UTC 日期，会让北京 0:00–8:00 的签到落到「前一天」。
describe('beijingDateKey（UTC+8 当天日期键）', () => {
  it('UTC 白天 → 当天日期', () => {
    // 2026-06-09T03:00Z = 北京 06-09 11:00
    expect(beijingDateKey(new Date('2026-06-09T03:00:00Z'))).toBe('2026-06-09');
  });

  it('UTC 15:59（北京 23:59）→ 仍是当天', () => {
    expect(beijingDateKey(new Date('2026-06-09T15:59:00Z'))).toBe('2026-06-09');
  });

  it('UTC 16:00（北京次日 00:00）→ 进入次日', () => {
    expect(beijingDateKey(new Date('2026-06-09T16:00:00Z'))).toBe('2026-06-10');
  });

  it('UTC 16:30（北京次日 00:30）→ 北京当天，回归点', () => {
    // 旧 UTC 实现会错判成 2026-06-09
    expect(beijingDateKey(new Date('2026-06-09T16:30:00Z'))).toBe('2026-06-10');
  });

  it('UTC 23:59（北京次日 07:59）→ 次日', () => {
    expect(beijingDateKey(new Date('2026-06-09T23:59:00Z'))).toBe('2026-06-10');
  });

  it('跨月边界：UTC 06-30 18:00（北京 07-01 02:00）→ 07-01', () => {
    expect(beijingDateKey(new Date('2026-06-30T18:00:00Z'))).toBe('2026-07-01');
  });
});
