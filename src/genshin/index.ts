import { BannersParser, coerceChronicledToCharBanner, coerceChronicledToWeapBanner } from './banners';
import { writeData, writeImages } from '../fandom/output';
import * as fandom from './fandom-api';
import { BannerDataset, QueryResponse, BannerProcessingResult } from '../fandom/types';
import * as core from '@actions/core';

export async function pullGenshinBanners(
  outputPath: string,
  outputImageDir: string,
  force: boolean,
  skipImages: boolean,
  minDataSize: number
): Promise<BannerProcessingResult> {
  core.info('Pulling Genshin Impact banner data...');

  const [fiveChars, fiveWeaps, fourChars, fourWeaps, eventWishes, chronicledWishes] = await Promise.all([
    fandom.get5StarCharacters(),
    fandom.get5StarWeapons(),
    fandom.get4StarCharacters(),
    fandom.get4StarWeapons(),
    fandom.getEventWishes(),
    fandom.getChronicledWishes()
  ]);

  // Merge chronicled wishes into event wishes
  const mergedEventWishes: QueryResponse = {
    query: {
      pages: {
        ...eventWishes.query?.pages,
        ...coerceChronicledToCharBanner(chronicledWishes, fiveChars).query?.pages,
        ...coerceChronicledToWeapBanner(chronicledWishes, fiveWeaps).query?.pages
      }
    }
  };

  const parser = new BannersParser();
  const data = await parser.parse(
    mergedEventWishes,
    fiveChars,
    fourChars,
    fiveWeaps,
    fourWeaps
  );

  const dataSize = writeData(data, outputPath, minDataSize);
  const imagesDownloaded = skipImages ? 0 : await writeImages(
    data, 
    outputImageDir, 
    force, 
    false,
    fandom.downloadCharacterImage,
    fandom.downloadWeaponImage
  );

  return { dataSize, imagesDownloaded };
}