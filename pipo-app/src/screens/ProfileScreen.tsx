import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth, useUser } from '@clerk/expo';
import { getCurrentUser, ApiUser, ApiUsage } from '../services/apiClient';

const FREE_LIMITS = {
  messagesPerMonth: 100,
  storageMb: 500,
  maxChats: 2,
};

export function ProfileScreen() {
  const { signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [usage, setUsage] = useState<ApiUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const result = await getCurrentUser();
      setApiUser(result.user);
      setUsage(result.usage);
    } catch {
      // User may not be registered in backend yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSignOut = useCallback(async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  }, [signOut]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  const displayName =
    apiUser?.displayName || clerkUser?.fullName || clerkUser?.primaryEmailAddress?.emailAddress || 'User';
  const email =
    apiUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || '';
  const tier = apiUser?.subscriptionTier || 'free';

  const messagesPct = usage
    ? Math.min((usage.messagesSent / FREE_LIMITS.messagesPerMonth) * 100, 100)
    : 0;
  const storagePct = usage
    ? Math.min((usage.storageUsedMb / FREE_LIMITS.storageMb) * 100, 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Info */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>
            {tier === 'free' ? 'Free Plan' : 'Premium'}
          </Text>
        </View>
      </View>

      {/* Usage Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage This Month</Text>

        <View style={styles.usageItem}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageLabel}>Messages Sent</Text>
            <Text style={styles.usageValue}>
              {usage?.messagesSent ?? 0} / {FREE_LIMITS.messagesPerMonth}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${messagesPct}%` },
                messagesPct >= 90 && styles.progressWarning,
              ]}
            />
          </View>
        </View>

        <View style={styles.usageItem}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageLabel}>Storage Used</Text>
            <Text style={styles.usageValue}>
              {(usage?.storageUsedMb ?? 0).toFixed(1)} MB / {FREE_LIMITS.storageMb} MB
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${storagePct}%` },
                storagePct >= 90 && styles.progressWarning,
              ]}
            />
          </View>
        </View>

        <View style={styles.usageItem}>
          <View style={styles.usageHeader}>
            <Text style={styles.usageLabel}>Media Uploaded</Text>
            <Text style={styles.usageValue}>
              {(usage?.mediaUploadedMb ?? 0).toFixed(1)} MB
            </Text>
          </View>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Edit Profile</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Notification Settings</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Privacy Policy</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Pipo v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#075E54',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: '#8e8e93',
    marginBottom: 12,
  },
  tierBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tierText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  usageItem: {
    marginBottom: 16,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: 15,
    color: '#3c3c43',
  },
  usageValue: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#25D366',
    borderRadius: 4,
  },
  progressWarning: {
    backgroundColor: '#FF9500',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  menuItemArrow: {
    fontSize: 22,
    color: '#c7c7cc',
  },
  signOutButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF3B30',
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: '#c7c7cc',
  },
});
