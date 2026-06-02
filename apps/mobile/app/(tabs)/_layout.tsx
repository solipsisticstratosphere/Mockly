import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { Icon } from '../../components/ui/Icon';

function TabBarComponent({ state, descriptors, navigation }: any) {
  const router = useRouter();

  const leftTabs = state.routes.slice(0, 2);
  const rightTabs = state.routes.slice(2, 4);

  const TabButton = ({ route, index }: { route: any; index: number }) => {
    const { options } = descriptors[route.key];
    const label = options.tabBarLabel ?? options.title ?? route.name;
    const icon = options.tabBarIcon;
    const focused = state.index === index;

    return (
      <TouchableOpacity
        key={route.key}
        onPress={() => navigation.navigate(route.name)}
        style={styles.tab}
        activeOpacity={0.7}
      >
        {icon && icon({ focused, color: focused ? Colors.blue700 : Colors.n70, size: 23 })}
        <Text style={[styles.tabLabel, { color: focused ? Colors.blue700 : Colors.n70 }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.tabBar}>
      {leftTabs.map((route: any, i: number) => <TabButton key={route.key} route={route} index={i} />)}
      <View style={styles.fabWrap}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/session/setup')}
          activeOpacity={0.85}
        >
          <Icon name="play" size={22} color={Colors.white} fill />
        </TouchableOpacity>
      </View>
      {rightTabs.map((route: any, i: number) => <TabButton key={route.key} route={route} index={i + 2} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.n30, backgroundColor: Colors.white,
    paddingBottom: 24, paddingTop: 8, paddingHorizontal: 8,
    shadowColor: '#1F2C37', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 5,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6 },
  tabLabel: { fontFamily: Font.semiBold, fontSize: 11 },
  fabWrap: { width: 76, flexShrink: 0, alignItems: 'center' },
  fab: {
    width: 58, height: 58, borderRadius: 999, backgroundColor: Colors.blue800,
    borderWidth: 4, borderColor: Colors.white,
    marginTop: -34, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1B448B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
});

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBarComponent {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => <Icon name="home" size={size} color={color} strokeWidth={focused ? 2.1 : 1.75} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size, focused }) => <Icon name="history" size={size} color={color} strokeWidth={focused ? 2.1 : 1.75} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Progress',
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color, size, focused }) => <Icon name="chart" size={size} color={color} strokeWidth={focused ? 2.1 : 1.75} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => <Icon name="user" size={size} color={color} strokeWidth={focused ? 2.1 : 1.75} />,
        }}
      />
    </Tabs>
  );
}
