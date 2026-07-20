import { useState } from 'react';
import { ArrowLeft, Minus, Plus, Trash2, Loader2, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CartItem } from '@/hooks/useCanteenCart';

interface OrderCheckoutProps {
  items: CartItem[];
  totalPrice: number;
  studentRollNumber: string;
  vendorName: string;
  vendorLocation?: string;
  prepTime: number;
  onUpdateQuantity: (menuItemId: string, qty: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onClearCart: () => void;
  onPlaceOrder: () => void;
  onBack: () => void;
  isPlacing: boolean;
}

export default function OrderCheckout({
  items, totalPrice, studentRollNumber, vendorName, vendorLocation, prepTime,
  onUpdateQuantity, onRemoveItem, onClearCart, onPlaceOrder, onBack, isPlacing
}: OrderCheckoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      <header className="p-4 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="glass rounded-full p-3 hover:bg-primary/10 transition-all group">
            <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-primary" />
          </button>
          <h1 className="font-display text-lg font-semibold text-foreground">Checkout</h1>
        </div>
        {items.length > 0 && (
          <button onClick={onClearCart} className="text-sm text-destructive hover:underline">Clear All</button>
        )}
      </header>

      <main className="flex-1 p-4 pb-32 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Order From */}
          <div className="glass rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-foreground">{vendorName}</span>
            </div>
            {vendorLocation && (
              <p className="text-xs text-muted-foreground ml-6">📍 {vendorLocation}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Estimated prep: ~{prepTime} mins</span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <h2 className="font-semibold text-foreground text-sm px-1">Your Items</h2>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-3xl mb-2">🛒</p>
                <p className="text-sm">Your cart is empty</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.menuItemId} className="flex items-center gap-3 glass rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate">{item.name}</h3>
                    <p className="text-sm font-bold text-foreground mt-0.5">₹{item.price * item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border border-border rounded-lg">
                      <button onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)} className="p-1.5 hover:bg-muted rounded-l-lg">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)} className="p-1.5 hover:bg-muted rounded-r-lg">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button onClick={() => onRemoveItem(item.menuItemId)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bill Summary */}
          {items.length > 0 && (
            <div className="glass rounded-2xl p-4 space-y-3">
              <h2 className="font-semibold text-foreground text-sm">Bill Summary</h2>
              <div className="space-y-2 text-sm">
                {items.map(item => (
                  <div key={item.menuItemId} className="flex justify-between text-muted-foreground">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
                  <span>Total</span>
                  <span>₹{totalPrice}</span>
                </div>
              </div>
            </div>
          )}

          {/* Student Info */}
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Ordering as</p>
            <p className="font-semibold text-foreground">{studentRollNumber}</p>
          </div>
        </div>
      </main>

      {/* Place Order Button */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-50">
          <Button
            onClick={onPlaceOrder}
            disabled={isPlacing}
            className="w-full max-w-2xl mx-auto h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-base shadow-xl"
          >
            {isPlacing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Placing Order...
              </>
            ) : (
              <>Place Order • ₹{totalPrice}</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
