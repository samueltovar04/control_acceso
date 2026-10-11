import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { VitalSignsHomeScreen } from './src/screens/VitalSignsHomeScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { DigitalPassScreen } from './src/screens/DigitalPassScreen';
import { PaymentsScreen } from './src/screens/PaymentsScreen';
import { VitalSignsScreen } from './src/screens/VitalSignsScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#1E88E5" />
      <Stack.Navigator
        initialRouteName="VitalSignsHome"
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#1E88E5' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      >
        <Stack.Screen name="VitalSignsHome" component={VitalSignsHomeScreen} options={{ title: 'Signos Vitales & Bluetooth', headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registro de Cliente' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar Sesión', headerShown: false }} />
        <Stack.Screen name="MainDrawer" component={HomeScreen} options={{ title: 'Menú Principal' }} />
        <Stack.Screen name="DigitalPass" component={DigitalPassScreen} options={{ title: 'Pase Digital QR' }} />
        <Stack.Screen name="Payments" component={PaymentsScreen} options={{ title: 'Pagos & Membresía' }} />
        <Stack.Screen name="VitalSigns" component={VitalSignsScreen} options={{ title: 'Signos Vitales IoT' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificaciones' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
