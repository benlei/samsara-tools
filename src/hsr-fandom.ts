import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { QueryResponse, PageContent } from './types';
import { queryAll } from './fandom';

const HSR_API_URL = 'https://honkai-star-rail.fandom.com/api.php';

export async function getEventWishes(): Promise<QueryResponse> {
  console.log('Gathering all HSR event wishes');
  return queryAll({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: 'Category:Event_Warps',
    prop: 'categories',
    cllimit: 'max',
    gcmlimit: 'max',
    format: 'json'
  }, HSR_API_URL);
}

export async function get5StarCharacters(): Promise<QueryResponse> {
  console.log('Gathering all HSR 5 star characters');
  return queryAll({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: 'Category:5-Star_Characters',
    gcmlimit: 'max',
    format: 'json'
  }, HSR_API_URL);
}

export async function get4StarCharacters(): Promise<QueryResponse> {
  console.log('Gathering all HSR 4 star characters');
  return queryAll({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: 'Category:4-Star_Characters',
    gcmlimit: 'max',
    format: 'json'
  }, HSR_API_URL);
}

export async function get5StarWeapons(): Promise<QueryResponse> {
  console.log('Gathering all HSR 5 star light cones');
  return queryAll({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: 'Category:5-Star_Light_Cones',
    gcmlimit: 'max',
    format: 'json'
  }, HSR_API_URL);
}

export async function get4StarWeapons(): Promise<QueryResponse> {
  console.log('Gathering all HSR 4 star light cones');
  return queryAll({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: 'Category:4-Star_Light_Cones',
    gcmlimit: 'max',
    format: 'json'
  }, HSR_API_URL);
}

export async function downloadCharacterImage(outputPath: string, characterName: string, size: number = 80): Promise<void> {
  console.log(`Downloading ${characterName} icon to ${outputPath}`);
  const url = `https://honkai-star-rail.fandom.com/index.php?title=Special:Redirect/file/Character ${characterName} Icon.png&width=${size}&height=${size}`;
  
  await downloadImage(url, outputPath);
}

export async function downloadWeaponImage(outputPath: string, weaponName: string, size: number = 80): Promise<void> {
  console.log(`Downloading ${weaponName} icon to ${outputPath}`);
  const url = `https://honkai-star-rail.fandom.com/index.php?title=Special:Redirect/file/Light Cone ${weaponName} Icon.png&width=${size}&height=${size}`;
  
  await downloadImage(url, outputPath);
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    
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
  } catch (error) {
    console.warn(`Failed to download HSR image from ${url}: ${error}`);
  }
}
