import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PortalLayout from '../components/PortalLayout';
import { supabase } from '../lib/supabaseClient';

type AdminAction = {
  id: string;
  admin_id: string | null;
  action: string | null;
  reason: string | null;
  shift_id?: string | null;
  created_at: string;
};

export default function PortalAdminActionsScreen() {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: actionsError } = await supabase
      .from('admin_actions')
      .select('id,admin_id,action,reason,shift_id,created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (actionsError) {
      setError(actionsError.message);
    }

    setActions(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  return (
    <PortalLayout title="Admin Actions">
      <TouchableOpacity style={styles.refreshButton} onPress={loadActions} disabled={loading}>
        <Text style={styles.refreshText}>{loading ? 'Loading…' : 'Refresh audit log'}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>Supabase error: {error}</Text> : null}
      <View style={styles.list}>
        {actions.length === 0 && !loading ? <Text style={styles.mutedText}>No admin actions yet.</Text> : null}
        {actions.map(action => (
          <View key={action.id} style={styles.row}>
            <Text style={styles.rowTitle}>{action.action ?? 'Action'}</Text>
            <Text style={styles.rowMeta}>Admin: {action.admin_id ?? 'N/A'}</Text>
            <Text style={styles.rowMeta}>Reason: {action.reason ?? 'N/A'}</Text>
            {action.shift_id ? <Text style={styles.rowMeta}>Shift: {action.shift_id}</Text> : null}
            <Text style={styles.rowMeta}>{new Date(action.created_at).toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </PortalLayout>
  );
}

const styles = StyleSheet.create({
  refreshButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  refreshText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  list: {
    gap: 12,
  },
  row: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  rowTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  rowMeta: {
    color: '#6B7280',
    fontSize: 12,
  },
  errorText: {
    color: '#B91C1C',
  },
  mutedText: {
    color: '#6B7280',
  },
});
