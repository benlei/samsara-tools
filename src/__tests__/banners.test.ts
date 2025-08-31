import { parseVersionWithLuna } from '../banners';

describe('parseVersionWithLuna', () => {
  test('should parse regular versions correctly', () => {
    expect(parseVersionWithLuna('1.2.3')).toEqual([1, 2, 3]);
    expect(parseVersionWithLuna('5.8')).toEqual([5, 8, 0]);
  });

  test('should parse Luna versions correctly', () => {
    expect(parseVersionWithLuna('Luna I')).toEqual([5, 9, 0]);
    expect(parseVersionWithLuna('Luna II')).toEqual([5, 10, 0]);
    expect(parseVersionWithLuna('Luna III')).toEqual([5, 11, 0]);
  });

  test('should handle malformed versions', () => {
    expect(parseVersionWithLuna('invalid')).toEqual([999, 999, 999]);
  });
});
