import { QueryResponse } from '../fandom/types';
import { queryAll } from '../fandom/api';
import axios from 'axios';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { dirname } from 'path';
import { info, warning } from '@actions/core';

const GI_API_URL = 'https://genshin-impact.fandom.com/api.php';

// Genshin Impact specific functions
export async function get5StarCharacters(): Promise<QueryResponse> {
  info('Gathering all 5 star characters');
  return queryAll(
    {
      action: 'query',
      generator: 'categorymembers',
      gcmtitle: 'Category:5-Star_Characters',
      gcmlimit: 'max',
      format: 'json',
    },
    GI_API_URL
  );
}

export async function get4StarCharacters(): Promise<QueryResponse> {
  info('Gathering all 4 star characters');
  return queryAll(
    {
      action: 'query',
      generator: 'categorymembers',
      gcmtitle: 'Category:4-Star_Characters',
      gcmlimit: 'max',
      format: 'json',
    },
    GI_API_URL
  );
}

export async function get5StarWeapons(): Promise<QueryResponse> {
  info('Gathering all 5 star weapons');
  return queryAll(
    {
      action: 'query',
      generator: 'categorymembers',
      gcmtitle: 'Category:5-Star_Weapons',
      gcmlimit: 'max',
      format: 'json',
    },
    GI_API_URL
  );
}

export async function get4StarWeapons(): Promise<QueryResponse> {
  info('Gathering all 4 star weapons');
  return queryAll(
    {
      action: 'query',
      generator: 'categorymembers',
      gcmtitle: 'Category:4-Star_Weapons',
      gcmlimit: 'max',
      format: 'json',
    },
    GI_API_URL
  );
}

export async function getEventWishes(): Promise<QueryResponse> {
  info('Gathering all event wishes');
  const result = await queryAll(
    {
      action: 'query',
      generator: 'categorymembers',
      gcmtitle: 'Category:Event_Wishes',
      prop: 'categories',
      cllimit: 'max',
      gcmlimit: 'max',
      format: 'json',
    },
    GI_API_URL
  );

  return result;
}

export async function getChronicledWishes(): Promise<QueryResponse> {
  info('Gathering all chronicled wishes');
  return queryAll(
    {
      action: 'query',
      generator: 'categorymembers',
      gcmtitle: 'Category:Chronicled_Wishes',
      prop: 'categories',
      cllimit: 'max',
      gcmlimit: 'max',
      format: 'json',
    },
    GI_API_URL
  );
}

async function downloadFandomThumbnail(
  outputPath: string,
  apiBase: string,
  fileName: string,
  size: number
): Promise<void> {
  const params = {
    action: 'query',
    titles: `File:${fileName}`,
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: size,
    format: 'json',
  };

  const response = await axios.get(apiBase, {
    params,
    timeout: 10000,
    headers: {
      'User-Agent': 'Samsara-Tools/1.0.0',
    },
  });

  if (response.status !== 200) {
    warning(`Received status ${response.status} from API ${apiBase}`);
    throw new Error(`HTTP ${response.status}`);
  }

  const pages = response.data?.query?.pages;
  const pageId = pages ? Object.keys(pages)[0] : undefined;
  const thumbUrl = pageId ? pages[pageId]?.imageinfo?.[0]?.thumburl : undefined;

  if (!thumbUrl) {
    throw new Error(`Could not generate thumbnail URL for ${fileName}`);
  }

  info(`Downloading resized icon: ${thumbUrl}`);

  const downloadResponse = await axios.get(thumbUrl, {
    responseType: 'stream',
    timeout: 10000,
    headers: {
      'User-Agent': 'Samsara-Tools/1.0.0',
    },
  });

  if (downloadResponse.status !== 200) {
    warning(`Received status ${downloadResponse.status} trying to download image from ${thumbUrl}`);
    throw new Error(`HTTP ${downloadResponse.status}`);
  }

  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const writer = createWriteStream(outputPath);
  downloadResponse.data.pipe(writer);

  return new Promise<void>((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

export async function downloadCharacterImage(
  outputPath: string,
  characterName: string,
  size: number = 80
): Promise<void> {
  info(`Downloading ${characterName} icon to ${outputPath}`);
  return downloadFandomThumbnail(outputPath, GI_API_URL, `${characterName} Icon.png`, size);
}

export async function downloadWeaponImage(
  outputPath: string,
  weaponName: string,
  size: number = 80
): Promise<void> {
  info(`Downloading ${weaponName} icon to ${outputPath}`);
  return downloadFandomThumbnail(outputPath, GI_API_URL, `Weapon ${weaponName}.png`, size);
}
