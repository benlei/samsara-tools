import { describe, test, expect, beforeEach, vi } from 'vitest';
import { pullGenshinBanners } from '../src/genshin/index';
import * as fandom from '../src/genshin/fandom-api';
import * as output from '../src/fandom/output';
import * as banners from '../src/genshin/banners';
import { QueryResponse } from '../src/fandom/types';

// Use spies instead of module-level mocks. We'll spy on specific functions below.
// No vi.mock() calls here.

describe('Genshin module', () => {
  let parseSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Spy on parser.parse to avoid replacing the constructor
    parseSpy = vi.spyOn(banners.BannersParser.prototype, 'parse').mockResolvedValue({
      fiveStarCharacters: [],
      fourStarCharacters: [],
      fiveStarWeapons: [],
      fourStarWeapons: [],
    });

  // Spy on fandom API functions. Use 'unknown' double-cast to satisfy QueryResponse typing for empty pages
  vi.spyOn(fandom, 'get5StarCharacters').mockResolvedValue({ query: { pages: {} } } as unknown as QueryResponse);
  vi.spyOn(fandom, 'get5StarWeapons').mockResolvedValue({ query: { pages: {} } } as unknown as QueryResponse);
  vi.spyOn(fandom, 'getEventWishes').mockResolvedValue({ query: { pages: {} } } as unknown as QueryResponse);
  vi.spyOn(fandom, 'getChronicledWishes').mockResolvedValue({ query: { pages: {} } } as unknown as QueryResponse);
  vi.spyOn(fandom, 'get4StarCharacters').mockResolvedValue({ query: { pages: {} } } as unknown as QueryResponse);
  vi.spyOn(fandom, 'get4StarWeapons').mockResolvedValue({ query: { pages: {} } } as unknown as QueryResponse);

    // Spy on output functions
    vi.spyOn(output, 'writeData').mockReturnValue(50000);
    vi.spyOn(output, 'writeImages').mockResolvedValue(10 as unknown as number);
  });

  test('should pull Genshin banners successfully', async () => {
    const result = await pullGenshinBanners(
      '/test/output.yml',
      '/test/images',
      false,
      false,
      40000
    );

    expect(result).toEqual({
      dataSize: 50000,
      imagesDownloaded: 10
    });
  });

  test('should fetch all required data sources', async () => {
    await pullGenshinBanners(
      '/test/output.yml',
      '/test/images',
      false,
      false,
      40000
    );

  expect(fandom.get5StarCharacters).toHaveBeenCalled();
  expect(fandom.get5StarWeapons).toHaveBeenCalled();
  expect(fandom.getEventWishes).toHaveBeenCalled();
  expect(fandom.getChronicledWishes).toHaveBeenCalled();
  expect(fandom.get4StarCharacters).toHaveBeenCalled();
  expect(fandom.get4StarWeapons).toHaveBeenCalled();
  });

  test('should merge chronicled wishes with event wishes', async () => {
    const mockEventWishes: QueryResponse = {
      query: {
        pages: { '1': { pageid: 1, title: 'Event Banner', categories: [] } }
      }
    };
    const mockChronicledWishes: QueryResponse = {
      query: {
        pages: { '2': { pageid: 2, title: 'Chronicled Banner', categories: [] } }
      }
    };

  vi.spyOn(fandom, 'getEventWishes').mockResolvedValue(mockEventWishes as QueryResponse);
  vi.spyOn(fandom, 'getChronicledWishes').mockResolvedValue(mockChronicledWishes as QueryResponse);

    await pullGenshinBanners(
      '/test/output.yml',
      '/test/images',
      false,
      false,
      40000
    );

  expect(parseSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          pages: expect.objectContaining({
            '1': { pageid: 1, title: 'Event Banner', categories: [] }
          })
        })
      }),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    );
  });

  test('should skip images when skipImages is true', async () => {
    const result = await pullGenshinBanners(
      '/test/output.yml',
      '/test/images',
      false,
      true, // skipImages = true
      40000
    );

  expect(output.writeImages).not.toHaveBeenCalled();
    expect(result.imagesDownloaded).toBe(0);
  });

  test('should download images when skipImages is false', async () => {
    await pullGenshinBanners(
      '/test/output.yml',
      '/test/images',
      false,
      false, // skipImages = false
      40000
    );

  expect(output.writeImages).toHaveBeenCalledWith(
      expect.any(Object),
      '/test/images',
      false,
      false, // isHSR = false for Genshin
      expect.any(Function), // downloadCharacterImage
      expect.any(Function)  // downloadWeaponImage
    );
  });

  test('should pass force parameter correctly', async () => {
    await pullGenshinBanners(
      '/test/output.yml',
      '/test/images',
      true, // force = true
      false,
      40000
    );

  expect(output.writeImages).toHaveBeenCalledWith(
      expect.any(Object),
      '/test/images',
      true, // force should be passed through
      false,
      expect.any(Function), // downloadCharacterImage
      expect.any(Function)  // downloadWeaponImage
    );
  });

  test('should write data with correct parameters', async () => {
    const mockData = {
      fiveStarCharacters: [],
      fourStarCharacters: [],
      fiveStarWeapons: [],
      fourStarWeapons: []
    };

    // Just verify the function was called, not the internal parser details
    await pullGenshinBanners(
      '/test/output.yml',
      '/test/images',
      false,
      false,
      45000
    );

  expect(output.writeData).toHaveBeenCalledWith(
      expect.any(Object),
      '/test/output.yml',
      45000
    );
  });

  // Richer unit tests inspired by legacy Python tests but compact and deterministic
  test('coerceChronicledToCharBanner should add feature categories for multiple matching characters', async () => {
  const chronicled: QueryResponse = {
      query: {
        pages: {
          '12': {
            pageid: 12,
            title: 'Character Banner/2020-03-03',
            categories: [
              { title: 'Category:Wish Pool Includes Venti' },
              { title: 'Category:Wish Pool Includes Klee' },
            ],
          },
          '13': {
            pageid: 13,
            title: 'NotABanner',
            categories: [{ title: 'Category:Wish Pool Includes Venti' }],
          },
        },
      },
  };

  const fiveChars: QueryResponse = {
      query: {
        pages: {
          '1': { pageid: 1, title: 'Venti', categories: [] },
          '2': { pageid: 2, title: 'Klee', categories: [] },
        },
      },
  };

  const result = banners.coerceChronicledToCharBanner(chronicled, fiveChars);

  // Should include only the page that looks like a banner (has '/') and add feature categories
  expect(result.query!.pages!['12']).toBeDefined();
  const addedCats = result.query!.pages!['12'].categories.map((c: any) => c.title);
    expect(addedCats).toContain('Category:Features Venti');
    expect(addedCats).toContain('Category:Features Klee');
    // Non-banner page should be omitted
  expect(result.query!.pages!['13']).toBeUndefined();
  });

  test('coerceChronicledToWeapBanner should transform multiple weapons and preserve unique keys', async () => {
  const chronicled: QueryResponse = {
      query: {
        pages: {
          '20': {
            pageid: 20,
            title: 'Weapon Banner/2020-02-02',
            categories: [
              { title: "Category:Wish Pool Includes Amos' Bow" },
              { title: "Category:Wish Pool Includes Wolf's Gravestone" },
            ],
          },
          '21': {
            pageid: 21,
            title: 'Weapon Banner/2020-04-04',
            categories: [{ title: "Category:Wish Pool Includes Wolf's Gravestone" }],
          },
        },
      },
  };

  const fiveWeaps: QueryResponse = {
      query: {
        pages: {
          '1': { title: "Amos' Bow" },
          '2': { title: "Wolf's Gravestone" },
        },
      },
  };

  const result = banners.coerceChronicledToWeapBanner(chronicled, fiveWeaps);

  // Weapon pages should be keyed by negative pageid
  expect(result.query!.pages!['-20']).toBeDefined();
  expect(result.query!.pages!['-21']).toBeDefined();

  // Titles should be transformed to an Epitome Invocation format and categories should include feature entries
  expect(result.query!.pages!['-20'].title).toContain('Epitome Invocation/');
  const cats20 = result.query!.pages!['-20'].categories.map((c: any) => c.title);
    expect(cats20).toContain("Category:Features Amos' Bow");
    expect(cats20).toContain("Category:Features Wolf's Gravestone");

  const cats21 = result.query!.pages!['-21'].categories.map((c: any) => c.title);
    expect(cats21).toContain("Category:Features Wolf's Gravestone");
  });
});
