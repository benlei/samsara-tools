import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import merge from 'deepmerge';
import { QueryResponse, Continuable, PageContent } from './types';

const MAX_CONTINUES = 100;

export async function queryAll(
  params: Record<string, any>,
  apiUrl: string = 'https://genshin-impact.fandom.com/api.php'
): Promise<QueryResponse> {
  let result: QueryResponse = { query: { pages: {} } };
  let queryParams = { ...params };
  let continues = 0;

  while (continues < MAX_CONTINUES) {
    const response = await axios.get(apiUrl, { params: queryParams });
    const data: QueryResponse = response.data;

    if (data.errors) {
      throw new Error(`API Error: ${JSON.stringify(data.errors)}`);
    }

    if (data.warnings) {
      console.log('API Warnings:', data.warnings);
    }

    // Use deepmerge to match Python's mergedeep Strategy.ADDITIVE
    // Configure to combine arrays (like categories) additively, same as Python
    result = merge(result, data, {
      arrayMerge: (destinationArray, sourceArray) => destinationArray.concat(sourceArray)
    });

    continues++;

    // Check for continuation
    if (data.continue) {
      queryParams = { ...params, ...data.continue };
    } else {
      break;
    }
  }

  result.total_pages = continues;
  return result;
}

export async function getPageContent(pageId: number, apiUrl: string = 'https://genshin-impact.fandom.com/api.php'): Promise<PageContent> {
  const params = {
    action: 'query',
    pageids: pageId.toString(),
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
    format: 'json'
  };

  const response = await axios.get(apiUrl, { params });
  return response.data;
}

// Genshin Impact specific functions
export async function get5StarCharacters(): Promise<QueryResponse> {
  console.log('Gathering all 5 star characters');
  return queryAll({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: 'Category:5-Star_Characters',
    gcmlimit: 'max',
    format: 'json'
  });
}

export async function get4StarCharacters(): Promise<QueryResponse> {
  console.log('Gathering all 4 star characters');
  return queryAll({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: 'Category:4-Star_Characters',
    gcmlimit: 'max',
    format: 'json'
  });
}

export async function get5StarWeapons(): Promise<QueryResponse> {
  console.log('Gathering all 5 star weapons');
  return queryAll({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: 'Category:5-Star_Weapons',
    gcmlimit: 'max',
    format: 'json'
  });
}

export async function get4StarWeapons(): Promise<QueryResponse> {
  console.log('Gathering all 4 star weapons');
  return queryAll({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: 'Category:4-Star_Weapons',
    gcmlimit: 'max',
    format: 'json'
  });
}

export async function getEventWishes(): Promise<QueryResponse> {
  console.log('Gathering all event wishes');
  const result = await queryAll({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: 'Category:Event_Wishes',
    prop: 'categories',
    cllimit: 'max',
    gcmlimit: 'max',
    format: 'json'
  });
  
  return result;
}

export async function getChronicledWishes(): Promise<QueryResponse> {
  console.log('Gathering all chronicled wishes');
  return queryAll({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: 'Category:Chronicled_Wishes',
    prop: 'categories',
    cllimit: 'max',
    gcmlimit: 'max',
    format: 'json'
  });
}

export async function downloadCharacterImage(outputPath: string, characterName: string, size: number = 80): Promise<void> {
  console.log(`Downloading ${characterName} icon to ${outputPath}`);
  
  // Use Fandom's redirect system like the Python version
  const url = `https://genshin-impact.fandom.com/index.php?title=Special:Redirect/file/${characterName} Icon.png&width=${size}&height=${size}`;
  
  await downloadImage(url, outputPath);
}

export async function downloadWeaponImage(outputPath: string, weaponName: string, size: number = 80): Promise<void> {
  console.log(`Downloading ${weaponName} icon to ${outputPath}`);
  
  // Use Fandom's redirect system like the Python version
  const url = `https://genshin-impact.fandom.com/index.php?title=Special:Redirect/file/Weapon ${weaponName}.png&width=${size}&height=${size}`;
  
  await downloadImage(url, outputPath);
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await axios.get(url, { 
    responseType: 'stream',
    timeout: 10000, // 10 second timeout
    headers: {
      'User-Agent': 'Samsara-Tools/1.0.0'
    }
  });
  
  if (response.status !== 200) {
    console.warn(`Received status ${response.status} trying to download image from ${url}`);
    throw new Error(`HTTP ${response.status}`);
  }
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);
  
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

function generateFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase();
}
