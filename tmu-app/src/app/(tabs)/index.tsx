import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

export default function HomeScreen() {
  const router = useRouter();
  const [isAiModalVisible, setIsAiModalVisible] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your TMU AI Support Assistant. How can I help you today with traffic complaints or regulations?',
    },
  ]);

  const handleSendAiMessage = (queryText?: string) => {
    const textToSend = queryText || aiPrompt.trim();
    if (!textToSend) return;

    // Add user message
    setAiMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setAiPrompt('');

    // Generate intelligent AI response
    setTimeout(() => {
      let reply = 'Thank you for your question. You can file a formal complaint using the "File a Complaint" button on your homepage, or track existing reports under the Track tab.';
      
      const lower = textToSend.toLowerCase();
      if (lower.includes('overcharg') || lower.includes('fare')) {
        lower.includes('overcharg') || lower.includes('fare');
        reply = 'For overcharging complaints, make sure to take note of the driver’s plate number, tricycle body number, location, and the fare amount charged.';
      } else if (lower.includes('route') || lower.includes('devia')) {
        reply = 'Route deviation applies when a public vehicle operates outside its authorized franchise route. You can submit route details in the complaint form.';
      } else if (lower.includes('status') || lower.includes('track')) {
        reply = 'You can check the live status of your reported violations under the "Track Reports" tab in the bottom menu.';
      }

      setAiMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBadge}>
              <Image
                source={require('@/assets/images/react-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.brandTitle}>
                e-<Text style={styles.brandAccent}>Reklamo</Text>
              </Text>
              <Text style={styles.brandSubtitle}>TRAFFIC MANAGEMENT UNIT</Text>
            </View>
          </View>

          <View style={styles.onlineBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.onlineText}>ONLINE</Text>
          </View>
        </View>

        {/* Hero Quote Card */}
        <View style={styles.quoteCard}>
          <View style={styles.quoteIconWrapper}>
            <SymbolView
              name={{ ios: 'quote.opening', android: 'format_quote', web: 'format_quote' }}
              tintColor="#10b981"
              size={24}
            />
          </View>
          <Text style={styles.quoteText}>
            "Safety on our roads starts with accountability. Report traffic violations easily and help build safer streets for everyone."
          </Text>
          <Text style={styles.quoteAuthor}>— TMU Public Safety Office</Text>
        </View>

        {/* Main Action Callout */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Report an Incident</Text>
          <Text style={styles.ctaSubtitle}>
            Encountered overcharging, route deviation, or reckless driving? Submit an official report directly to TMU operators.
          </Text>

          <Pressable
            onPress={() => router.push('/complaint-form' as any)}
            style={({ pressed }) => [
              styles.fileComplaintBtn,
              pressed && styles.fileComplaintBtnPressed,
            ]}
          >
            <SymbolView
              name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }}
              tintColor="#022c1a"
              size={20}
            />
            <Text style={styles.fileComplaintBtnText}>FILE A COMPLAINT</Text>
          </Pressable>
        </View>

        {/* Quick Access Grid */}
        <Text style={styles.sectionHeader}>QUICK SERVICES</Text>
        <View style={styles.grid}>
          <Pressable
            onPress={() => router.push('/(tabs)/track' as any)}
            style={styles.gridCard}
          >
            <View style={styles.gridIconBadge}>
              <SymbolView
                name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                tintColor="#34d399"
                size={22}
              />
            </View>
            <Text style={styles.gridTitle}>Track Reports</Text>
            <Text style={styles.gridSub}>Check real-time complaint status</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/history' as any)}
            style={styles.gridCard}
          >
            <View style={styles.gridIconBadge}>
              <SymbolView
                name={{ ios: 'clock', android: 'history', web: 'history' }}
                tintColor="#34d399"
                size={22}
              />
            </View>
            <Text style={styles.gridTitle}>Report History</Text>
            <Text style={styles.gridSub}>View past resolved tickets</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* AI Support Floating Action Button (FAB) */}
      <Pressable
        onPress={() => setIsAiModalVisible(true)}
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.fabPressed,
        ]}
      >
        <SymbolView
          name={{ ios: 'sparkles', android: 'smart_toy', web: 'smart_toy' }}
          tintColor="#022c1a"
          size={24}
        />
        <View style={styles.fabBadge} />
      </Pressable>

      {/* AI Support Popup Modal Overlay */}
      <Modal
        visible={isAiModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.aiModalContent}>
            {/* Modal Header */}
            <View style={styles.aiModalHeader}>
              <View style={styles.aiHeaderTitleRow}>
                <View style={styles.aiHeaderIcon}>
                  <SymbolView
                    name={{ ios: 'sparkles', android: 'smart_toy', web: 'smart_toy' }}
                    tintColor="#10b981"
                    size={20}
                  />
                </View>
                <View>
                  <Text style={styles.aiModalTitle}>TMU AI Assistant</Text>
                  <Text style={styles.aiModalSub}>Instant Support & Guide</Text>
                </View>
              </View>

              <Pressable
                onPress={() => setIsAiModalVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            {/* AI Messages List */}
            <ScrollView
              style={styles.messagesContainer}
              contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
            >
              {aiMessages.map((msg, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.messageBubble,
                    msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      msg.sender === 'user' ? styles.userMessageText : styles.aiMessageText,
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Quick Prompt Chips */}
            <View style={styles.quickPromptsRow}>
              <Pressable
                onPress={() => handleSendAiMessage('How do I report fare overcharging?')}
                style={styles.promptChip}
              >
                <Text style={styles.promptChipText}>Overcharging?</Text>
              </Pressable>

              <Pressable
                onPress={() => handleSendAiMessage('How do I track my submitted report?')}
                style={styles.promptChip}
              >
                <Text style={styles.promptChipText}>Track Ticket?</Text>
              </Pressable>
            </View>

            {/* Input Row */}
            <View style={styles.aiInputRow}>
              <TextInput
                style={styles.aiTextInput}
                placeholder="Ask TMU AI Assistant..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={aiPrompt}
                onChangeText={setAiPrompt}
              />
              <Pressable
                onPress={() => handleSendAiMessage()}
                style={styles.aiSendBtn}
              >
                <Text style={styles.aiSendBtnText}>Send</Text>
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
    backgroundColor: '#040c07',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 90,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 26,
    height: 26,
    tintColor: '#10b981',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  brandAccent: {
    color: '#10b981',
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(16, 185, 129, 0.6)',
    letterSpacing: 2,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  onlineText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6ee7b7',
    letterSpacing: 1,
  },
  quoteCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  quoteIconWrapper: {
    alignSelf: 'flex-start',
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 20,
  },
  quoteAuthor: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 1,
    marginTop: 4,
  },
  ctaCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  ctaSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
  },
  fileComplaintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  fileComplaintBtnPressed: {
    backgroundColor: '#059669',
  },
  fileComplaintBtnText: {
    color: '#022c1a',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  gridIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  gridSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },

  /* Floating Action Button (FAB) */
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 9999,
  },
  fabPressed: {
    transform: [{ scale: 0.92 }],
  },
  fabBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34d399',
    borderWidth: 2,
    borderColor: '#040c07',
  },

  /* AI Assistant Modal Overlay */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  aiModalContent: {
    backgroundColor: '#07160d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    height: '75%',
    padding: 20,
    gap: 12,
  },
  aiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.15)',
  },
  aiHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  aiModalSub: {
    fontSize: 11,
    color: '#34d399',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  messagesContainer: {
    flex: 1,
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 14,
    padding: 12,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#10b981',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  aiMessageText: {
    color: '#e2e8f0',
  },
  userMessageText: {
    color: '#022c1a',
    fontWeight: '600',
  },
  quickPromptsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promptChip: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  promptChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6ee7b7',
  },
  aiInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  aiTextInput: {
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
  aiSendBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSendBtnText: {
    color: '#022c1a',
    fontSize: 12,
    fontWeight: '800',
  },
});
