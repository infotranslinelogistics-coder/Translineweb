import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, AlertTriangle, Users, Truck, Camera, Shield, FileText, Menu } from 'lucide-react';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { OverviewDashboard } from './components/OverviewDashboard';
import { LiveShiftsMonitor } from './components/LiveShiftsMonitor';
import { ShiftDetailView } from './components/ShiftDetailView';
import { EventLogs } from './components/EventLogs';
import { DriversManagement } from './components/DriversManagement';
import { VehiclesManagement } from './components/VehiclesManagement';
import { OdometerReview } from './components/OdometerReview';
import { AdminOverrides } from './components/AdminOverrides';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Button } from './components/ui/button';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-987e9da2`;

function PortalLayout() {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState('overview');
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const seedDatabase = async () => {
    try {
      const response = await fetch(`${API_BASE}/seed`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}` 
        },
      });
      const data = await response.json();
      console.log('Database seeded:', data);
      fetchStats();
      alert('Database seeded successfully!');
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  };

  const handleViewShift = (shiftId: string) => {
    setSelectedShiftId(shiftId);
    setCurrentSection('shift-detail');
    navigate(`/shift/${shiftId}`);
  };

  const handleBackToShifts = () => {
    setSelectedShiftId(null);
    setCurrentSection('shifts');
    navigate('/shifts');
  };

  const navigation = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/' },
    { id: 'shifts', label: 'Live Shifts', icon: Activity, path: '/shifts' },
    { id: 'events', label: 'Event Logs', icon: AlertTriangle, path: '/events' },
    { id: 'drivers', label: 'Drivers', icon: Users, path: '/drivers' },
    { id: 'vehicles', label: 'Vehicles', icon: Truck, path: '/vehicles' },
    { id: 'odometer', label: 'Odometer Review', icon: Camera, path: '/odometer' },
    { id: 'admin', label: 'Admin Overrides', icon: Shield, path: '/admin' },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-[#0f0f11] border-r border-[#27272a] flex flex-col overflow-hidden`}
      >
        <div className="p-4 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#ff6b35] to-[#1e90ff] rounded"></div>
            <div>
              <h1 className="text-sm font-bold text-foreground">LOGISTICS OPS</h1>
              <p className="text-xs text-muted-foreground">Mission Control</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentSection(item.id);
                  navigate(item.path);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#ff6b35] text-[#0a0a0b]'
                    : 'text-[#e5e5e7] hover:bg-[#1e1e20]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#27272a]">
          <Button
            onClick={seedDatabase}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            Seed Test Data
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-[#0f0f11] border-b border-[#27272a] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {navigation.find(n => n.id === currentSection)?.label || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {stats && (
              <>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
                  <span className="text-muted-foreground">System Online</span>
                </div>
                <div className="h-8 w-px bg-[#27272a]"></div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Active Shifts: </span>
                  <span className="text-[#ff6b35] font-bold">{stats.activeShiftsCount}</span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Drivers: </span>
                  <span className="text-[#1e90ff] font-bold">{stats.activeDriversCount}</span>
                </div>
              </>
            )}
            <div className="h-8 w-px bg-[#27272a]"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ff6b35] flex items-center justify-center text-xs font-bold text-[#0a0a0b]">
                AD
              </div>
              <div className="text-xs">
                <div className="font-medium text-foreground">Admin User</div>
                <div className="text-muted-foreground">Administrator</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-background">
          <Routes>
            <Route path="/" element={<OverviewDashboard onViewShift={handleViewShift} />} />
            <Route path="/shifts" element={<LiveShiftsMonitor onViewShift={handleViewShift} />} />
            <Route path="/shift/:shiftId" element={<ShiftDetailView shiftId={selectedShiftId || ''} onBack={handleBackToShifts} />} />
            <Route path="/events" element={<EventLogs />} />
            <Route path="/drivers" element={<DriversManagement />} />
            <Route path="/vehicles" element={<VehiclesManagement />} />
            <Route path="/odometer" element={<OdometerReview onViewShift={handleViewShift} />} />
            <Route path="/admin" element={<AdminOverrides />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/portal">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <PortalLayout />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
