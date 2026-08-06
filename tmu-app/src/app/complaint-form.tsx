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
  { id: '1', name: 'Speeding', code: 'SPEEDING' },
  { id: '2', name: 'Overcharging Fare', code: 'OVERCHARGE' },
  { id: '3', name: 'Route Deviation', code: 'DEVIATION' },
  { id: '4', name: 'Reckless Driving', code: 'RECKLESS' },
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

  const formatDateTimeDisplay = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }

    if (selectedDate) {
      setIncidentDate(selectedDate);
      if (Platform.OS === 'android' && datePickerMode === 'date') {
        // Switch to time mode on Android after date selection
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
        Alert.alert('Permission Required', 'Permission to access media library is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || asset.uri.endsWith('.mp4') || asset.uri.endsWith('.mov');
        const newMedia: EvidenceItem = {
          uri: asset.uri,
          type: isVideo ? 'video' : 'image',
          name: asset.fileName || `gallery_${Date.now()}`,
        };

        setEvidenceList((prev) => [...prev, newMedia].slice(0, 3));
      }
    } catch (err: any) {
      console.warn('Gallery picker error:', err);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setEvidenceList((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Complaint title is required.';
    }

    if (!complainantAddress.trim()) {
      newErrors.complainantAddress = 'Complainant address is required.';
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
      formData.append('driver_id', '1'); // Default or selected driver ID
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
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor="#10b981"
              size={22}
            />
          </Pressable>
          <Text style={styles.topBarTitle}>File a Complaint</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>COMPLAINT DETAILS</Text>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>COMPLAINT SUBJECT / TITLE *</Text>
              <View style={[styles.inputContainer, errors.title && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Overcharged on tricycle fare"
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
                  value={title}
                  onChangeText={(t) => {
                    setTitle(t);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                  }}
                />
              </View>
              {!!errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            {/* Complainant Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>COMPLAINANT ADDRESS *</Text>
              <View style={[styles.inputContainer, errors.complainantAddress && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Brgy. San Jose, Pasig City"
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
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
              <Text style={styles.label}>CONTACT NUMBER *</Text>
              <View style={[styles.inputContainer, errors.contactNumber && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 09123456789"
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
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

            {/* Violation Category Dropdown Menu */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>VIOLATION CATEGORY *</Text>
              <Pressable
                onPress={() => setIsCategoryModalVisible(true)}
                style={styles.dropdownContainer}
              >
                <Text style={styles.dropdownSelectedText}>{selectedCategory.name}</Text>
                <SymbolView
                  name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow_drop_down' }}
                  tintColor="#10b981"
                  size={20}
                />
              </Pressable>
            </View>

            {/* Plate / Vehicle Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DRIVER PLATE / BODY NUMBER</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. ABC-123 or Body #45"
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
                  autoCapitalize="characters"
                  value={plateNumber}
                  onChangeText={setPlateNumber}
                />
              </View>
            </View>

            {/* Incident Location & Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>INCIDENT LOCATION *</Text>
              <View style={[styles.inputContainer, errors.incidentLocation && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Street name, landmark, city"
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
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
              <Text style={styles.label}>DATE & TIME OF INCIDENT *</Text>
              <View style={styles.pickerRow}>
                <Pressable
                  onPress={() => openDateTimePicker('date')}
                  style={styles.datePickerBtn}
                >
                  <SymbolView
                    name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                    tintColor="#10b981"
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
                    tintColor="#10b981"
                    size={18}
                  />
                  <Text style={styles.pickerBtnText}>
                    {incidentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </Text>
                </Pressable>
              </View>

              {/* DateTimePicker Dialog / Popup */}
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

            {/* Description */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.label}>INCIDENT DESCRIPTION *</Text>
                <Text style={{ fontSize: 9, color: 'rgba(16, 185, 129, 0.7)', fontWeight: '600' }}>
                  Preset: "Color: Red"
                </Text>
              </View>

              <View style={[styles.textAreaContainer, errors.description && styles.inputError]}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Color: Red&#10;"
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={(t) => {
                    setDescription(t);
                    if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                  }}
                />
              </View>
              {!!errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>

            {/* Evidence Media Upload (Limited to 3) */}
            <View style={styles.inputGroup}>
              <View style={styles.evidenceHeaderRow}>
                <Text style={styles.label}>EVIDENCE (IMAGE / VIDEO)</Text>
                <Text style={styles.evidenceCounterText}>{evidenceList.length} / 3 Max</Text>
              </View>

              {/* Media Thumbnails Grid */}
              {evidenceList.length > 0 && (
                <View style={styles.mediaGrid}>
                  {evidenceList.map((item, idx) => (
                    <View key={idx} style={styles.mediaItem}>
                      {item.type === 'image' ? (
                        <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} />
                      ) : (
                        <View style={styles.videoPlaceholder}>
                          <SymbolView
                            name={{ ios: 'video.fill', android: 'videocam', web: 'videocam' }}
                            tintColor="#10b981"
                            size={24}
                          />
                          <Text style={styles.videoTag}>VIDEO</Text>
                        </View>
                      )}

                      <Pressable
                        onPress={() => handleRemoveMedia(idx)}
                        style={styles.removeMediaBtn}
                      >
                        <Text style={styles.removeMediaText}>✕</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* Add Media Button */}
              {evidenceList.length < 3 && (
                <Pressable
                  onPress={handleOpenMediaSourcePicker}
                  style={({ pressed }) => [
                    styles.addMediaBtn,
                    pressed && styles.addMediaBtnPressed,
                  ]}
                >
                  <SymbolView
                    name={{ ios: 'photo.badge.plus', android: 'add_photo_alternate', web: 'add_photo_alternate' }}
                    tintColor="#10b981"
                    size={20}
                  />
                  <Text style={styles.addMediaBtnText}>
                    + Add Photo or Video ({3 - evidenceList.length} remaining)
                  </Text>
                </Pressable>
              )}
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
                <ActivityIndicator color="#022c1a" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>SUBMIT COMPLAINT</Text>
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

            <ScrollView style={{ maxHeight: 320 }}>
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
                      tintColor="#10b981"
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
                tintColor="#10b981"
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
                tintColor="#10b981"
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
                tintColor="#10b981"
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
    backgroundColor: '#040c07',
  },
  keyboardView: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.15)',
  },
  backBtn: {
    padding: 6,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  card: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1.5,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(16, 185, 129, 0.75)',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  dropdownSelectedText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  datePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  timePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  pickerBtnText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  textAreaContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 96,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  textArea: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  errorText: {
    color: '#f87171',
    fontSize: 10,
  },
  evidenceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evidenceCounterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34d399',
  },
  addMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 46,
  },
  addMediaBtnPressed: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  addMediaBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },
  mediaGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  mediaItem: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  videoTag: {
    fontSize: 8,
    fontWeight: '800',
    color: '#34d399',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMediaText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnPressed: {
    backgroundColor: '#059669',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#022c1a',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  categoryDropdownModal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#07160d',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  dropdownModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.15)',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.08)',
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 8,
  },
  dropdownOptionText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  dropdownOptionTextSelected: {
    color: '#10b981',
    fontWeight: '800',
  },
  mediaSourceModal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#07160d',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  mediaSourceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  mediaSourceSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  sourceOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 14,
    padding: 14,
  },
  sourceOptionBtnPressed: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  sourceOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  sourceOptionSub: {
    fontSize: 10,
    color: 'rgba(16, 185, 129, 0.7)',
    marginTop: 2,
  },
  cancelSourceBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  cancelSourceText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
