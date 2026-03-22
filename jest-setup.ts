import "@testing-library/jest-native/extend-expect";
import fs from "fs";
import path from "path";
import "react-native-gesture-handler/jestSetup";

jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper", () => ({}), { virtual: true });

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");

  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock("react-native-reanimated/src/Animated", () => {
  const Actual = jest.requireActual("react-native-reanimated/mock");
  return Actual;
});

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

global.fetch = jest.fn((url: string) => {
  if (url.startsWith("/mocks/")) {
    try {
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

jest.mock("@/shared/logic/platformStorage", () => ({
  createPlatformStorage: jest.fn(() => ({
    read: jest.fn(),
    write: jest.fn(),
  })),
}));
