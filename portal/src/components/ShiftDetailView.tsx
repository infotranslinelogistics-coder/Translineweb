interface ShiftDetailViewProps {
  shiftId: string | null;
}

export default function ShiftDetailView({ shiftId }: ShiftDetailViewProps) {
  return (
    <div className="p-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Shift Details</h2>
        <p className="text-sm text-muted-foreground mt-1">View shift {shiftId}</p>
      </div>
      <div className="mt-6 p-8 bg-card border border-border rounded-lg text-center">
        <p className="text-muted-foreground">Shift Detail View component coming soon...</p>
      </div>
    </div>
  );
}
