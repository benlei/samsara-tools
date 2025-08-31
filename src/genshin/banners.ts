import { FandomParser } from '../fandom/parser';
import { Page, QueryResponse } from '../fandom/types';
import { getQrPageTitles } from '../fandom/parser';

export class BannersParser extends FandomParser {
  constructor() {
    super('https://genshin-impact.fandom.com/api.php', /Epitome Invocation/);
  }
}

export function stripChronicledPrefix(title: string): string {
  return title.substring('Category:Wish Pool Includes '.length);
}

function isPageBanner(page: Page): boolean {
  return page.title.includes('/');
}

export function coerceChronicledToCharBanner(
  chronicledQr: QueryResponse,
  charQr: QueryResponse
): QueryResponse {
  const fiveStarCharacters = getQrPageTitles(charQr, 'Category:5-Star Characters');
  const result: QueryResponse = { query: { pages: {} } };

  if (chronicledQr.query?.pages) {
    for (const page of Object.values(chronicledQr.query.pages)) {
      if (!isPageBanner(page)) {
        continue;
      }

      const newPage = JSON.parse(JSON.stringify(page));
      const additionalCategories = page.categories
        .map(c => stripChronicledPrefix(c.title))
        .filter(title => fiveStarCharacters.includes(title))
        .map(title => ({ title: `Category:Features ${title}` }));

      newPage.categories.push(...additionalCategories);
      result.query!.pages![page.pageid] = newPage;
    }
  }

  return result;
}

export function coerceChronicledToWeapBanner(
  chronicledQr: QueryResponse,
  weapQr: QueryResponse
): QueryResponse {
  const fiveStarWeapons = getQrPageTitles(weapQr, 'Category:5-Star Weapons');
  const result: QueryResponse = { query: { pages: {} } };

  if (chronicledQr.query?.pages) {
    for (const page of Object.values(chronicledQr.query.pages)) {
      if (!isPageBanner(page)) {
        continue;
      }

      const newPage = JSON.parse(JSON.stringify(page));
      newPage.pageid = -page.pageid;
      newPage.title = `Epitome Invocation/${page.title.split('/')[1]}`;
      
      const additionalCategories = page.categories
        .map(c => stripChronicledPrefix(c.title))
        .filter(title => fiveStarWeapons.includes(title))
        .map(title => ({ title: `Category:Features ${title}` }));

      newPage.categories.push(...additionalCategories);
      result.query!.pages![-page.pageid] = newPage;
    }
  }

  return result;
}
