import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { AnnouncementItem } from '@/constants/announcements';

interface AnnouncementDetailModalProps {
  announcement: AnnouncementItem | null;
  visible: boolean;
  onClose: () => void;
}

export const AnnouncementDetailModal: React.FC<AnnouncementDetailModalProps> = ({
  announcement,
  visible,
  onClose,
}) => {
  const [copyFeedback, setCopyFeedback] = useState(false);

  if (!announcement) return null;

  const isUrgent = announcement.urgency === 'urgent';
  const isPriority = announcement.urgency === 'priority';

  const handleCopyRef = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(announcement.refNumber);
    }
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  const handleShare = async () => {
    try {
      const shareMessage = `[Official TMU Announcement] ${announcement.refNumber}\n\n${announcement.title}\n\nSummary: ${announcement.summary}\n\nKey Directives:\n${announcement.keyDirectives.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nIssuing Office: ${announcement.issuingOffice}\nDate: ${announcement.date}`;
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(shareMessage);
          Alert.alert('Announcement Copied', 'Full announcement details copied to clipboard ready to share.');
        } else {
          Alert.alert('Announcement Shared', 'Reference: ' + announcement.refNumber);
        }
      } else {
        await Share.share({
          title: announcement.title,
          message: shareMessage,
        });
      }
    } catch {
      // Ignored
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Top Bar Header */}
          <View style={styles.modalTopBar}>
            <View style={styles.modalCategoryGroup}>
              <View
                style={[
                  styles.urgencyDot,
                  isUrgent && styles.urgencyDotUrgent,
                  isPriority && styles.urgencyDotPriority,
                ]}
              />
              <Text style={styles.modalCategoryText}>
                {announcement.badgeLabel}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            >
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                tintColor="#64748b"
                size={18}
              />
            </Pressable>
          </View>

          {/* Scrollable Document Container */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Government Official Letterhead */}
            <View style={styles.letterhead}>
              <View style={styles.sealRow}>
                <View style={styles.sealCircle}>
                  <SymbolView
                    name={{ ios: 'shield.fill', android: 'shield', web: 'shield' }}
                    tintColor="#1e3a8a"
                    size={20}
                  />
                </View>
                <View style={styles.letterheadTexts}>
                  <Text style={styles.republicText}>Republic of the Philippines</Text>
                  <Text style={styles.cityText}>CITY OF ROXAS • PROVINCE OF CAPIZ</Text>
                  <Text style={styles.agencyText}>TRAFFIC MANAGEMENT UNIT (TMU)</Text>
                </View>
              </View>

              <View style={styles.letterheadDivider} />

              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaLabel}>REFERENCE CODE</Text>
                  <Pressable onPress={handleCopyRef} style={styles.refClickable}>
                    <Text style={styles.metaRefValue}>{announcement.refNumber}</Text>
                    <SymbolView
                      name={{ ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }}
                      tintColor="#2563eb"
                      size={12}
                    />
                  </Pressable>
                  {copyFeedback && (
                    <Text style={styles.copyFeedbackText}>✓ Copied to clipboard</Text>
                  )}
                </View>

                <View style={styles.metaRight}>
                  <Text style={styles.metaLabel}>DATE OF ISSUANCE</Text>
                  <Text style={styles.metaValue}>{announcement.date}</Text>
                </View>
              </View>
            </View>

            {/* Document Title */}
            <View style={styles.titleSection}>
              <View style={styles.statusPillRow}>
                <View
                  style={[
                    styles.statusPill,
                    isUrgent
                      ? styles.statusPillUrgent
                      : isPriority
                      ? styles.statusPillPriority
                      : styles.statusPillRoutine,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isUrgent
                        ? styles.statusPillTextUrgent
                        : isPriority
                        ? styles.statusPillTextPriority
                        : styles.statusPillTextRoutine,
                    ]}
                  >
                    {announcement.urgency.toUpperCase()} PRIORITY
                  </Text>
                </View>

                {announcement.effectiveDate && (
                  <View style={styles.effectivePill}>
                    <Text style={styles.effectivePillText}>
                      Effective: {announcement.effectiveDate}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.docTitle}>{announcement.title}</Text>
            </View>

            {/* Legal Basis Callout */}
            {announcement.legalBasis && (
              <View style={styles.legalBasisCard}>
                <View style={styles.legalIconBadge}>
                  <SymbolView
                    name={{ ios: 'book.closed.fill', android: 'menu_book', web: 'menu_book' }}
                    tintColor="#1e40af"
                    size={16}
                  />
                </View>
                <View style={styles.legalTextWrap}>
                  <Text style={styles.legalTitle}>Statutory & Legal Basis</Text>
                  <Text style={styles.legalContent}>{announcement.legalBasis}</Text>
                </View>
              </View>
            )}

            {/* Executive Summary */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>I. SUMMARY & CONTEXT</Text>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryBody}>{announcement.summary}</Text>
              </View>
            </View>

            {/* Key Directives */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>II. MANDATORY DIRECTIVES & PROVISIONS</Text>
              <View style={styles.directivesList}>
                {announcement.keyDirectives.map((directive, index) => (
                  <View key={index} style={styles.directiveItem}>
                    <View style={styles.directiveNumberBadge}>
                      <Text style={styles.directiveNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.directiveText}>{directive}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Issuing Office & Official Signatories */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>III. ATTESTATION & SIGNATORIES</Text>
              <View style={styles.officeBox}>
                <Text style={styles.officeLabel}>ISSUING AUTHORITY</Text>
                <Text style={styles.officeName}>{announcement.issuingOffice}</Text>
              </View>

              <View style={styles.signatoriesGrid}>
                {announcement.signatories.map((sig, idx) => (
                  <View key={idx} style={styles.signatoryCard}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatoryName}>{sig.name}</Text>
                    <Text style={styles.signatoryTitle}>{sig.title}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.verificationSealRow}>
              <SymbolView
                name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                tintColor="#059669"
                size={18}
              />
              <Text style={styles.verificationSealText}>
                Official Digital Publication verified by City TMU Central Dispatch
              </Text>
            </View>
          </ScrollView>

          {/* Modal Footer Actions */}
          <View style={styles.modalFooter}>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [styles.shareBtn, pressed && styles.shareBtnPressed]}
            >
              <SymbolView
                name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
                tintColor="#2563eb"
                size={16}
              />
              <Text style={styles.shareBtnText}>Share Announcement</Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.dismissBtn, pressed && styles.dismissBtnPressed]}
            >
              <Text style={styles.dismissBtnText}>Close Announcement</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalCategoryGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  urgencyDotUrgent: {
    backgroundColor: '#ef4444',
  },
  urgencyDotPriority: {
    backgroundColor: '#f59e0b',
  },
  modalCategoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: {
    backgroundColor: '#e2e8f0',
  },
  modalScroll: {
    maxHeight: '78%',
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingBottom: 40,
    gap: 18,
  },

  /* Letterhead */
  letterhead: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  sealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sealCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  letterheadTexts: {
    flex: 1,
  },
  republicText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  cityText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  agencyText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1e3a8a',
    letterSpacing: 0.5,
  },
  letterheadDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
  },
  refClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaRefValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyFeedbackText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
  },

  /* Title Section */
  titleSection: {
    gap: 10,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillUrgent: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  statusPillPriority: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  statusPillRoutine: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPillTextUrgent: {
    color: '#dc2626',
  },
  statusPillTextPriority: {
    color: '#d97706',
  },
  statusPillTextRoutine: {
    color: '#2563eb',
  },
  effectivePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  effectivePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  docTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 25,
    letterSpacing: -0.3,
  },

  /* Legal Basis */
  legalBasisCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 10,
  },
  legalIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  legalTextWrap: {
    flex: 1,
  },
  legalTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e40af',
  },
  legalContent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e3a8a',
    lineHeight: 17,
    marginTop: 2,
  },

  /* Sections */
  sectionBlock: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
  },
  summaryBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryBody: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#334155',
    lineHeight: 20,
  },

  /* Directives */
  directivesList: {
    gap: 8,
  },
  directiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  directiveNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  directiveNumberText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  directiveText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 18,
  },

  /* Office & Signatories */
  officeBox: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  officeLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  officeName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  signatoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  signatoryCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  signatureLine: {
    width: 60,
    height: 1,
    backgroundColor: '#94a3b8',
    marginBottom: 8,
    marginTop: 4,
  },
  signatoryName: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  signatoryTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
  },

  verificationSealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  verificationSealText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },

  /* Footer */
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    height: 44,
    borderRadius: 12,
    gap: 8,
  },
  shareBtnPressed: {
    backgroundColor: '#dbeafe',
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
  },
  dismissBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    height: 44,
    borderRadius: 12,
  },
  dismissBtnPressed: {
    backgroundColor: '#1d4ed8',
  },
  dismissBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
