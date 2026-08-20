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
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { apiService } from '@/services/api';
import { authStore } from '@/services/auth-store';

export default function HomeScreen() {
  const router = useRouter();
  const currentUser = authStore.getUser();
  const token = authStore.getToken() || undefined;

  // Chat Modal State
  const [isChatModalVisible, setIsChatModalVisible] = useState(false);
  const [conversationId, setConversationId] = useState<number>(1);
  const [messages, setMessages] = useState<Array<{ id: number; sender_type: string; sender_name: string; text: string; time: string }>>([
    {
      id: 1,
      sender_type: 'employee',
      sender_name: 'TMU Agent #304',
      text: 'Hello John! How can I assist you with your report update today?',
      time: '10:02 AM',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  // Load chat messages
  const loadMessages = async (convId: number) => {
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
        setMessages(mapped);
      }
    } catch {
      // Use fallback/mock messages if backend is offline
    }
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
          await loadMessages(targetConvId);
        }
      } catch (err) {
        console.warn("Chat modal init error:", err);
      }
    };

    initChat();

    pollInterval = setInterval(() => {
      if (isMounted) {
        loadMessages(conversationId);
      }
    }, 3000);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isChatModalVisible, conversationId]);

  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend) return;

    const userMsg = {
      id: Date.now(),
      sender_type: 'user',
      sender_name: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Citizen',
      text: textToSend,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const senderName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Citizen';
      const senderRole = currentUser?.role || 'citizen';
      const sendRes = await apiService.sendChatMessage(conversationId, textToSend, token, senderName, senderRole);

      if (sendRes?.data?.conversation_id && sendRes.data.conversation_id !== conversationId) {
        setConversationId(sendRes.data.conversation_id);
      }
      setTimeout(() => {
        loadMessages(sendRes?.data?.conversation_id || conversationId);
      }, 800);
    } catch {
      // Offline support mock response
      setTimeout(() => {
        setMessages((prev) => [
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
      setIsSending(false);
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
          <Text style={styles.brandTitle}>TMU App</Text>
        </View>

        <View style={styles.civicBadge}>
          <Text style={styles.civicBadgeText}>CIVIC</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Jumbotron Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Road Safety & Enforcement</Text>
          <Text style={styles.heroSubtitle}>
            Report reckless driving and illegal violations directly to local traffic units.
          </Text>

          <Pressable
            onPress={() => router.push('/complaint-form' as any)}
            style={({ pressed }) => [
              styles.fileComplaintBtn,
              pressed && styles.fileComplaintBtnPressed,
            ]}
          >
            <SymbolView
              name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }}
              tintColor="#ffffff"
              size={16}
            />
            <Text style={styles.fileComplaintBtnText}>File a Complaint</Text>
          </Pressable>
        </View>

        {/* Quick Access Section */}
        <View style={styles.quickPortalsSection}>
          <Text style={styles.sectionHeader}>Quick Portals</Text>

          {/* Side by Side Grid Cards */}
          <View style={styles.grid}>
            <Pressable
              onPress={() => router.push('/(tabs)/track' as any)}
              style={styles.gridCard}
            >
              <View style={styles.gridIconBadge}>
                <SymbolView
                  name={{ ios: 'magnifyingglass.circle.fill', android: 'search', web: 'search' }}
                  tintColor="#2563eb"
                  size={24}
                />
              </View>
              <Text style={styles.gridTitle}>Track Reports</Text>
              <Text style={styles.gridSub}>Verify active claims</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/history' as any)}
              style={styles.gridCard}
            >
              <View style={styles.gridIconBadge}>
                <SymbolView
                  name={{ ios: 'doc.text.fill', android: 'article', web: 'article' }}
                  tintColor="#2563eb"
                  size={24}
                />
              </View>
              <Text style={styles.gridTitle}>My History</Text>
              <Text style={styles.gridSub}>Filed records archive</Text>
            </Pressable>
          </View>

          {/* Full-width Direct Chat Portal Card */}
          <Pressable
            onPress={() => setIsChatModalVisible(true)}
            style={styles.fullWidthCard}
          >
            <View style={styles.fullCardLeft}>
              <View style={styles.chatIconBadge}>
                <SymbolView
                  name={{ ios: 'message.fill', android: 'chat', web: 'chat' }}
                  tintColor="#2563eb"
                  size={20}
                />
              </View>
              <View>
                <Text style={styles.fullCardTitle}>Direct Operator Chat</Text>
                <Text style={styles.fullCardSub}>Live support assistance with enforcement personnel</Text>
              </View>
            </View>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              tintColor="#94a3b8"
              size={18}
            />
          </Pressable>
        </View>

        {/* Advisory Warning Alert Banner */}
        <View style={styles.advisoryCard}>
          <View style={styles.advisoryHeader}>
            <SymbolView
              name={{ ios: 'info.circle.fill', android: 'info', web: 'info' }}
              tintColor="#d97706"
              size={18}
              style={styles.advisoryIcon}
            />
            <Text style={styles.advisoryTitle}>Advisory: Road Maintenance</Text>
          </View>
          <Text style={styles.advisoryText}>
            Expect high volume around Roxas Blvd starting Nov 12 due to lane repairs.
          </Text>
        </View>
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
              {messages.map((msg, idx) => {
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
                value={inputText}
                onChangeText={setInputText}
              />

              <Pressable
                onPress={handleSendMessage}
                disabled={isSending || !inputText.trim()}
                style={({ pressed }) => [
                  styles.sendBtn,
                  pressed && styles.sendBtnPressed,
                  (!inputText.trim()) && styles.sendBtnDisabled,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 100,
    gap: 24,
  },
  heroCard: {
    backgroundColor: '#1e3a8a',
    borderRadius: 24,
    padding: 24,
    gap: 12,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
    fontWeight: '500',
  },
  fileComplaintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: '#d97706',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
  },
  fileComplaintBtnPressed: {
    opacity: 0.9,
  },
  fileComplaintBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  quickPortalsSection: {
    gap: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 16,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  gridIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  gridSub: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 14,
    fontWeight: '500',
  },
  fullWidthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  fullCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  chatIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  fullCardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
    maxWidth: '90%',
  },
  advisoryCard: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#d97706',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  advisoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  advisoryIcon: {
    marginTop: 1,
  },
  advisoryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  advisoryText: {
    fontSize: 12,
    color: '#b45309',
    lineHeight: 16,
    fontWeight: '500',
    paddingLeft: 26,
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
