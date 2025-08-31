# Samsara Banner Tools (v2.0)

A TypeScript GitHub Action for pulling banner data from Fandom wikis for Genshin Impact and Honkai Star Rail.

## Overview

This action fetches banner information including:
- Character and weapon banner histories
- Banner dates and versions
- Character/weapon images
- YAML formatted data output

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `game` | Game to process: "gi" for Genshin Impact, "hsr" for Honkai Star Rail | Yes | `gi` |
| `output` | The location to output the YAML data | Yes | - |
| `output-image-dir` | The directory to output images | Yes | - |
| `force` | Force replace all images with newer ones | No | `false` |
| `min-data-size` | Minimum data size to expect (in bytes) | No | `40000` |

## Outputs

| Output | Description |
|--------|-------------|
| `data-size` | Size of the generated data file |
| `images-downloaded` | Number of images downloaded |

## Usage

### Genshin Impact Banner Data

```yaml
- name: Pull Genshin Impact Banner Data
  uses: benlei/samsara-tools@v2.0
  with:
    game: 'gi'
    output: './data/gi-banners.yml'
    output-image-dir: './images'
    force: 'false'
    min-data-size: '40000'
```

### Honkai Star Rail Banner Data

```yaml
- name: Pull HSR Banner Data
  uses: benlei/samsara-tools@v2.0
  with:
    game: 'hsr'
    output: './data/hsr-banners.yml'
    output-image-dir: './images'
    force: 'false'
    min-data-size: '500'
```

## License

This repository is licensed under the GNU General Public License version 2 (GPL-2.0).

See the `LICENSE` file for the full license text.

## Data Format

The action outputs YAML data with the following structure:

```yaml
fiveStarCharacters:
  - name: "Character Name"
    versions: ["1.0.1", "1.5.2"]
    dates:
      - start: "2020-09-28"
        end: "2020-10-18"
      - start: "2021-04-06"
        end: "2021-04-27"

fourStarCharacters:
  # Similar structure

fiveStarWeapons:
  # Similar structure

fourStarWeapons:
  # Similar structure
```

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
npm install
```

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```