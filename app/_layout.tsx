import "../global.css";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useThemePreferences } from "@/shared/themes/useThemePreferences";

export default function RootLayout() {
  const { theme } = useThemePreferences();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.pageBackground }}>
      <BottomSheetModalProvider>
        <Stack
          screenOptions={{
            contentStyle: {
              backgroundColor: theme.colors.pageBackground,
            },
            animation: Platform.select({
              ios: "ios_from_right",
              android: "fade_from_bottom",
              default: "default",
            }),
            gestureEnabled: true,
            fullScreenGestureEnabled: Platform.OS === "ios",
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="reader/[id]"
            options={{
              headerShown: false,
              animation: Platform.select({
                ios: "default",
                android: "fade_from_bottom",
                default: "default",
              }),
              animationDuration: Platform.OS === "ios" ? 300 : undefined,
              animationMatchesGesture: Platform.OS === "ios",
            }}
          />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
