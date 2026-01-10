import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';

const SQL_SNIPPET = `insert into public.profiles (id, role, full_name)
values ('AUTH_USER_UUID_HERE', 'admin', 'Admin')
on conflict (id) do update
set role='admin', full_name=excluded.full_name;`;

export default function PortalLoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setProfileMissing(false);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setError('Login succeeded but user profile was not available.');
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    if (!profile) {
      setProfileMissing(true);
      setLoading(false);
      navigation.reset({ index: 0, routes: [{ name: 'PortalDashboard' as never }] });
      return;
    }

    if (profile.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Not authorized. Your account is not an admin.');
      setLoading(false);
      return;
    }

    setLoading(false);
    navigation.reset({ index: 0, routes: [{ name: 'PortalDashboard' as never }] });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Portal Login</Text>
      <Text style={styles.subtitle}>Only admin users can access the web portal.</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {profileMissing ? (
          <Text style={styles.noticeText}>
            Profile not found. Ask an admin to insert your profiles row and set role=admin.
          </Text>
        ) : null}
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.helperCard}>
        <Text style={styles.helperTitle}>Admin profile setup SQL</Text>
        <Text style={styles.helperText}>
          Create the auth user in Supabase Authentication, then insert/update the profile row:
        </Text>
        <View style={styles.codeBlock}>
          <Text style={styles.codeText}>{SQL_SNIPPET}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    gap: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    color: '#6B7280',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorText: {
    color: '#B91C1C',
  },
  noticeText: {
    color: '#92400E',
  },
  helperCard: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  helperTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  helperText: {
    color: '#4B5563',
  },
  codeBlock: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
  },
  codeText: {
    color: '#F9FAFB',
    fontFamily: 'Courier',
    fontSize: 12,
  },
});
