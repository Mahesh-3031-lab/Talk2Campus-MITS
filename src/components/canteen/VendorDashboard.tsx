import { useState } from 'react';
import { ArrowLeft, LogOut, ClipboardList, UtensilsCrossed, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VendorOrderList from '@/components/canteen/VendorOrderList';
import MenuManagement from '@/components/canteen/MenuManagement';

interface VendorDashboardProps {
  vendorId: string;
  vendorName: string;
  onLogout: () => void;
  onBack: () => void;
}

type Tab = 'orders' | 'menu' | 'analytics';

export default function VendorDashboard({ vendorId, vendorName, onLogout, onBack }: VendorDashboardProps) {
  const [tab, setTab] = useState<Tab>('orders');

  if (tab === 'orders') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
        {/* Tab Bar */}
        <div className="bg-card/80 border-b border-border/30 px-4">
          <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
            {([
              { key: 'orders' as Tab, icon: ClipboardList, label: 'Orders' },
              { key: 'menu' as Tab, icon: UtensilsCrossed, label: 'Menu' },
              { key: 'analytics' as Tab, icon: BarChart3, label: 'Analytics' },
            ]).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <VendorOrderList vendorId={vendorId} vendorName={vendorName} onLogout={onLogout} onBack={onBack} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="rounded-full p-2.5 hover:bg-muted transition-all">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">{vendorName}</h1>
              <p className="text-xs text-muted-foreground">Vendor Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="rounded-full text-destructive hover:bg-destructive/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="bg-card/80 border-b border-border/30 px-4">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {([
            { key: 'orders' as Tab, icon: ClipboardList, label: 'Orders' },
            { key: 'menu' as Tab, icon: UtensilsCrossed, label: 'Menu' },
            { key: 'analytics' as Tab, icon: BarChart3, label: 'Analytics' },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {tab === 'menu' && <MenuManagement vendorId={vendorId} />}
          {tab === 'analytics' && (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-semibold">Analytics Coming Soon</p>
              <p className="text-sm mt-1">Track orders, revenue and popular items</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
