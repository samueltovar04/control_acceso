import React, { useEffect } from 'react';
import { StatusBar, Platform, PermissionsAndroid } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { LoginScreen } from './src/screens/LoginScreen';
import { ChangePasswordScreen } from './src/screens/ChangePasswordScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { RegisterMultiPoseScreen } from './src/screens/RegisterMultiPoseScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { DigitalPassScreen } from './src/screens/DigitalPassScreen';
import { PaymentsScreen } from './src/screens/PaymentsScreen';
import { VitalSignsScreen } from './src/screens/VitalSignsScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    async function requestNotificationPermission() {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
        } catch (err) {
          console.warn('Error solicitando permiso de notificaciones:', err);
        }
      }
    }
    requestNotificationPermission();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#1E88E5" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#1E88E5' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar Sesión', headerShown: false }} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Cambio de Clave Obligatorio' }} />
        <Stack.Screen name="Register" component={RegisterMultiPoseScreen} options={{ title: 'Captura Facial Multi-Ángulo' }} />
        <Stack.Screen name="RegisterSingle" component={RegisterScreen} options={{ title: 'Registro de Cliente' }} />
        <Stack.Screen name="MainDrawer" component={HomeScreen} options={{ title: 'Menú Principal' }} />
        <Stack.Screen name="DigitalPass" component={DigitalPassScreen} options={{ title: 'Pase Digital QR' }} />
        <Stack.Screen name="Payments" component={PaymentsScreen} options={{ title: 'Pagos & Notificaciones' }} />
        <Stack.Screen name="VitalSigns" component={VitalSignsScreen} options={{ title: 'Signos Vitales IoT' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificaciones' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
