import { QueryResponse } from '../fandom/types';
import { queryAll } from '../fandom/api';
import axios from 'axios';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { dirname } from 'path';

const HSR_API_URL = 'https://honkai-star-rail.fandom.com/api.php';

export async function getEventWishes(): Promise<QueryResponse> {
  console.log('Gathering all HSR event wishes');
  return queryAll(
    {
      action: 'query',
      generator: 'categorymembers',
      gcmtitle: 'Category:Event_Warps',
      prop: 'categories',
      cllimit: 'max',
      gcmlimit: 'max',
      format: 'json',
    },
    HSR_API_URL
  );
}

export async function get5StarCharacters(): Promise<QueryResponse> {
  console.log('Gathering all HSR 5 star characters');
  return queryAll(
    {
      action: 'query',
      generator: 'categorymembers',
      gcmtitle: 'Category:5-Star_Characters',
      gcmlimit: 'max',
      format: 'json',
    },
    HSR_API_URL
  );
}

export async function get4StarCharacters(): Promise<QueryResponse> {
  console.log('Gathering all HSR 4 star characters');
  return queryAll(
    {
      action: 'query',
      generator: 'categorymembers',
      gcmtitle: 'Category:4-Star_Characters',
      gcmlimit: 'max',
      format: 'json',
    },
    HSR_API_URL
  );
}

export async function get5StarWeapons(): Promise<QueryResponse> {
  console.log('Gathering all HSR 5 star light cones');
  return queryAll(
    {
      action: 'query',
      generator: 'categorymembers',
      gcmtitle: 'Category:5-Star_Light_Cones',
      gcmlimit: 'max',
      format: 'json',
    },
    HSR_API_URL
  );
}

export async function get4StarWeapons(): Promise<QueryResponse> {
  console.log('Gathering all HSR 4 star light cones');
  return queryAll(
    {
      action: 'query',
      generator: 'categorymembers',
      gcmtitle: 'Category:4-Star_Light_Cones',
      gcmlimit: 'max',
      format: 'json',
    },
    HSR_API_URL
  );
}

export async function downloadCharacterImage(
  outputPath: string,
  characterName: string,
  size: number = 80
): Promise<void> {
  console.log(`Downloading ${characterName} icon to ${outputPath}`);
  const url = `https://honkai-star-rail.fandom.com/index.php?title=Special:Redirect/file/Character ${characterName} Icon.png&width=${size}&height=${size}`;

  try {
    const response = await axios.get(url, { responseType: 'stream' });

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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to download HSR character image from ${url}: ${errorMessage}`);
    throw error;
  }
}

export async function downloadWeaponImage(
  outputPath: string,
  weaponName: string,
  size: number = 80
): Promise<void> {
  console.log(`Downloading ${weaponName} icon to ${outputPath}`);
  const url = `https://honkai-star-rail.fandom.com/index.php?title=Special:Redirect/file/Light Cone ${weaponName} Icon.png&width=${size}&height=${size}`;

  try {
    const response = await axios.get(url, { responseType: 'stream' });

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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to download HSR weapon image from ${url}: ${errorMessage}`);
    throw error;
  }
}
