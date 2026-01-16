import React, { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import PortalLayout from '../components/PortalLayout';
import { supabase } from '../lib/supabaseClient';

type ShiftDetail = {
  id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  started_at: string | null;
  ended_at: string | null;
};

type ShiftEvent = {
  id: string;
  event_type: string | null;
  created_at: string;
  shift_id: string | null;
  odometer_photo_path?: string | null;
  photo_path?: string | null;
  photo_url?: string | null;
};

export default function PortalShiftDetailScreen() {
  const route = useRoute<RouteProp<Record<string, { shiftId: string }>, string>>();
  const shiftId = (route.params as { shiftId: string } | undefined)?.shiftId;
  const [shift, setShift] = useState<ShiftDetail | null>(null);
  const [events, setEvents] = useState<ShiftEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!shiftId) {
      setError('Missing shift id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [{ data: shiftData, error: shiftError }, { data: eventsData, error: eventsError }] = await Promise.all([
      supabase
        .from('shifts')
        .select('id,driver_id,vehicle_id,started_at,ended_at')
        .eq('id', shiftId)
        .maybeSingle(),
      supabase
        .from('events')
        .select('id,event_type,created_at,shift_id,odometer_photo_path,photo_path,photo_url')
        .eq('shift_id', shiftId)
        .order('created_at', { ascending: true }),
    ]);

    if (shiftError) {
      setError(shiftError.message);
    }

    if (eventsError) {
      setError(eventsError.message);
    }

    setShift(shiftData ?? null);
    setEvents(eventsData ?? []);
    setLoading(false);
  }, [shiftId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const renderPhotoLink = (label: string, path: string | null | undefined) => {
    if (!path) return null;
    const isUrl = path.startsWith('http');
    return (
      <TouchableOpacity onPress={() => (isUrl ? Linking.openURL(path) : undefined)}>
        <Text style={styles.photoLink}>{label}: {path}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <PortalLayout title="Shift Details">
      {loading ? <Text style={styles.mutedText}>Loading shift details…</Text> : null}
      {error ? <Text style={styles.errorText}>Supabase error: {error}</Text> : null}
      {shift ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shift {shift.id}</Text>
          <Text style={styles.cardMeta}>Driver: {shift.driver_id ?? 'N/A'}</Text>
          <Text style={styles.cardMeta}>Vehicle: {shift.vehicle_id ?? 'N/A'}</Text>
          <Text style={styles.cardMeta}>Started: {shift.started_at ?? 'N/A'}</Text>
          <Text style={styles.cardMeta}>Ended: {shift.ended_at ?? 'Active'}</Text>
        </View>
      ) : null}

      <View style={styles.timeline}>
        <Text style={styles.timelineTitle}>Events timeline</Text>
        {events.length === 0 && !loading ? <Text style={styles.mutedText}>No events logged for this shift.</Text> : null}
        {events.map(event => (
          <View key={event.id} style={styles.timelineRow}>
            <Text style={styles.eventType}>{event.event_type ?? 'Event'}</Text>
            <Text style={styles.eventMeta}>{new Date(event.created_at).toLocaleString()}</Text>
            {renderPhotoLink('Odometer photo', event.odometer_photo_path)}
            {renderPhotoLink('Photo', event.photo_path)}
            {renderPhotoLink('Photo', event.photo_url)}
          </View>
        ))}
      </View>
    </PortalLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  cardTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  cardMeta: {
    color: '#6B7280',
  },
  timeline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  timelineTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  timelineRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
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
  photoLink: {
    color: '#2563EB',
    fontSize: 12,
  },
  mutedText: {
    color: '#6B7280',
  },
  errorText: {
    color: '#B91C1C',
  },
});
