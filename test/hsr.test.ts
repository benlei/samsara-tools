import { describe, test, expect, beforeEach, vi } from 'vitest';
import { pullHSRBanners } from '../src/hsr/index';
import * as hsrFandom from '../src/hsr/fandom-api';
import * as output from '../src/fandom/output';
import * as hsrBanners from '../src/hsr/banners';

// Mock the dependencies
vi.mock('../src/hsr/fandom-api');
vi.mock('../src/fandom/output');
vi.mock('../src/hsr/banners');
vi.mock('@actions/core');

const mockHsrFandom = vi.mocked(hsrFandom);
const mockOutput = vi.mocked(output);
// we'll spy on hsrBanners.HSRBannersParser when needed

describe('HSR module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the parser instance
    const mockParserInstance = {
      parse: vi.fn().mockResolvedValue({
        fiveStarCharacters: [],
        fourStarCharacters: [],
        fiveStarWeapons: [],
        fourStarWeapons: []
      })
    };
  vi.spyOn(hsrBanners as any, 'HSRBannersParser').mockImplementation(() => mockParserInstance as any);

    // Mock HSR fandom API calls
    mockHsrFandom.getEventWishes.mockResolvedValue({ query: { pages: {} } } as any);
    mockHsrFandom.get5StarCharacters.mockResolvedValue({ query: { pages: {} } } as any);
    mockHsrFandom.get4StarCharacters.mockResolvedValue({ query: { pages: {} } } as any);
    mockHsrFandom.get5StarLightCones.mockResolvedValue({ query: { pages: {} } } as any);
    mockHsrFandom.get4StarLightCones.mockResolvedValue({ query: { pages: {} } } as any);

    // Mock output functions
    mockOutput.writeData.mockReturnValue(35000);
    mockOutput.writeImages.mockResolvedValue(15);
  });

  test('should pull HSR banners successfully', async () => {
    const result = await pullHSRBanners(
      '/test/hsr-output.yml',
      '/test/hsr-images',
      false,
      false,
      30000
    );

    expect(result).toEqual({
      dataSize: 35000,
      imagesDownloaded: 15
    });
  });

  test('should fetch all required HSR data sources', async () => {
    await pullHSRBanners(
      '/test/hsr-output.yml',
      '/test/hsr-images',
      false,
      false,
      30000
    );

    expect(mockHsrFandom.getEventWishes).toHaveBeenCalled();
    expect(mockHsrFandom.get5StarCharacters).toHaveBeenCalled();
    expect(mockHsrFandom.get4StarCharacters).toHaveBeenCalled();
    expect(mockHsrFandom.get5StarLightCones).toHaveBeenCalled();
    expect(mockHsrFandom.get4StarLightCones).toHaveBeenCalled();
  });

  test('should use HSR banner parser', async () => {
    await pullHSRBanners(
      '/test/hsr-output.yml',
      '/test/hsr-images',
      false,
      false,
      30000
    );

    expect((hsrBanners as any).HSRBannersParser).toHaveBeenCalled();
    
    const parserInstance = (hsrBanners as any).HSRBannersParser.mock.results[0].value;
    expect(parserInstance.parse).toHaveBeenCalledWith(
      expect.any(Object), // event wishes
      expect.any(Object), // 5 star characters
      expect.any(Object), // 4 star characters
      expect.any(Object), // 5 star weapons
      expect.any(Object)  // 4 star weapons
    );
  });

  test('should skip images when skipImages is true', async () => {
    const result = await pullHSRBanners(
      '/test/hsr-output.yml',
      '/test/hsr-images',
      false,
      true, // skipImages = true
      30000
    );

    expect(mockOutput.writeImages).not.toHaveBeenCalled();
    expect(result.imagesDownloaded).toBe(0);
  });

  test('should download images when skipImages is false', async () => {
    await pullHSRBanners(
      '/test/hsr-output.yml',
      '/test/hsr-images',
      false,
      false, // skipImages = false
      30000
    );

    expect(mockOutput.writeImages).toHaveBeenCalledWith(
      expect.any(Object),
      '/test/hsr-images',
      false,
      true, // isHSR = true for HSR
      expect.any(Function), // downloadCharacterImage
      expect.any(Function)  // downloadWeaponImage
    );
  });

  test('should pass force parameter correctly', async () => {
    await pullHSRBanners(
      '/test/hsr-output.yml',
      '/test/hsr-images',
      true, // force = true
      false,
      30000
    );

    expect(mockOutput.writeImages).toHaveBeenCalledWith(
      expect.any(Object),
      '/test/hsr-images',
      true, // force should be passed through
      true,
      expect.any(Function), // downloadCharacterImage
      expect.any(Function)  // downloadWeaponImage
    );
  });

  test('should write data with correct parameters', async () => {
    const mockData = {
      fiveStarCharacters: [
        {
          name: 'Seele',
          versions: ['1.0.1'],
          dates: [{ start: '2023-04-26', end: '2023-05-17' }]
        }
      ],
      fourStarCharacters: [],
      fiveStarWeapons: [],
      fourStarWeapons: []
    };

    // Just verify the function was called, not the internal parser details
    await pullHSRBanners(
      '/test/hsr-output.yml',
      '/test/hsr-images',
      false,
      false,
      25000
    );

    expect(mockOutput.writeData).toHaveBeenCalledWith(
      expect.any(Object),
      '/test/hsr-output.yml',
      25000
    );
  });

  test('should handle API call order correctly', async () => {
    const eventWishesData = { query: { pages: { '1': { title: 'HSR Event' } } } };
    const fiveStarCharsData = { query: { pages: { '2': { title: 'Seele' } } } };
    
    mockHsrFandom.getEventWishes.mockResolvedValue(eventWishesData as any);
    mockHsrFandom.get5StarCharacters.mockResolvedValue(fiveStarCharsData as any);

    await pullHSRBanners(
      '/test/hsr-output.yml',
      '/test/hsr-images',
      false,
      false,
      30000
    );

  const parserInstance = (hsrBanners as any).HSRBannersParser.mock.results[0].value;
    expect(parserInstance.parse).toHaveBeenCalledWith(
      eventWishesData,
      fiveStarCharsData,
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    );
  });

  // Small focused tests inspired by legacy Python tests
  test('HSRBannersParser.convertSpecializationPageToTitle should normalize special cases', async () => {
    // restore original constructor so we can use real methods
    if ((hsrBanners as any).HSRBannersParser?.mockRestore) {
      (hsrBanners as any).HSRBannersParser.mockRestore();
    }
    const parser = new (hsrBanners as any).HSRBannersParser();

    // Use a page title that directly equals the specialization so the HSR mapper runs
    const page = { title: 'Topaz & Numby', pageid: 1, categories: [] } as any;
    const converted = parser.convertSpecializationPageToTitle(page);
    expect(converted).toBe('Topaz and Numby');
  });
  
  test('HSRBannersParser.isPageWeapon should detect light cone banners', async () => {
    if ((hsrBanners as any).HSRBannersParser?.mockRestore) {
      (hsrBanners as any).HSRBannersParser.mockRestore();
    }
    const parser = new (hsrBanners as any).HSRBannersParser();
    const weaponPage = { title: 'Event Warp: Light Cone - Special', pageid: 2, categories: [] } as any;
    expect(parser.isPageWeapon(weaponPage)).toBe(true);
    const nonWeaponPage = { title: 'Event Warp: Character - Special', pageid: 3, categories: [] } as any;
    expect(parser.isPageWeapon(nonWeaponPage)).toBe(false);
  });

  test('HSRBannersParser.getFeaturedDates should return start/end pairs for featured items', async () => {
    if ((hsrBanners as any).HSRBannersParser?.mockRestore) {
      (hsrBanners as any).HSRBannersParser.mockRestore();
    }
    const parser = new (hsrBanners as any).HSRBannersParser();

    // eventWishes contains two banner pages with dates; one follows the other
    const eventWishes = {
      query: {
        pages: {
          '100': { pageid: 100, title: 'Event A/2023-04-01', categories: [{ title: 'Category:Features Seele' }] },
          '101': { pageid: 101, title: 'Event B/2023-04-15', categories: [{ title: 'Category:Features Seele' }] },
        },
      },
    } as any;

    const dates = await parser.getFeaturedDates(eventWishes as any, 'Seele');
    // Expect two entries: start for Event A with end = Event B start, and Event B with end = '' (no next)
    expect(dates.length).toBe(2);
    expect(dates[0].start).toBe('2023-04-01');
    expect(dates[0].end).toBe('2023-04-15');
    expect(dates[1].start).toBe('2023-04-15');
    expect(dates[1].end).toBe('');
  });

  test('HSRBannersParser.getFeaturedVersions should return version strings sorted', async () => {
    if ((hsrBanners as any).HSRBannersParser?.mockRestore) {
      (hsrBanners as any).HSRBannersParser.mockRestore();
    }
    const parser = new (hsrBanners as any).HSRBannersParser();

    // Provide pages where getVersionFromPage will read categories for version
    const eventWishes = {
      query: {
        pages: {
      '200': { pageid: 200, title: 'Event/2023-04', categories: [{ title: 'Category:Features Seele' }, { title: 'Category:Released in Version 3.4' }] },
      '201': { pageid: 201, title: 'Event/2023-05', categories: [{ title: 'Category:Features Seele' }, { title: 'Category:Released in Version 3.5' }] },
        },
      },
    } as any;
    const versions = await parser.getFeaturedVersions(eventWishes as any, 'Seele');
    // parser returns a minor index; with these inputs we expect the minor to be 1 for both
    expect(versions).toEqual(['3.4.1', '3.5.1']);
  });
});
