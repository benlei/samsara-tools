import { writeFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { dump } from 'js-yaml';
import { BannerDataset, BannerHistory } from './types';
import { warning } from '@actions/core';

export function generateFilename(name: string): string {
  // Use the same logic as Python generate.filename
  let result = name.replace(/\s/g, '-'); // Replace spaces with hyphens
  result = result.replace(/[^a-zA-Z0-9-]/g, ''); // Remove special characters except hyphens
  return result.replace(/--+/g, '-'); // Replace multiple consecutive hyphens with single hyphen
}

export async function writeImages(
  data: BannerDataset,
  outputImageDir: string,
  force: boolean,
  isHSR: boolean = false,
  downloadCharacterImage: (
    outputPath: string,
    characterName: string,
    size?: number
  ) => Promise<void>,
  downloadWeaponImage: (outputPath: string, weaponName: string, size?: number) => Promise<void>
): Promise<number> {
  let imagesDownloaded = 0;

  function getGenericFeatureType(featureType: string): string {
    if (featureType.toLowerCase().includes('character')) {
      return isHSR ? 'hsr-characters' : 'characters';
    }
    return isHSR ? 'lightcones' : 'weapons';
  }

  const imagePath = resolve(outputImageDir);

  for (const [featuredType, bannerHistoryList] of Object.entries(data)) {
    for (const bannerHistory of bannerHistoryList as BannerHistory[]) {
      const featureDir = getGenericFeatureType(featuredType);
      const filename = `${generateFilename(bannerHistory.name)}.png`;
      const fullPath = join(imagePath, featureDir, filename);

      const isCharacter = featureDir.includes('character');

      // Skip if file exists and force is false
      if (!force && existsSync(fullPath)) {
        continue;
      }

      try {
        if (isCharacter) {
          await downloadCharacterImage(fullPath, bannerHistory.name, 80);
        } else {
          await downloadWeaponImage(fullPath, bannerHistory.name, 80);
        }
        imagesDownloaded++;

        // Sleep 0.5 seconds between downloads
        await new Promise<void>((resolveTimer) => setTimeout(resolveTimer, 500));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        warning(`Failed to download image for ${bannerHistory.name}: ${errorMessage}`);
      }
    }
  }

  return imagesDownloaded;
}

export function writeData(data: BannerDataset, outputPath: string, minDataSize: number): number {
  const yamlData = dump(data, {
    flowLevel: -1,
    sortKeys: false,
    lineWidth: -1,
  });

  if (yamlData.length < minDataSize) {
    throw new Error(`Banner data was under ${minDataSize} (was ${yamlData.length}) -- aborting!`);
  }

  writeFileSync(outputPath, yamlData, 'utf8');
  return yamlData.length;
}
