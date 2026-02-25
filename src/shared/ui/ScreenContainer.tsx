import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { View, type StyleProp, type ViewStyle } from "react-native";

type ScreenContainerProps = {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  edges?: readonly Edge[];
};

export const ScreenContainer = ({
  children,
  className = "",
  style,
  backgroundColor,
  edges,
}: ScreenContainerProps) => {
  const rootClassName = className ? `flex-1 px-4 ${className}` : "flex-1 px-4";

  return (
    <SafeAreaView edges={edges} style={[{ flex: 1 }, backgroundColor && { backgroundColor }]}>
      <View style={[backgroundColor && { backgroundColor }, style]} className={rootClassName}>
        {children}
      </View>
    </SafeAreaView>
  );
};
