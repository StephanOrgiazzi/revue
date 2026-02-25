import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const LONG_PRESS_SECONDARY_DELAY_MS = 35;

const swallowHapticError = () => undefined;

const runHaptic = (task: Promise<unknown>) => {
  void task.catch(swallowHapticError);
};

const runAndroidHaptic = (feedbackType: Haptics.AndroidHaptics): boolean => {
  if (Platform.OS !== "android") {
    return false;
  }

  runHaptic(Haptics.performAndroidHapticsAsync(feedbackType));
  return true;
};

export const triggerContextClickHaptic = () => {
  if (runAndroidHaptic(Haptics.AndroidHaptics.Context_Click)) {
    return;
  }

  runHaptic(Haptics.selectionAsync());
};

export const triggerSelectionTickHaptic = () => {
  if (runAndroidHaptic(Haptics.AndroidHaptics.Segment_Tick)) {
    return;
  }

  runHaptic(Haptics.selectionAsync());
};

export const triggerFrequentTickHaptic = () => {
  if (runAndroidHaptic(Haptics.AndroidHaptics.Segment_Frequent_Tick)) {
    return;
  }

  runHaptic(Haptics.selectionAsync());
};

export const triggerLightImpactHaptic = () => {
  runHaptic(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
};

export const triggerLongPressHaptic = () => {
  if (runAndroidHaptic(Haptics.AndroidHaptics.Long_Press)) {
    return;
  }

  void (async () => {
    await Haptics.selectionAsync();
    setTimeout(() => {
      runHaptic(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid));
    }, LONG_PRESS_SECONDARY_DELAY_MS);
  })().catch(swallowHapticError);
};
