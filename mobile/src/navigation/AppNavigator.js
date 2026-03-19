import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthStatus } from '../store/slices/authSlice';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NutritionPlansScreen from '../screens/NutritionPlansScreen';
import NutritionProfileSetupScreen from '../screens/NutritionProfileSetupScreen';
import NutritionRegionSelectScreen from '../screens/NutritionRegionSelectScreen';
import FoodPreferencesScreen from '../screens/FoodPreferencesScreen';
import GeneratedPlanViewScreen from '../screens/GeneratedPlanViewScreen';
import MyNutritionPlanScreen from '../screens/MyNutritionPlanScreen';
import WorkoutSetupScreen from '../screens/WorkoutSetupScreen';
import GeneratedWorkoutPlanViewScreen from '../screens/GeneratedWorkoutPlanViewScreen';
import MyWorkoutScreen from '../screens/MyWorkoutScreen';
import WorkoutChoiceScreen from '../screens/WorkoutChoiceScreen';
import FreeWorkoutBuilderScreen from '../screens/FreeWorkoutBuilderScreen';
import FreeWorkoutViewScreen from '../screens/FreeWorkoutViewScreen';
import StepHistoryScreen from '../screens/StepHistoryScreen';
import ProgressDashboardScreen from '../screens/ProgressDashboardScreen';
import WellnessHomeScreen from '../screens/WellnessHomeScreen';
import FoodPhotoLogScreen from '../screens/FoodPhotoLogScreen';
import GroceryListScreen from '../screens/GroceryListScreen';
import WeeklyReportScreen from '../screens/WeeklyReportScreen';
import WorkoutFeedbackScreen from '../screens/WorkoutFeedbackScreen';
import ExerciseProgressScreen from '../screens/ExerciseProgressScreen';
import SubscriptionPlansScreen from '../screens/SubscriptionPlansScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import RazorpayCheckoutScreen from '../screens/RazorpayCheckoutScreen';
import NutritionChoiceScreen from '../screens/NutritionChoiceScreen';
import FreeNutritionBuilderScreen from '../screens/FreeNutritionBuilderScreen';

import { colors, spacing } from '../config/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.text.secondary,
      tabBarStyle: {
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      headerStyle: {
        backgroundColor: colors.primary,
      },
      headerTintColor: colors.text.inverse,
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
        headerShown: false,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
        headerTitle: 'My Profile',
      }}
    />
  </Tab.Navigator>
);

const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="NutritionPlans" component={NutritionPlansScreen} />
    <Stack.Screen name="NutritionChoice" component={NutritionChoiceScreen} />
    <Stack.Screen name="NutritionProfileSetup" component={NutritionProfileSetupScreen} />
    <Stack.Screen name="NutritionRegionSelect" component={NutritionRegionSelectScreen} />
    <Stack.Screen name="FoodPreferences" component={FoodPreferencesScreen} />
    <Stack.Screen name="GeneratedPlanView" component={GeneratedPlanViewScreen} />
    <Stack.Screen name="FreeNutritionBuilder" component={FreeNutritionBuilderScreen} />
    <Stack.Screen name="MyNutritionPlan" component={MyNutritionPlanScreen} />
    <Stack.Screen name="WorkoutSetup" component={WorkoutSetupScreen} />
    <Stack.Screen name="GeneratedWorkoutPlanView" component={GeneratedWorkoutPlanViewScreen} />
    <Stack.Screen name="MyWorkout" component={MyWorkoutScreen} />
    <Stack.Screen name="WorkoutChoice" component={WorkoutChoiceScreen} />
    <Stack.Screen name="FreeWorkoutBuilder" component={FreeWorkoutBuilderScreen} />
    <Stack.Screen name="FreeWorkoutView" component={FreeWorkoutViewScreen} />
    <Stack.Screen name="StepHistory" component={StepHistoryScreen} />
    <Stack.Screen name="ProgressDashboard" component={ProgressDashboardScreen} />
    <Stack.Screen name="WellnessHome" component={WellnessHomeScreen} />
    <Stack.Screen name="FoodPhotoLog" component={FoodPhotoLogScreen} />
    <Stack.Screen name="GroceryList" component={GroceryListScreen} />
    <Stack.Screen name="WeeklyReport" component={WeeklyReportScreen} />
    <Stack.Screen name="WorkoutFeedback" component={WorkoutFeedbackScreen} />
    <Stack.Screen name="ExerciseProgress" component={ExerciseProgressScreen} />
    <Stack.Screen name="SubscriptionPlans" component={SubscriptionPlansScreen} />
    <Stack.Screen name="Payment" component={PaymentScreen} />
    <Stack.Screen name="RazorpayCheckout" component={RazorpayCheckoutScreen} />
    <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
    <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isChecking, setIsChecking] = React.useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      await dispatch(checkAuthStatus());
      setIsChecking(false);
    };
    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
});

export default AppNavigator;

