import * as core from '@actions/core';
import { BannerDataset } from './types';
import { HSRBannersParser } from './hsr-banners';
import * as hsrFandom from './hsr-fandom';
import { writeData, writeImages } from './output';

export async function pullHSRBanners(
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
