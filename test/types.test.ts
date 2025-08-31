import { BannerHistory, BannerDataset } from '../src/types';

describe('Types', () => {
  test('should create valid BannerHistory', () => {
    const bannerHistory: BannerHistory = {
      name: 'Test Character',
      versions: ['1.0.1'],
      dates: [{ start: '2020-09-28', end: '2020-10-18' }]
    };

    expect(bannerHistory.name).toBe('Test Character');
    expect(bannerHistory.versions).toHaveLength(1);
    expect(bannerHistory.dates).toHaveLength(1);
  });

  test('should create valid BannerDataset', () => {
    const dataset: BannerDataset = {
      fiveStarCharacters: [],
      fourStarCharacters: [],
      fiveStarWeapons: [],
      fourStarWeapons: []
    };

    expect(dataset).toBeDefined();
    expect(Array.isArray(dataset.fiveStarCharacters)).toBe(true);
  });
});
