import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PortalLayout from '../components/PortalLayout';
import { supabase } from '../lib/supabaseClient';

type Vehicle = {
  id: string;
  registration: string | null;
  type: string | null;
  depot: string | null;
};

const EMPTY_FORM = { registration: '', type: '', depot: '' };

export default function PortalVehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id,registration,type,depot')
      .order('registration', { ascending: true });

    if (vehiclesError) {
      setError(vehiclesError.message);
    }
    setVehicles(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const handleEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setForm({
      registration: vehicle.registration ?? '',
      type: vehicle.type ?? '',
      depot: vehicle.depot ?? '',
    });
  };

  const handleSave = async () => {
    if (!form.registration.trim()) {
      setError('Registration is required.');
      return;
    }

    setSaving(true);
    setError(null);

    if (editingId) {
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          registration: form.registration.trim(),
          type: form.type.trim() || null,
          depot: form.depot.trim() || null,
        })
        .eq('id', editingId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from('vehicles')
        .insert({
          registration: form.registration.trim(),
          type: form.type.trim() || null,
          depot: form.depot.trim() || null,
        });

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setForm(EMPTY_FORM);
    setEditingId(null);
    setSaving(false);
    await loadVehicles();
  };

  return (
    <PortalLayout title="Vehicles">
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>{editingId ? 'Edit vehicle' : 'Add vehicle'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Registration"
          value={form.registration}
          onChangeText={value => setForm(prev => ({ ...prev, registration: value }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Type"
          value={form.type}
          onChangeText={value => setForm(prev => ({ ...prev, type: value }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Depot"
          value={form.depot}
          onChangeText={value => setForm(prev => ({ ...prev, depot: value }))}
        />
        {error ? <Text style={styles.errorText}>Supabase error: {error}</Text> : null}
        <View style={styles.formActions}>
          <TouchableOpacity style={[styles.primaryButton, saving && styles.disabledButton]} onPress={handleSave} disabled={saving}>
            <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save vehicle'}</Text>
          </TouchableOpacity>
          {editingId ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
              disabled={saving}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.list}>
        {loading ? <Text style={styles.mutedText}>Loading vehicles…</Text> : null}
        {vehicles.length === 0 && !loading ? <Text style={styles.mutedText}>No vehicles found.</Text> : null}
        {vehicles.map(vehicle => (
          <View key={vehicle.id} style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{vehicle.registration ?? 'Unassigned'}</Text>
              <Text style={styles.rowMeta}>Type: {vehicle.type ?? 'N/A'}</Text>
              <Text style={styles.rowMeta}>Depot: {vehicle.depot ?? 'N/A'}</Text>
            </View>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => handleEdit(vehicle)} disabled={saving}>
              <Text style={styles.secondaryButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </PortalLayout>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  formTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#111827',
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
    borderColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#111827',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  rowMain: {
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
  disabledButton: {
    opacity: 0.6,
  },
});
