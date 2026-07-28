import { Redirect } from 'expo-router';

export default function Index() {
  // Automatically redirect entry point to Login screen
  return <Redirect href="/login" />;
}
