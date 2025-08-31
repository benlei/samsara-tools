import { describe, test, expect, beforeEach, vi } from 'vitest';
import { pullHSRBanners } from '../src/hsr/index';
import * as hsrFandom from '../src/hsr/fandom-api';
import * as output from '../src/fandom/output';
import { HSRBannersParser } from '../src/hsr/banners';

// Mock the dependencies
vi.mock('../src/hsr/fandom-api');
vi.mock('../src/fandom/output');
vi.mock('../src/hsr/banners');
vi.mock('@actions/core');

const mockHsrFandom = vi.mocked(hsrFandom);
const mockOutput = vi.mocked(output);
const mockHSRBannersParser = vi.mocked(HSRBannersParser, true);

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
    mockHSRBannersParser.mockImplementation(() => mockParserInstance as any);

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

    expect(mockHSRBannersParser).toHaveBeenCalled();
    
    const parserInstance = mockHSRBannersParser.mock.results[0].value;
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

    const parserInstance = mockHSRBannersParser.mock.results[0].value;
    expect(parserInstance.parse).toHaveBeenCalledWith(
      eventWishesData,
      fiveStarCharsData,
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    );
  });
});
