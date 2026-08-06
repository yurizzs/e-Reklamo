import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

    if (!username.trim()) {
      newErrors.username = 'Username is required.';
    } else if (!/^[a-zA-Z0-9._]{3,30}$/.test(username.trim())) {
      newErrors.username =
        'Username must be 3-30 characters (letters, numbers, dots, underscores).';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card */}
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoBadge}>
                <Image
                  source={require('@/assets/images/react-logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>Citizen Registration</Text>
                <Text style={styles.subtitle}>Create your e-Reklamo TMU account</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Section 1: Personal Details */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>PERSONAL DETAILS</Text>

              {/* First Name & Middle Name */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.label}>FIRST NAME *</Text>
                  <View style={[styles.inputContainer, errors.firstName && styles.inputError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="John"
                      placeholderTextColor="rgba(255, 255, 255, 0.35)"
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
                  <Text style={styles.label}>MIDDLE NAME</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="D."
                      placeholderTextColor="rgba(255, 255, 255, 0.35)"
                      value={middleName}
                      onChangeText={setMiddleName}
                    />
                  </View>
                </View>
              </View>

              {/* Last Name & Suffix */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.flex2]}>
                  <Text style={styles.label}>LAST NAME *</Text>
                  <View style={[styles.inputContainer, errors.lastName && styles.inputError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Doe"
                      placeholderTextColor="rgba(255, 255, 255, 0.35)"
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
                  <Text style={styles.label}>SUFFIX</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Jr."
                      placeholderTextColor="rgba(255, 255, 255, 0.35)"
                      value={suffix}
                      onChangeText={setSuffix}
                    />
                  </View>
                </View>
              </View>

              {/* Email & Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="john.doe@example.com"
                    placeholderTextColor="rgba(255, 255, 255, 0.35)"
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PHONE NUMBER</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="09123456789"
                    placeholderTextColor="rgba(255, 255, 255, 0.35)"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ADDRESS</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Brgy. San Jose, Pasig City"
                    placeholderTextColor="rgba(255, 255, 255, 0.35)"
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>
              </View>
            </View>

            {/* Section 2: Account Credentials */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>ACCOUNT CREDENTIALS</Text>

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>USERNAME *</Text>
                <View style={[styles.inputContainer, errors.username && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Choose a username"
                    placeholderTextColor="rgba(255, 255, 255, 0.35)"
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
                <Text style={styles.label}>PASSWORD *</Text>
                <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Create a strong password"
                    placeholderTextColor="rgba(255, 255, 255, 0.35)"
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
                <Text style={styles.label}>CONFIRM PASSWORD *</Text>
                <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor="rgba(255, 255, 255, 0.35)"
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
                <ActivityIndicator color="#022c1a" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>CREATE ACCOUNT</Text>
              )}
            </Pressable>

            {/* Back to Login */}
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
    backgroundColor: '#040c07',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 28,
    height: 28,
    tintColor: '#10b981',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(16, 185, 129, 0.7)',
    marginTop: 1,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1.5,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  inputGroup: {
    gap: 5,
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
    height: 44,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  toggleText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 1,
  },
  errorText: {
    color: '#f87171',
    fontSize: 10,
  },
  submitBtn: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    height: 46,
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
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginPromptText: {
    fontSize: 12,
    color: 'rgba(167, 243, 208, 0.4)',
  },
  loginLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },
});
