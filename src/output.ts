import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { BannerDataset, BannerHistory } from './types';
import * as fandom from './fandom';
import * as hsrFandom from './hsr-fandom';

export function generateFilename(name: string): string {
  // Use the same logic as Python generate.filename
  let result = name.replace(/\s/g, '-'); // Replace spaces with hyphens
  result = result.replace(/[^a-zA-Z0-9\-]/g, ''); // Remove special characters except hyphens
  return result.replace(/--+/g, '-'); // Replace multiple consecutive hyphens with single hyphen
}

async function downloadImage(
  outputPath: string, 
  name: string, 
  isCharacter: boolean, 
  isHSR: boolean = false,
  force: boolean = false
): Promise<void> {
  const fullPath = path.resolve(outputPath);
  
  if (!force && fs.existsSync(fullPath)) {
    return;
  }

  if (isHSR) {
    if (isCharacter) {
      await hsrFandom.downloadCharacterImage(fullPath, name, 80);
    } else {
      await hsrFandom.downloadWeaponImage(fullPath, name, 80);
    }
  } else {
    if (isCharacter) {
      await fandom.downloadCharacterImage(fullPath, name, 80);
    } else {
      await fandom.downloadWeaponImage(fullPath, name, 80);
    }
  }

  // Sleep 0.5 seconds between downloads
  await new Promise(resolve => setTimeout(resolve, 500));
}

export async function writeImages(
  data: BannerDataset, 
  outputImageDir: string, 
  force: boolean, 
  isHSR: boolean = false
): Promise<number> {
  let imagesDownloaded = 0;

  function getGenericFeatureType(featureType: string): string {
    if (featureType.toLowerCase().includes('character')) {
      return isHSR ? 'hsr-characters' : 'characters';
    }
    return isHSR ? 'lightcones' : 'weapons';
  }

  const imagePath = path.resolve(outputImageDir);

  for (const [featuredType, bannerHistoryList] of Object.entries(data)) {
    for (const bannerHistory of bannerHistoryList as BannerHistory[]) {
      const featureDir = getGenericFeatureType(featuredType);
      const filename = `${generateFilename(bannerHistory.name)}.png`;
      const fullPath = path.join(imagePath, featureDir, filename);

      const isCharacter = featureDir.includes('character');
      
      try {
        await downloadImage(fullPath, bannerHistory.name, isCharacter, isHSR, force);
        imagesDownloaded++;
      } catch (error) {
        core.warning(`Failed to download image for ${bannerHistory.name}: ${error}`);
      }
    }
  }

  return imagesDownloaded;
}

export function writeData(data: BannerDataset, outputPath: string, minDataSize: number): number {
  const yamlData = yaml.dump(data, {
    flowLevel: -1,
    sortKeys: false,
    lineWidth: -1
  });

  if (yamlData.length < minDataSize) {
    throw new Error(`Banner data was under ${minDataSize} (was ${yamlData.length}) -- aborting!`);
  }

  fs.writeFileSync(outputPath, yamlData, 'utf8');
  return yamlData.length;
}
