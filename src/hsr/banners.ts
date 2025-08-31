import { FandomParser } from '../fandom/parser';
import { Page } from '../fandom/types';

export class HSRBannersParser extends FandomParser {
  constructor() {
    super('https://honkai-star-rail.fandom.com/api.php', /Event Warp/);
  }

  isPageWeapon(page: Page): boolean {
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
