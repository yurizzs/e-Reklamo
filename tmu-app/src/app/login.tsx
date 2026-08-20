import React, { useState, useEffect } from 'react';
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
import { authStore } from '@/services/auth-store';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required.';
    } else if (!/^[a-zA-Z0-9._@]{3,40}$/.test(username.trim())) {
      newErrors.username = 'Please enter a valid username or email.';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (lockoutSeconds > 0) {
      Alert.alert('Too Many Attempts', `Please wait ${lockoutSeconds}s before trying again.`);
      return;
    }

    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await apiService.login({
        username: username.trim(),
        password: password.trim(),
      });

      if (res.success) {
        if (res.user) {
          authStore.setUser(res.user, res.token);
        }
        Alert.alert('Success', res.message || 'Logged in successfully!', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)' as any),
          },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Authentication Error', err.message || 'Invalid username or password.');
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
          {/* Header Shield & Branding */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <SymbolView
                name={{ ios: 'shield.fill', android: 'shield', web: 'shield' }}
                tintColor="#ffffff"
                size={34}
              />
            </View>

            <View style={styles.brandTitleWrapper}>
              <Text style={styles.brandTitle}>TMU Portal</Text>
              <Text style={styles.brandSubtitle}>Traffic Management Unit Citizen Center</Text>
            </View>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Welcome back</Text>

            {/* Form */}
            <View style={styles.form}>
              {/* Username Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username or Email</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.username && styles.inputError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your username or email"
                    placeholderTextColor="#94a3b8"
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (errors.username)
                        setErrors((prev) => ({ ...prev, username: undefined }));
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.username && (
                  <Text style={styles.errorText}>{errors.username}</Text>
                )}
              </View>

              {/* Password Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.password && styles.inputError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password)
                        setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.togglePasswordBtn}
                  >
                    <SymbolView
                      name={{ ios: showPassword ? 'eye.slash.fill' : 'eye.fill', android: showPassword ? 'visibility_off' : 'visibility', web: showPassword ? 'visibility_off' : 'visibility' }}
                      tintColor="#64748b"
                      size={18}
                    />
                  </Pressable>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Forgot Password Link */}
              <Pressable
                onPress={() =>
                  Alert.alert('Forgot Password', 'Please contact support to reset your account password.')
                }
                style={styles.forgotBtn}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>

              {/* Submit Button */}
              <Pressable
                onPress={handleLogin}
                disabled={isLoading || lockoutSeconds > 0}
                style={({ pressed }) => [
                  styles.submitBtn,
                  (isLoading || lockoutSeconds > 0) && styles.submitBtnDisabled,
                  pressed && styles.submitBtnPressed,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {lockoutSeconds > 0
                      ? `Retry in ${lockoutSeconds}s`
                      : 'Login'}
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signupPrompt}>
              <Text style={styles.signupPromptText}>New to TMU Portal? </Text>
              <Pressable onPress={() => router.push('/register')}>
                <Text style={styles.signupLinkText}>Register here</Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTitleWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e3a8a',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    gap: 20,
  },
  cardHeader: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    alignSelf: 'flex-start',
    letterSpacing: -0.5,
  },
  form: {
    width: '100%',
    gap: 16,
  },
  inputGroup: {
    width: '100%',
    gap: 8,
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
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
  togglePasswordBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
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
  signupPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  signupPromptText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  signupLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
  },
});
