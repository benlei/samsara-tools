# Migration Guide: Python to TypeScript GitHub Action

## Overview

The `samsara-tools` repository has been successfully converted from Python scripts to a TypeScript GitHub Action. This provides better integration with GitHub workflows and improved performance.

## What Changed

### Before (Python)
```bash
# Genshin Impact
python pull_banners.py --output ./gi-banners.yml --output-image-dir ./images --force

# Honkai Star Rail  
python pull_hsr_banners.py --output ./hsr-banners.yml --output-image-dir ./images --force
```

### After (TypeScript GitHub Action)
```yaml
# Genshin Impact
- uses: benlei/samsara-tools@v1
  with:
    game: 'gi'
    output: './gi-banners.yml'
    output-image-dir: './images'
    force: 'true'

# Honkai Star Rail
- uses: benlei/samsara-tools@v1
  with:
    game: 'hsr'
    output: './hsr-banners.yml'
    output-image-dir: './images'
    force: 'true'
```

## Key Improvements

1. **Better Integration**: Native GitHub Actions support
2. **Unified Interface**: Single action handles both games
3. **Better Error Handling**: Proper GitHub Actions outputs and error reporting
4. **Automated Testing**: TypeScript with Jest testing framework
5. **Type Safety**: Full TypeScript type definitions
6. **Performance**: Compiled and bundled for faster execution

## File Structure

### New TypeScript Files
- `src/index.ts` - Main action entry point
- `src/types.ts` - Type definitions
- `src/fandom.ts` - Genshin Impact Fandom API interface
- `src/hsr-fandom.ts` - HSR Fandom API interface
- `src/banners.ts` - Banner parsing logic
- `src/hsr-banners.ts` - HSR-specific banner parsing

### Configuration Files
- `action.yml` - GitHub Action metadata
- `package.json` - Node.js dependencies
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Test configuration

### Generated Files
- `lib/` - Compiled JavaScript
- `dist/` - Bundled action for distribution

## Migration Steps for Users

1. **Remove Python Dependencies**: No longer need Poetry or Python environment
2. **Update Workflows**: Replace script calls with action usage
3. **Adjust Parameters**: Map old CLI arguments to action inputs
4. **Use Outputs**: Leverage action outputs for better workflow integration

## Parameter Mapping

| Python Argument | Action Input | Description |
|----------------|--------------|-------------|
| `--output` | `output` | Output file path |
| `--output-image-dir` | `output-image-dir` | Image directory |
| `--force` | `force` | Force image replacement |
| `--min-data-size` | `min-data-size` | Minimum data size |
| Script choice | `game` | 'gi' or 'hsr' |

## Backwards Compatibility

The Python scripts are preserved for reference but are no longer the primary interface. The action produces identical output formats to maintain compatibility with existing data consumers.

## Development Workflow

### For Action Development
```bash
npm install          # Install dependencies
npm test            # Run tests
npm run build       # Build action
npm run lint        # Check code style
```

### For Action Usage
Simply reference the action in your workflow - no local setup required!
