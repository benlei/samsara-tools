import {
  QueryResponse,
  Page,
  BannerDataset,
  BannerHistory,
  BannerDates,
  RomanNumeralMap,
  PageContentCache,
} from './types';
import { getPageContent } from './api';

export function parseVersionWithLuna(version: string): number[] {
  // Handle Luna versions
  const lunaMatch = version.match(/^Luna ([IVX]+)$/);
  if (lunaMatch) {
    const romanNumeral = lunaMatch[1];
    const romanToInt: RomanNumeralMap = {
      I: 1,
      II: 2,
      III: 3,
      IV: 4,
      V: 5,
      VI: 6,
      VII: 7,
      VIII: 8,
    };
    const lunaNumber = romanToInt[romanNumeral] || 1;
    // Treat Luna I as 5.9, Luna II as 5.10, etc.
    const syntheticVersion = `5.${8 + lunaNumber}`;
    return syntheticVersion.split('.').map(Number).concat([0]);
  }

  // Handle regular versions
  try {
    const parts = version.split('.').map((x) => {
      const num = parseInt(x, 10);
      return isNaN(num) ? 999 : num;
    });

    // Check if any part is invalid
    if (parts.some((p) => p === 999)) {
      return [999, 999, 999];
    }

    while (parts.length < 3) {
      parts.push(0);
    }
    return parts.slice(0, 3);
  } catch (error) {
    // Fallback for any malformed versions
    return [999, 999, 999];
  }
}

function getValidDateOrBlank(date: string): string {
  try {
    // Check if the date string matches YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return '';
    }
    const parsedDate = new Date(date);
    // Check if the date is valid
    if (isNaN(parsedDate.getTime())) {
      return '';
    }
    return date;
  } catch {
    return '';
  }
}

function isPageBanner(page: Page): boolean {
  return page.title.includes('/');
}

function getBannerDate(page: Page): string {
  return page.title.split('/')[1];
}

function appendUnique<T>(list: T[], value: T): void {
  if (!list.includes(value)) {
    list.push(value);
  }
}

const pageCache: PageContentCache = {};

export class FandomParser {
  protected CategoryVersionPrefix = 'Category:Released in Version ';
  protected CategoryFeaturedPrefix = 'Category:Features ';
  protected WeaponPagePrefix: RegExp;
  protected ChangeHistoryRegex = /\{\{Change History\|(\d+\.\d+)\}\}/;
  protected apiUrl: string;

  constructor(
    apiUrl: string = 'https://genshin-impact.fandom.com/api.php',
    weaponPagePrefix: RegExp = /Epitome Invocation/
  ) {
    this.apiUrl = apiUrl;
    this.WeaponPagePrefix = weaponPagePrefix;
  }

  async cachedFetchPageContent(pageId: number): Promise<string> {
    if (pageId in pageCache) {
      return pageCache[pageId];
    }

    try {
      pageCache[pageId] = await this.fetchPageContent(pageId);
    } catch {
      pageCache[pageId] = '';
    }

    return pageCache[pageId];
  }

  async fetchPageContent(pageId: number): Promise<string> {
    const content = await getPageContent(pageId, this.apiUrl);
    return content.query.pages[0].revisions[0].slots.main.content;
  }

  async getVersionFromPage(page: Page): Promise<string> {
    function getLastBreadcrumb(): string {
      return page.title.substring(page.title.indexOf('/') + 1);
    }

    function isLastBreadcrumbAVersion(): boolean {
      return /^\d+\.\d+$/.test(getLastBreadcrumb());
    }

    // Python expects categories to exist - if they don't, it's an error
    if (!page.categories) {
      throw new Error(`Page has no categories: ${page.title}`);
    }

    const versions = page.categories.filter((c) => c.title.startsWith(this.CategoryVersionPrefix));

    if (versions.length !== 1 && isLastBreadcrumbAVersion()) {
      return getLastBreadcrumb();
    }

    if (versions.length === 0) {
      const content = await this.cachedFetchPageContent(page.pageid);
      const match = this.ChangeHistoryRegex.exec(content);
      const matchedVersion = match?.[1];
      if (matchedVersion) {
        return matchedVersion;
      }

      throw new Error(`Could not determine version from page ${page.title}`);
    }

    return versions[0].title.substring(this.CategoryVersionPrefix.length);
  }

  isPageWeapon(page: Page): boolean {
    return this.WeaponPagePrefix.test(page.title);
  }

  pageContainFeatured(page: Page, featured: string): boolean {
    // Handle pages without categories
    if (!page.categories || !Array.isArray(page.categories)) {
      return false;
    }

    return page.categories.some((c) => c.title === `${this.CategoryFeaturedPrefix}${featured}`);
  }

  async getPagesOfVersion(
    eventWishesQr: QueryResponse,
    version: string,
    isWeapon: boolean
  ): Promise<Page[]> {
    function keyByValidDate(page: Page): string {
      const validDate = getValidDateOrBlank(getBannerDate(page));
      return validDate !== '' ? validDate : '9999-99-99';
    }

    const pages: Page[] = [];
    if (eventWishesQr.query?.pages) {
      for (const page of Object.values(eventWishesQr.query.pages)) {
        if (
          isPageBanner(page) &&
          this.isPageWeapon(page) === isWeapon &&
          (await this.getVersionFromPage(page)) === version
        ) {
          pages.push(page);
        }
      }
    }

    return pages.sort((a, b) => keyByValidDate(a).localeCompare(keyByValidDate(b)));
  }

  async getMinorVersion(
    eventWishesQr: QueryResponse,
    version: string,
    featured: string,
    isWeapon: boolean
  ): Promise<number> {
    let result = 0;
    let startDate = '';

    const pages = await this.getPagesOfVersion(eventWishesQr, version, isWeapon);
    for (const page of pages) {
      if (getBannerDate(page) !== startDate) {
        startDate = getBannerDate(page);
        result += 1;
      }

      if (this.pageContainFeatured(page, featured)) {
        break;
      }
    }

    return result;
  }

  async filterInvalidPages(eventWishesQr: QueryResponse): Promise<QueryResponse> {
    const result: QueryResponse = { query: { pages: {} } };

    if (eventWishesQr.query?.pages) {
      for (const page of Object.values(eventWishesQr.query.pages)) {
        if (!isPageBanner(page)) {
          continue;
        }

        try {
          await this.getVersionFromPage(page);
          result.query!.pages![page.pageid] = page;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`Skipping page due to version error: ${page.title} - ${errorMessage}`);
          continue;
        }
      }
    }

    return result;
  }

  async getFeaturedVersions(eventWishesQr: QueryResponse, featured: string): Promise<string[]> {
    const result: string[] = [];

    if (eventWishesQr.query?.pages) {
      for (const page of Object.values(eventWishesQr.query.pages)) {
        if (this.pageContainFeatured(page, featured)) {
          try {
            const version = await this.getVersionFromPage(page);
            const minorVersion = await this.getMinorVersion(
              eventWishesQr,
              version,
              featured,
              this.isPageWeapon(page)
            );
            const fullVersion = `${version}.${minorVersion}`;
            appendUnique(result, fullVersion);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log(`Error getting version for ${page.title}: ${errorMessage}`);
            continue;
          }
        }
      }
    }

    result.sort((a, b) => {
      const aParts = parseVersionWithLuna(a);
      const bParts = parseVersionWithLuna(b);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const diff = (aParts[i] || 0) - (bParts[i] || 0);
        if (diff !== 0) return diff;
      }
      return 0;
    });

    return result;
  }

  getNextBannerDate(eventWishesQr: QueryResponse, startDate: string, isWeapon: boolean): string {
    const dates: string[] = [];

    if (eventWishesQr.query?.pages) {
      for (const page of Object.values(eventWishesQr.query.pages)) {
        if (
          isPageBanner(page) &&
          this.isPageWeapon(page) === isWeapon &&
          getBannerDate(page) > startDate
        ) {
          dates.push(getBannerDate(page));
        }
      }
    }

    dates.sort();
    return dates.length > 0 ? dates[0] : '';
  }

  async getFeaturedDates(eventWishesQr: QueryResponse, featured: string): Promise<BannerDates[]> {
    const result: BannerDates[] = [];

    if (eventWishesQr.query?.pages) {
      for (const page of Object.values(eventWishesQr.query.pages)) {
        if (this.pageContainFeatured(page, featured)) {
          const startDate = getValidDateOrBlank(getBannerDate(page));
          const endDate =
            startDate !== ''
              ? getValidDateOrBlank(
                  this.getNextBannerDate(
                    eventWishesQr,
                    getBannerDate(page),
                    this.isPageWeapon(page)
                  )
                )
              : '';

          const bannerDate: BannerDates = {
            start: startDate,
            end: endDate,
          };

          // Use appendUnique equivalent for objects
          if (
            !result.some(
              (existing) => existing.start === bannerDate.start && existing.end === bannerDate.end
            )
          ) {
            result.push(bannerDate);
          }
        }
      }
    }

    result.sort((a, b) => {
      const aStart = a.start === '' ? '999999999' : a.start;
      const bStart = b.start === '' ? '999999999' : b.start;
      return aStart.localeCompare(bStart);
    });

    return result;
  }

  convertSpecializationPageToTitle(page: Page): string {
    if (page.title.includes('/')) {
      const parts = page.title.split('/');
      return `${parts[0]} (${parts[1]})`;
    }
    return page.title;
  }

  async getFeaturedBannerHistory(
    eventWishesQr: QueryResponse,
    featuredQs: QueryResponse
  ): Promise<BannerHistory[]> {
    const result: BannerHistory[] = [];

    if (featuredQs.query?.pages) {
      // Sort pages by title to match Python's alphabetical iteration order
      const sortedPages = Object.values(featuredQs.query.pages).sort((a, b) =>
        a.title.localeCompare(b.title)
      );

      for (const page of sortedPages) {
        const modifiedPage = { ...page };
        modifiedPage.title = this.convertSpecializationPageToTitle(modifiedPage);

        const versions = await this.getFeaturedVersions(eventWishesQr, modifiedPage.title);
        const dates = await this.getFeaturedDates(eventWishesQr, modifiedPage.title);

        result.push({
          name: modifiedPage.title,
          versions,
          dates,
        });

        if (result[result.length - 1].versions.length !== result[result.length - 1].dates.length) {
          console.log(
            `WARNING: Version and dates length mismatch for ${modifiedPage.title} - versions: ${JSON.stringify(versions)}, dates: ${JSON.stringify(dates)}`
          );
          // throw new Error(`Version and dates length mismatch for ${modifiedPage.title}`);
        }
      }
    }

    return result
      .filter((r) => r.versions.length > 0)
      .sort((a, b) => {
        const aParts = parseVersionWithLuna(a.versions[0]);
        const bParts = parseVersionWithLuna(b.versions[0]);
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const diff = (aParts[i] || 0) - (bParts[i] || 0);
          if (diff !== 0) return diff;
        }
        // If versions are equal, maintain original order (stable sort)
        // This matches Python's stable sort behavior
        return 0;
      });
  }

  async parse(
    eventWishesQr: QueryResponse,
    fiveStarCharactersQr: QueryResponse,
    fourStarCharactersQr: QueryResponse,
    fiveStarWeaponsQr: QueryResponse,
    fourStarWeaponsQr: QueryResponse
  ): Promise<BannerDataset> {
    const filteredEventWishes = await this.filterInvalidPages(eventWishesQr);

    return {
      fiveStarCharacters: await this.getFeaturedBannerHistory(
        filteredEventWishes,
        fiveStarCharactersQr
      ),
      fourStarCharacters: await this.getFeaturedBannerHistory(
        filteredEventWishes,
        fourStarCharactersQr
      ),
      fiveStarWeapons: await this.getFeaturedBannerHistory(filteredEventWishes, fiveStarWeaponsQr),
      fourStarWeapons: await this.getFeaturedBannerHistory(filteredEventWishes, fourStarWeaponsQr),
    };
  }
}

export function getQrPageTitles(qr: QueryResponse): string[] {
  const result: string[] = [];
  if (qr.query?.pages) {
    for (const page of Object.values(qr.query.pages)) {
      result.push(page.title);
    }
  }
  return result;
}
