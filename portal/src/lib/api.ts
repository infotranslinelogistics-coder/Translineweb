import { supabase } from './supabase-client';

// Fetch dashboard stats
export async function fetchDashboardStats() {
  const { data: shifts } = await supabase
    .from('shifts')
    .select('*')
    .eq('status', 'active');
  
  const { data: drivers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'driver');
  
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*');
  
  const { data: failedEvents } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'failed');

  return {
    activeShiftsCount: shifts?.length || 0,
    activeDriversCount: drivers?.length || 0,
    vehiclesInUseCount: vehicles?.filter(v => v.assigned_driver_id).length || 0,
    alerts: {
      stuckShifts: shifts?.filter(s => {
        const duration = Date.now() - new Date(s.started_at).getTime();
        return duration > 12 * 60 * 60 * 1000;
      }).length || 0,
      missingOdometer: shifts?.filter(s => !s.odometer_photo_url).length || 0,
      failedEvents: failedEvents?.length || 0,
    },
  };
}

// Fetch active shifts
export async function fetchActiveShifts() {
  const { data, error } = await supabase
    .from('shifts')
    .select(`
      *,
      driver:profiles!shifts_driver_id_fkey(id, full_name),
      vehicle:vehicles(id, registration, type)
    `)
    .eq('status', 'active')
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Fetch shift details including events
export async function fetchShiftDetails(shiftId: string) {
  const { data: shift, error: shiftError } = await supabase
    .from('shifts')
    .select(`
      *,
      driver:profiles!shifts_driver_id_fkey(id, full_name, phone),
      vehicle:vehicles(id, registration, type, depot)
    `)
    .eq('id', shiftId)
    .single();

  if (shiftError) throw shiftError;

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .eq('shift_id', shiftId)
    .order('occurred_at', { ascending: true });

  if (eventsError) throw eventsError;

  // Fetch related data
  const { data: fuelLogs } = await supabase
    .from('fuel_logs')
    .select('*')
    .eq('shift_id', shiftId);

  const { data: incidents } = await supabase
    .from('incidents')
    .select('*')
    .eq('shift_id', shiftId);

  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('shift_id', shiftId);

  return {
    shift,
    events: events || [],
    fuelLogs: fuelLogs || [],
    incidents: incidents || [],
    notes: notes || [],
  };
}

// Fetch drivers
export async function fetchDrivers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'driver')
    .order('full_name');

  if (error) throw error;
  return data || [];
}

// Fetch vehicles
export async function fetchVehicles() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('registration');

  if (error) throw error;
  return data || [];
}

// Admin action: Force end shift
export async function forceEndShift(shiftId: string, reason: string, adminName: string) {
  const { error } = await supabase
    .from('shifts')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
      admin_ended_reason: reason,
      admin_ended_by: adminName,
    })
    .eq('id', shiftId);

  if (error) throw error;

  // Log admin action as event
  await supabase.from('events').insert({
    shift_id: shiftId,
    event_type: 'admin_force_end',
    occurred_at: new Date().toISOString(),
    metadata: { reason, admin_name: adminName },
  });
}

// Get odometer photo URL
export async function getOdometerPhotoUrl(path: string) {
  const { data } = supabase.storage
    .from('odometer-photos')
    .getPublicUrl(path);
  
  return data.publicUrl;
}
