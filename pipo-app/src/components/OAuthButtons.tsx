import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useOAuth } from '@clerk/expo';
import { useSignInWithApple } from '@clerk/expo/apple';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { registerUser } from '../services/apiClient';

WebBrowser.maybeCompleteAuthSession();

type OAuthButtonsProps = {
  mode: 'sign-in' | 'sign-up';
};

export function OAuthButtons({ mode }: OAuthButtonsProps) {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleGooglePress = useCallback(async () => {
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive, signUp } = await startOAuthFlow({
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });

        // If this was a new sign-up via OAuth, register in our backend
        if (signUp?.createdUserId) {
          try {
            const email =
              signUp.emailAddress || '';
            const name =
              `${signUp.firstName || ''} ${signUp.lastName || ''}`.trim() ||
              email.split('@')[0];
            await registerUser(email, name);
          } catch {
            console.warn('Backend registration failed after Google OAuth, will retry later');
          }
        }
      }
    } catch (err: unknown) {
      const error = err as { code?: string; errors?: Array<{ longMessage?: string }> };
      // User cancelled
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      const message =
        error.errors?.[0]?.longMessage || 'Google sign-in failed. Please try again.';
      Alert.alert('Error', message);
      console.error('Google OAuth error:', JSON.stringify(err, null, 2));
    } finally {
      setGoogleLoading(false);
    }
  }, [startOAuthFlow]);

  const handleApplePress = useCallback(async () => {
    setAppleLoading(true);
    try {
      const { createdSessionId, setActive, signUp } = await startAppleAuthenticationFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });

        // If this was a new sign-up via Apple, register in our backend
        if (signUp?.createdUserId) {
          try {
            const email =
              signUp.emailAddress || '';
            const name =
              `${signUp.firstName || ''} ${signUp.lastName || ''}`.trim() ||
              email.split('@')[0];
            await registerUser(email, name);
          } catch {
            console.warn('Backend registration failed after Apple OAuth, will retry later');
          }
        }
      }
    } catch (err: unknown) {
      const error = err as { code?: string; errors?: Array<{ longMessage?: string }> };
      // User cancelled
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      const message =
        error.errors?.[0]?.longMessage || 'Apple sign-in failed. Please try again.';
      Alert.alert('Error', message);
      console.error('Apple Sign-In error:', JSON.stringify(err, null, 2));
    } finally {
      setAppleLoading(false);
    }
  }, [startAppleAuthenticationFlow]);

  const label = mode === 'sign-in' ? 'Sign in' : 'Sign up';

  return (
    <View style={styles.container}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.oauthButton, styles.googleButton, googleLoading && styles.buttonDisabled]}
        onPress={handleGooglePress}
        disabled={googleLoading || appleLoading}
        activeOpacity={0.8}
      >
        {googleLoading ? (
          <ActivityIndicator color="#1a1a1a" />
        ) : (
          <>
            <Text style={styles.oauthIcon}>G</Text>
            <Text style={styles.googleButtonText}>{label} with Google</Text>
          </>
        )}
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <TouchableOpacity
          style={[styles.oauthButton, styles.appleButton, appleLoading && styles.buttonDisabled]}
          onPress={handleApplePress}
          disabled={googleLoading || appleLoading}
          activeOpacity={0.8}
        >
          {appleLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.appleIcon}></Text>
              <Text style={styles.appleButtonText}>{label} with Apple</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '500',
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  oauthIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 10,
  },
  appleIcon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 8,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
