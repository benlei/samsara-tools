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

export interface QueryResponse {
  continue?: Continuable;
  query?: Query;
  errors?: any;
  warnings?: any;
  total_pages?: number;
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
