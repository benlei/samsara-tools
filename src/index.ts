import * as core from '@actions/core';
import { pullGenshinBanners } from './genshin';
import { pullHSRBanners } from './hsr';

async function run(): Promise<void> {
  try {
    const game = core.getInput('game', { required: true });
    const output = core.getInput('output', { required: true });
    const outputImageDir = core.getInput('output-image-dir', { required: true });
    const force = core.getBooleanInput('force');
    const skipImages = core.getBooleanInput('skip-images');
    const minDataSize = parseInt(core.getInput('min-data-size') || '40000');

    let result: { dataSize: number; imagesDownloaded: number };

    switch (game.toLowerCase()) {
      case 'gi':
        result = await pullGenshinBanners(output, outputImageDir, force, skipImages, minDataSize);
        break;
      case 'hsr':
        result = await pullHSRBanners(output, outputImageDir, force, skipImages, minDataSize);
        break;
      default:
        throw new Error(`Unsupported game: ${game}. Use 'gi' for Genshin Impact or 'hsr' for Honkai Star Rail.`);
    }

    core.setOutput('data-size', result.dataSize.toString());
    core.setOutput('images-downloaded', result.imagesDownloaded.toString());
    
    core.info(`Successfully processed ${game.toUpperCase()} banner data`);
    core.info(`Data size: ${result.dataSize} bytes`);
    core.info(`Images downloaded: ${result.imagesDownloaded}`);
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

// Export run function for testing
export { run };

// GitHub Actions entry point - run immediately when not in test environment
if (process.env.NODE_ENV !== 'test') {
  run();
}
