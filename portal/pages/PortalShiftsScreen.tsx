import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PortalLayout from '../components/PortalLayout';
import { supabase } from '../lib/supabaseClient';
import { usePortalAuth } from '../lib/portalAuth';

type ShiftRow = {
  id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  status: string | null;
  started_at: string | null;
  ended_at: string | null;
};

export default function PortalShiftsScreen() {
  const navigation = useNavigation();
  const { session } = usePortalAuth();
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endingShiftId, setEndingShiftId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [reasonForShift, setReasonForShift] = useState<string | null>(null);

  const loadShifts = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('shifts')
      .select('id,driver_id,vehicle_id,status,started_at,ended_at')
      .order('started_at', { ascending: false });

    if (activeOnly) {
      query = query.is('ended_at', null);
    }

    const { data, error: shiftsError } = await query;
    if (shiftsError) {
      setError(shiftsError.message);
    }
    setShifts(data ?? []);
    setLoading(false);
  }, [activeOnly]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const selectedShift = useMemo(() => shifts.find(shift => shift.id === reasonForShift), [reasonForShift, shifts]);

  const handleForceEnd = async () => {
    if (!reasonForShift || !reason.trim()) {
      setError('Provide a reason for the force end action.');
      return;
    }

    setEndingShiftId(reasonForShift);
    setError(null);

    const { error: endError } = await supabase
      .from('shifts')
      .update({ ended_at: new Date().toISOString(), status: 'ended' })
      .eq('id', reasonForShift);

    if (endError) {
      setError(endError.message);
      setEndingShiftId(null);
      return;
    }

    const adminId = session?.user.id ?? null;
    const { error: logError } = await supabase.from('admin_actions').insert({
      admin_id: adminId,
      action: 'force_end_shift',
      reason: reason.trim(),
      shift_id: reasonForShift,
    });

    if (logError) {
      setError(logError.message);
    }

    setReason('');
    setReasonForShift(null);
    setEndingShiftId(null);
    await loadShifts();
  };

  return (
    <PortalLayout title="Shifts">
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.toggle, activeOnly && styles.toggleActive]}
          onPress={() => setActiveOnly(prev => !prev)}
        >
          <Text style={styles.toggleText}>{activeOnly ? 'Showing active shifts' : 'Showing all shifts'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshButton} onPress={loadShifts} disabled={loading}>
          <Text style={styles.refreshText}>{loading ? 'Loading…' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>Supabase error: {error}</Text> : null}

      <View style={styles.table}>
        {shifts.length === 0 && !loading ? <Text style={styles.mutedText}>No shifts found.</Text> : null}
        {shifts.map(shift => (
          <View key={shift.id} style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>Shift {shift.id}</Text>
              <Text style={styles.rowMeta}>Driver: {shift.driver_id ?? 'N/A'}</Text>
              <Text style={styles.rowMeta}>Vehicle: {shift.vehicle_id ?? 'N/A'}</Text>
              <Text style={styles.rowMeta}>Started: {shift.started_at ?? 'N/A'}</Text>
              <Text style={styles.rowMeta}>Ended: {shift.ended_at ?? 'Active'}</Text>
            </View>
            <View style={styles.rowActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('PortalShiftDetail' as never, { shiftId: shift.id } as never)}
              >
                <Text style={styles.actionButtonText}>View details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, shift.ended_at && styles.disabledButton]}
                onPress={() => setReasonForShift(shift.id)}
                disabled={Boolean(shift.ended_at) || endingShiftId === shift.id}
              >
                <Text style={styles.actionButtonText}>{endingShiftId === shift.id ? 'Ending…' : 'Force end'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {reasonForShift && selectedShift ? (
        <View style={styles.reasonCard}>
          <Text style={styles.reasonTitle}>Force end shift {selectedShift.id}</Text>
          <TextInput
            style={styles.reasonInput}
            placeholder="Reason for admin override"
            value={reason}
            onChangeText={setReason}
          />
          <View style={styles.reasonActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleForceEnd} disabled={endingShiftId !== null}>
              <Text style={styles.primaryButtonText}>Confirm force end</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setReasonForShift(null);
                setReason('');
              }}
              disabled={endingShiftId !== null}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </PortalLayout>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  toggle: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: '#111827',
  },
  toggleText: {
    color: '#111827',
  },
  refreshButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  table: {
    gap: 12,
  },
  row: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  rowMain: {
    flex: 1,
    minWidth: 220,
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
  rowActions: {
    gap: 8,
    alignItems: 'flex-start',
  },
  actionButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  reasonCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  reasonTitle: {
    fontWeight: '700',
    color: '#92400E',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  reasonActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#B45309',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#92400E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#92400E',
    fontWeight: '600',
  },
  errorText: {
    color: '#B91C1C',
  },
  mutedText: {
    color: '#6B7280',
  },
});
