import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { apiService } from '@/services/api';

export default function RegisterScreen() {
  const router = useRouter();

  // Form State
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCertified, setIsCertified] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required.';
    } else if (!/^[a-zA-Z0-9._]{3,30}$/.test(username.trim())) {
      newErrors.username =
        'Username must be 3-30 characters (letters, numbers, dots, underscores).';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!isCertified) {
      Alert.alert('Verification Required', 'Please certify that all submitted information is true, complete, and legally valid.');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await apiService.registerCitizen({
        first_name: firstName.trim(),
        middle_name: middleName.trim() || undefined,
        last_name: lastName.trim(),
        suffix_1name: suffix.trim() || undefined,
        username: username.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        password: password,
        role: 'user',
      });

      if (res.success) {
        Alert.alert('Registration Successful', res.message, [
          {
            text: 'Sign In Now',
            onPress: () => router.replace('/login'),
          },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Unable to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Custom Mockup Navigation Header */}
      <View style={styles.navHeader}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <SymbolView
            name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }}
            tintColor="#2563eb"
            size={22}
          />
        </Pressable>
        <Text style={styles.navTitle}>Create Civic Account</Text>
        <View style={styles.civicBadge}>
          <Text style={styles.civicBadgeText}>CIVIC</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.bodyHeader}>
            <Text style={styles.bodyTitle}>Complainant Verification Profile</Text>
            <Text style={styles.bodySubtitle}>
              Provide accurate credentials. To ensure lawful prosecution of traffic incidents, TMU mandates citizen identity verification.
            </Text>
          </View>

          {/* Form Scroll Container */}
          <View style={styles.card}>
            {/* Section 1: Personal Details */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>1. PERSONAL DETAILS</Text>

              {/* First Name & Middle Name */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.flex2]}>
                  <Text style={styles.label}>First Name *</Text>
                  <View style={[styles.inputContainer, errors.firstName && styles.inputError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="John"
                      placeholderTextColor="#94a3b8"
                      value={firstName}
                      onChangeText={(t) => {
                        setFirstName(t);
                        if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
                      }}
                    />
                  </View>
                  {!!errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                </View>

                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.label}>Middle Name</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="D."
                      placeholderTextColor="#94a3b8"
                      value={middleName}
                      onChangeText={setMiddleName}
                    />
                  </View>
                </View>
              </View>

              {/* Last Name & Suffix */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.flex2]}>
                  <Text style={styles.label}>Last Name *</Text>
                  <View style={[styles.inputContainer, errors.lastName && styles.inputError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Doe"
                      placeholderTextColor="#94a3b8"
                      value={lastName}
                      onChangeText={(t) => {
                        setLastName(t);
                        if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
                      }}
                    />
                  </View>
                  {!!errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                </View>

                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.label}>Suffix</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Jr."
                      placeholderTextColor="#94a3b8"
                      value={suffix}
                      onChangeText={setSuffix}
                    />
                  </View>
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="+63 917 123 4567"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(t) => {
                      setPhone(t);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                  />
                </View>
                {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              {/* Email Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="john.doe@civic.gov"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                  />
                </View>
                {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter complete home address"
                    placeholderTextColor="#94a3b8"
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Section 2: Account Credentials */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>2. ACCOUNT CREDENTIALS</Text>

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username *</Text>
                <View style={[styles.inputContainer, errors.username && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Choose a username"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={username}
                    onChangeText={(t) => {
                      setUsername(t);
                      if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
                    }}
                  />
                </View>
                {!!errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Create a strong password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    }}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.toggleText}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
                  </Pressable>
                </View>
                {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password *</Text>
                <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                  />
                </View>
                {!!errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>
            </View>

            {/* Checkbox Statement */}
            <Pressable onPress={() => setIsCertified(!isCertified)} style={styles.checkboxContainer}>
              <View style={[styles.checkbox, isCertified && styles.checkboxActive]}>
                {isCertified && (
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    tintColor="#ffffff"
                    size={12}
                  />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                I certify that all information submitted is true, complete, and legally valid.
              </Text>
            </Pressable>

            {/* Submit Button */}
            <Pressable
              onPress={handleRegister}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.submitBtn,
                isLoading && styles.submitBtnDisabled,
                pressed && styles.submitBtnPressed,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Register</Text>
              )}
            </Pressable>

            {/* Back to Login Link */}
            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>Already have an account? </Text>
              <Pressable onPress={() => router.push('/login')}>
                <Text style={styles.loginLinkText}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  navHeader: {
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
  navTitle: {
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 20,
  },
  bodyHeader: {
    gap: 8,
    paddingHorizontal: 4,
  },
  bodyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  bodySubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    fontWeight: '500',
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
    color: '#2563eb',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
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
  toggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 1,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnPressed: {
    backgroundColor: '#1d4ed8',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loginPromptText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  loginLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
  },
});
