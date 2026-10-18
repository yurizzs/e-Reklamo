import React from 'react';
import { Redirect } from 'expo-router';

export default function AnnouncementsRootRedirect() {
  return <Redirect href="/(tabs)/announcements" />;
}
