import React from 'react';
import { CompactAnnouncements } from './compact-announcements';
export * from '@/constants/announcements';

export interface PublicAnnouncementsProps {
  variant?: 'home' | 'standalone';
  searchQuery?: string;
}

export const PublicAnnouncements: React.FC<PublicAnnouncementsProps> = () => {
  return <CompactAnnouncements />;
};

export default PublicAnnouncements;
