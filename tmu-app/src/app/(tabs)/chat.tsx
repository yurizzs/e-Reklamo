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
  const isOperator = currentUser.role === 'operator' || currentUser.role === 'admin';

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
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const token = authStore.getToken() || undefined;

  const loadBackendMessages = async (convId: number) => {
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
      // Offline fallback
    }
  };

  useEffect(() => {
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
          await loadBackendMessages(targetConvId);
        }
      } catch (err) {
        console.warn("Silent chat init:", err);
      }
    };

    initChat();

    pollInterval = setInterval(() => {
      if (isMounted) {
        loadBackendMessages(conversationId);
      }
    }, 3000);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [conversationId]);

  const handleSend = async () => {
    const textToSend = inputText.trim();
    if (!textToSend) return;

    const userMsg = {
      id: Date.now(),
      sender_type: isOperator ? 'employee' : 'user',
      sender_name: `${currentUser.first_name} ${currentUser.last_name}`,
      text: textToSend,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    try {
      const senderName = `${currentUser.first_name} ${currentUser.last_name}`;
      const senderRole = currentUser.role || (isOperator ? 'operator' : 'citizen');
      const sendRes = await apiService.sendChatMessage(conversationId, textToSend, token, senderName, senderRole);

      if (sendRes?.data?.conversation_id && sendRes.data.conversation_id !== conversationId) {
        setConversationId(sendRes.data.conversation_id);
      }
      
      setTimeout(() => {
        loadBackendMessages(sendRes?.data?.conversation_id || conversationId);
      }, 800);
    } catch {
      // Offline mock response
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
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.chatAvatar}>
            <Text style={styles.chatAvatarText}>OP</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>
              {isOperator ? 'Operator Dispatch Chat' : 'TMU Agent #304'}
            </Text>
            <View style={styles.onlineBadgeRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>

        {isOperator && (
          <View style={styles.opBadge}>
            <Text style={styles.opBadgeText}>DUTY OPERATOR</Text>
          </View>
        )}
      </View>

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
  opBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  opBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#2563eb',
  },
  chatScroll: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
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
