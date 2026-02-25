import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import {
  triggerContextClickHaptic,
  triggerFrequentTickHaptic,
  triggerLightImpactHaptic,
  triggerLongPressHaptic,
  triggerSelectionTickHaptic,
} from "@/shared/logic/haptics";

describe("haptics", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (Haptics.performAndroidHapticsAsync as jest.Mock).mockResolvedValue(undefined);
    (Haptics.selectionAsync as jest.Mock).mockResolvedValue(undefined);
    (Haptics.impactAsync as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("uses Android-specific API for Android selection-like feedback", () => {
    Platform.OS = "android";

    triggerContextClickHaptic();
    triggerSelectionTickHaptic();
    triggerFrequentTickHaptic();

    expect(Haptics.performAndroidHapticsAsync).toHaveBeenCalledWith(
      Haptics.AndroidHaptics.Context_Click,
    );
    expect(Haptics.performAndroidHapticsAsync).toHaveBeenCalledWith(
      Haptics.AndroidHaptics.Segment_Tick,
    );
    expect(Haptics.performAndroidHapticsAsync).toHaveBeenCalledWith(
      Haptics.AndroidHaptics.Segment_Frequent_Tick,
    );
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("falls back to selection API on non-android platforms", () => {
    Platform.OS = "ios";

    triggerContextClickHaptic();
    triggerSelectionTickHaptic();
    triggerFrequentTickHaptic();

    expect(Haptics.performAndroidHapticsAsync).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(3);
  });

  it("triggers light impact with Light style", () => {
    triggerLightImpactHaptic();

    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it("triggers long press using Android haptic when on Android", () => {
    Platform.OS = "android";

    triggerLongPressHaptic();

    expect(Haptics.performAndroidHapticsAsync).toHaveBeenCalledWith(
      Haptics.AndroidHaptics.Long_Press,
    );
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("triggers long press sequence on non-android platforms", async () => {
    Platform.OS = "ios";
    (Haptics.selectionAsync as jest.Mock).mockResolvedValue(undefined);

    triggerLongPressHaptic();
    await Promise.resolve();
    jest.advanceTimersByTime(35);

    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Rigid);
  });
});
