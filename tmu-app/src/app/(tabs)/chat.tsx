import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
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

export default function ChatScreen() {
  const currentUser = authStore.getUser();
  const isOperator = currentUser.role === 'operator' || currentUser.role === 'admin';

  const [conversationId, setConversationId] = useState<number>(1);
  const [messages, setMessages] = useState<Array<{ id: number; sender_type: string; sender_name: string; text: string; time: string }>>([
    {
      id: 1,
      sender_type: 'employee',
      sender_name: 'TMU Duty Helpdesk',
      text: 'Welcome to TMU Direct Support. How can we assist your traffic inquiry today?',
      time: '10:00 AM',
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
          sender_name: m.sender_name || 'TMU Duty Officer',
          text: m.message_text,
          time: m.time_formatted || 'Just now',
        }));
        setMessages(mapped);
      }
    } catch {
      // Keep existing state on network error
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
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Send to Laravel API backend with user name and role
    const senderName = `${currentUser.first_name} ${currentUser.last_name}`;
    const senderRole = currentUser.role || (isOperator ? 'operator' : 'citizen');
    const sendRes = await apiService.sendChatMessage(conversationId, textToSend, token, senderName, senderRole);

    if (sendRes?.data?.conversation_id && sendRes.data.conversation_id !== conversationId) {
      setConversationId(sendRes.data.conversation_id);
    }
    
    // Refresh messages from server
    setTimeout(() => {
      loadBackendMessages(sendRes?.data?.conversation_id || conversationId);
    }, 800);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>
            {isOperator ? 'Operator Dispatch & Peer Chat' : 'Support & Helpdesk Chat'}
          </Text>
          {isOperator && (
            <View style={styles.opBadge}>
              <Text style={styles.opBadgeText}>DUTY OPERATOR</Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSub}>
          {isOperator ? 'Internal Operator Channel • Live Sync' : 'TMU Public Helpdesk • Active'}
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.chatScroll}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#10b981" style={{ marginVertical: 20 }} />
        ) : (
          messages.map((msg) => {
            const isUserMsg = msg.sender_type === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.bubble,
                  isUserMsg ? styles.userBubble : styles.staffBubble,
                ]}
              >
                <Text style={styles.senderLabel}>{msg.sender_name}</Text>
                <Text style={[styles.msgText, isUserMsg ? styles.userMsgText : styles.staffMsgText]}>
                  {msg.text}
                </Text>
                <Text style={styles.timeText}>{msg.time}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={isOperator ? "Broadcast message to duty operators..." : "Type message to TMU support..."}
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          value={inputText}
          onChangeText={setInputText}
        />
        <Pressable onPress={handleSend} style={styles.sendBtn}>
          <Text style={styles.sendBtnText}>Send</Text>
        </Pressable>
      </View>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  opBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  opBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
  },
  headerSub: {
    fontSize: 11,
    color: '#34d399',
    marginTop: 2,
  },
  chatScroll: {
    padding: 16,
    gap: 12,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  staffBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#10b981',
  },
  senderLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  staffMsgText: {
    color: '#ffffff',
  },
  userMsgText: {
    color: '#022c1a',
    fontWeight: '600',
  },
  timeText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.4)',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.15)',
  },
  input: {
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
  sendBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#022c1a',
    fontSize: 12,
    fontWeight: '800',
  },
});
