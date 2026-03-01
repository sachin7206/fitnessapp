import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import store from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import { I18nProvider } from './src/i18n';

export default function App() {
  return (
    <Provider store={store}>
      <I18nProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </I18nProvider>
    </Provider>
  );
}

