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

  // AI Chatbot State
  const [isChatModalVisible, setIsChatModalVisible] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: number; sender_type: string; sender_name: string; text: string; time: string }>>([
    {
      id: 1,
      sender_type: 'bot',
      sender_name: 'TMU AI Assistant',
      text: `Hello ${currentUser?.first_name || 'Citizen'}! 🤖 I am your 24/7 TMU AI Assistant. Ask me anything about filing complaints, violation penalties, or traffic rules!`,
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  const getAiResponse = (userQuery: string): string => {
    const q = userQuery.toLowerCase();

    if (q.includes('file') || q.includes('report') || q.includes('submit') || q.includes('how to')) {
      return `To file a traffic complaint:\n1. Tap 'File a Complaint' on the Home screen.\n2. Complete your complainant info (Address is required).\n3. Enter the driver/vehicle plate number, color, and location.\n4. Attach up to 3 photo/video evidence items.\n5. Tap Submit to send directly to TMU inspectors!`;
    }

    if (q.includes('penalty') || q.includes('fine') || q.includes('cost') || q.includes('fee') || q.includes('amount')) {
      return `Official TMU Violation Fines:\n• Overcharging Fare: ₱500.00\n• Route Deviation: ₱1,000.00\n• Reckless Driving: ₱1,500.00\n• Obstruction / Illegal Parking: ₱500.00\n\nAll fines are subject to municipal traffic code enforcement.`;
    }

    if (q.includes('evidence') || q.includes('photo') || q.includes('video') || q.includes('proof')) {
      return `Valid Evidence Guidelines:\n• Clear photos or video showing vehicle license plate or body number.\n• Footage demonstrating the violation taking place.\n• Maximum 3 media attachments per complaint.`;
    }

    if (q.includes('human') || q.includes('agent') || q.includes('officer') || q.includes('staff') || q.includes('operator')) {
      return `To chat live with a human TMU officer, tap the 'TMU Agent' tab in the bottom navigation bar!`;
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('good day')) {
      return `Hello ${currentUser?.first_name || 'Citizen'}! How can I assist you today? You can ask about filing complaints, penalty rates, or evidence rules.`;
    }

    return `Thank you for your inquiry regarding "${userQuery}". TMU promotes safe, lawful road transit.\n\n• To submit a report, tap 'File a Complaint'.\n• To message human officers directly, visit the 'TMU Agent' tab at the bottom!`;
  };

  const handleSendMessage = (overrideText?: string) => {
    const textToSend = (overrideText || inputText).trim();
    if (!textToSend) return;

    const userMsg = {
      id: Date.now(),
      sender_type: 'user',
      sender_name: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Citizen',
      text: textToSend,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInputText('');
    setIsSending(true);

    setTimeout(() => {
      const aiReply = {
        id: Date.now() + 1,
        sender_type: 'bot',
        sender_name: 'TMU AI Assistant',
        text: getAiResponse(textToSend),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      };
      setMessages((prev) => [...prev, aiReply]);
      setIsSending(false);
    }, 500);
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
                  name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                  tintColor="#2563eb"
                  size={20}
                />
              </View>
              <View>
                <Text style={styles.fullCardTitle}>TMU AI Assistant</Text>
                <Text style={styles.fullCardSub}>Instant 24/7 AI guidance on traffic rules, fines, & filing reports</Text>
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
          name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
          tintColor="#ffffff"
          size={24}
        />
        <View style={styles.fabBadge}>
          <Text style={styles.fabBadgeText}>AI</Text>
        </View>
      </Pressable>

      {/* TMU AI Assistant Chatbot Modal Popup */}
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
                  <Text style={styles.chatAvatarText}>AI</Text>
                </View>
                <View>
                  <Text style={styles.chatHeaderTitle}>TMU AI Assistant</Text>
                  <View style={styles.onlineBadgeRow}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.onlineText}>Instant 24/7 Support</Text>
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
              {isSending && (
                <View style={styles.messageBubbleWrapper}>
                  <View style={[styles.messageBubble, styles.agentBubble]}>
                    <Text style={styles.agentMessageText}>Thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* AI Quick Prompts Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 4, paddingBottom: 8 }}
            >
              <Pressable
                onPress={() => handleSendMessage('How to file a report?')}
                style={styles.quickPromptChip}
              >
                <Text style={styles.quickPromptText}>📝 How to file a report?</Text>
              </Pressable>
              <Pressable
                onPress={() => handleSendMessage('What are penalty fines?')}
                style={styles.quickPromptChip}
              >
                <Text style={styles.quickPromptText}>💰 Penalty Fines</Text>
              </Pressable>
              <Pressable
                onPress={() => handleSendMessage('What evidence is needed?')}
                style={styles.quickPromptChip}
              >
                <Text style={styles.quickPromptText}>📷 Evidence Rules</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setIsChatModalVisible(false);
                  router.push('/(tabs)/chat' as any);
                }}
                style={[styles.quickPromptChip, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
              >
                <Text style={[styles.quickPromptText, { color: '#2563eb' }]}>👤 Chat with Human Agent</Text>
              </Pressable>
            </ScrollView>

            {/* Input Row */}
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatTextInput}
                placeholder="Ask AI about traffic rules or report steps..."
                placeholderTextColor="#94a3b8"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSendMessage()}
              />

              <Pressable
                onPress={() => handleSendMessage()}
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
  quickPromptChip: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPromptText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
});
