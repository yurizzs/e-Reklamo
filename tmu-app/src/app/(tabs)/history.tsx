import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryScreen() {
  const historyReports = [
    {
      ticketNo: 'TMU-2026-0010',
      title: 'Tricycle Fare Overcharge resolved',
      category: 'Overcharging Fare',
      location: 'Intramuros, Manila',
      status: 'RESOLVED',
      date: '2026-06-15',
    },
    {
      ticketNo: 'TMU-2025-0892',
      title: 'Jeepney reckless swerving report',
      category: 'Reckless Driving',
      location: 'Lerma St, Manila',
      status: 'RESOLVED',
      date: '2025-12-25',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Report History</Text>
        <Text style={styles.headerSub}>Past resolved and processed complaints</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {historyReports.map((report) => (
          <View key={report.ticketNo} style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketNo}>{report.ticketNo}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{report.status}</Text>
              </View>
            </View>

            <Text style={styles.ticketTitle}>{report.title}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Category:</Text>
              <Text style={styles.metaValue}>{report.category}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Resolved On:</Text>
              <Text style={styles.metaValue}>{report.date}</Text>
            </View>
          </View>
        ))}
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
    paddingVertical: 14,
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
    borderColor: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 1,
  },
  ticketTitle: {
    fontSize: 14,
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
});
