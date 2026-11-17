import { Redirect } from 'expo-router';
import { authStore } from '@/services/auth-store';

export default function Index() {
  if (authStore.isAuthenticated()) {
    return <Redirect href="/(tabs)" />;
  }
  return <Redirect href="/login" />;
}
