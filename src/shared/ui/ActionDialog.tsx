import { Modal, Pressable, Text, View } from "react-native";

import { triggerLightImpactHaptic } from "@/shared/logic/haptics";
import { useThemePreferences } from "@/shared/themes/useThemePreferences";

type ActionDialogAction = {
  id?: string;
  label: string;
  onPress?: () => void;
  style?: "default" | "destructive" | "cancel";
};

type ActionDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  actions: ActionDialogAction[];
  onClose: () => void;
};

const HAIRLINE_WIDTH = 0.5;

export const ActionDialog = ({ visible, title, message, actions, onClose }: ActionDialogProps) => {
  const { theme } = useThemePreferences();

  const getActionTextStyle = (style: ActionDialogAction["style"]) => {
    if (style === "destructive") {
      return { color: theme.colors.error, fontWeight: "700" as const };
    }

    if (style === "cancel") {
      return { color: theme.colors.textSecondary, fontWeight: "600" as const };
    }

    return { color: theme.colors.textPrimary, fontWeight: "500" as const };
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center px-8"
        onPress={onClose}
        style={{ backgroundColor: theme.colors.sheetBackdrop }}
      >
        <Pressable
          className="w-full max-w-sm overflow-hidden rounded-[28px]"
          style={{
            backgroundColor: theme.colors.sheetBackground,
            borderColor: theme.colors.surfaceBorder,
            borderWidth: theme.isDark ? 1 : 0,
            boxShadow: "0px 12px 16px rgba(0, 0, 0, 0.3)",
          }}
          onPress={() => undefined}
        >
          <View className="items-center px-6 pb-6 pt-7">
            <Text
              className="text-center text-lg font-bold tracking-tight"
              numberOfLines={2}
              style={{ color: theme.colors.textPrimary }}
            >
              {title}
            </Text>
            {message ? (
              <Text
                className="mt-2 text-center text-[15px] leading-5"
                style={{ color: theme.colors.textSecondary }}
              >
                {message}
              </Text>
            ) : null}
          </View>

          <View
            style={{
              borderTopWidth: HAIRLINE_WIDTH,
              borderTopColor: theme.colors.divider,
            }}
          >
            {actions.map((action, index) => (
              <Pressable
                key={action.id ?? `${action.style ?? "default"}-${action.label}`}
                className="items-center px-6 py-4 active:opacity-60"
                style={{
                  borderBottomWidth: index === actions.length - 1 ? 0 : HAIRLINE_WIDTH,
                  borderBottomColor: theme.colors.divider,
                }}
                onPress={() => {
                  if (action.style !== "cancel") {
                    triggerLightImpactHaptic();
                  }
                  onClose();
                  setTimeout(() => action.onPress?.(), 100);
                }}
              >
                <Text
                  className="text-[17px] tracking-[-0.4px]"
                  style={getActionTextStyle(action.style)}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
