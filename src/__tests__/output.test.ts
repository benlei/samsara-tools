import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { generateFilename, writeData, writeImages } from '../output';
import { BannerDataset, BannerHistory } from '../types';
import * as fandom from '../fandom';
import * as hsrFandom from '../hsr-fandom';

// Mock the dependencies
vi.mock('fs');
vi.mock('../fandom');
vi.mock('../hsr-fandom');
vi.mock('@actions/core');

const mockFs = vi.mocked(fs);
const mockFandom = vi.mocked(fandom);
const mockHsrFandom = vi.mocked(hsrFandom);

describe('Output utilities', () => {
  describe('generateFilename', () => {
    test('should replace spaces with hyphens', () => {
      expect(generateFilename('Dan Heng')).toBe('Dan-Heng');
      expect(generateFilename('Silver Wolf')).toBe('Silver-Wolf');
    });

    test('should remove special characters except hyphens', () => {
      expect(generateFilename('Dan Heng • Imbibitor Lunae')).toBe('Dan-Heng-Imbibitor-Lunae');
      expect(generateFilename('Topaz & Numby')).toBe('Topaz-Numby');
      expect(generateFilename('Character (Element)')).toBe('Character-Element');
    });

    test('should handle multiple consecutive hyphens', () => {
      expect(generateFilename('Test  --  Name')).toBe('Test-Name');
      expect(generateFilename('Multiple   Spaces')).toBe('Multiple-Spaces');
    });

    test('should preserve case', () => {
      expect(generateFilename('CamelCase Name')).toBe('CamelCase-Name');
      expect(generateFilename('UPPERCASE NAME')).toBe('UPPERCASE-NAME');
    });

    test('should handle edge cases', () => {
      expect(generateFilename('')).toBe('');
      expect(generateFilename('   ')).toBe('-'); // Spaces become hyphens, then multiple hyphens become single
      expect(generateFilename('123')).toBe('123');
      expect(generateFilename('A-B-C')).toBe('A-B-C');
    });
  });

  describe('writeData', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('should write YAML data to file with correct format', () => {
      const mockData: BannerDataset = {
        fiveStarCharacters: [
          {
            name: 'Test Character',
            versions: ['1.0.1'],
            dates: [{ start: '2020-09-28', end: '2020-10-18' }]
          }
        ],
        fourStarCharacters: [],
        fiveStarWeapons: [],
        fourStarWeapons: []
      };

      const result = writeData(mockData, '/test/output.yml', 100);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/test/output.yml',
        expect.stringContaining('fiveStarCharacters:'),
        'utf8'
      );
      expect(result).toBeGreaterThan(100);
    });

    test('should throw error if data size is too small', () => {
      const mockData: BannerDataset = {
        fiveStarCharacters: [],
        fourStarCharacters: [],
        fiveStarWeapons: [],
        fourStarWeapons: []
      };

      expect(() => {
        writeData(mockData, '/test/output.yml', 10000);
      }).toThrow('Banner data was under 10000');
    });

    test('should return correct data size', () => {
      const mockData: BannerDataset = {
        fiveStarCharacters: [
          {
            name: 'Test Character',
            versions: ['1.0.1'],
            dates: [{ start: '2020-09-28', end: '2020-10-18' }]
          }
        ],
        fourStarCharacters: [],
        fiveStarWeapons: [],
        fourStarWeapons: []
      };

      const result = writeData(mockData, '/test/output.yml', 10);
      const expectedYaml = yaml.dump(mockData, {
        flowLevel: -1,
        sortKeys: false,
        lineWidth: -1
      });

      expect(result).toBe(expectedYaml.length);
    });
  });

  describe('writeImages', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockFs.existsSync.mockReturnValue(false);
      mockFandom.downloadCharacterImage.mockResolvedValue();
      mockFandom.downloadWeaponImage.mockResolvedValue();
      mockHsrFandom.downloadCharacterImage.mockResolvedValue();
      mockHsrFandom.downloadWeaponImage.mockResolvedValue();
    });

    test('should download Genshin character images', async () => {
      const mockData: BannerDataset = {
        fiveStarCharacters: [
          {
            name: 'Test Character',
            versions: ['1.0.1'],
            dates: [{ start: '2020-09-28', end: '2020-10-18' }]
          }
        ],
        fourStarCharacters: [],
        fiveStarWeapons: [],
        fourStarWeapons: []
      };

      const result = await writeImages(mockData, '/test/images', false, false);

      expect(mockFandom.downloadCharacterImage).toHaveBeenCalledWith(
        expect.stringContaining('Test-Character.png'),
        'Test Character',
        80
      );
      expect(result).toBe(1);
    });

    test('should download Genshin weapon images', async () => {
      const mockData: BannerDataset = {
        fiveStarCharacters: [],
        fourStarCharacters: [],
        fiveStarWeapons: [
          {
            name: 'Test Weapon',
            versions: ['1.0.1'],
            dates: [{ start: '2020-09-28', end: '2020-10-18' }]
          }
        ],
        fourStarWeapons: []
      };

      const result = await writeImages(mockData, '/test/images', false, false);

      expect(mockFandom.downloadWeaponImage).toHaveBeenCalledWith(
        expect.stringContaining('Test-Weapon.png'),
        'Test Weapon',
        80
      );
      expect(result).toBe(1);
    });

    test('should download HSR character images', async () => {
      const mockData: BannerDataset = {
        fiveStarCharacters: [
          {
            name: 'HSR Character',
            versions: ['1.0.1'],
            dates: [{ start: '2020-09-28', end: '2020-10-18' }]
          }
        ],
        fourStarCharacters: [],
        fiveStarWeapons: [],
        fourStarWeapons: []
      };

      const result = await writeImages(mockData, '/test/images', false, true);

      expect(mockHsrFandom.downloadCharacterImage).toHaveBeenCalledWith(
        expect.stringContaining('HSR-Character.png'),
        'HSR Character',
        80
      );
      expect(result).toBe(1);
    });

    test('should skip existing images when force is false', async () => {
      mockFs.existsSync.mockReturnValue(true);

      const mockData: BannerDataset = {
        fiveStarCharacters: [
          {
            name: 'Existing Character',
            versions: ['1.0.1'],
            dates: [{ start: '2020-09-28', end: '2020-10-18' }]
          }
        ],
        fourStarCharacters: [],
        fiveStarWeapons: [],
        fourStarWeapons: []
      };

      const result = await writeImages(mockData, '/test/images', false, false);

      expect(mockFandom.downloadCharacterImage).not.toHaveBeenCalled();
      expect(result).toBe(1); // Still counts as processed
    });

    test('should download existing images when force is true', async () => {
      mockFs.existsSync.mockReturnValue(true);

      const mockData: BannerDataset = {
        fiveStarCharacters: [
          {
            name: 'Existing Character',
            versions: ['1.0.1'],
            dates: [{ start: '2020-09-28', end: '2020-10-18' }]
          }
        ],
        fourStarCharacters: [],
        fiveStarWeapons: [],
        fourStarWeapons: []
      };

      const result = await writeImages(mockData, '/test/images', true, false);

      expect(mockFandom.downloadCharacterImage).toHaveBeenCalled();
      expect(result).toBe(1);
    });

    test('should use correct directory structure for HSR', async () => {
      const mockData: BannerDataset = {
        fiveStarCharacters: [
          {
            name: 'HSR Character',
            versions: ['1.0.1'],
            dates: [{ start: '2020-09-28', end: '2020-10-18' }]
          }
        ],
        fourStarCharacters: [],
        fiveStarWeapons: [
          {
            name: 'Light Cone',
            versions: ['1.0.1'],
            dates: [{ start: '2020-09-28', end: '2020-10-18' }]
          }
        ],
        fourStarWeapons: []
      };

      await writeImages(mockData, '/test/images', false, true);

      expect(mockHsrFandom.downloadCharacterImage).toHaveBeenCalledWith(
        expect.stringContaining('hsr-characters'),
        'HSR Character',
        80
      );
      expect(mockHsrFandom.downloadWeaponImage).toHaveBeenCalledWith(
        expect.stringContaining('lightcones'),
        'Light Cone',
        80
      );
    });
  });
});
