import {
  BannersParser,
  coerceChronicledToCharBanner,
  coerceChronicledToWeapBanner,
} from './banners';
import { writeData, writeImages } from '../fandom/output';
import {
  get5StarCharacters,
  get5StarWeapons,
  get4StarCharacters,
  get4StarWeapons,
  getEventWishes,
  getChronicledWishes,
  downloadCharacterImage,
  downloadWeaponImage,
} from './fandom-api';
import { QueryResponse, BannerProcessingResult } from '../fandom/types';
import { info } from '@actions/core';

export async function pullGenshinBanners(
  outputPath: string,
  outputImageDir: string,
  force: boolean,
  skipImages: boolean,
  minDataSize: number
): Promise<BannerProcessingResult> {
  info('Pulling Genshin Impact banner data...');

  const [fiveChars, fiveWeaps, fourChars, fourWeaps, eventWishes, chronicledWishes] =
    await Promise.all([
      get5StarCharacters(),
      get5StarWeapons(),
      get4StarCharacters(),
      get4StarWeapons(),
      getEventWishes(),
      getChronicledWishes(),
    ]);

  // Merge chronicled wishes into event wishes
  const mergedEventWishes: QueryResponse = {
    query: {
      pages: {
        ...eventWishes.query?.pages,
        ...coerceChronicledToCharBanner(chronicledWishes, fiveChars).query?.pages,
        ...coerceChronicledToWeapBanner(chronicledWishes, fiveWeaps).query?.pages,
      },
    },
  };

  const parser = new BannersParser();
  const data = await parser.parse(mergedEventWishes, fiveChars, fourChars, fiveWeaps, fourWeaps);

  const dataSize = writeData(data, outputPath, minDataSize);
  const imagesDownloaded = skipImages
    ? 0
    : await writeImages(
        data,
        outputImageDir,
        force,
        false,
        downloadCharacterImage,
        downloadWeaponImage
      );

  return { dataSize, imagesDownloaded };
}
