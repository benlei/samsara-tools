import { describe, test, expect, beforeEach, vi } from 'vitest';
import { pullGenshinBanners } from '../genshin';
import * as fandom from '../fandom';
import * as output from '../output';
import { BannersParser } from '../banners';

// Mock the dependencies
vi.mock('../fandom');
vi.mock('../output');
vi.mock('../banners');
vi.mock('@actions/core');

// Mock the banner utility functions
vi.mock('../banners', async () => {
  const actual = await vi.importActual('../banners');
  return {
    ...actual,
    BannersParser: vi.fn(),
    coerceChronicledToCharBanner: vi.fn().mockReturnValue({ query: { pages: {} } }),
    coerceChronicledToWeapBanner: vi.fn().mockReturnValue({ query: { pages: {} } })
  };
});

const mockFandom = vi.mocked(fandom);
const mockOutput = vi.mocked(output);
const mockBannersParser = vi.mocked(BannersParser, true);

describe('Genshin module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the parser instance
    const mockParserInstance = {
      transformData: vi.fn().mockResolvedValue({
        fiveStarCharacters: [],
        fourStarCharacters: [],
        fiveStarWeapons: [],
        fourStarWeapons: []
      })
    };
    mockBannersParser.mockImplementation(() => mockParserInstance as any);

    // Mock fandom API calls
    mockFandom.get5StarCharacters.mockResolvedValue({ query: { pages: {} } } as any);
    mockFandom.get5StarWeapons.mockResolvedValue({ query: { pages: {} } } as any);
    mockFandom.getEventWishes.mockResolvedValue({ query: { pages: {} } } as any);
    mockFandom.getChronicledWishes.mockResolvedValue({ query: { pages: {} } } as any);
    mockFandom.get4StarCharacters.mockResolvedValue({ query: { pages: {} } } as any);
    mockFandom.get4StarWeapons.mockResolvedValue({ query: { pages: {} } } as any);

    // Mock output functions
    mockOutput.writeData.mockReturnValue(50000);
    mockOutput.writeImages.mockResolvedValue(10);
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

    expect(mockFandom.get5StarCharacters).toHaveBeenCalled();
    expect(mockFandom.get5StarWeapons).toHaveBeenCalled();
    expect(mockFandom.getEventWishes).toHaveBeenCalled();
    expect(mockFandom.getChronicledWishes).toHaveBeenCalled();
    expect(mockFandom.get4StarCharacters).toHaveBeenCalled();
    expect(mockFandom.get4StarWeapons).toHaveBeenCalled();
  });

  test('should merge chronicled wishes with event wishes', async () => {
    const mockEventWishes = {
      query: {
        pages: { '1': { title: 'Event Banner' } }
      }
    };
    const mockChronicledWishes = {
      query: {
        pages: { '2': { title: 'Chronicled Banner' } }
      }
    };

    mockFandom.getEventWishes.mockResolvedValue(mockEventWishes as any);
    mockFandom.getChronicledWishes.mockResolvedValue(mockChronicledWishes as any);

    await pullGenshinBanners(
      '/test/output.yml',
      '/test/images',
      false,
      false,
      40000
    );

    const parserInstance = mockBannersParser.mock.results[0].value;
    expect(parserInstance.transformData).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          pages: expect.objectContaining({
            '1': { title: 'Event Banner' }
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

    expect(mockOutput.writeImages).not.toHaveBeenCalled();
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

    expect(mockOutput.writeImages).toHaveBeenCalledWith(
      expect.any(Object),
      '/test/images',
      false,
      false // isHSR = false for Genshin
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

    expect(mockOutput.writeImages).toHaveBeenCalledWith(
      expect.any(Object),
      '/test/images',
      true, // force should be passed through
      false
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

    expect(mockOutput.writeData).toHaveBeenCalledWith(
      expect.any(Object),
      '/test/output.yml',
      45000
    );
  });
});
