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

export default function HistoryScreen() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'resolved'>('all');
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

  const historyReports = [
    {
      ticketNo: '#TMU-48291',
      title: 'Speeding Bus EDSA Corner',
      category: 'Over-speeding Sign',
      status: 'RESOLVED',
      date: 'Filed: Nov 01, 2026',
    },
    {
      ticketNo: '#TMU-49122',
      title: 'Illegal U-turn on Makati Ave',
      category: 'Reckless Turn',
      status: 'PENDING',
      date: 'Filed: Nov 05, 2026',
    },
    {
      ticketNo: '#TMU-50119',
      title: 'Blocked Pedestrian Crossing',
      category: 'Obstruction',
      status: 'NEW',
      date: 'Filed: Today',
    },
  ];

  // Filtering reports
  const filteredReports = historyReports.filter((report) => {
    if (activeFilter === 'pending') return report.status === 'PENDING' || report.status === 'NEW';
    if (activeFilter === 'resolved') return report.status === 'RESOLVED';
    return true;
  });

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
        console.warn("Chat init warning in history:", err);
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
          <Text style={styles.brandTitle}>Report Ledger</Text>
        </View>

        <View style={styles.civicBadge}>
          <Text style={styles.civicBadgeText}>CIVIC</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabItem, activeFilter === 'all' && styles.tabItemActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.tabText, activeFilter === 'all' && styles.tabTextActive]}>
            All Submissions
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, activeFilter === 'pending' && styles.tabItemActive]}
          onPress={() => setActiveFilter('pending')}
        >
          <Text style={[styles.tabText, activeFilter === 'pending' && styles.tabTextActive]}>
            Pending Approval
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, activeFilter === 'resolved' && styles.tabItemActive]}
          onPress={() => setActiveFilter('resolved')}
        >
          <Text style={[styles.tabText, activeFilter === 'resolved' && styles.tabTextActive]}>
            Resolved Case
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredReports.map((report) => {
          const isResolved = report.status === 'RESOLVED';
          const isPending = report.status === 'PENDING';
          const isNew = report.status === 'NEW';

          return (
            <View key={report.ticketNo} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.titleWrapper}>
                  <Text style={styles.ticketTitle}>{report.title}</Text>
                  <Text style={styles.ticketNo}>Case ID: {report.ticketNo}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    isResolved && styles.statusResolved,
                    isPending && styles.statusPending,
                    isNew && styles.statusNew,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isResolved && styles.statusTextResolved,
                      isPending && styles.statusTextPending,
                      isNew && styles.statusTextNew,
                    ]}
                  >
                    {report.status}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>Category: {report.category}</Text>
                <Text style={styles.metaText}>{report.date}</Text>
              </View>
            </View>
          );
        })}
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
  tabBar: {
    height: 48,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#2563eb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleWrapper: {
    flex: 1,
    gap: 4,
  },
  ticketTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  ticketNo: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    fontSize: 11,
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
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
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
