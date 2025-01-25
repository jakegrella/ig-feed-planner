import { Stack } from "expo-router";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            header: () => (
              <View
                style={{
                  height: 59,
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.05)",
                }}
              />
            ),
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
