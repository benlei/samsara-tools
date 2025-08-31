import * as core from '@actions/core';
import { BannerDataset, BannerProcessingResult } from '../fandom/types';
import { HSRBannersParser } from './banners';
import * as hsrFandom from './fandom-api';
import { writeData, writeImages } from '../fandom/output';

export async function pullHSRBanners(
  outputPath: string,
  outputImageDir: string,
  force: boolean,
  skipImages: boolean,
  minDataSize: number
): Promise<BannerProcessingResult> {
  core.info('Pulling Honkai Star Rail banner data...');

  const parser = new HSRBannersParser();
  const data = await parser.parse(
    await hsrFandom.getEventWishes(),
    await hsrFandom.get5StarCharacters(),
    await hsrFandom.get4StarCharacters(),
    await hsrFandom.get5StarWeapons(),
    await hsrFandom.get4StarWeapons()
  );

  const dataSize = writeData(data, outputPath, minDataSize);
  const imagesDownloaded = skipImages ? 0 : await writeImages(
    data, 
    outputImageDir, 
    force, 
    true,
    hsrFandom.downloadCharacterImage,
    hsrFandom.downloadWeaponImage
  );

  return { dataSize, imagesDownloaded };
}
