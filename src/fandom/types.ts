export interface BannerDates {
  start: string;
  end: string;
}

export interface BannerHistory {
  name: string;
  versions: string[];
  dates: BannerDates[];
}

export interface BannerDataset {
  fiveStarCharacters: BannerHistory[];
  fourStarCharacters: BannerHistory[];
  fiveStarWeapons: BannerHistory[];
  fourStarWeapons: BannerHistory[];
}

export interface BannerProcessingResult {
  dataSize: number;
  imagesDownloaded: number;
}

export interface Category {
  title: string;
}

export interface Page {
  pageid: number;
  title: string;
  categories: Category[];
}

export type Pages = Record<string, Page>;

export interface Query {
  pages?: Pages;
}

export interface Continuable {
  continue?: string;
  clcontinue?: string;
  gcmcontinue?: string;
}

export interface ApiError {
  code: string;
  info: string;
  module?: string;
}

export interface ApiWarning {
  module: string;
  warnings: string;
}

export interface MediaWikiApiParams {
  action: string;
  format?: string;
  generator?: string;
  gcmtitle?: string;
  gcmlimit?: string | number;
  prop?: string;
  cllimit?: string | number;
  pageids?: string;
  rvprop?: string;
  rvslots?: string;
  [key: string]: string | number | undefined;
}

export interface QueryResponse {
  continue?: Continuable;
  query?: Query;
  errors?: ApiError[];
  warnings?: Record<string, ApiWarning>;
  total_pages?: number;
}

export interface RomanNumeralMap {
  [key: string]: number;
}

export interface PageContentCache {
  [pageId: number]: string;
}

export interface PageContent {
  query: {
    pages: Array<{
      revisions: Array<{
        slots: {
          main: {
            content: string;
          };
        };
      }>;
    }>;
  };
}
