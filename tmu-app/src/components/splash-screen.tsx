import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

  useEffect(() => {
    // Fade in & Scale in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
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
    ]).start();

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

    return () => clearTimeout(timer);
  }, []);

  const spin = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
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
          <Animated.Image
            source={require('../../assets/images/react-logo.png')}
            style={[styles.logoImage, { transform: [{ rotate: spin }] }]}
            resizeMode="contain"
          />
        </View>

        {/* Brand Text */}
        <View style={styles.textContainer}>
          <Text style={styles.brandTitle}>
            e-<Text style={styles.brandAccent}>Reklamo</Text>
          </Text>
          <Text style={styles.brandSubtitle}>TRAFFIC MANAGEMENT UNIT</Text>
        </View>

        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>SYSTEM INITIALIZING</Text>
        </View>
      </Animated.View>

      {/* Footer Version */}
      <Text style={styles.footerText}>© {new Date().getFullYear()} e-Reklamo • Mobile V1.0</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#040c07',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    opacity: 0.15,
  },
  cornerBracket: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: 'rgba(16, 185, 129, 0.35)',
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
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  logoImage: {
    width: 54,
    height: 54,
    tintColor: '#10b981',
  },
  textContainer: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: '#10b981',
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(16, 185, 129, 0.65)',
    letterSpacing: 3,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34d399',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6ee7b7',
    letterSpacing: 1.5,
  },
  footerText: {
    position: 'absolute',
    bottom: 30,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(16, 185, 129, 0.3)',
    letterSpacing: 1.5,
  },
});
