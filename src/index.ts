import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { BannerDataset, BannerHistory } from './types';
import { BannersParser, coerceChronicledToCharBanner, coerceChronicledToWeapBanner } from './banners';
import { HSRBannersParser } from './hsr-banners';
import * as fandom from './fandom';
import * as hsrFandom from './hsr-fandom';

function generateFilename(name: string): string {
  // Use the same logic as Python generate.filename
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase();
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

async function writeImages(
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

function writeData(data: BannerDataset, outputPath: string, minDataSize: number): number {
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

async function pullGenshinBanners(
  outputPath: string,
  outputImageDir: string,
  force: boolean,
  skipImages: boolean,
  minDataSize: number
): Promise<{ dataSize: number; imagesDownloaded: number }> {
  core.info('Pulling Genshin Impact banner data...');

  const [fiveChars, fiveWeaps, eventWishes, chronicledWishes] = await Promise.all([
    fandom.get5StarCharacters(),
    fandom.get5StarWeapons(),
    fandom.getEventWishes(),
    fandom.getChronicledWishes()
  ]);

  // Merge chronicled wishes into event wishes
  const mergedEventWishes = {
    ...eventWishes,
    query: {
      ...eventWishes.query,
      pages: {
        ...eventWishes.query?.pages,
        ...coerceChronicledToCharBanner(chronicledWishes, fiveChars).query?.pages,
        ...coerceChronicledToWeapBanner(chronicledWishes, fiveWeaps).query?.pages
      }
    }
  };

  const parser = new BannersParser();
  const data = await parser.transformData(
    mergedEventWishes,
    fiveChars,
    await fandom.get4StarCharacters(),
    fiveWeaps,
    await fandom.get4StarWeapons()
  );

  const dataSize = writeData(data, outputPath, minDataSize);
  const imagesDownloaded = skipImages ? 0 : await writeImages(data, outputImageDir, force, false);

  return { dataSize, imagesDownloaded };
}

async function pullHSRBanners(
  outputPath: string,
  outputImageDir: string,
  force: boolean,
  skipImages: boolean,
  minDataSize: number
): Promise<{ dataSize: number; imagesDownloaded: number }> {
  core.info('Pulling Honkai Star Rail banner data...');

  const parser = new HSRBannersParser();
  const data = await parser.transformData(
    await hsrFandom.getEventWishes(),
    await hsrFandom.get5StarCharacters(),
    await hsrFandom.get4StarCharacters(),
    await hsrFandom.get5StarWeapons(),
    await hsrFandom.get4StarWeapons()
  );

  const dataSize = writeData(data, outputPath, minDataSize);
  const imagesDownloaded = skipImages ? 0 : await writeImages(data, outputImageDir, force, true);

  return { dataSize, imagesDownloaded };
}

async function run(): Promise<void> {
  try {
    const game = core.getInput('game', { required: true });
    const output = core.getInput('output', { required: true });
    const outputImageDir = core.getInput('output-image-dir', { required: true });
    const force = core.getBooleanInput('force');
    const skipImages = core.getBooleanInput('skip-images');
    const minDataSize = parseInt(core.getInput('min-data-size') || '40000');

    let result: { dataSize: number; imagesDownloaded: number };

    switch (game.toLowerCase()) {
      case 'gi':
        result = await pullGenshinBanners(output, outputImageDir, force, skipImages, minDataSize);
        break;
      case 'hsr':
        result = await pullHSRBanners(output, outputImageDir, force, skipImages, minDataSize);
        break;
      default:
        throw new Error(`Unsupported game: ${game}. Use 'gi' for Genshin Impact or 'hsr' for Honkai Star Rail.`);
    }

    core.setOutput('data-size', result.dataSize.toString());
    core.setOutput('images-downloaded', result.imagesDownloaded.toString());
    
    core.info(`Successfully processed ${game.toUpperCase()} banner data`);
    core.info(`Data size: ${result.dataSize} bytes`);
    core.info(`Images downloaded: ${result.imagesDownloaded}`);
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

if (require.main === module) {
  run();
}

export { run };
