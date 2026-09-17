import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  duration = 2200,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [loadingStep, setLoadingStep] = useState('Loading TMU System...');

  useEffect(() => {
    // Fade in & Scale in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: duration - 300,
        useNativeDriver: false,
      }),
    ]).start();

    // Step-by-step loading messages
    const step1 = setTimeout(() => setLoadingStep('Connecting to Secure Servers...'), 600);
    const step2 = setTimeout(() => setLoadingStep('Initializing System Modules...'), 1200);
    const step3 = setTimeout(() => setLoadingStep('System Ready!'), 1800);

    // Trigger onFinish when timer completes
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, duration);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(timer);
    };
  }, []);

  const spin = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Background Grid Overlay */}
      <View style={styles.gridOverlay} />

      {/* Decorative Corner Brackets */}
      <View style={[styles.cornerBracket, styles.bracketTopLeft]} />
      <View style={[styles.cornerBracket, styles.bracketTopRight]} />
      <View style={[styles.cornerBracket, styles.bracketBottomLeft]} />
      <View style={[styles.cornerBracket, styles.bracketBottomRight]} />

      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
        {/* Logo Container */}
        <View style={styles.logoBadge}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <SymbolView
              name={{ ios: 'shield.fill', android: 'shield', web: 'shield' }}
              tintColor="#ffffff"
              size={44}
            />
          </Animated.View>
        </View>

        {/* Brand Text */}
        <View style={styles.textContainer}>
          <Text style={styles.brandTitle}>TMU Portal</Text>
          <Text style={styles.brandSubtitle}>TRAFFIC MANAGEMENT UNIT</Text>
        </View>

        {/* Lazy Loading Spinner & Status Badge */}
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="small" color="#2563eb" style={{ marginBottom: 4 }} />
          
          <View style={styles.statusBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusText}>{loadingStep.toUpperCase()}</Text>
          </View>

          {/* Progress Bar Container */}
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
          </View>
        </View>
      </Animated.View>

      {/* Footer Version */}
      <Text style={styles.footerText}>© {new Date().getFullYear()} e-Reklamo • Mobile V2.4.0</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F8F9FC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    opacity: 0.05,
  },
  cornerBracket: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  bracketTopLeft: {
    top: 24,
    left: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 8,
  },
  bracketTopRight: {
    top: 24,
    right: 24,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 8,
  },
  bracketBottomLeft: {
    bottom: 24,
    left: 24,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 8,
  },
  bracketBottomRight: {
    bottom: 24,
    right: 24,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 8,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 20,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoImage: {
    width: 54,
    height: 54,
  },
  textContainer: {
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e3a8a',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 2,
    marginTop: 4,
  },
  loadingWrapper: {
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e40af',
    letterSpacing: 1.2,
  },
  progressBarBg: {
    width: 180,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  footerText: {
    position: 'absolute',
    bottom: 30,
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
    letterSpacing: 1.5,
  },
});
