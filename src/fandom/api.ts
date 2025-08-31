import axios from 'axios';
import merge from 'deepmerge';
import { QueryResponse, PageContent, MediaWikiApiParams } from './types';

const MAX_CONTINUES = 100;

export async function queryAll(
  params: MediaWikiApiParams,
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
      arrayMerge: (destinationArray, sourceArray) => destinationArray.concat(sourceArray),
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

export async function getPageContent(
  pageId: number,
  apiUrl: string = 'https://genshin-impact.fandom.com/api.php'
): Promise<PageContent> {
  const params: MediaWikiApiParams = {
    action: 'query',
    pageids: pageId.toString(),
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
    format: 'json',
  };

  const response = await axios.get(apiUrl, { params });
  return response.data;
}
