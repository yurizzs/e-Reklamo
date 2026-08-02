import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '@/services/api';
import { authStore } from '@/services/auth-store';

export default function TrackScreen() {
  const [activeTab, setActiveTab] = useState<'my_reports' | 'check_violations'>('my_reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [violationResults, setViolationResults] = useState<any[] | null>(null);

  const currentUser = authStore.getUser();

  const activeReports = [
    {
      ticketNo: 'TMU-2026-0042',
      title: 'Overcharged fare on Tricycle ABC-123',
      category: 'Overcharging Fare',
      location: 'Espana Blvd, Manila',
      status: 'UNDER REVIEW',
      statusColor: '#f59e0b',
      date: '2026-07-28 14:30',
    },
    {
      ticketNo: 'TMU-2026-0039',
      title: 'Jeepney operating out of authorized route',
      category: 'Route Deviation',
      location: 'Quezon Ave, QC',
      status: 'PENDING',
      statusColor: '#3b82f6',
      date: '2026-07-27 09:15',
    },
  ];

  const handleSearchViolations = async (overrideQuery?: string) => {
    const q = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
    const finalQuery = q || `${currentUser.first_name} ${currentUser.last_name}`;

    setIsSearching(true);
    try {
      const res = await apiService.checkViolations(finalQuery, authStore.getToken() || undefined);
      if (res.success && res.data) {
        setViolationResults(res.data.violations || []);
      } else {
        setViolationResults([]);
      }
    } catch (err: any) {
      Alert.alert('Search Error', err.message || 'Unable to fetch violation records.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Track & Check Violations</Text>
        <Text style={styles.headerSub}>Live status of complaints and driver violation lookup</Text>

        {/* Tab Toggle */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabItem, activeTab === 'my_reports' && styles.tabItemActive]}
            onPress={() => setActiveTab('my_reports')}
          >
            <Text style={[styles.tabText, activeTab === 'my_reports' && styles.tabTextActive]}>
              My Submitted Reports
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabItem, activeTab === 'check_violations' && styles.tabItemActive]}
            onPress={() => {
              setActiveTab('check_violations');
              if (violationResults === null) {
                handleSearchViolations('');
              }
            }}
          >
            <Text style={[styles.tabText, activeTab === 'check_violations' && styles.tabTextActive]}>
              Driver Violation Lookup
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'my_reports' ? (
          activeReports.map((report) => (
            <View key={report.ticketNo} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketNo}>{report.ticketNo}</Text>
                <View style={[styles.statusBadge, { borderColor: report.statusColor }]}>
                  <Text style={[styles.statusText, { color: report.statusColor }]}>{report.status}</Text>
                </View>
              </View>

              <Text style={styles.ticketTitle}>{report.title}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Category:</Text>
                <Text style={styles.metaValue}>{report.category}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Location:</Text>
                <Text style={styles.metaValue}>{report.location}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Submitted:</Text>
                <Text style={styles.metaValue}>{report.date}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.lookupSection}>
            <Text style={styles.lookupTitle}>Check Driver Traffic Violation Records</Text>
            <Text style={styles.lookupSub}>
              Enter a Vehicle Plate Number or Driver Full Name to view registered infractions.
            </Text>

            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="e.g. ABC-123 or Juan Dela Cruz"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Pressable style={styles.searchBtn} onPress={() => handleSearchViolations()}>
                <Text style={styles.searchBtnText}>Search</Text>
              </Pressable>
            </View>

            <Pressable style={styles.quickSelfBtn} onPress={() => handleSearchViolations('')}>
              <Text style={styles.quickSelfText}>
                🔍 Check Violations for My Profile ({currentUser.first_name} {currentUser.last_name})
              </Text>
            </Pressable>

            {isSearching ? (
              <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 20 }} />
            ) : violationResults !== null ? (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsHeader}>
                  Found {violationResults.length} violation record(s)
                </Text>

                {violationResults.length === 0 ? (
                  <View style={styles.noViolationCard}>
                    <Text style={styles.cleanRecordTitle}>✅ Clean Record</Text>
                    <Text style={styles.cleanRecordSub}>
                      No active traffic violations found for this plate number or driver profile.
                    </Text>
                  </View>
                ) : (
                  violationResults.map((item: any, idx: number) => (
                    <View key={item.id || idx} style={styles.ticketCard}>
                      <View style={styles.ticketHeader}>
                        <Text style={styles.ticketNo}>VIOLATION REKLAMO #{item.id}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            { borderColor: item.status === 'resolved' ? '#10b981' : '#f59e0b' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: item.status === 'resolved' ? '#10b981' : '#f59e0b' },
                            ]}
                          >
                            {(item.status || 'new').toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.ticketTitle}>{item.title}</Text>

                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Driver / Plate:</Text>
                        <Text style={styles.metaValue}>
                          {item.driver?.first_name ? `${item.driver.first_name} ${item.driver.last_name}` : 'N/A'}{' '}
                          ({item.driver?.plate_number || 'N/A'})
                        </Text>
                      </View>

                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Violation Category:</Text>
                        <Text style={styles.metaValue}>{item.category?.category_name || 'N/A'}</Text>
                      </View>

                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Penalty Amount:</Text>
                        <Text style={[styles.metaValue, { color: '#ef4444' }]}>
                          ₱{item.category?.penalty_amount || '0.00'}
                        </Text>
                      </View>

                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Incident Date:</Text>
                        <Text style={styles.metaValue}>{item.incident_date_time || 'N/A'}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#040c07',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.15)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(16, 185, 129, 0.65)',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#10b981',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tabTextActive: {
    color: '#022c1a',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  ticketCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketNo: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  ticketTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  metaValue: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  lookupSection: {
    gap: 14,
  },
  lookupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  lookupSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
  },
  searchBox: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    color: '#ffffff',
    fontSize: 13,
  },
  searchBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#022c1a',
    fontSize: 12,
    fontWeight: '800',
  },
  quickSelfBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quickSelfText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '700',
  },
  resultsContainer: {
    marginTop: 10,
    gap: 12,
  },
  resultsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
  noViolationCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  cleanRecordTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
  },
  cleanRecordSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});
