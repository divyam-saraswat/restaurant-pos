import { useEffect, useState } from 'react';
import { ShoppingBag, Coffee, Store, CreditCard, Banknote, QrCode, Plus, Minus, Trash2, Printer, LayoutDashboard } from 'lucide-react';
import { db, seedDatabase, type Category, type MenuItem, type Order, type OrderItem } from './lib/db';
import AdminDashboard from './AdminDashboard';

function POSPage({ onGoToAdmin }: { onGoToAdmin: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  useEffect(() => {
    const initDb = async () => {
      await seedDatabase();
      const cats = await db.categories.toArray();
      const items = await db.menuItems.toArray();
      setCategories(cats);
      setMenuItems(items);
    };
    initDb();
  }, []);

  const filteredItems = selectedCategory 
    ? menuItems.filter(item => item.categoryId === selectedCategory)
    : menuItems;

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: crypto.randomUUID(), menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async (method: 'CASH' | 'CARD' | 'UPI') => {
    const newOrder: Order = {
      id: crypto.randomUUID(),
      type: orderType,
      items: cart,
      totalAmount,
      status: 'COMPLETED',
      paymentMethod: method,
      createdAt: Date.now()
    };
    
    await db.orders.add(newOrder);
    setReceiptOrder(newOrder);
    setIsPaymentModalOpen(false);
    setCart([]);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="flex h-screen bg-neutral-50 font-sans text-neutral-900 overflow-hidden">
      {/* Main Content - Menu Grid */}
      <main className="flex-1 flex flex-col h-full overflow-hidden print:hidden">
        <header className="bg-white border-b border-neutral-200 p-4 lg:p-6 flex items-center justify-between shadow-sm z-10">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Terminal</h1>
            <p className="text-sm text-neutral-500 font-medium">Select items to add to order</p>
          </div>
          <div className="flex space-x-2">
            <button onClick={onGoToAdmin} className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg transition-colors flex items-center" title="Dashboard">
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <button className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg transition-colors">
              <Store className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-6 flex-1 overflow-y-auto">
          {/* Categories */}
          <div className="flex space-x-3 overflow-x-auto pb-4 mb-4 scrollbar-hide">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap font-medium text-sm transition-all duration-200 ${!selectedCategory ? 'bg-neutral-900 text-white shadow-md' : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'}`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full whitespace-nowrap font-medium text-sm transition-all duration-200 ${selectedCategory === cat.id ? 'bg-neutral-900 text-white shadow-md' : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md hover:border-neutral-200 active:scale-[0.98] transition-all text-left flex flex-col group h-32"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-800 leading-tight group-hover:text-neutral-950">{item.name}</h3>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-bold text-lg">${item.price.toFixed(2)}</span>
                  <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Cart Sidebar */}
      <aside className="w-96 bg-white border-l border-neutral-200 flex flex-col h-full shadow-xl z-20 print:hidden relative">
        <div className="p-5 border-b border-neutral-100">
          <h2 className="text-xl font-bold flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2 text-neutral-400" /> Current Order
          </h2>
          
          <div className="flex p-1 bg-neutral-100 rounded-lg mt-4">
            <button 
              onClick={() => setOrderType('DINE_IN')}
              className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-semibold transition-all ${orderType === 'DINE_IN' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <Coffee className="w-4 h-4 mr-2" /> Dine-In
            </button>
            <button 
              onClick={() => setOrderType('TAKEAWAY')}
              className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-semibold transition-all ${orderType === 'TAKEAWAY' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <ShoppingBag className="w-4 h-4 mr-2" /> Takeaway
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center group">
                <div className="flex-1 pr-3">
                  <h4 className="font-semibold text-neutral-800 text-sm">{item.name}</h4>
                  <p className="text-neutral-500 text-sm">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-3 bg-neutral-50 rounded-lg p-1 border border-neutral-100">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-neutral-600 hover:text-neutral-900">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-semibold w-4 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-neutral-600 hover:text-neutral-900">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="ml-3 p-2 text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-neutral-100 bg-neutral-50/50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-neutral-500 text-sm">
              <span>Subtotal</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-500 text-sm">
              <span>Tax (0%)</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-neutral-200">
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
          <button 
            disabled={cart.length === 0}
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-md"
          >
            Charge ${totalAmount.toFixed(2)}
          </button>
        </div>
      </aside>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900">Select Payment Method</h3>
              <p className="text-neutral-500 mt-1">Amount due: <span className="font-bold text-neutral-900">${totalAmount.toFixed(2)}</span></p>
            </div>
            <div className="p-6 grid grid-cols-1 gap-3">
              <button onClick={() => handleCheckout('CASH')} className="flex items-center p-4 border border-neutral-200 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition-all">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-4">
                  <Banknote className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold">Cash</div>
                  <div className="text-sm text-neutral-500">Pay with physical currency</div>
                </div>
              </button>
              <button onClick={() => handleCheckout('CARD')} className="flex items-center p-4 border border-neutral-200 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition-all">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-4">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold">Credit / Debit Card</div>
                  <div className="text-sm text-neutral-500">Tap, insert, or swipe</div>
                </div>
              </button>
              <button onClick={() => handleCheckout('UPI')} className="flex items-center p-4 border border-neutral-200 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition-all">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mr-4">
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold">UPI / QR Code</div>
                  <div className="text-sm text-neutral-500">Scan to pay</div>
                </div>
              </button>
            </div>
            <div className="p-4 bg-neutral-50 text-center">
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-neutral-500 hover:text-neutral-900 font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptOrder && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden print:shadow-none print:max-w-full">
            <div className="p-8 pb-4 border-b border-dashed border-neutral-300 flex flex-col items-center">
              <div className="w-12 h-12 bg-neutral-900 text-white rounded-xl flex items-center justify-center mb-3">
                <Store className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">AI POS System</h2>
              <p className="text-sm text-neutral-500 mb-4">123 Main Street, City, Country</p>
              
              <div className="w-full text-xs text-neutral-500 flex justify-between uppercase tracking-wider font-semibold mb-1">
                <span>Order #{receiptOrder.id.substring(0, 8)}</span>
                <span>{new Date(receiptOrder.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="w-full text-xs text-neutral-500 flex justify-between uppercase tracking-wider font-semibold">
                <span>{receiptOrder.type.replace('_', ' ')}</span>
                <span>{receiptOrder.paymentMethod}</span>
              </div>
            </div>

            <div className="p-8 py-4 space-y-3">
              {receiptOrder.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-semibold text-neutral-800">{item.quantity}x</span> <span className="text-neutral-600">{item.name}</span>
                  </div>
                  <span className="text-neutral-900 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="p-8 pt-4 bg-neutral-50 print:bg-white">
              <div className="flex justify-between font-bold text-lg pt-4 border-t border-neutral-200 mb-6">
                <span>Total Paid</span>
                <span>${receiptOrder.totalAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex space-x-3 print:hidden">
                <button onClick={printReceipt} className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold py-3 rounded-xl flex items-center justify-center transition-colors">
                  <Printer className="w-4 h-4 mr-2" /> Print
                </button>
                <button onClick={() => setReceiptOrder(null)} className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-3 rounded-xl transition-colors">
                  New Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<'POS' | 'ADMIN'>('POS');
  
  if (view === 'ADMIN') {
    return <AdminDashboard onBack={() => setView('POS')} />;
  }
  
  return <POSPage onGoToAdmin={() => setView('ADMIN')} />;
}
