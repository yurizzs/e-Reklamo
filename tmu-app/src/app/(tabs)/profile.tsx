import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authStore } from '@/services/auth-store';

export default function ProfileScreen() {
  const router = useRouter();
  const user = authStore.getUser();

  const fullName = trimName(user.first_name, user.middle_name, user.last_name, user.suffix_1name);
  const roleDisplay = user.role ? `${user.role.toUpperCase()} ACCOUNT` : 'CITIZEN ACCOUNT';

  const handleLogout = () => {
    authStore.clearSession();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.avatarBadge}>
            <Image
              source={require('@/assets/images/react-logo.png')}
              style={styles.avatarImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userRole}>{roleDisplay}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionHeader}>ACCOUNT INFORMATION</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{user.username || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{user.email || 'Not provided'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>{user.phone || 'Not provided'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{user.address || 'Not provided'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account ID</Text>
            <Text style={styles.infoValue}>#{user.id}</Text>
          </View>
        </View>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && styles.logoutBtnPressed,
          ]}
        >
          <Text style={styles.logoutBtnText}>LOG OUT</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function trimName(first?: string, middle?: string, last?: string, suffix?: string): string {
  const parts = [first, middle, last, suffix].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Citizen User';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#040c07',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  headerCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  avatarBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 42,
    height: 42,
    tintColor: '#10b981',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  userRole: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  logoutBtnPressed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutBtnText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
