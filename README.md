# Revue

[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54-000020?logo=expo&logoColor=white)](https://docs.expo.dev/)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=111111)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.x-F9F1E1?logo=bun&logoColor=111111)](https://bun.sh/)
[![Jest](https://img.shields.io/badge/Tests-Jest-C21325?logo=jest&logoColor=white)](https://jestjs.io/)
[![Platforms](https://img.shields.io/badge/Platforms-Android%20%7C%20iOS-0E7C86)](#mobile-usage-androidios)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-green)](#open-source)

> Read markdown like an article, not a raw text file.

Revue is an open source iOS and Android app that turns plain `.md` files into a focused, magazine-style reading experience with local-first storage, reader controls, table of contents navigation, and automatic progress restore.

<p align="center">
  <img src="./assets/revue.png" alt="Revue app screenshot" width="320" style="border-radius: 16px;" />
</p>

## Contents

- [Why Revue](#why-revue)
- [Architecture](#architecture)
- [How It Feels (Android/iOS)](#how-it-feels-androidios)
- [Web Usage](#web-usage)
- [Quick Start (Development)](#quick-start-development)
- [Developer Reference](#developer-reference)
- [Scripts](#scripts)
- [Project Docs](#project-docs)

## Why Revue

- Editorial reading layout built for long-form content
- Instant local import of your existing markdown files
- Lightweight reader controls (theme and type scale)
- Table-of-contents navigation for fast scanning
- Auto-resume exactly where you stopped
- iOS and Android support with web for development

## Architecture

- Local-first: markdown metadata and preferences are persisted with platform storage.
- Native file access uses `expo-file-system` (`file://` and `content://`).
- Web supports URI-based imports (`http`, `https`, `blob`, `data`, and local paths).
- Reader rendering pipeline:
  - Parse and normalize markdown
  - Remove frontmatter for content rendering
  - Convert markdown to HTML blocks
  - Render with `react-native-render-html`

## How It Feels (Android/iOS)

1. Import markdown.
2. Read in a clean, distraction-free view.
3. Jump sections instantly with table of contents.
4. Return later and continue from the same spot.

Android also supports opening markdown from external apps through file/content intents configured in `app.json`.

## Web usage

Run locally:

```bash
bun run web
```

## Quick start (development)

```bash
bun install
bun run start
```

Platform targets:

```bash
bun run android
bun run ios
bun run web
```

## Developer reference

### Stack

- Expo SDK 54
- React Native 0.81
- React 19
- Expo Router
- NativeWind
- react-native-render-html
- Bun (package manager and script runner)

### Run

```bash
bun run start
bun run android
bun run ios
bun run web
bunx expo start --tunnel --clear
```

### Quality checks

```bash
bun run lint
bun run typecheck
bun run test
```

### Build

Android preview build (EAS):

```bash
bunx eas-cli build -p android --profile preview
```

## Scripts

| Command             | Description              |
| ------------------- | ------------------------ |
| `bun run start`     | Expo start               |
| `bun run android`   | Open Android target      |
| `bun run ios`       | Open iOS target          |
| `bun run web`       | Run web target           |
| `bun run prebuild`  | Expo prebuild            |
| `bun run lint`      | `oxlint` + `oxfmt` check |
| `bun run format`    | Auto-fix lint and format |
| `bun run typecheck` | TypeScript `--noEmit`    |
| `bun run test`      | Jest                     |

## Project docs

- [Contributing](docs/CONTRIBUTING.md)
- [Contributor License Agreement](docs/CLA.md)
