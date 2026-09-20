import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { apiService } from '@/services/api';
import { authStore } from '@/services/auth-store';

export default function ChatScreen() {
  const currentUser = authStore.getUser();
  const isOperator = currentUser?.role === 'operator' || currentUser?.role === 'admin';
  const fullName = `${currentUser?.first_name || 'Citizen'} ${currentUser?.last_name || ''}`.trim();

  const [conversationId, setConversationId] = useState<number>(0);
  const [messages, setMessages] = useState<Array<{ id: number; sender_type: string; sender_name: string; text: string; time: string }>>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const conversationIdRef = useRef<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const token = authStore.getToken() || undefined;

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const getWelcomeMessage = (name: string) => ({
    id: 99999,
    sender_type: 'employee',
    sender_name: 'TMU Agent',
    text: `Hello ${name || 'Citizen'}! 👋 Welcome to TMU Live Support. How can we assist you with traffic inquiries or report follow-ups today?`,
    time: 'Just now',
  });

  const loadBackendMessages = async (convId: number) => {
    if (!convId || convId <= 0) return;
    try {
      const res = await apiService.fetchMessages(convId, token);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((m: any) => {
          let sType = m.sender_type;
          if (!sType) {
            sType = (m.sender_role === 'citizen' || m.sender_role === 'user') ? 'user' : 'employee';
          }
          return {
            id: m.id,
            sender_type: sType,
            sender_name: m.sender_name || (sType === 'user' ? fullName : 'TMU Agent'),
            text: m.message_text,
            time: m.time_formatted || 'Just now',
          };
        });
        setMessages(mapped);
      } else {
        setMessages([getWelcomeMessage(currentUser?.first_name || 'Citizen')]);
      }
    } catch {
      setMessages([getWelcomeMessage(currentUser?.first_name || 'Citizen')]);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let pollInterval: any = null;

    const checkAndFetchChat = async () => {
      if (!isMounted) return;

      const currentId = conversationIdRef.current;
      if (currentId > 0) {
        await loadBackendMessages(currentId);
      } else {
        try {
          const convRes = await apiService.fetchConversations(token, fullName);
          if (convRes.success && Array.isArray(convRes.data) && convRes.data.length > 0) {
            const userConv = convRes.data[0];
            if (isMounted && userConv?.id) {
              setConversationId(userConv.id);
              conversationIdRef.current = userConv.id;
              await loadBackendMessages(userConv.id);
            }
          }
        } catch {}
      }
    };

    checkAndFetchChat();

    pollInterval = setInterval(() => {
      if (isMounted) {
        checkAndFetchChat();
      }
    }, 3000);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [currentUser?.username, currentUser?.id, token, fullName]);

  const handleSend = async () => {
    const textToSend = inputText.trim();
    if (!textToSend) return;

    const userMsg = {
      id: Date.now(),
      sender_type: isOperator ? 'employee' : 'user',
      sender_name: fullName,
      text: textToSend,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    try {
      const senderRole = currentUser?.role || (isOperator ? 'operator' : 'citizen');
      const sendRes = await apiService.sendChatMessage(conversationId, textToSend, token, fullName, senderRole);

      const returnedConvId = sendRes?.data?.conversation_id || sendRes?.data?.message?.conversation_id;
      if (returnedConvId) {
        if (returnedConvId !== conversationId) {
          setConversationId(returnedConvId);
        }
        conversationIdRef.current = returnedConvId;
        setTimeout(() => loadBackendMessages(returnedConvId), 300);
      } else if (conversationId > 0) {
        setTimeout(() => loadBackendMessages(conversationId), 300);
      }
    } catch {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender_type: 'employee',
            sender_name: 'TMU Agent',
            text: "Thank you for sending your message. Our duty operator has received it.",
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          },
        ]);
      }, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.chatAvatar}>
            <Text style={styles.chatAvatarText}>OP</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>
              {isOperator ? 'Operator Dispatch Chat' : 'TMU Duty Agent'}
            </Text>
            <View style={styles.onlineBadgeRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.onlineText}>Online & Active</Text>
            </View>
          </View>
        </View>

        {isOperator && (
          <View style={styles.opBadge}>
            <Text style={styles.opBadgeText}>DUTY OPERATOR</Text>
          </View>
        )}
      </View>

      {/* Main Chat Scroll Container */}
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.chatScroll}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#2563eb" style={{ marginVertical: 20 }} />
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.sender_type === 'user';
            return (
              <View key={msg.id || idx} style={styles.messageBubbleWrapper}>
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
          })
        )}
      </ScrollView>

      {/* Input Box Row */}
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
          placeholder="Message TMU Duty Officer..."
          placeholderTextColor="#94a3b8"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
        />

        <Pressable
          onPress={handleSend}
          disabled={!inputText.trim()}
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
    gap: 12,
  },
  chatAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  onlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  onlineText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  opBadge: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  opBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
  },
  chatScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  messageBubbleWrapper: {
    marginBottom: 8,
  },
  messageBubble: {
    maxWidth: '84%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  agentMessageText: {
    color: '#1e293b',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 3,
    color: '#94a3b8',
  },
  userTime: {
    alignSelf: 'flex-end',
  },
  agentTime: {
    alignSelf: 'flex-start',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
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
    height: 42,
    backgroundColor: '#f1f5f9',
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0f172a',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnPressed: {
    backgroundColor: '#1d4ed8',
  },
  sendBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
});
