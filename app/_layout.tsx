import { Stack } from "expo-router";
import { View, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
          // options={{
          //   header: () => (
          //     <View
          //       style={{
          //         height: 59,
          //         backgroundColor:
          //           colorScheme === "light" ? "#ffffff" : "#000000",
          //         boxShadow: "0 1px 4px rgba(0, 0, 0, 0.05)",
          //       }}
          //     />
          //   ),
          // }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
