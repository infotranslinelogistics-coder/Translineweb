-- Migration: Fix Admin Portal - Add RLS policies and storage bucket for odometer photos

-- Create odometer photos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('odometer-photos', 'odometer-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Add admin policies for fuel_logs
CREATE POLICY IF NOT EXISTS "fuel_logs_admin_all" ON public.fuel_logs 
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Add admin policies for incidents  
CREATE POLICY IF NOT EXISTS "incidents_admin_all" ON public.incidents 
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Add admin policies for notes
CREATE POLICY IF NOT EXISTS "notes_admin_all" ON public.notes 
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Add storage policy for admins to read odometer photos
CREATE POLICY IF NOT EXISTS "admins_read_odometer_photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'odometer-photos' 
  AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Add storage policy for drivers to insert their own odometer photos
CREATE POLICY IF NOT EXISTS "drivers_insert_own_odometer_photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'odometer-photos'
  AND auth.uid() IS NOT NULL
);
