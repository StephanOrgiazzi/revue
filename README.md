# Revue

[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54-000020?logo=expo&logoColor=white)](https://docs.expo.dev/)
[![Expo Router](https://img.shields.io/badge/Expo%20Router-6-000020?logo=expo&logoColor=white)](https://docs.expo.dev/router/introduction/)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=111111)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NativeWind](https://img.shields.io/badge/NativeWind-4.2-38BDF8?logo=tailwindcss&logoColor=white)](https://www.nativewind.dev/)
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
- [Built with Modern Tooling](#built-with-modern-tooling)
- [Read in Browser](#read-in-browser)
- [Quick Start (Development)](#quick-start-development)
- [Quality Checks](#quality-checks)
- [Build](#build)
- [Scripts](#scripts)
- [Project Docs](#project-docs)

## Why Revue

**Markdown is a strong format for mobile reading because it is inherently responsive by structure and highly styleable in presentation. Revue builds on that foundation to turn plain `.md` files into a polished, readable experience across screen sizes.**

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

## Built with Modern Tooling

Built with a modern toolchain for fast iteration and reliability: Expo Router, React Native 0.81, TypeScript 5.9, Bun-first workflows, `oxlint`/`oxfmt`, and Jest.

### Stack

- Expo SDK 54
- React Native 0.81
- React 19
- Expo Router
- NativeWind
- react-native-render-html
- Bun (package manager and script runner)

## Read in Browser

```bash
bun run web
```

## Quick start (development)

```bash
bun install
bun run start
bun run web
```

## Quality Checks

```bash
bun run lint
bun run typecheck
bun run test
```

## Build

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
