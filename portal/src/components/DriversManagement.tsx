import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Lock, Unlock } from 'lucide-react';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { fetchDrivers } from '../lib/api';
import { supabase } from '../lib/supabase-client';

export default function DriversManagement() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState({
    open: false,
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    fetchDriversData();
  }, []);

  const fetchDriversData = async () => {
    try {
      const data = await fetchDrivers();
      setDrivers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setLoading(false);
    }
  };

  const handleCreateDriver = async () => {
    if (!createDialog.name.trim()) {
      alert('Please enter a driver name');
      return;
    }

    try {
      const { error } = await supabase.from('profiles').insert({
        full_name: createDialog.name,
        email: createDialog.email,
        phone: createDialog.phone,
        role: 'driver',
      });

      if (error) throw error;

      setCreateDialog({ open: false, name: '', email: '', phone: '' });
      fetchDriversData();
      alert('Driver created successfully');
    } catch (error) {
      console.error('Error creating driver:', error);
      alert('Failed to create driver');
    }
  };

  const handleToggleStatus = async (driverId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this driver?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', driverId);

      if (error) throw error;

      fetchDriversData();
      alert(`Driver ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating driver:', error);
      alert('Failed to update driver status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading drivers...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Drivers Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage driver accounts and permissions</p>
        </div>
        <Button onClick={() => setCreateDialog({ open: true, name: '', email: '', phone: '' })}>
          <Users className="w-4 h-4 mr-2" />
          Add Driver
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-border hover:bg-muted/30">
              <TableHead className="text-xs font-bold text-foreground uppercase">Status</TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase">Name</TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase">Email</TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase">Phone</TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase">Last Login</TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase">Created</TableHead>
              <TableHead className="text-xs font-bold text-foreground uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No drivers found
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => (
                <TableRow key={driver.id} className="border-b border-border hover:bg-muted/20">
                  <TableCell>
                    {driver.status === 'active' ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#10b981]" />
                        <span className="text-xs text-[#10b981] font-medium">ACTIVE</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-medium">INACTIVE</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">{driver.full_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{driver.email || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{driver.phone || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {driver.last_login ? new Date(driver.last_login).toLocaleString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(driver.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant={driver.status === 'active' ? 'destructive' : 'default'}
                        onClick={() => handleToggleStatus(driver.id, driver.status)}
                        className="text-xs"
                      >
                        {driver.status === 'active' ? (
                          <>
                            <Lock className="w-3 h-3 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Driver Dialog */}
      <Dialog open={createDialog.open} onOpenChange={(open: boolean) => setCreateDialog({ ...createDialog, open })}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
            <DialogDescription>
              Create a new driver account. The driver will be able to log in and manage shifts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Name (Required)</label>
              <Input
                placeholder="John Doe"
                value={createDialog.name}
                onChange={(e) => setCreateDialog({ ...createDialog, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={createDialog.email}
                onChange={(e) => setCreateDialog({ ...createDialog, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Phone</label>
              <Input
                placeholder="555-0101"
                value={createDialog.phone}
                onChange={(e) => setCreateDialog({ ...createDialog, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog({ open: false, name: '', email: '', phone: '' })}>
              Cancel
            </Button>
            <Button onClick={handleCreateDriver}>Create Driver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
