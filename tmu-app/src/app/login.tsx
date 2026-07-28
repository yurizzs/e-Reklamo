import React, { useState, useEffect } from 'react';
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
    } else if (!/^[a-zA-Z0-9._]{3,30}$/.test(username.trim())) {
      newErrors.username =
        'Username must be 3-30 characters (letters, numbers, dots, underscores).';
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
          {/* Decorative Corner Brackets */}
          <View style={[styles.cornerBracket, styles.bracketTopLeft]} />
          <View style={[styles.cornerBracket, styles.bracketTopRight]} />
          <View style={[styles.cornerBracket, styles.bracketBottomLeft]} />
          <View style={[styles.cornerBracket, styles.bracketBottomRight]} />

          {/* Login Glass Card */}
          <View style={styles.card}>
            {/* Logo & Branding */}
            <View style={styles.header}>
              <View style={styles.logoBadge}>
                <Image
                  source={require('@/assets/images/react-logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.brandTitleWrapper}>
                <Text style={styles.brandTitle}>
                  e-<Text style={styles.brandAccent}>Reklamo</Text>
                </Text>
                <Text style={styles.brandSubtitle}>TRAFFIC MANAGEMENT UNIT</Text>
              </View>
            </View>

            {/* System Status Badge */}
            <View style={styles.statusBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.statusText}>SYSTEM ONLINE</Text>
            </View>

            <View style={styles.divider} />

            {/* Form */}
            <View style={styles.form}>
              {/* Username Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>USERNAME</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.username && styles.inputError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your username"
                    placeholderTextColor="rgba(255, 255, 255, 0.35)"
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
                <Text style={styles.label}>PASSWORD</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.password && styles.inputError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(255, 255, 255, 0.35)"
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
                    <Text style={styles.togglePasswordText}>
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </Text>
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
                <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
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
                  <ActivityIndicator color="#022c1a" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {lockoutSeconds > 0
                      ? `RETRY IN ${lockoutSeconds}S`
                      : 'SIGN IN'}
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signupPrompt}>
              <Text style={styles.signupPromptText}>Don't have an account? </Text>
              <Pressable onPress={() => router.push('/register')}>
                <Text style={styles.signupLinkText}>Sign Up</Text>
              </Pressable>
            </View>

            {/* Footer */}
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} e-Reklamo • V2.4.0
            </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  cornerBracket: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  bracketTopLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 6,
  },
  bracketTopRight: {
    top: 16,
    right: 16,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 6,
  },
  bracketBottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 6,
  },
  bracketBottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 6,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 58,
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 34,
    height: 34,
    tintColor: '#10b981',
  },
  brandTitleWrapper: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: '#10b981',
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(16, 185, 129, 0.55)',
    letterSpacing: 3,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(110, 231, 183, 0.9)',
    letterSpacing: 1.5,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  form: {
    width: '100%',
    gap: 14,
  },
  inputGroup: {
    width: '100%',
    gap: 6,
  },
  label: {
    fontSize: 10,
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
  inputError: {
    borderColor: '#ef4444',
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  errorText: {
    color: '#f87171',
    fontSize: 11,
    marginTop: 2,
  },
  togglePasswordBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  togglePasswordText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 1,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(16, 185, 129, 0.6)',
    letterSpacing: 1,
  },
  submitBtn: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
  signupPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  signupPromptText: {
    fontSize: 12,
    color: 'rgba(167, 243, 208, 0.4)',
  },
  signupLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(16, 185, 129, 0.2)',
    letterSpacing: 1,
    marginTop: 6,
  },
});
