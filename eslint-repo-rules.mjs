import fs from "node:fs";
import path from "node:path";

const SOURCE_FILE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const TEST_FILE_NAME_PATTERN = /\.(test|spec)\.[^.]+$/;
const TEST_FILE_PATH_PATTERN = /\/test\/[^/]+\.(test|spec)\.[^.]+$/;
const FEATURE_HOOK_FILE_PATTERN = /\/src\/features\/[^/]+\/hooks\/use[A-Z][^/]*\.(?:ts|tsx)$/;
const SHARED_LOGIC_HOOK_FILE_PATTERN = /\/src\/shared\/logic\/use[A-Z][^/]*\.(?:ts|tsx)$/;
const SHARED_THEME_HOOK_FILE_PATTERN = /\/src\/shared\/themes\/use[A-Z][^/]*\.(?:ts|tsx)$/;
const SHARED_UI_LOCAL_HOOK_FILE_PATTERN = /\/src\/shared\/ui\/.+\/use[A-Z][^/]*\.(?:ts|tsx)$/;
const FEATURE_SCREEN_FILE_PATTERN = /\/src\/features\/[^/]+\/screens\/[^/]+Screen\.tsx$/;

const ALLOWED_TSX_FILE_PATTERN =
  /\/src\/(?:shared\/ui\/|features\/[^/]+\/(?:components|screens)\/).+\.tsx$/;

function getFilename(context) {
  return normalizePath(context.filename);
}

function isAllowedHookFile(filePath) {
  return (
    FEATURE_HOOK_FILE_PATTERN.test(filePath) ||
    SHARED_LOGIC_HOOK_FILE_PATTERN.test(filePath) ||
    SHARED_THEME_HOOK_FILE_PATTERN.test(filePath) ||
    SHARED_UI_LOCAL_HOOK_FILE_PATTERN.test(filePath)
  );
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

function isTestNamedFile(filePath) {
  return TEST_FILE_NAME_PATTERN.test(path.posix.basename(filePath));
}

function isTypesFile(filePath) {
  return filePath.endsWith("/types.ts");
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

const hookFilePlacementRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce hook file placement and naming conventions.",
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
        if (/\/hooks\//.test(filePath) && !/^use[A-Z][^/]*\.(?:ts|tsx)$/.test(baseName)) {
          reportProgramNode(
            context,
            node,
            "Files inside a hooks directory must be named use*.ts or use*.tsx.",
          );
          return;
        }

        if (/^use[A-Z][^/]*\.(?:ts|tsx)$/.test(baseName) && !isAllowedHookFile(filePath)) {
          reportProgramNode(
            context,
            node,
            "Hooks must live in src/features/<feature>/hooks, src/shared/logic, src/shared/themes, or a local shared/ui component folder.",
          );
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

const testFilePlacementRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce colocated test directory placement.",
    },
    schema: [],
  },
  create(context) {
    const filePath = getFilename(context);
    if (!isSrcFile(filePath)) {
      return {};
    }

    return {
      Program(node) {
        if (!isTestNamedFile(filePath)) {
          return;
        }

        if (!isTestFile(filePath)) {
          reportProgramNode(
            context,
            node,
            "Tests must live in a sibling test/ directory next to the module they verify.",
          );
          return;
        }

        const testBaseName = path.posix.basename(filePath).replace(TEST_FILE_NAME_PATTERN, "");

        const sourceDirectory = path.posix.dirname(path.posix.dirname(filePath));

        const hasSourceFile = SOURCE_FILE_EXTENSIONS.some((extension) =>
          fs.existsSync(`${sourceDirectory}/${testBaseName}${extension}`),
        );

        if (!hasSourceFile) {
          reportProgramNode(
            context,
            node,
            "Each test file must map to a sibling source module in the parent directory.",
          );
        }
      },
    };
  },
};

const preferTypesFileRule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer colocating exported shared type declarations in a dedicated types.ts file.",
    },
    schema: [],
  },
  create(context) {
    const filePath = getFilename(context);
    if (!isSrcFile(filePath) || isTestFile(filePath) || isTypesFile(filePath)) {
      return {};
    }

    return {
      ExportNamedDeclaration(node) {
        if (!node.declaration) {
          return;
        }

        const declaration = node.declaration;
        if (
          declaration.type === "TSTypeAliasDeclaration" ||
          declaration.type === "TSInterfaceDeclaration"
        ) {
          context.report({
            node,
            message:
              "Exported types/interfaces should live in a sibling types.ts file. Keep file-local types non-exported.",
          });
        }
      },
    };
  },
};

export default {
  rules: {
    "import-boundaries": importBoundariesRule,
    "hook-file-placement": hookFilePlacementRule,
    "prefer-types-file": preferTypesFileRule,
    "screen-file-placement": screenFilePlacementRule,
    "tsx-file-placement": tsxFilePlacementRule,
    "test-file-placement": testFilePlacementRule,
  },
};
