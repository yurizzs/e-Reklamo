import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

export interface AnnouncementItem {
  id: string;
  type: 'memorandum' | 'announcement' | 'directive';
  badgeLabel: string;
  refNumber: string;
  title: string;
  summary: string;
  issuingOffice: string;
  date: string;
  urgency: 'routine' | 'priority' | 'urgent';
  legalBasis?: string;
  keyDirectives: string[];
  signatories: { name: string; title: string }[];
}

export const OFFICIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'memo-2026-10-094',
    type: 'memorandum',
    badgeLabel: 'OFFICIAL MEMORANDUM',
    refNumber: 'TMU-MC-2026-10-094',
    title: 'Strict Enforcement of Approved Tricycle Fare Matrix & Mandatory Fare Card Display',
    summary:
      'Directing all motorized tricycle operators and transport cooperatives to strictly adhere to the ₱15.00 base fare and grant the mandatory 20% discount to Students, Senior Citizens, and PWDs.',
    issuingOffice: 'Office of the City Mayor & Traffic Management Unit (TMU)',
    date: 'October 07, 2026',
    urgency: 'priority',
    legalBasis: 'Roxas City Ordinance No. 024-2024 & Municipal Transportation Code',
    keyDirectives: [
      'All franchised tricycle units must visibly install the laminated 2026 Fare Matrix inside the passenger cabin.',
      'Base passenger fare is strictly capped at ₱15.00 for the first two (2) kilometers.',
      'Mandatory twenty percent (20%) discount (₱10.00 base fare) must be honored for Students, Senior Citizens, and PWDs upon presentation of valid ID.',
      'Overcharging fines will be strictly enforced: ₱500.00 for 1st offense, ₱1,000.00 for 2nd offense, and franchise suspension on 3rd offense.',
    ],
    signatories: [
      { name: 'Engr. Arnel M. Del Rosario', title: 'TMU Operations Directorate Specialist' },
      { name: 'P/Supt. Rodrigo M. Valdez', title: 'Traffic Enforcement Commander' },
      { name: 'Hon. City Mayor', title: 'Office of the City Chief Executive' },
    ],
  },
  {
    id: 'pa-2026-102',
    type: 'announcement',
    badgeLabel: 'PUBLIC ADVISORY',
    refNumber: 'PA-TMU-2026-102',
    title: 'Temporary Road Maintenance & Rerouting Advisory along Roxas Blvd Sector 2',
    summary:
      'Road rehabilitation and drainage culvert enhancement begins along Roxas Blvd starting Nov 12. Motorists and commuters are advised to follow the designated Sector 4 bypass.',
    issuingOffice: 'TMU Public Information Desk & DPWH Engineering Taskforce',
    date: 'October 05, 2026',
    urgency: 'routine',
    legalBasis: 'City Executive Order No. 44-2026 on Infrastructure Safety Measures',
    keyDirectives: [
      'Heavy freight and passenger utility vehicles are redirected toward Sector 4 bypass corridor between 06:30 AM and 08:30 PM.',
      'Dedicated TMU field traffic enforcers will be stationed at Checkpoint Alpha and Checkpoint Beta to assist commuters.',
      'Tricycle terminal pick-up points on Sector 2 East are temporarily moved 100 meters northward near Central Plaza.',
    ],
    signatories: [
      { name: 'Capt. Nelson G. Borja', title: 'Field Operations & Dispatch Lead' },
      { name: 'TMU Command Center', title: 'Civic Grievances & Enforcement Bureau' },
    ],
  },
  {
    id: 'jrd-2026-04',
    type: 'directive',
    badgeLabel: 'REGULATORY DIRECTIVE',
    refNumber: 'JRD-TRB-TMU-2026-04',
    title: 'Joint TMU-TRB Q4 Tricycle Franchise Validation & Driver Courtesy Audit',
    summary:
      'Mandatory roadside verification of franchise registration stickers, driver uniform compliance (closed shoes and ID), and passenger refusal monitoring.',
    issuingOffice: 'Tricycle Regulatory Board (TRB) & TMU Enforcement Division',
    date: 'September 28, 2026',
    urgency: 'priority',
    legalBasis: 'Municipal Traffic Safety & Commuter Protection Act',
    keyDirectives: [
      'Refusal to convey passengers without justifiable technical grounds is subject to immediate ₱1,000.00 citation fine.',
      'Franchise renewal grace period closes at the end of the current operations cycle; unrenewed units risk impoundment.',
      'Commuters are strongly urged to report plate numbers and body numbers via the e-Reklamo mobile app for rapid response.',
    ],
    signatories: [
      { name: 'Atty. Cristina R. Alcantara', title: 'TRB Board Chairperson' },
      { name: 'TMU Legal & Adjudication Unit', title: 'Public Transportation Oversight' },
    ],
  },
];

export interface PublicAnnouncementsProps {
  variant?: 'home' | 'standalone';
  searchQuery?: string;
}

export const PublicAnnouncements: React.FC<PublicAnnouncementsProps> = ({
  variant = 'home',
  searchQuery = '',
}) => {
  const router = useRouter();

  const [announcements] = useState<AnnouncementItem[]>(OFFICIAL_ANNOUNCEMENTS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'memorandum' | 'announcement' | 'directive'>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  const filteredItems = announcements.filter((item) => {
    if (activeFilter === 'memorandum' && item.type !== 'memorandum') return false;
    if (activeFilter === 'announcement' && item.type !== 'announcement') return false;
    if (activeFilter === 'directive' && item.type !== 'directive') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchRef = item.refNumber.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      const matchOffice = item.issuingOffice.toLowerCase().includes(q);
      return matchTitle || matchRef || matchSummary || matchOffice;
    }

    return true;
  });

  const displayedItems = variant === 'home' ? filteredItems.slice(0, 3) : filteredItems;

  return (
    <View style={styles.container}>
      {/* Section Header with WIP UI Tag & Staff Action */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleGroup}>
          <View style={styles.iconBadge}>
            <SymbolView
              name={{ ios: 'megaphone.fill', android: 'campaign', web: 'campaign' }}
              tintColor="#2563eb"
              size={18}
            />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.sectionTitle}>
                {variant === 'home' ? 'Public Announcements' : 'Announcements Archive'}
              </Text>
              <View style={styles.wipBadge}>
                <Text style={styles.wipBadgeText}>WIP</Text>
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>
              Official memoranda, fare directives & city advisories
            </Text>
          </View>
        </View>

        {/* View All Archive Button for Home Variant */}
        {variant === 'home' && (
          <Pressable
            onPress={() => router.push('/announcements' as any)}
            style={({ pressed }) => [
              styles.viewAllArchiveBtn,
              pressed && styles.viewAllArchiveBtnPressed,
            ]}
          >
            <Text style={styles.viewAllArchiveText}>All ({announcements.length})</Text>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              tintColor="#2563eb"
              size={12}
            />
          </Pressable>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setActiveFilter('all')}
          style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
            All ({filteredItems.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('memorandum')}
          style={[styles.filterChip, activeFilter === 'memorandum' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, activeFilter === 'memorandum' && styles.filterTextActive]}>
            Memoranda
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('announcement')}
          style={[styles.filterChip, activeFilter === 'announcement' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, activeFilter === 'announcement' && styles.filterTextActive]}>
            Advisories
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('directive')}
          style={[styles.filterChip, activeFilter === 'directive' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, activeFilter === 'directive' && styles.filterTextActive]}>
            Directives
          </Text>
        </Pressable>
      </View>

      {/* Cards List */}
      <View style={styles.cardsList}>
        {displayedItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <SymbolView
              name={{ ios: 'tray.fill', android: 'inbox', web: 'inbox' }}
              tintColor="#94a3b8"
              size={32}
            />
            <Text style={styles.emptyTitle}>No matching circulars found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search terms or filter selection.</Text>
            {activeFilter !== 'all' && (
              <Pressable
                onPress={() => setActiveFilter('all')}
                style={styles.clearFilterBtn}
              >
                <Text style={styles.clearFilterBtnText}>Reset Filter</Text>
              </Pressable>
            )}
          </View>
        ) : (
          displayedItems.map((item) => {
            const isMemo = item.type === 'memorandum' || item.type === 'directive';
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedAnnouncement(item)}
                style={({ pressed }) => [
                  styles.card,
                  isMemo ? styles.memoCardBorder : styles.advisoryCardBorder,
                  pressed && styles.cardPressed,
                ]}
              >
                {/* Card Meta Top Row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.cardBadgeGroup}>
                    <View
                      style={[
                        styles.typeBadge,
                        isMemo ? styles.memoTypeBadge : styles.advisoryTypeBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          isMemo ? styles.memoTypeBadgeText : styles.advisoryTypeBadgeText,
                        ]}
                      >
                        {item.badgeLabel}
                      </Text>
                    </View>
                    <Text style={styles.refText}>{item.refNumber}</Text>
                  </View>

                  <Text style={styles.dateText}>{item.date}</Text>
                </View>

                {/* Card Title & Snippet */}
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSummary} numberOfLines={2}>
                  {item.summary}
                </Text>

                {/* Card Footer Action */}
                <View style={styles.cardFooter}>
                  <View style={styles.officeRow}>
                    <SymbolView
                      name={{ ios: 'building.columns', android: 'account_balance', web: 'account_balance' }}
                      tintColor="#64748b"
                      size={13}
                    />
                    <Text style={styles.officeText} numberOfLines={1}>
                      {item.issuingOffice}
                    </Text>
                  </View>

                  <View style={styles.readMoreBtn}>
                    <Text style={styles.readMoreText}>View Document</Text>
                    <SymbolView
                      name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                      tintColor="#2563eb"
                      size={12}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      {/* Browse Full Archive Footer for Home Variant */}
      {variant === 'home' && announcements.length > 3 && (
        <Pressable
          onPress={() => router.push('/announcements' as any)}
          style={({ pressed }) => [
            styles.browseArchiveFooterBtn,
            pressed && styles.browseArchiveFooterBtnPressed,
          ]}
        >
          <View style={styles.browseArchiveFooterLeft}>
            <View style={styles.browseIconCircle}>
              <SymbolView
                name={{ ios: 'folder.fill', android: 'folder', web: 'folder' }}
                tintColor="#2563eb"
                size={14}
              />
            </View>
            <Text style={styles.browseArchiveFooterText}>
              Explore Full Announcements Archive ({announcements.length} documents)
            </Text>
          </View>
          <SymbolView
            name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
            tintColor="#2563eb"
            size={14}
          />
        </Pressable>
      )}

      {/* Official Memorandum & Announcement Detailed Document Modal */}
      <Modal
        visible={selectedAnnouncement !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAnnouncement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Top Control Bar */}
            <View style={styles.modalControlBar}>
              <View style={styles.modalControlLeft}>
                <View style={styles.modalDocIconBadge}>
                  <SymbolView
                    name={{ ios: 'doc.text.fill', android: 'article', web: 'article' }}
                    tintColor="#2563eb"
                    size={18}
                  />
                </View>
                <View>
                  <View style={styles.modalTitleRow}>
                    <Text style={styles.modalHeaderTitle}>Official City Gazette</Text>
                    <View style={styles.modalWipPill}>
                      <Text style={styles.modalWipPillText}>WIP PREVIEW</Text>
                    </View>
                  </View>
                  <Text style={styles.modalHeaderSubtitle}>Official Municipal Publication</Text>
                </View>
              </View>

              <Pressable
                onPress={() => setSelectedAnnouncement(null)}
                style={styles.modalCloseBtn}
              >
                <SymbolView
                  name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                  tintColor="#94a3b8"
                  size={24}
                />
              </Pressable>
            </View>

            {/* Scrollable Document Container */}
            {selectedAnnouncement && (
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Official White Paper Container */}
                <View style={styles.documentPaper}>
                  {/* Government Official Letterhead */}
                  <View style={styles.letterhead}>
                    <View style={styles.emblemCircle}>
                      <SymbolView
                        name={{ ios: 'shield.fill', android: 'shield', web: 'shield' }}
                        tintColor="#1e3a8a"
                        size={22}
                      />
                    </View>
                    <View style={styles.letterheadTextGroup}>
                      <Text style={styles.repText}>REPUBLIC OF THE PHILIPPINES</Text>
                      <Text style={styles.govText}>CITY GOVERNMENT OF SAN JOSE / ROXAS CITY</Text>
                      <Text style={styles.unitText}>TRAFFIC MANAGEMENT UNIT (TMU)</Text>
                      <Text style={styles.subUnitText}>
                        Operations Directorate • Civic Grievances & Enforcement Bureau
                      </Text>
                    </View>
                  </View>

                  {/* Memorandum Routing Metadata */}
                  <View style={styles.routingBox}>
                    <View style={styles.routingHeaderRow}>
                      <Text style={styles.routingDocNo}>{selectedAnnouncement.refNumber}</Text>
                      <Text style={styles.routingSecurity}>OFFICIAL BUSINESS</Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>TO / FOR:</Text>
                      <Text style={styles.metaValue}>ALL MOTORIZED TRICYCLE OPERATORS & COMMUTING PUBLIC</Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>FROM:</Text>
                      <Text style={styles.metaValue}>{selectedAnnouncement.issuingOffice}</Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>DATE:</Text>
                      <Text style={styles.metaValue}>{selectedAnnouncement.date}</Text>
                    </View>

                    <View style={[styles.metaRow, styles.metaSubjectRow]}>
                      <Text style={styles.metaSubjectLabel}>SUBJECT:</Text>
                      <Text style={styles.metaSubjectValue}>{selectedAnnouncement.title}</Text>
                    </View>
                  </View>

                  {/* Executive Overview Summary */}
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionHeading}>1. EXECUTIVE DIRECTIVE OVERVIEW</Text>
                    <Text style={styles.bodyParagraph}>{selectedAnnouncement.summary}</Text>
                    {selectedAnnouncement.legalBasis && (
                      <View style={styles.legalBox}>
                        <Text style={styles.legalLabel}>Legal Reference / Ordinance:</Text>
                        <Text style={styles.legalText}>{selectedAnnouncement.legalBasis}</Text>
                      </View>
                    )}
                  </View>

                  {/* Specific Numbered Action Directives */}
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionHeading}>2. MANDATORY OPERATIONAL GUIDELINES</Text>
                    <View style={styles.directivesList}>
                      {selectedAnnouncement.keyDirectives.map((directive, idx) => (
                        <View key={idx} style={styles.directiveRow}>
                          <View style={styles.numBullet}>
                            <Text style={styles.numBulletText}>{idx + 1}</Text>
                          </View>
                          <Text style={styles.directiveText}>{directive}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Signatories Block */}
                  <View style={styles.signatoriesSection}>
                    <Text style={styles.sectionHeading}>3. CERTIFICATION & ISSUING AUTHORITY</Text>
                    <View style={styles.signatoriesGrid}>
                      {selectedAnnouncement.signatories.map((sig, idx) => (
                        <View key={idx} style={styles.signatoryItem}>
                          <View style={styles.sigLine} />
                          <Text style={styles.sigName}>{sig.name}</Text>
                          <Text style={styles.sigTitle}>{sig.title}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Official Footer Verification Stamp */}
                  <View style={styles.docFooter}>
                    <Text style={styles.docFooterText}>
                      AUTHENTICATED BY E-REKLAMO MUNICIPAL COMMAND SYSTEM
                    </Text>
                    <Text style={styles.docFooterSub}>
                      DOCUMENT CODE: {selectedAnnouncement.refNumber} • OFFICIAL CITIZEN COPY
                    </Text>
                  </View>
                </View>

                {/* Staging WIP Notice Card */}
                <View style={styles.wipNoticeCard}>
                  <SymbolView
                    name={{ ios: 'info.circle.fill', android: 'info', web: 'info' }}
                    tintColor="#d97706"
                    size={16}
                  />
                  <Text style={styles.wipNoticeText}>
                    <Text style={{ fontWeight: '800' }}>Work In Progress (WIP): </Text>
                    Direct Push Broadcasts, SMS Emergency alerts, and PDF Gazette downloads are currently in staging for the next mobile release.
                  </Text>
                </View>

                {/* File a Complaint Action Shortcut */}
                {selectedAnnouncement.type === 'memorandum' && (
                  <Pressable
                    onPress={() => {
                      setSelectedAnnouncement(null);
                      router.push('/complaint-form' as any);
                    }}
                    style={styles.fileComplaintShortcut}
                  >
                    <SymbolView
                      name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }}
                      tintColor="#ffffff"
                      size={16}
                    />
                    <Text style={styles.fileComplaintShortcutText}>
                      Report a Violation of this Memorandum
                    </Text>
                  </Pressable>
                )}
              </ScrollView>
            )}

            {/* Modal Bottom Footer */}
            <View style={styles.modalFooterBar}>
              <Pressable
                onPress={() => setSelectedAnnouncement(null)}
                style={styles.modalDoneBtn}
              >
                <Text style={styles.modalDoneBtnText}>Dismiss & Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  wipBadge: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  wipBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#b45309',
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  cardsList: {
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  memoCardBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  advisoryCardBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#d97706',
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  memoTypeBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  advisoryTypeBadge: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  typeBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  memoTypeBadgeText: {
    color: '#1d4ed8',
  },
  advisoryTypeBadgeText: {
    color: '#b45309',
  },
  refText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#64748b',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  cardSummary: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    fontWeight: '400',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 2,
  },
  officeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  officeText: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
  },

  /* Detailed Document Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 11, 20, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalControlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalDocIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalWipPill: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalWipPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fcd34d',
    letterSpacing: 0.8,
  },
  modalHeaderSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: '80%',
  },
  modalScrollContent: {
    padding: 16,
    gap: 14,
  },
  documentPaper: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  letterhead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
  },
  emblemCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
  },
  letterheadTextGroup: {
    flex: 1,
  },
  repText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 1.5,
  },
  govText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  unitText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: 0.5,
  },
  subUnitText: {
    fontSize: 8.5,
    color: '#64748b',
    marginTop: 1,
  },
  routingBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  routingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 4,
  },
  routingDocNo: {
    fontSize: 9.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
    color: '#0f172a',
  },
  routingSecurity: {
    fontSize: 8.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaLabel: {
    width: 64,
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  metaValue: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: '#1e293b',
  },
  metaSubjectRow: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  metaSubjectLabel: {
    width: 64,
    fontSize: 10,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  metaSubjectValue: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 14,
  },
  sectionBlock: {
    gap: 6,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  bodyParagraph: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 17,
    textAlign: 'justify',
  },
  legalBox: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  legalLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1d4ed8',
    textTransform: 'uppercase',
  },
  legalText: {
    fontSize: 10.5,
    color: '#1e3a8a',
    fontWeight: '600',
    marginTop: 1,
  },
  directivesList: {
    gap: 8,
    marginTop: 4,
  },
  directiveRow: {
    flexDirection: 'row',
    gap: 10,
  },
  numBullet: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  numBulletText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#ffffff',
  },
  directiveText: {
    flex: 1,
    fontSize: 11,
    color: '#1e293b',
    lineHeight: 16,
    fontWeight: '500',
  },
  signatoriesSection: {
    gap: 10,
    paddingTop: 8,
  },
  signatoriesGrid: {
    gap: 14,
  },
  signatoryItem: {
    gap: 2,
  },
  sigLine: {
    height: 1,
    backgroundColor: '#0f172a',
    width: '60%',
    marginBottom: 4,
  },
  sigName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  sigTitle: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '500',
  },
  docFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    gap: 2,
  },
  docFooterText: {
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#64748b',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  docFooterSub: {
    fontSize: 7.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#94a3b8',
  },
  wipNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    borderRadius: 12,
    padding: 12,
  },
  wipNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#fcd34d',
    lineHeight: 15,
  },
  fileComplaintShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  fileComplaintShortcutText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalFooterBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  modalDoneBtn: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  viewAllArchiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    borderRadius: 10,
  },
  viewAllArchiveBtnPressed: {
    opacity: 0.8,
  },
  viewAllArchiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  clearFilterBtn: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
  },
  clearFilterBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  browseArchiveFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  browseArchiveFooterBtnPressed: {
    backgroundColor: '#f8faff',
  },
  browseArchiveFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  browseIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseArchiveFooterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e3a8a',
    flex: 1,
  },
});
