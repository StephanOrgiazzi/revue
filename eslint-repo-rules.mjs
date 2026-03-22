import path from "node:path";

const TEST_FILE_PATH_PATTERN = /\/test\/[^/]+\.(test|spec)\.[^.]+$/;
const FEATURE_SCREEN_FILE_PATTERN = /\/src\/features\/[^/]+\/screens\/[^/]+Screen\.tsx$/;

const ALLOWED_TSX_FILE_PATTERN =
  /\/src\/(?:shared\/ui\/|features\/[^/]+\/(?:components|screens)\/).+\.tsx$/;

function getFilename(context) {
  return normalizePath(context.filename);
}

function isAllowedTsxFile(filePath) {
  return ALLOWED_TSX_FILE_PATTERN.test(filePath);
}

function isFeatureComponentFile(filePath) {
  return /\/src\/features\/[^/]+\/components\//.test(filePath);
}

function isFeatureHookFile(filePath) {
  return /\/src\/features\/[^/]+\/hooks\//.test(filePath);
}

function isFeatureLogicFile(filePath) {
  return /\/src\/features\/[^/]+\/logic\//.test(filePath);
}

function isFeatureScreenFile(filePath) {
  return /\/src\/features\/[^/]+\/screens\//.test(filePath);
}

function isLibraryFile(filePath) {
  return filePath.includes("/src/features/library/");
}

function isLibraryImportMarkdownLogicFile(filePath) {
  return filePath.includes("/src/features/library/logic/importMarkdown/");
}

function isLibraryLogicFile(filePath) {
  return filePath.includes("/src/features/library/logic/");
}

function isReaderFile(filePath) {
  return filePath.includes("/src/features/reader/");
}

function isReaderLogicFile(filePath) {
  return filePath.includes("/src/features/reader/logic/");
}

function isReaderMarkdownLogicFile(filePath) {
  return filePath.includes("/src/features/reader/logic/markdown/");
}

function isRestrictedAliasImport(importSource, modulePath) {
  return importSource === modulePath || importSource.startsWith(`${modulePath}/`);
}

function isRestrictedPackageImport(importSource, packageName) {
  return importSource === packageName || importSource.startsWith(`${packageName}/`);
}

function isSharedFile(filePath) {
  return filePath.includes("/src/shared/");
}

function isSharedLibraryFile(filePath) {
  return filePath.includes("/src/shared/library/");
}

function isSharedPlatformStorageFile(filePath) {
  return filePath.endsWith("/src/shared/logic/platformStorage.ts");
}

function isSharedUiFile(filePath) {
  return filePath.includes("/src/shared/ui/");
}

function isSrcFile(filePath) {
  return filePath.includes("/src/");
}

function isTestFile(filePath) {
  return TEST_FILE_PATH_PATTERN.test(filePath);
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function reportProgramNode(context, node, message) {
  context.report({ node, message });
}

const importBoundariesRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce repo-specific architectural import boundaries.",
    },
    schema: [],
  },
  create(context) {
    const filePath = getFilename(context);
    if (!isSrcFile(filePath) || isTestFile(filePath)) {
      return {};
    }

    return {
      /* oxlint-disable-next-line */
      ImportDeclaration(node) {
        const importSource = node.source.value;
        if (typeof importSource !== "string") {
          return;
        }

        if (isSharedFile(filePath) && importSource.startsWith("@/features/")) {
          context.report({
            node,
            message:
              "Shared code must not depend on feature internals. Move shared behavior under src/shared first.",
          });
          return;
        }

        if (isReaderFile(filePath) && importSource.startsWith("@/features/library/")) {
          context.report({
            node,
            message:
              "Reader code must not import library internals. Move shared concerns to src/shared/library or reader logic.",
          });
          return;
        }

        if (isLibraryFile(filePath) && importSource.startsWith("@/features/reader/")) {
          context.report({
            node,
            message:
              "Library code must not import reader internals. Keep reader-specific behavior inside src/features/reader.",
          });
          return;
        }

        if (
          (isFeatureComponentFile(filePath) || isSharedUiFile(filePath)) &&
          importSource.startsWith("@/features/") &&
          importSource.includes("/hooks/")
        ) {
          context.report({
            node,
            message:
              "UI modules must not depend on feature hooks directly. Screens orchestrate hooks; components stay presentation-focused.",
          });
          return;
        }

        if (
          isFeatureHookFile(filePath) &&
          importSource.startsWith("@/features/") &&
          (importSource.includes("/components/") || importSource.includes("/screens/"))
        ) {
          context.report({
            node,
            message:
              "Feature hooks must not import screens or components. Move reusable view data and side effects into logic modules.",
          });
          return;
        }

        if (
          isRestrictedPackageImport(importSource, "expo-file-system") &&
          !isSharedPlatformStorageFile(filePath) &&
          !isLibraryLogicFile(filePath) &&
          !filePath.endsWith("/src/features/reader/logic/readerRepository.ts")
        ) {
          context.report({
            node,
            message:
              "expo-file-system access is reserved for shared storage infrastructure, library persistence/import logic, and readerRepository.",
          });
          return;
        }

        if (
          isRestrictedAliasImport(importSource, "@/shared/logic/platformStorage") &&
          !isSharedFile(filePath)
        ) {
          context.report({
            node,
            message:
              "createPlatformStorage is shared infrastructure. Feature code must go through shared/library or feature repositories instead.",
          });
          return;
        }

        if (
          (isRestrictedAliasImport(importSource, "@/shared/library/libraryStore") ||
            isRestrictedAliasImport(importSource, "@/shared/library/libraryIndexStorage")) &&
          !isSharedLibraryFile(filePath) &&
          !isFeatureLogicFile(filePath)
        ) {
          context.report({
            node,
            message:
              "Article persistence modules belong in shared/library and feature logic. Hooks, screens, and components must go through repositories.",
          });
          return;
        }

        if (
          isReaderFile(filePath) &&
          isRestrictedAliasImport(importSource, "@/shared/library/libraryIndexStorage")
        ) {
          context.report({
            node,
            message:
              "Reader code must not read or write the full library index directly. Use readerRepository and shared/libraryStore.",
          });
          return;
        }

        if (
          isRestrictedAliasImport(importSource, "@/shared/logic/markdown") &&
          !isReaderLogicFile(filePath) &&
          !isLibraryLogicFile(filePath)
        ) {
          context.report({
            node,
            message:
              "Shared markdown parsing utilities may only be called from feature logic. Keep markdown work out of hooks, screens, and UI modules.",
          });
          return;
        }

        if (
          (isRestrictedPackageImport(importSource, "marked") ||
            isRestrictedPackageImport(importSource, "highlight.js")) &&
          !isReaderMarkdownLogicFile(filePath) &&
          !isLibraryImportMarkdownLogicFile(filePath)
        ) {
          context.report({
            node,
            message:
              "Raw markdown parser dependencies are restricted to reader markdown logic and library importMarkdown logic.",
          });
        }
      },
    };
  },
};

const screenFilePlacementRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce screen file placement and naming conventions.",
    },
    schema: [],
  },
  create(context) {
    const filePath = getFilename(context);
    if (!isSrcFile(filePath) || isTestFile(filePath)) {
      return {};
    }

    const baseName = path.posix.basename(filePath);

    return {
      Program(node) {
        if (isFeatureScreenFile(filePath) && !baseName.endsWith("Screen.tsx")) {
          reportProgramNode(
            context,
            node,
            "Feature screen files must live in src/features/<feature>/screens and end with Screen.tsx.",
          );
          return;
        }

        if (baseName.endsWith("Screen.tsx") && !FEATURE_SCREEN_FILE_PATTERN.test(filePath)) {
          reportProgramNode(
            context,
            node,
            "Files named *Screen.tsx must live in src/features/<feature>/screens.",
          );
        }
      },
    };
  },
};

const tsxFilePlacementRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Restrict non-test TSX files to UI directories.",
    },
    schema: [],
  },
  create(context) {
    const filePath = getFilename(context);
    if (!isSrcFile(filePath) || isTestFile(filePath) || !filePath.endsWith(".tsx")) {
      return {};
    }

    return {
      Program(node) {
        if (!isAllowedTsxFile(filePath)) {
          reportProgramNode(
            context,
            node,
            "Non-test TSX files must live in src/shared/ui or src/features/<feature>/(components|screens).",
          );
        }
      },
    };
  },
};

export default {
  rules: {
    "import-boundaries": importBoundariesRule,
    "screen-file-placement": screenFilePlacementRule,
    "tsx-file-placement": tsxFilePlacementRule,
  },
};
