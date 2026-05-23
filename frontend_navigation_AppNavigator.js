// src/navigation/AppNavigator.js
import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import LoginScreen          from '../screens/LoginScreen';
import RegisterScreen       from '../screens/RegisterScreen';
import HomeScreen           from '../screens/HomeScreen';
import AdminScreen          from '../screens/AdminScreen';
import FamilyAdminScreen    from '../screens/FamilyAdminScreen';
import ScheduleScreen       from '../screens/ScheduleScreen';
import ProfileScreen        from '../screens/ProfileScreen';
import NotificationsScreen  from '../screens/NotificationsScreen';
import DevicesScreen        from '../screens/DevicesScreen';

import { Colors, Fonts } from '../utils/theme';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

function BadgeIcon({ name, color, unread }) {
  return (
    <View>
      <Ionicons name={name} size={22} color={color} />
      {unread > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -6,
          backgroundColor: Colors.danger, borderRadius: 8,
          minWidth: 16, height: 16,
          justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2,
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
            {unread > 9 ? '9+' : unread}
          </Text>
        </View>
      )}
    </View>
  );
}

function MainTabs() {
  const user          = useSelector(s => s.auth.user);
  const unread        = useSelector(s => s.notif.unread);
  const isSuperAdmin  = user?.role === 'super_admin';
  const isFamilyAdmin = user?.role === 'family_admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.cardBg,
          borderTopColor: 'rgba(0,200,220,0.2)',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor:   Colors.accent,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarLabelStyle: { fontSize: Fonts.sizes.xs, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          const map = {
            Home:          focused ? 'home'             : 'home-outline',
            Admin:         focused ? 'shield'            : 'shield-outline',
            FamilyAdmin:   focused ? 'people'            : 'people-outline',
            Notifications: focused ? 'notifications'     : 'notifications-outline',
            Devices:       focused ? 'phone-portrait'    : 'phone-portrait-outline',
            Schedule:      focused ? 'calendar'          : 'calendar-outline',
            Profile:       focused ? 'person-circle'     : 'person-circle-outline',
          };
          if (route.name === 'Notifications') {
            return <BadgeIcon name={map[route.name]} color={color} unread={unread} />;
          }
          return <Ionicons name={map[route.name] || 'ellipse-outline'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"          component={HomeScreen}          options={{ title: 'Home' }} />
      {isSuperAdmin  && <Tab.Screen name="Admin"       component={AdminScreen}        options={{ title: 'Admin' }} />}
      {isFamilyAdmin && <Tab.Screen name="FamilyAdmin" component={FamilyAdminScreen}  options={{ title: 'My Family' }} />}
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="Devices"       component={DevicesScreen}       options={{ title: 'Devices' }} />
      <Tab.Screen name="Schedule"      component={ScheduleScreen}      options={{ title: 'Schedule' }} />
      <Tab.Screen name="Profile"       component={ProfileScreen}       options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: Colors.primary } }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const user = useSelector(s => s.auth.user);
  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
