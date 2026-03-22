import { Tabs } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide tab bar - game uses full screen
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "용이 감춘 보물",
        }}
      />
    </Tabs>
  );
}
