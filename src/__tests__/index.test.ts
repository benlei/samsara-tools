import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as core from '@actions/core';
import { run } from '../index';
import { pullGenshinBanners } from '../genshin';
import { pullHSRBanners } from '../hsr';

// Mock the dependencies
vi.mock('@actions/core');
vi.mock('../genshin');
vi.mock('../hsr');

const mockCore = vi.mocked(core);
const mockPullGenshinBanners = vi.mocked(pullGenshinBanners);
const mockPullHSRBanners = vi.mocked(pullHSRBanners);

describe('Main index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default mock implementations
    mockCore.getInput.mockImplementation((name: string, options?: any) => {
      const defaults: Record<string, string> = {
        'game': 'gi',
        'output': 'test-output.yml',
        'output-image-dir': 'test-images',
        'min-data-size': '40000'
      };
      return defaults[name] || '';
    });
    
    mockCore.getBooleanInput.mockImplementation((name: string) => {
      const defaults: Record<string, boolean> = {
        'force': false,
        'skip-images': false
      };
      return defaults[name] || false;
    });

    mockPullGenshinBanners.mockResolvedValue({
      dataSize: 83077,
      imagesDownloaded: 25
    });

    mockPullHSRBanners.mockResolvedValue({
      dataSize: 35148,
      imagesDownloaded: 15
    });
  });

  test('should handle Genshin Impact game correctly', async () => {
    mockCore.getInput.mockImplementation((name: string) => {
      const values: Record<string, string> = {
        'game': 'gi',
        'output': 'gi-output.yml',
        'output-image-dir': 'gi-images',
        'min-data-size': '80000'
      };
      return values[name] || '';
    });

    await run();

    expect(mockPullGenshinBanners).toHaveBeenCalledWith(
      'gi-output.yml',
      'gi-images',
      false,
      false,
      80000
    );
    expect(mockPullHSRBanners).not.toHaveBeenCalled();
  });

  test('should handle HSR game correctly', async () => {
    mockCore.getInput.mockImplementation((name: string) => {
      const values: Record<string, string> = {
        'game': 'hsr',
        'output': 'hsr-output.yml',
        'output-image-dir': 'hsr-images',
        'min-data-size': '30000'
      };
      return values[name] || '';
    });

    await run();

    expect(mockPullHSRBanners).toHaveBeenCalledWith(
      'hsr-output.yml',
      'hsr-images',
      false,
      false,
      30000
    );
    expect(mockPullGenshinBanners).not.toHaveBeenCalled();
  });

  test('should handle unsupported game error', async () => {
    mockCore.getInput.mockImplementation((name: string) => {
      return name === 'game' ? 'invalid' : 'test-value';
    });

    await run();

    expect(mockCore.setFailed).toHaveBeenCalledWith(
      "Unsupported game: invalid. Use 'gi' for Genshin Impact or 'hsr' for Honkai Star Rail."
    );
  });

  test('should set correct outputs', async () => {
    await run();

    expect(mockCore.setOutput).toHaveBeenCalledWith('data-size', '83077');
    expect(mockCore.setOutput).toHaveBeenCalledWith('images-downloaded', '25');
    expect(mockCore.info).toHaveBeenCalledWith('Successfully processed GI banner data');
  });
});
