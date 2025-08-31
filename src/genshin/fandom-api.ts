import { QueryResponse } from '../fandom/types';
import { queryAll } from '../fandom/api';
import axios from 'axios';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { dirname } from 'path';

const GI_API_URL = 'https://genshin-impact.fandom.com/api.php';

// Genshin Impact specific functions
export async function get5StarCharacters(): Promise<QueryResponse> {
  console.log('Gathering all 5 star characters');
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
  console.log('Gathering all 4 star characters');
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
  console.log('Gathering all 5 star weapons');
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
  console.log('Gathering all 4 star weapons');
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
  console.log('Gathering all event wishes');
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
  console.log('Gathering all chronicled wishes');
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

export async function downloadCharacterImage(
  outputPath: string,
  characterName: string,
  size: number = 80
): Promise<void> {
  console.log(`Downloading ${characterName} icon to ${outputPath}`);

  // Use Fandom's redirect system like the Python version
  const url = `https://genshin-impact.fandom.com/index.php?title=Special:Redirect/file/${characterName} Icon.png&width=${size}&height=${size}`;

  const response = await axios.get(url, {
    responseType: 'stream',
    timeout: 10000, // 10 second timeout
    headers: {
      'User-Agent': 'Samsara-Tools/1.0.0',
    },
  });

  if (response.status !== 200) {
    console.warn(`Received status ${response.status} trying to download image from ${url}`);
    throw new Error(`HTTP ${response.status}`);
  }

  // Ensure directory exists
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const writer = createWriteStream(outputPath);
  response.data.pipe(writer);

  return new Promise<void>((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

export async function downloadWeaponImage(
  outputPath: string,
  weaponName: string,
  size: number = 80
): Promise<void> {
  console.log(`Downloading ${weaponName} icon to ${outputPath}`);

  // Use Fandom's redirect system like the Python version
  const url = `https://genshin-impact.fandom.com/index.php?title=Special:Redirect/file/Weapon ${weaponName}.png&width=${size}&height=${size}`;

  const response = await axios.get(url, {
    responseType: 'stream',
    timeout: 10000, // 10 second timeout
    headers: {
      'User-Agent': 'Samsara-Tools/1.0.0',
    },
  });

  if (response.status !== 200) {
    console.warn(`Received status ${response.status} trying to download image from ${url}`);
    throw new Error(`HTTP ${response.status}`);
  }

  // Ensure directory exists
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const writer = createWriteStream(outputPath);
  response.data.pipe(writer);

  return new Promise<void>((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
