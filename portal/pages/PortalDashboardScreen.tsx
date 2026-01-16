import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PortalLayout from '../components/PortalLayout';
import { supabase } from '../lib/supabaseClient';

type DashboardCounts = {
  activeShifts: number;
  vehicles: number;
};

type RecentEvent = {
  id: string;
  event_type: string | null;
  created_at: string;
  shift_id: string | null;
};

export default function PortalDashboardScreen() {
  const [counts, setCounts] = useState<DashboardCounts>({ activeShifts: 0, vehicles: 0 });
  const [events, setEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [{ count: activeCount, error: activeError }, { count: vehicleCount, error: vehicleError }] = await Promise.all([
      supabase.from('shifts').select('id', { count: 'exact', head: true }).is('ended_at', null),
      supabase.from('vehicles').select('id', { count: 'exact', head: true }),
    ]);

    if (activeError || vehicleError) {
      setError(activeError?.message ?? vehicleError?.message ?? 'Failed to load counts.');
    }

    const { data: recentEvents, error: eventsError } = await supabase
      .from('events')
      .select('id,event_type,created_at,shift_id')
      .order('created_at', { ascending: false })
      .limit(6);

    if (eventsError) {
      setError(eventsError.message);
    }

    setCounts({
      activeShifts: activeCount ?? 0,
      vehicles: vehicleCount ?? 0,
    });
    setEvents(recentEvents ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <PortalLayout title="Dashboard">
      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Active shifts</Text>
          <Text style={styles.cardValue}>{loading ? '…' : counts.activeShifts}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Vehicles</Text>
          <Text style={styles.cardValue}>{loading ? '…' : counts.vehicles}</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>Supabase error: {error}</Text> : null}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Recent events</Text>
        {events.length === 0 && !loading ? <Text style={styles.mutedText}>No recent events.</Text> : null}
        {events.map(event => (
          <View key={event.id} style={styles.eventRow}>
            <Text style={styles.eventType}>{event.event_type ?? 'Unknown event'}</Text>
            <Text style={styles.eventMeta}>{new Date(event.created_at).toLocaleString()}</Text>
            <Text style={styles.eventMeta}>Shift: {event.shift_id ?? 'N/A'}</Text>
          </View>
        ))}
      </View>
    </PortalLayout>
  );
}

const styles = StyleSheet.create({
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    minWidth: 180,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardLabel: {
    color: '#6B7280',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  eventRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    gap: 4,
  },
  eventType: {
    fontWeight: '600',
    color: '#111827',
  },
  eventMeta: {
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
