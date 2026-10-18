import React, { useState, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { OFFICIAL_ANNOUNCEMENTS, AnnouncementItem } from '@/constants/announcements';
import { AnnouncementDetailModal } from '@/components/announcement-detail-modal';
import { apiService } from '@/services/api';

export const CompactAnnouncements: React.FC = () => {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(OFFICIAL_ANNOUNCEMENTS);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchLive = async () => {
      try {
        const res = await apiService.fetchAnnouncements();
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAnnouncements(res.data);
        }
      } catch {}
    };
    fetchLive();
    return () => {
      isMounted = false;
    };
  }, []);

  // Take the 3 latest announcements for the compact dashboard feed
  const latestAnnouncements = announcements.slice(0, 3);

  const getCategoryTheme = (type: AnnouncementItem['type']) => {
    switch (type) {
      case 'memorandum':
        return {
          pillBg: '#eff6ff',
          pillBorder: '#bfdbfe',
          pillText: '#1d4ed8',
          label: 'MEMORANDUM',
        };
      case 'directive':
        return {
          pillBg: '#f5f3ff',
          pillBorder: '#ddd6fe',
          pillText: '#6d28d9',
          label: 'DIRECTIVE',
        };
      case 'announcement':
      default:
        return {
          pillBg: '#f0fdf4',
          pillBorder: '#bbf7d0',
          pillText: '#15803d',
          label: 'ADVISORY',
        };
    }
  };

  const getUrgencyBadge = (urgency: AnnouncementItem['urgency']) => {
    switch (urgency) {
      case 'urgent':
        return {
          badgeBg: '#fef2f2',
          badgeBorder: '#fecaca',
          badgeText: '#dc2626',
          label: 'URGENT',
        };
      case 'priority':
        return {
          badgeBg: '#fffbeb',
          badgeBorder: '#fde68a',
          badgeText: '#b45309',
          label: 'PRIORITY',
        };
      case 'routine':
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <SymbolView
              name={{ ios: 'megaphone.fill', android: 'campaign', web: 'campaign' }}
              tintColor="#2563eb"
              size={18}
            />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Latest Announcements</Text>
            <Text style={styles.sectionSubtitle}>
              Official directives & advisories
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/announcements' as any)}
          style={({ pressed }) => [
            styles.seeAllBtn,
            pressed && styles.seeAllBtnPressed,
          ]}
        >
          <Text style={styles.seeAllText}>See All ({announcements.length})</Text>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            tintColor="#2563eb"
            size={12}
          />
        </Pressable>
      </View>

      {/* Compact Cards List */}
      <View style={styles.list}>
        {latestAnnouncements.map((item) => {
          const theme = getCategoryTheme(item.type);
          const urgencyBadge = getUrgencyBadge(item.urgency);

          return (
            <Pressable
              key={item.id}
              onPress={() => setSelectedAnnouncement(item)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              {/* Top Row: Category Pill + Urgency + Date */}
              <View style={styles.cardHeader}>
                <View style={styles.cardBadges}>
                  <View
                    style={[
                      styles.typePill,
                      { backgroundColor: theme.pillBg, borderColor: theme.pillBorder },
                    ]}
                  >
                    <Text style={[styles.typePillText, { color: theme.pillText }]}>
                      {theme.label}
                    </Text>
                  </View>

                  {urgencyBadge && (
                    <View
                      style={[
                        styles.urgencyPill,
                        {
                          backgroundColor: urgencyBadge.badgeBg,
                          borderColor: urgencyBadge.badgeBorder,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.urgencyDot,
                          { backgroundColor: urgencyBadge.badgeText },
                        ]}
                      />
                      <Text
                        style={[
                          styles.urgencyPillText,
                          { color: urgencyBadge.badgeText },
                        ]}
                      >
                        {urgencyBadge.label}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.dateText}>{item.date}</Text>
              </View>

              {/* Title */}
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>

              {/* 1-Line Preview Summary */}
              <Text style={styles.cardSummary} numberOfLines={1}>
                {item.summary}
              </Text>

              {/* Bottom Meta & Action */}
              <View style={styles.cardFooter}>
                <Text style={styles.refCode}>{item.refNumber}</Text>
                <View style={styles.viewMemoLink}>
                  <Text style={styles.viewMemoText}>Read Announcement</Text>
                  <SymbolView
                    name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
                    tintColor="#2563eb"
                    size={11}
                  />
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Quick Link Banner to Full Dedicated View */}
      <Pressable
        onPress={() => router.push('/(tabs)/announcements' as any)}
        style={({ pressed }) => [
          styles.archiveBanner,
          pressed && styles.archiveBannerPressed,
        ]}
      >
        <View style={styles.archiveBannerLeft}>
          <SymbolView
            name={{ ios: 'doc.text.magnifyingglass', android: 'find_in_page', web: 'find_in_page' }}
            tintColor="#1e40af"
            size={18}
          />
          <Text style={styles.archiveBannerText}>
            Browse full TMU circulars & ordinance archives
          </Text>
        </View>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          tintColor="#1e40af"
          size={14}
        />
      </Pressable>

      {/* Document Detail Modal */}
      <AnnouncementDetailModal
        announcement={selectedAnnouncement}
        visible={!!selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 1,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  seeAllBtnPressed: {
    backgroundColor: '#dbeafe',
  },
  seeAllText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2563eb',
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  cardPressed: {
    backgroundColor: '#f8fafc',
    transform: [{ scale: 0.995 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  urgencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  urgencyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  urgencyPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  cardSummary: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  refCode: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.2,
  },
  viewMemoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewMemoText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2563eb',
  },
  archiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 2,
  },
  archiveBannerPressed: {
    backgroundColor: '#dbeafe',
  },
  archiveBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  archiveBannerText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1e40af',
  },
});
