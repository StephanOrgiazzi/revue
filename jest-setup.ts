import "@testing-library/jest-native/extend-expect";
import fs from "fs";
import path from "path";

// 1) React Native Gesture Handler (required for many navigation/gesture libs)
import "react-native-gesture-handler/jestSetup";

// 2) Silence the “useNativeDriver” warning + a bunch of noisy RN Animated internals
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper", () => ({}), { virtual: true });

// 3) Reanimated (needed for @gorhom/bottom-sheet, react-native-reanimated, etc.)
jest.mock("react-native-reanimated", () => {
  // Use the official mock
  const Reanimated = require("react-native-reanimated/mock");

  // Some libs expect these helpers to exist
  Reanimated.default.call = () => {};
  return Reanimated;
});

// If you use Reanimated v2/v3+ you typically also want this:
jest.mock("react-native-reanimated/src/Animated", () => {
  const Actual = jest.requireActual("react-native-reanimated/mock");
  return Actual;
});

// 4) Safe Area Context
jest.mock("react-native-safe-area-context", () => {
  return {
    SafeAreaProvider: (props: any) => props.children,
    SafeAreaConsumer: (props: any) => props.children({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: require("react-native").View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 0, height: 0 }),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
    },
  };
});

// 5) Expo Haptics
jest.mock("expo-haptics", () => ({
  AndroidHaptics: {
    Context_Click: "Context_Click",
    Segment_Tick: "Segment_Tick",
    Segment_Frequent_Tick: "Segment_Frequent_Tick",
    Long_Press: "Long_Press",
  },
  ImpactFeedbackStyle: {
    Light: "Light",
    Rigid: "Rigid",
  },
  performAndroidHapticsAsync: jest.fn(),
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

// 6) Mocking expo-router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
  Link: (props: any) => props.children,
  Stack: (props: any) => props.children,
  Tabs: (props: any) => props.children,
}));

// 7) Wire up our mocks located in public folder
// This mocks global.fetch so that calls to /mocks/file.md return the content of the file in public/mocks/
global.fetch = jest.fn((url: string) => {
  if (url.startsWith("/mocks/")) {
    try {
      // Trim leading slash and join with project root (where public/ exists)
      const relativePath = url.startsWith("/") ? url.slice(1) : url;
      const absolutePath = path.join(__dirname, "public", relativePath);
      const content = fs.readFileSync(absolutePath, "utf8");

      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(content),
      } as Response);
    } catch (error) {
      return Promise.reject(new Error(`Failed to load mock file from ${url}: ${error}`));
    }
  }
  return Promise.reject(new Error(`Fetch not mocked for URL: ${url}`));
}) as jest.Mock;
// 8) Mock expo-file-system
jest.mock("expo-file-system", () => ({
  Directory: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    exists: true,
  })),
  File: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    exists: true,
    textSync: jest.fn().mockReturnValue(""),
    write: jest.fn(),
    delete: jest.fn(),
  })),
  Paths: {
    document: "/mock-document-path",
  },
}));

// 9) Mock platformStorage to avoid top-level side effects
jest.mock("@/shared/logic/platformStorage", () => ({
  createPlatformStorage: jest.fn(() => ({
    read: jest.fn(),
    write: jest.fn(),
  })),
}));
