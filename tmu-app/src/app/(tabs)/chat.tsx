import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const [messages, setMessages] = useState<Array<{ id: number; sender: 'ai' | 'operator' | 'user'; text: string; time: string }>>([
    { id: 1, sender: 'ai', text: 'Welcome to TMU Direct Support. How can we assist your traffic inquiry today?', time: '10:00 AM' },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    const userMsg = { id: Date.now(), sender: 'user' as const, text: inputText.trim(), time: 'Just now' };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'operator', text: 'Thank you for reaching out. A TMU duty operator is reviewing your message.', time: 'Just now' },
      ]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support & Operator Chat</Text>
        <Text style={styles.headerSub}>TMU Helpdesk • Active</Text>
      </View>

      <ScrollView contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.sender === 'user' ? styles.userBubble : styles.staffBubble,
            ]}
          >
            <Text style={styles.senderLabel}>
              {msg.sender === 'user' ? 'You' : msg.sender === 'ai' ? 'TMU AI Bot' : 'TMU Duty Officer'}
            </Text>
            <Text style={[styles.msgText, msg.sender === 'user' ? styles.userMsgText : styles.staffMsgText]}>
              {msg.text}
            </Text>
            <Text style={styles.timeText}>{msg.time}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type message to TMU support..."
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
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
