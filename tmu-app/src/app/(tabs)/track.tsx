import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { apiService } from '@/services/api';
import { authStore } from '@/services/auth-store';

export default function TrackScreen() {
  const [activeTab, setActiveTab] = useState<'my_reports' | 'check_violations'>('check_violations');
  const [searchQuery, setSearchQuery] = useState('ABC 1234');
  const [isSearching, setIsSearching] = useState(false);
  const [violationResults, setViolationResults] = useState<any[] | null>([
    {
      id: 49122,
      title: 'Obstruction of Traffic',
      status: 'unpaid',
      incident_date_time: 'Nov 04, 2026 • 11:30 AM',
      location_name: 'Gil Puyat Ave Westbound',
      category: { category_name: 'Obstruction of Traffic', penalty_amount: '100.00' }
    },
    {
      id: 49123,
      title: 'Illegal Parking',
      status: 'unpaid',
      incident_date_time: 'Oct 28, 2026 • 04:15 PM',
      location_name: 'Legazpi Village St',
      category: { category_name: 'Illegal Parking', penalty_amount: '80.00' }
    },
    {
      id: 49124,
      title: 'No U-Turn Sign',
      status: 'settled',
      incident_date_time: 'Sep 12, 2026 • 09:20 AM',
      location_name: 'EDSA Crossing Northbound',
      category: { category_name: 'No U-Turn Sign', penalty_amount: '60.00' }
    }
  ]);

  const currentUser = authStore.getUser();
  const token = authStore.getToken() || undefined;

  // Chat Modal State
  const [isChatModalVisible, setIsChatModalVisible] = useState(false);
  const [conversationId, setConversationId] = useState<number>(1);
  const [chatMessages, setChatMessages] = useState<Array<{ id: number; sender_type: string; sender_name: string; text: string; time: string }>>([
    {
      id: 1,
      sender_type: 'employee',
      sender_name: 'TMU Agent #304',
      text: 'Hello John! How can I assist you with your report update today?',
      time: '10:02 AM',
    },
  ]);
  const [chatInputText, setChatInputText] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  const activeReports = [
    {
      ticketNo: 'TMU-48291',
      title: 'Speeding Bus EDSA Corner',
      category: 'Over-speeding Sign',
      location: 'EDSA Corner, Pasay',
      status: 'RESOLVED',
      statusColor: '#10b981',
      date: 'Nov 01, 2026',
    },
    {
      ticketNo: 'TMU-49122',
      title: 'Illegal U-turn on Makati Ave',
      category: 'Reckless Turn',
      location: 'Makati Ave, Makati',
      status: 'PENDING',
      statusColor: '#f59e0b',
      date: 'Nov 05, 2026',
    },
    {
      ticketNo: 'TMU-50119',
      title: 'Blocked Pedestrian Crossing',
      category: 'Obstruction',
      location: 'Ayala Ave, Makati',
      status: 'NEW',
      statusColor: '#2563eb',
      date: 'Today',
    },
  ];

  const handleSearchViolations = async (overrideQuery?: string) => {
    const q = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    try {
      const res = await apiService.checkViolations(q, token);
      if (res.success && res.data) {
        setViolationResults(res.data.violations || []);
      } else {
        setViolationResults([]);
      }
    } catch {
      // Keep static mock records for visual preview if server offline
    } finally {
      setIsSearching(false);
    }
  };

  // Unpaid balance calculation
  const unpaidViolations = violationResults?.filter((v: any) => (v.status || '').toLowerCase() === 'unpaid') || [];
  const totalUnpaid = unpaidViolations.reduce((sum, v) => {
    const amt = parseFloat(v.category?.penalty_amount || '0');
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  // Chat loading and polling
  const loadChatMessages = async (convId: number) => {
    try {
      const res = await apiService.fetchMessages(convId, token);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((m: any) => ({
          id: m.id,
          sender_type: m.sender_type || (m.sender_role === 'citizen' ? 'user' : 'employee'),
          sender_name: m.sender_name || 'TMU Agent #304',
          text: m.message_text,
          time: m.time_formatted || 'Just now',
        }));
        setChatMessages(mapped);
      }
    } catch {}
  };

  useEffect(() => {
    if (!isChatModalVisible) return;

    let isMounted = true;
    let pollInterval: any = null;

    const initChat = async () => {
      try {
        const convRes = await apiService.fetchConversations(token);
        let targetConvId = 1;
        if (convRes.success && Array.isArray(convRes.data) && convRes.data.length > 0) {
          targetConvId = convRes.data[0].id;
        }
        if (isMounted) {
          setConversationId(targetConvId);
          await loadChatMessages(targetConvId);
        }
      } catch (err) {
        console.warn("Chat init warning in track:", err);
      }
    };

    initChat();

    pollInterval = setInterval(() => {
      if (isMounted) {
        loadChatMessages(conversationId);
      }
    }, 3000);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isChatModalVisible, conversationId]);

  const handleSendChatMessage = async () => {
    const textToSend = chatInputText.trim();
    if (!textToSend) return;

    const userMsg = {
      id: Date.now(),
      sender_type: 'user',
      sender_name: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Citizen',
      text: textToSend,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInputText('');
    setIsSendingChat(true);

    try {
      const senderName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Citizen';
      const senderRole = currentUser?.role || 'citizen';
      const sendRes = await apiService.sendChatMessage(conversationId, textToSend, token, senderName, senderRole);

      if (sendRes?.data?.conversation_id && sendRes.data.conversation_id !== conversationId) {
        setConversationId(sendRes.data.conversation_id);
      }
      setTimeout(() => {
        loadChatMessages(sendRes?.data?.conversation_id || conversationId);
      }, 800);
    } catch {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender_type: 'employee',
            sender_name: 'TMU Agent #304',
            text: "Sure thing. Please attach the photo here and I'll merge it right away.",
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          },
        ]);
      }, 1000);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <SymbolView
              name={{ ios: 'shield.fill', android: 'shield', web: 'shield' }}
              tintColor="#ffffff"
              size={20}
            />
          </View>
          <Text style={styles.brandTitle}>Violation Check Portal</Text>
        </View>

        <View style={styles.civicBadge}>
          <Text style={styles.civicBadgeText}>CIVIC</Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabItem, activeTab === 'check_violations' && styles.tabItemActive]}
            onPress={() => setActiveTab('check_violations')}
          >
            <Text style={[styles.tabText, activeTab === 'check_violations' && styles.tabTextActive]}>
              Violation Lookup
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabItem, activeTab === 'my_reports' && styles.tabItemActive]}
            onPress={() => setActiveTab('my_reports')}
          >
            <Text style={[styles.tabText, activeTab === 'my_reports' && styles.tabTextActive]}>
              My Submitted Reports
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'my_reports' ? (
          <View style={styles.listContainer}>
            {activeReports.map((report) => (
              <View key={report.ticketNo} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.ticketNo}>{report.ticketNo}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      report.status === 'RESOLVED' && styles.statusResolved,
                      report.status === 'PENDING' && styles.statusPending,
                      report.status === 'NEW' && styles.statusNew,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        report.status === 'RESOLVED' && styles.statusTextResolved,
                        report.status === 'PENDING' && styles.statusTextPending,
                        report.status === 'NEW' && styles.statusTextNew,
                      ]}
                    >
                      {report.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{report.title}</Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Category</Text>
                  <Text style={styles.metaValue}>{report.category}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Location</Text>
                  <Text style={styles.metaValue}>{report.location}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Filed Date</Text>
                  <Text style={styles.metaValue}>{report.date}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.lookupSection}>
            <Text style={styles.sectionHeader}>Track Driver / Plate Records</Text>

            {/* Search Box */}
            <View style={styles.searchBox}>
              <View style={styles.searchInputWrapper}>
                <SymbolView
                  name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                  tintColor="#64748b"
                  size={18}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="e.g. ABC 1234"
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                    <SymbolView
                      name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                      tintColor="#cbd5e1"
                      size={18}
                    />
                  </Pressable>
                )}
              </View>
              <Pressable style={styles.searchBtn} onPress={() => handleSearchViolations()}>
                <Text style={styles.searchBtnText}>Search</Text>
              </Pressable>
            </View>

            {/* Unpaid Penalty Card */}
            {totalUnpaid > 0 && (
              <View style={styles.unpaidPenaltyCard}>
                <View style={styles.unpaidInfo}>
                  <Text style={styles.unpaidLabel}>Total Unpaid Penalty Fees</Text>
                  <Text style={styles.unpaidAmount}>${totalUnpaid.toFixed(2)}</Text>
                </View>
                <Pressable
                  style={styles.payDuesBtn}
                  onPress={() => Alert.alert('Payment', 'Navigate to TMU mobile payment portal.')}
                >
                  <Text style={styles.payDuesBtnText}>Pay Dues</Text>
                </Pressable>
              </View>
            )}

            {/* Violation List */}
            {isSearching ? (
              <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 20 }} />
            ) : violationResults !== null ? (
              <View style={styles.listContainer}>
                {violationResults.length === 0 ? (
                  <View style={styles.cleanRecordCard}>
                    <Text style={styles.cleanRecordTitle}>✅ Clean Record</Text>
                    <Text style={styles.cleanRecordSub}>
                      No active traffic violations found for this plate number or driver profile.
                    </Text>
                  </View>
                ) : (
                  violationResults.map((item: any, idx: number) => {
                    const isSettled = (item.status || '').toLowerCase() === 'settled';
                    return (
                      <View key={item.id || idx} style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                          <Text style={styles.cardTitle}>{item.title}</Text>
                          <View
                            style={[
                              styles.statusBadge,
                              isSettled ? styles.statusResolved : styles.statusPending,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                isSettled ? styles.statusTextResolved : styles.statusTextPending,
                              ]}
                            >
                              {isSettled ? 'Settled' : 'Unpaid'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.metaValueSub}>
                          Location: {item.location_name || 'Gil Puyat Ave Westbound'}
                        </Text>
                        <Text style={styles.metaValueSub}>
                          Date: {item.incident_date_time || 'Nov 04, 2026 • 11:30 AM'}
                        </Text>

                        {!isSettled && (
                          <View style={styles.fineRow}>
                            <Text style={styles.fineLabel}>Fine Amount:</Text>
                            <Text style={styles.fineAmount}>
                              ${parseFloat(item.category?.penalty_amount || '0.00').toFixed(2)}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <Pressable
        onPress={() => setIsChatModalVisible(true)}
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.fabPressed,
        ]}
      >
        <SymbolView
          name={{ ios: 'message.fill', android: 'chat', web: 'chat' }}
          tintColor="#ffffff"
          size={24}
        />
        <View style={styles.fabBadge}>
          <Text style={styles.fabBadgeText}>1</Text>
        </View>
      </Pressable>

      {/* Operator Chat Modal Popup */}
      <Modal
        visible={isChatModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsChatModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.chatModalContent}>
            {/* Modal Header */}
            <View style={styles.chatModalHeader}>
              <View style={styles.chatHeaderLeft}>
                <View style={styles.chatAvatar}>
                  <Text style={styles.chatAvatarText}>OP</Text>
                </View>
                <View>
                  <Text style={styles.chatHeaderTitle}>TMU Agent #304</Text>
                  <View style={styles.onlineBadgeRow}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.onlineText}>Online</Text>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={() => setIsChatModalVisible(false)}
                style={styles.closeBtn}
              >
                <SymbolView
                  name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                  tintColor="#cbd5e1"
                  size={24}
                />
              </Pressable>
            </View>

            {/* Chat Messages List */}
            <ScrollView
              ref={chatScrollRef}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
              style={styles.messagesContainer}
              contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {chatMessages.map((msg, idx) => {
                const isUser = msg.sender_type === 'user';
                return (
                  <View key={idx} style={styles.messageBubbleWrapper}>
                    <View
                      style={[
                        styles.messageBubble,
                        isUser ? styles.userBubble : styles.agentBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isUser ? styles.userMessageText : styles.agentMessageText,
                        ]}
                      >
                        {msg.text}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.messageTime,
                        isUser ? styles.userTime : styles.agentTime,
                      ]}
                    >
                      {msg.time}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            {/* Input Row */}
            <View style={styles.chatInputRow}>
              <Pressable style={styles.clipBtn} onPress={() => Alert.alert('Attachment', 'Attach image or file.')}>
                <SymbolView
                  name={{ ios: 'paperclip', android: 'attach_file', web: 'attach_file' }}
                  tintColor="#64748b"
                  size={20}
                />
              </Pressable>

              <TextInput
                style={styles.chatTextInput}
                placeholder="Type a message..."
                placeholderTextColor="#94a3b8"
                value={chatInputText}
                onChangeText={setChatInputText}
              />

              <Pressable
                onPress={handleSendChatMessage}
                disabled={isSendingChat || !chatInputText.trim()}
                style={({ pressed }) => [
                  styles.sendBtn,
                  pressed && styles.sendBtnPressed,
                  (!chatInputText.trim()) && styles.sendBtnDisabled,
                ]}
              >
                <SymbolView
                  name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
                  tintColor="#ffffff"
                  size={16}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  civicBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  civicBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#d97706',
    letterSpacing: 1,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#F8F9FC',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#0f172a',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  searchBox: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '500',
    outlineStyle: 'none' as any,
  },
  clearBtn: {
    padding: 2,
  },
  searchBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 20,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  searchBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  unpaidPenaltyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  unpaidInfo: {
    gap: 4,
  },
  unpaidLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  unpaidAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e3a8a',
    letterSpacing: -0.5,
  },
  payDuesBtn: {
    backgroundColor: '#d97706',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  payDuesBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  listContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketNo: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusResolved: {
    backgroundColor: '#f0fdf4',
  },
  statusPending: {
    backgroundColor: '#fff7ed',
  },
  statusNew: {
    backgroundColor: '#eff6ff',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  statusTextResolved: {
    color: '#16803d',
  },
  statusTextPending: {
    color: '#c2410c',
  },
  statusTextNew: {
    color: '#2563eb',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
  },
  metaValueSub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  fineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    marginTop: 2,
  },
  fineLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  fineAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  cleanRecordCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  cleanRecordTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16803d',
  },
  cleanRecordSub: {
    fontSize: 12,
    color: '#15803d',
    textAlign: 'center',
    fontWeight: '500',
  },
  lookupSection: {
    gap: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  fabPressed: {
    transform: [{ scale: 0.94 }],
  },
  fabBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#d97706',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  chatModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '80%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  chatModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  chatHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  onlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  closeBtn: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messageBubbleWrapper: {
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  agentBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  agentMessageText: {
    color: '#334155',
  },
  userMessageText: {
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '600',
  },
  agentTime: {
    alignSelf: 'flex-start',
    paddingLeft: 4,
  },
  userTime: {
    alignSelf: 'flex-end',
    paddingRight: 4,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  clipBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '500',
    outlineStyle: 'none' as any,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnPressed: {
    backgroundColor: '#1d4ed8',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
