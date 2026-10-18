import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import {
  OFFICIAL_ANNOUNCEMENTS,
  AnnouncementItem,
} from '@/constants/announcements';
import { AnnouncementDetailModal } from '@/components/announcement-detail-modal';
import { apiService } from '@/services/api';

type FilterCategory = 'all' | 'memorandum' | 'announcement' | 'directive' | 'priority_urgent';

export default function AnnouncementsTabScreen() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(OFFICIAL_ANNOUNCEMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await apiService.fetchAnnouncements();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setAnnouncements(res.data);
      }
    } catch {
      // Fallback is maintained in initial state
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAnnouncements();
    setIsRefreshing(false);
  }, [loadAnnouncements]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      // Category filter
      if (selectedCategory === 'memorandum' && item.type !== 'memorandum') return false;
      if (selectedCategory === 'announcement' && item.type !== 'announcement') return false;
      if (selectedCategory === 'directive' && item.type !== 'directive') return false;
      if (selectedCategory === 'priority_urgent' && item.urgency === 'routine') return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = item.title.toLowerCase().includes(q);
        const inRef = item.refNumber.toLowerCase().includes(q);
        const inSummary = item.summary.toLowerCase().includes(q);
        const inOffice = item.issuingOffice.toLowerCase().includes(q);
        const inBasis = item.legalBasis?.toLowerCase().includes(q);
        const inDirectives = (item.keyDirectives || []).some((d) => d.toLowerCase().includes(q));
        return inTitle || inRef || inSummary || inOffice || inBasis || inDirectives;
      }

      return true;
    });
  }, [announcements, searchQuery, selectedCategory]);

  const counts = useMemo(() => {
    return {
      all: announcements.length,
      memorandum: announcements.filter((i) => i.type === 'memorandum').length,
      announcement: announcements.filter((i) => i.type === 'announcement').length,
      directive: announcements.filter((i) => i.type === 'directive').length,
      priority_urgent: announcements.filter((i) => i.urgency !== 'routine').length,
    };
  }, [announcements]);

  const getCategoryTheme = (type: AnnouncementItem['type']) => {
    switch (type) {
      case 'memorandum':
        return {
          pillBg: '#eff6ff',
          pillBorder: '#bfdbfe',
          pillText: '#1d4ed8',
          borderLeft: '#2563eb',
          label: 'MEMORANDUM',
        };
      case 'directive':
        return {
          pillBg: '#f5f3ff',
          pillBorder: '#ddd6fe',
          pillText: '#6d28d9',
          borderLeft: '#7c3aed',
          label: 'DIRECTIVE',
        };
      case 'announcement':
      default:
        return {
          pillBg: '#f0fdf4',
          pillBorder: '#bbf7d0',
          pillText: '#15803d',
          borderLeft: '#10b981',
          label: 'PUBLIC ADVISORY',
        };
    }
  };

  const getUrgencyBadge = (urgency: AnnouncementItem['urgency']) => {
    switch (urgency) {
      case 'urgent':
        return {
          bg: '#fef2f2',
          border: '#fecaca',
          text: '#dc2626',
          label: 'URGENT',
        };
      case 'priority':
        return {
          bg: '#fffbeb',
          border: '#fde68a',
          text: '#b45309',
          label: 'PRIORITY',
        };
      case 'routine':
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <SymbolView
              name={{ ios: 'newspaper.fill', android: 'campaign', web: 'campaign' }}
              tintColor="#ffffff"
              size={20}
            />
          </View>
          <View>
            <Text style={styles.headerTitle}>Public Announcements</Text>
            <Text style={styles.headerSubtitle}>Official TMU & City Transport Directives</Text>
          </View>
        </View>

        <View style={styles.verifiedBadge}>
          <SymbolView
            name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
            tintColor="#059669"
            size={12}
          />
          <Text style={styles.verifiedBadgeText}>OFFICIAL</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBox}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            tintColor="#64748b"
            size={16}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search fare rules, route bypass, memos, ordinances..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <SymbolView
                name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                tintColor="#94a3b8"
                size={16}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter Horizontal Scroll / Tabs */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          <Pressable
            onPress={() => setSelectedCategory('all')}
            style={[
              styles.filterChip,
              selectedCategory === 'all' && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === 'all' && styles.filterTextActive,
              ]}
            >
              All Announcements ({counts.all})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedCategory('memorandum')}
            style={[
              styles.filterChip,
              selectedCategory === 'memorandum' && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === 'memorandum' && styles.filterTextActive,
              ]}
            >
              Memoranda ({counts.memorandum})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedCategory('announcement')}
            style={[
              styles.filterChip,
              selectedCategory === 'announcement' && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === 'announcement' && styles.filterTextActive,
              ]}
            >
              Advisories ({counts.announcement})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedCategory('directive')}
            style={[
              styles.filterChip,
              selectedCategory === 'directive' && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === 'directive' && styles.filterTextActive,
              ]}
            >
              Directives ({counts.directive})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedCategory('priority_urgent')}
            style={[
              styles.filterChip,
              selectedCategory === 'priority_urgent' && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === 'priority_urgent' && styles.filterTextActive,
              ]}
            >
              Priority & Urgent ({counts.priority_urgent})
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Main Announcement Feed */}
      <ScrollView
        style={styles.feedScroll}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        {/* Stat Highlights Card */}
        <View style={styles.highlightsCard}>
          <View style={styles.highlightCol}>
            <Text style={styles.highlightNumber}>₱15.00</Text>
            <Text style={styles.highlightLabel}>Base Fare (2km)</Text>
          </View>
          <View style={styles.highlightDivider} />
          <View style={styles.highlightCol}>
            <Text style={styles.highlightNumber}>20%</Text>
            <Text style={styles.highlightLabel}>Student / Senior / PWD</Text>
          </View>
          <View style={styles.highlightDivider} />
          <View style={styles.highlightCol}>
            <Text style={styles.highlightNumber}>24/7</Text>
            <Text style={styles.highlightLabel}>TMU Hotline Support</Text>
          </View>
        </View>

        {filteredAnnouncements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <SymbolView
                name={{ ios: 'doc.text.magnifyingglass', android: 'find_in_page', web: 'find_in_page' }}
                tintColor="#94a3b8"
                size={34}
              />
            </View>
            <Text style={styles.emptyTitle}>No matching circulars</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find any announcements matching your query "{searchQuery}".
            </Text>
            <Pressable
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              style={styles.resetFiltersBtn}
            >
              <Text style={styles.resetFiltersBtnText}>Reset Filter & Search</Text>
            </Pressable>
          </View>
        ) : (
          filteredAnnouncements.map((item) => {
            const theme = getCategoryTheme(item.type);
            const urgencyBadge = getUrgencyBadge(item.urgency);

            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedAnnouncement(item)}
                style={({ pressed }) => [
                  styles.card,
                  { borderLeftColor: theme.borderLeft, borderLeftWidth: 4 },
                  pressed && styles.cardPressed,
                ]}
              >
                {/* Meta Top Row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.badgeGroup}>
                    <View
                      style={[
                        styles.categoryPill,
                        {
                          backgroundColor: theme.pillBg,
                          borderColor: theme.pillBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryPillText,
                          { color: theme.pillText },
                        ]}
                      >
                        {item.badgeLabel}
                      </Text>
                    </View>

                    {urgencyBadge && (
                      <View
                        style={[
                          styles.urgencyPill,
                          {
                            backgroundColor: urgencyBadge.bg,
                            borderColor: urgencyBadge.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.urgencyDot,
                            { backgroundColor: urgencyBadge.text },
                          ]}
                        />
                        <Text
                          style={[
                            styles.urgencyText,
                            { color: urgencyBadge.text },
                          ]}
                        >
                          {urgencyBadge.label}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.dateText}>{item.date}</Text>
                </View>

                {/* Ref Code Tag */}
                <View style={styles.refRow}>
                  <SymbolView
                    name={{ ios: 'number', android: 'tag', web: 'tag' }}
                    tintColor="#64748b"
                    size={12}
                  />
                  <Text style={styles.refCodeText}>{item.refNumber}</Text>
                </View>

                {/* Title */}
                <Text style={styles.cardTitle}>{item.title}</Text>

                {/* Summary */}
                <Text style={styles.cardSummary} numberOfLines={3}>
                  {item.summary}
                </Text>

                {/* Directive Count & Legal Basis */}
                <View style={styles.cardTagsRow}>
                  <View style={styles.directiveCountPill}>
                    <SymbolView
                      name={{ ios: 'list.bullet', android: 'format_list_bulleted', web: 'format_list_bulleted' }}
                      tintColor="#2563eb"
                      size={11}
                    />
                    <Text style={styles.directiveCountText}>
                      {item.keyDirectives.length} key directives
                    </Text>
                  </View>

                  {item.legalBasis && (
                    <View style={styles.legalBasisPill}>
                      <Text style={styles.legalBasisText} numberOfLines={1}>
                        {item.legalBasis.split('&')[0].trim()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Footer Authority */}
                <View style={styles.cardFooter}>
                  <View style={styles.authorityRow}>
                    <SymbolView
                      name={{ ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' }}
                      tintColor="#64748b"
                      size={13}
                    />
                    <Text style={styles.authorityText} numberOfLines={1}>
                      {item.issuingOffice}
                    </Text>
                  </View>

                  <View style={styles.readNoticeBtn}>
                    <Text style={styles.readNoticeText}>View Details</Text>
                    <SymbolView
                      name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                      tintColor="#2563eb"
                      size={12}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Reusable Document Detail Modal */}
      <AnnouncementDetailModal
        announcement={selectedAnnouncement}
        visible={!!selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },

  /* Search */
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
    padding: 0,
    outlineStyle: 'none' as any,
  },
  clearSearchBtn: {
    padding: 2,
  },

  /* Filters */
  filtersWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
  },
  filtersScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterTextActive: {
    color: '#ffffff',
  },

  /* Feed */
  feedScroll: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
    gap: 14,
  },

  /* Highlights Card */
  highlightsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  highlightCol: {
    flex: 1,
    alignItems: 'center',
  },
  highlightNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1d4ed8',
  },
  highlightLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e40af',
    textAlign: 'center',
    marginTop: 2,
  },
  highlightDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#bfdbfe',
  },

  /* Card */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  cardPressed: {
    backgroundColor: '#f8fafc',
    transform: [{ scale: 0.995 }],
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
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
  urgencyText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  cardSummary: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#475569',
    lineHeight: 18,
  },
  cardTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  directiveCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  directiveCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  legalBasisPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: 200,
  },
  legalBasisText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  authorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  authorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  readNoticeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  readNoticeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2563eb',
  },

  /* Empty */
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  resetFiltersBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  resetFiltersBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
