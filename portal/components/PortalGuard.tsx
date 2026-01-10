import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePortalAuth } from '../lib/portalAuth';

const SQL_SNIPPET = `insert into public.profiles (id, role, full_name)
values ('AUTH_USER_UUID_HERE', 'admin', 'Admin')
on conflict (id) do update
set role='admin', full_name=excluded.full_name;`;

export default function PortalGuard({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const { session, profile, loading, error, signOut } = usePortalAuth();

  useEffect(() => {
    if (!loading && !session) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'PortalLogin' as never }],
      });
    }
  }, [loading, navigation, session]);

  useEffect(() => {
    if (profile.role && profile.role !== 'admin') {
      signOut();
    }
  }, [profile.role, signOut]);

  if (loading) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateText}>Loading admin portal…</Text>
      </View>
    );
  }

  if (!session) {
    return null;
  }

  if (profile.missing) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>Profile not found</Text>
        <Text style={styles.stateText}>
          Ask an administrator to insert your profiles row and set role=admin. You cannot access the portal until this is done.
        </Text>
        <View style={styles.codeBlock}>
          <Text style={styles.codeText}>{SQL_SNIPPET}</Text>
        </View>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => signOut()}>
          <Text style={styles.secondaryButtonText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (profile.role !== 'admin') {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>Not authorized</Text>
        <Text style={styles.stateText}>Your account does not have admin access.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => signOut()}>
          <Text style={styles.secondaryButtonText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.errorText}>Supabase error: {error}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  stateText: {
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
  },
  codeBlock: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 8,
    maxWidth: 640,
  },
  codeText: {
    color: '#F9FAFB',
    fontFamily: 'Courier',
    fontSize: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#9CA3AF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  errorText: {
    color: '#B91C1C',
    marginBottom: 8,
  },
});
