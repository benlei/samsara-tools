import * as core from '@actions/core';
import { BannerDataset } from './types';
import { BannersParser, coerceChronicledToCharBanner, coerceChronicledToWeapBanner } from './banners';
import * as fandom from './fandom';
import { writeData, writeImages } from './output';

export async function pullGenshinBanners(
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
