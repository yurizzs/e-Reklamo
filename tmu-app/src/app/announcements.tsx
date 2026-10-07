import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { PublicAnnouncements } from '@/components/public-announcements';

export default function AnnouncementsArchiveScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            tintColor="#0f172a"
            size={20}
          />
        </Pressable>

        <View style={styles.navTitleCenter}>
          <View style={styles.navTitleRow}>
            <Text style={styles.navTitle}>Public Announcements & Memoranda</Text>
            <View style={styles.wipPill}>
              <Text style={styles.wipPillText}>WIP</Text>
            </View>
          </View>
          <Text style={styles.navSubtitle}>Official TMU & City Transportation Directives</Text>
        </View>

        <View style={styles.navRightPlaceholder} />
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            tintColor="#64748b"
            size={16}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search announcement, ordinance, fare rate..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
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

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PublicAnnouncements variant="standalone" searchQuery={searchQuery} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    opacity: 0.7,
  },
  navTitleCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  wipPill: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  wipPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#b45309',
    letterSpacing: 0.6,
  },
  navSubtitle: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  navRightPlaceholder: {
    width: 38,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
    padding: 0,
  },
  clearSearchBtn: {
    padding: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 60,
  },
});
