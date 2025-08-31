import { info } from '@actions/core';
import { BannerProcessingResult } from '../fandom/types';
import { HSRBannersParser } from './banners';
import {
  getEventWishes,
  get5StarCharacters,
  get4StarCharacters,
  get5StarWeapons,
  get4StarWeapons,
  downloadCharacterImage,
  downloadWeaponImage,
} from './fandom-api';
import { writeData, writeImages } from '../fandom/output';

export async function pullHSRBanners(
  outputPath: string,
  outputImageDir: string,
  force: boolean,
  skipImages: boolean,
  minDataSize: number
): Promise<BannerProcessingResult> {
  info('Pulling Honkai Star Rail banner data...');

  const parser = new HSRBannersParser();
  const data = await parser.parse(
    await getEventWishes(),
    await get5StarCharacters(),
    await get4StarCharacters(),
    await get5StarWeapons(),
    await get4StarWeapons()
  );

  const dataSize = writeData(data, outputPath, minDataSize);
  const imagesDownloaded = skipImages
    ? 0
    : await writeImages(
        data,
        outputImageDir,
        force,
        true,
        downloadCharacterImage,
        downloadWeaponImage
      );

  return { dataSize, imagesDownloaded };
}
