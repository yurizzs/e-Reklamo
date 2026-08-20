import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { authStore } from '@/services/auth-store';
import { apiService } from '@/services/api';

interface CategoryOption {
  id: string;
  name: string;
  code: string;
}

const VIOLATION_CATEGORIES: CategoryOption[] = [
  { id: '1', name: 'Reckless Driving (Aggressive lane splitting)', code: 'RECKLESS' },
  { id: '2', name: 'Speeding', code: 'SPEEDING' },
  { id: '3', name: 'Overcharging Fare', code: 'OVERCHARGE' },
  { id: '4', name: 'Route Deviation', code: 'DEVIATION' },
];

interface EvidenceItem {
  uri: string;
  type: 'image' | 'video';
  name?: string;
}

export default function ComplaintFormScreen() {
  const router = useRouter();
  const currentUser = authStore.getUser();

  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption>(VIOLATION_CATEGORIES[0]);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isMediaSourceModalVisible, setIsMediaSourceModalVisible] = useState(false);
  const [driverFirstName, setDriverFirstName] = useState('');
  const [driverLastName, setDriverLastName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [complainantAddress, setComplainantAddress] = useState(currentUser?.address || '');
  const [contactNumber, setContactNumber] = useState(currentUser?.phone || '');

  // Date & Time Picker State
  const [incidentDate, setIncidentDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');

  const [incidentLocation, setIncidentLocation] = useState('');
  const [description, setDescription] = useState('Color: Red');
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }

    if (selectedDate) {
      setIncidentDate(selectedDate);
      if (Platform.OS === 'android' && datePickerMode === 'date') {
        setDatePickerMode('time');
      } else {
        setShowDatePicker(false);
      }
    } else {
      setShowDatePicker(false);
    }
  };

  const openDateTimePicker = (mode: 'date' | 'time' = 'date') => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const handleOpenMediaSourcePicker = () => {
    if (evidenceList.length >= 3) {
      Alert.alert('Limit Reached', 'You can attach a maximum of 3 images or videos.');
      return;
    }
    setIsMediaSourceModalVisible(true);
  };

  const handleLaunchCamera = async (mode: 'photo' | 'video') => {
    setIsMediaSourceModalVisible(false);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to capture evidence.');
        return;
      }

      const mediaType =
        mode === 'video'
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: mediaType,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo = mode === 'video' || asset.type === 'video';
        const newMedia: EvidenceItem = {
          uri: asset.uri,
          type: isVideo ? 'video' : 'image',
          name: asset.fileName || `${mode}_${Date.now()}`,
        };

        setEvidenceList((prev) => [...prev, newMedia].slice(0, 3));
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      Alert.alert('Camera Error', 'Unable to launch camera. Falling back to file selection.');
      handleLaunchGallery();
    }
  };

  const handleLaunchGallery = async () => {
    setIsMediaSourceModalVisible(false);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Library permission is required to select files.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video';
        const newMedia: EvidenceItem = {
          uri: asset.uri,
          type: isVideo ? 'video' : 'image',
          name: asset.fileName || `gallery_${Date.now()}`,
        };

        setEvidenceList((prev) => [...prev, newMedia].slice(0, 3));
      }
    } catch (err) {
      console.warn('Gallery selection error:', err);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setEvidenceList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Complaint title is required.';
    }

    if (!complainantAddress.trim()) {
      newErrors.complainantAddress = 'Address is required.';
    }

    if (!contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required.';
    }

    if (!incidentLocation.trim()) {
      newErrors.incidentLocation = 'Incident location is required.';
    }

    if (!description.trim()) {
      newErrors.description = 'Please provide a detailed description.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const token = authStore.getToken() || undefined;
      const formData = new FormData();

      formData.append('complainant_first_name', currentUser?.first_name || 'Citizen');
      formData.append('complainant_last_name', currentUser?.last_name || 'User');
      formData.append('complainant_address', complainantAddress.trim());
      formData.append('complainant_contact', contactNumber.trim());
      if (driverFirstName.trim()) formData.append('driver_first_name', driverFirstName.trim());
      if (driverLastName.trim()) formData.append('driver_last_name', driverLastName.trim());
      if (plateNumber.trim()) formData.append('plate_number', plateNumber.trim());
      formData.append('category_id', selectedCategory.id);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('incident_date_time', incidentDate.toISOString().slice(0, 19).replace('T', ' '));
      formData.append('incident_location', incidentLocation.trim());
      formData.append('status', 'new');

      evidenceList.forEach((item, index) => {
        const fileExtension = item.uri.split('.').pop() || (item.type === 'video' ? 'mp4' : 'jpg');
        const mimeType = item.type === 'video' ? `video/${fileExtension}` : `image/${fileExtension}`;
        formData.append('evidence[]', {
          uri: item.uri,
          name: item.name || `evidence_${index}.${fileExtension}`,
          type: mimeType,
        } as any);
      });

      await apiService.submitComplaint(formData, token);

      setIsSubmitting(false);
      Alert.alert(
        'Complaint Submitted!',
        'Your report and evidence have been successfully transmitted to the Traffic Management Unit.',
        [
          {
            text: 'Track Report',
            onPress: () => router.replace('/(tabs)/track' as any),
          },
        ]
      );
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Submission Error', err.message || 'Failed to submit complaint. Please check your inputs.');
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const displayName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'John Doe';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Top Header */}
        <View style={styles.topBar}>
          <Pressable onPress={handleGoBack} style={styles.backBtn}>
            <SymbolView
              name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor="#2563eb"
              size={22}
            />
          </Pressable>
          <Text style={styles.topBarTitle}>File Traffic Complaint</Text>
          <View style={styles.civicBadge}>
            <Text style={styles.civicBadgeText}>CIVIC</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Section 1: Complainant Info */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>1. COMPLAINANT INFO</Text>

              {/* Full Name (Prefilled/Disabled Look) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={[styles.inputContainer, styles.disabledInput]}>
                  <TextInput
                    style={[styles.input, styles.disabledInputText]}
                    value={displayName}
                    editable={false}
                  />
                </View>
              </View>

              {/* Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address *</Text>
                <View style={[styles.inputContainer, errors.complainantAddress && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter complete home address"
                    placeholderTextColor="#94a3b8"
                    value={complainantAddress}
                    onChangeText={(t) => {
                      setComplainantAddress(t);
                      if (errors.complainantAddress) setErrors((prev) => ({ ...prev, complainantAddress: '' }));
                    }}
                  />
                </View>
                {!!errors.complainantAddress && <Text style={styles.errorText}>{errors.complainantAddress}</Text>}
              </View>

              {/* Contact Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Number *</Text>
                <View style={[styles.inputContainer, errors.contactNumber && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="+63 917 123 4567"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={contactNumber}
                    onChangeText={(t) => {
                      setContactNumber(t);
                      if (errors.contactNumber) setErrors((prev) => ({ ...prev, contactNumber: '' }));
                    }}
                  />
                </View>
                {!!errors.contactNumber && <Text style={styles.errorText}>{errors.contactNumber}</Text>}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Section 2: Incident Details */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>2. INCIDENT DETAILS</Text>

              {/* Subject Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Subject Title *</Text>
                <View style={[styles.inputContainer, errors.title && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Dangerous Overtaking near Highway"
                    placeholderTextColor="#94a3b8"
                    value={title}
                    onChangeText={(t) => {
                      setTitle(t);
                      if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                    }}
                  />
                </View>
                {!!errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
              </View>

              {/* Violation Category Dropdown Menu */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Violation Category *</Text>
                <Pressable
                  onPress={() => setIsCategoryModalVisible(true)}
                  style={styles.dropdownContainer}
                >
                  <Text style={styles.dropdownSelectedText}>{selectedCategory.name}</Text>
                  <SymbolView
                    name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow_drop_down' }}
                    tintColor="#64748b"
                    size={20}
                  />
                </Pressable>
              </View>

              {/* Driver Plate / Body Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Driver Plate / Body Number</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. ABC 1234"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                    value={plateNumber}
                    onChangeText={setPlateNumber}
                  />
                </View>
              </View>

              {/* Incident Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Incident Location *</Text>
                <View style={[styles.inputContainer, errors.incidentLocation && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Ayala Avenue corner Makati Ave"
                    placeholderTextColor="#94a3b8"
                    value={incidentLocation}
                    onChangeText={(t) => {
                      setIncidentLocation(t);
                      if (errors.incidentLocation) setErrors((prev) => ({ ...prev, incidentLocation: '' }));
                    }}
                  />
                </View>
                {!!errors.incidentLocation && <Text style={styles.errorText}>{errors.incidentLocation}</Text>}
              </View>

              {/* Date & Time Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date & Time *</Text>
                <View style={styles.pickerRow}>
                  <Pressable
                    onPress={() => openDateTimePicker('date')}
                    style={styles.datePickerBtn}
                  >
                    <SymbolView
                      name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                      tintColor="#2563eb"
                      size={18}
                    />
                    <Text style={styles.pickerBtnText}>
                      {incidentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => openDateTimePicker('time')}
                    style={styles.timePickerBtn}
                  >
                    <SymbolView
                      name={{ ios: 'clock.fill', android: 'access_time', web: 'access_time' }}
                      tintColor="#2563eb"
                      size={18}
                    />
                    <Text style={styles.pickerBtnText}>
                      {incidentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </Text>
                  </Pressable>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={incidentDate}
                    mode={datePickerMode}
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                  />
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Section 3: Evidence Upload */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>3. EVIDENCE UPLOAD</Text>
              <Text style={styles.evidenceSubtitle}>
                Upload clear photos or video footage showing vehicle plates/violations. Maximum 3 files.
              </Text>

              {/* Horizontal Upload Row */}
              <View style={styles.uploadRow}>
                {evidenceList.map((item, idx) => (
                  <View key={idx} style={styles.mediaItem}>
                    {item.type === 'image' ? (
                      <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} />
                    ) : (
                      <View style={styles.videoPlaceholder}>
                        <SymbolView
                          name={{ ios: 'video.fill', android: 'videocam', web: 'videocam' }}
                          tintColor="#2563eb"
                          size={24}
                        />
                        <Text style={styles.videoTag}>VIDEO</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => handleRemoveMedia(idx)}
                      style={styles.removeMediaBtn}
                    >
                      <SymbolView
                        name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                        tintColor="#ef4444"
                        size={18}
                      />
                    </Pressable>
                  </View>
                ))}

                {evidenceList.length < 3 && (
                  <Pressable
                    onPress={() => handleLaunchCamera('photo')}
                    style={styles.addMediaSlotBtn}
                  >
                    <SymbolView
                      name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                      tintColor="#2563eb"
                      size={20}
                    />
                    <Text style={styles.addMediaSlotText}>Upload</Text>
                  </Pressable>
                )}

                {evidenceList.length < 3 && (
                  <Pressable
                    onPress={() => handleLaunchCamera('video')}
                    style={styles.addMediaSlotBtn}
                  >
                    <SymbolView
                      name={{ ios: 'video.fill', android: 'videocam', web: 'videocam' }}
                      tintColor="#2563eb"
                      size={20}
                    />
                    <Text style={styles.addMediaSlotText}>Video</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.submitBtn,
                isSubmitting && styles.submitBtnDisabled,
                pressed && styles.submitBtnPressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Complaint</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Violation Category Dropdown Modal */}
      <Modal
        visible={isCategoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsCategoryModalVisible(false)}
        >
          <View style={styles.categoryDropdownModal}>
            <Text style={styles.dropdownModalTitle}>Select Violation Category</Text>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {VIOLATION_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setIsCategoryModalVisible(false);
                  }}
                  style={[
                    styles.dropdownOption,
                    selectedCategory.id === cat.id && styles.dropdownOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      selectedCategory.id === cat.id && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                  {selectedCategory.id === cat.id && (
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      tintColor="#2563eb"
                      size={18}
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Media Source Choice Modal */}
      <Modal
        visible={isMediaSourceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsMediaSourceModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsMediaSourceModalVisible(false)}
        >
          <View style={styles.mediaSourceModal}>
            <Text style={styles.mediaSourceTitle}>Attach Evidence Media</Text>
            <Text style={styles.mediaSourceSub}>Choose media type and camera/gallery source</Text>

            <Pressable
              onPress={() => handleLaunchCamera('photo')}
              style={({ pressed }) => [
                styles.sourceOptionBtn,
                pressed && styles.sourceOptionBtnPressed,
              ]}
            >
              <SymbolView
                name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                tintColor="#2563eb"
                size={22}
              />
              <View>
                <Text style={styles.sourceOptionTitle}>Take Photo (Camera)</Text>
                <Text style={styles.sourceOptionSub}>Capture a snapshot of the incident</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => handleLaunchCamera('video')}
              style={({ pressed }) => [
                styles.sourceOptionBtn,
                pressed && styles.sourceOptionBtnPressed,
              ]}
            >
              <SymbolView
                name={{ ios: 'video.fill', android: 'videocam', web: 'videocam' }}
                tintColor="#2563eb"
                size={22}
              />
              <View>
                <Text style={styles.sourceOptionTitle}>Record Video (Camera)</Text>
                <Text style={styles.sourceOptionSub}>Record a live video clip as evidence</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleLaunchGallery}
              style={({ pressed }) => [
                styles.sourceOptionBtn,
                pressed && styles.sourceOptionBtnPressed,
              ]}
            >
              <SymbolView
                name={{ ios: 'photo.on.rectangle.angled', android: 'collections', web: 'collections' }}
                tintColor="#2563eb"
                size={22}
              />
              <View>
                <Text style={styles.sourceOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.sourceOptionSub}>Pick saved photo or video from device</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setIsMediaSourceModalVisible(false)}
              style={styles.cancelSourceBtn}
            >
              <Text style={styles.cancelSourceText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  keyboardView: {
    flex: 1,
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 4,
  },
  topBarTitle: {
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
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    padding: 20,
    gap: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1e3a8a',
    letterSpacing: 1,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  disabledInput: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  disabledInputText: {
    color: '#64748b',
    fontWeight: '600',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  timePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  pickerBtnText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  input: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '500',
    outlineStyle: 'none' as any,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
  evidenceSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    fontWeight: '500',
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
  },
  addMediaSlotBtn: {
    flex: 1,
    aspectRatio: 1.1,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addMediaSlotText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
  },
  mediaItem: {
    position: 'relative',
    flex: 1,
    aspectRatio: 1.1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  videoTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 99,
  },
  submitBtn: {
    backgroundColor: '#d97706',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnPressed: {
    opacity: 0.9,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  categoryDropdownModal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  dropdownModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    letterSpacing: -0.2,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  dropdownOptionSelected: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    maxWidth: '85%',
  },
  dropdownOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '700',
  },
  mediaSourceModal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  mediaSourceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  mediaSourceSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  sourceOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 14,
  },
  sourceOptionBtnPressed: {
    backgroundColor: '#f1f5f9',
  },
  sourceOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  sourceOptionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  cancelSourceBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  cancelSourceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
});
