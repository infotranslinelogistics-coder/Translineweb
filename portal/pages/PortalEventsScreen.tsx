import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PortalLayout from '../components/PortalLayout';
import { supabase } from '../lib/supabaseClient';

type EventRow = {
  id: string;
  event_type: string | null;
  created_at: string;
  shift_id: string | null;
  driver_id?: string | null;
};

export default function PortalEventsScreen() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    driverId: '',
    shiftId: '',
    eventType: '',
    startDate: '',
    endDate: '',
  });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('events')
      .select('id,event_type,created_at,shift_id,driver_id')
      .order('created_at', { ascending: false });

    if (filters.driverId.trim()) {
      query = query.eq('driver_id', filters.driverId.trim());
    }

    if (filters.shiftId.trim()) {
      query = query.eq('shift_id', filters.shiftId.trim());
    }

    if (filters.eventType.trim()) {
      query = query.eq('event_type', filters.eventType.trim());
    }

    if (filters.startDate.trim()) {
      query = query.gte('created_at', filters.startDate.trim());
    }

    if (filters.endDate.trim()) {
      query = query.lte('created_at', filters.endDate.trim());
    }

    const { data, error: eventsError } = await query;
    if (eventsError) {
      setError(eventsError.message);
    }
    setEvents(data ?? []);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <PortalLayout title="Events">
      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>Filters</Text>
        <View style={styles.filterRow}>
          <TextInput
            style={styles.input}
            placeholder="Driver ID"
            value={filters.driverId}
            onChangeText={value => setFilters(prev => ({ ...prev, driverId: value }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Shift ID"
            value={filters.shiftId}
            onChangeText={value => setFilters(prev => ({ ...prev, shiftId: value }))}
          />
        </View>
        <View style={styles.filterRow}>
          <TextInput
            style={styles.input}
            placeholder="Event type"
            value={filters.eventType}
            onChangeText={value => setFilters(prev => ({ ...prev, eventType: value }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Start date (YYYY-MM-DD)"
            value={filters.startDate}
            onChangeText={value => setFilters(prev => ({ ...prev, startDate: value }))}
          />
          <TextInput
            style={styles.input}
            placeholder="End date (YYYY-MM-DD)"
            value={filters.endDate}
            onChangeText={value => setFilters(prev => ({ ...prev, endDate: value }))}
          />
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadEvents} disabled={loading}>
          <Text style={styles.refreshText}>{loading ? 'Loading…' : 'Apply filters'}</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>Supabase error: {error}</Text> : null}

      <View style={styles.list}>
        {loading ? <Text style={styles.mutedText}>Loading events…</Text> : null}
        {events.length === 0 && !loading ? <Text style={styles.mutedText}>No events found.</Text> : null}
        {events.map(event => (
          <View key={event.id} style={styles.row}>
            <Text style={styles.rowTitle}>{event.event_type ?? 'Event'}</Text>
            <Text style={styles.rowMeta}>{new Date(event.created_at).toLocaleString()}</Text>
            <Text style={styles.rowMeta}>Shift: {event.shift_id ?? 'N/A'}</Text>
            <Text style={styles.rowMeta}>Driver: {event.driver_id ?? 'N/A'}</Text>
          </View>
        ))}
      </View>
    </PortalLayout>
  );
}

const styles = StyleSheet.create({
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  filterTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 180,
    backgroundColor: '#FFFFFF',
  },
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
