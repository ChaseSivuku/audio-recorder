import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Voice Notes',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="mic" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

