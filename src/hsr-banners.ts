import { BannersParser } from './banners';
import { Page } from './types';

export class HSRBannersParser extends BannersParser {
  constructor() {
    super('https://honkai-star-rail.fandom.com/api.php');
  }

  isPageWeapon(page: any): boolean {
    // For HSR, weapon banners might have different naming
    return /Event Warp/.test(page.title) && page.title.includes('Light Cone');
  }

  convertSpecializationPageToTitle(page: Page): string {
    const title = super.convertSpecializationPageToTitle(page);
    
    if (title === 'Topaz & Numby') {
      return 'Topaz and Numby';
    }
    
    return title;
  }
}
