import { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { DollarSign, TrendingUp, ShoppingBag, ArrowLeft } from 'lucide-react';
import { db, type Order } from './lib/db';

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const data = await db.orders.toArray();
      setOrders(data);
    };
    fetchOrders();
  }, []);

  const totalSales = useMemo(() => orders.reduce((sum, o) => sum + o.totalAmount, 0), [orders]);
  const orderCount = orders.length;
  // Assume a 25% margin for Net Profit
  const netProfit = useMemo(() => totalSales * 0.25, [totalSales]); 

  const paymentModes = useMemo(() => {
    const modes = { CASH: 0, CARD: 0, UPI: 0 };
    orders.forEach(o => {
      if (o.paymentMethod) modes[o.paymentMethod] += o.totalAmount;
    });
    return [
      { name: 'Cash', value: modes.CASH, color: '#22c55e' },
      { name: 'Card', value: modes.CARD, color: '#3b82f6' },
      { name: 'UPI', value: modes.UPI, color: '#a855f7' }
    ].filter(m => m.value > 0);
  }, [orders]);

  const topItems = useMemo(() => {
    const itemCounts: Record<string, number> = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(itemCounts)
      .map(([name, count]) => ({ name, sales: count }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="flex flex-col h-screen bg-neutral-50 font-sans text-neutral-900 overflow-y-auto">
      <header className="bg-white border-b border-neutral-200 p-4 lg:p-6 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <button 
            onClick={onBack}
            className="mr-4 p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg transition-colors flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-1" /> Back to POS
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Owner Dashboard</h1>
            <p className="text-sm text-neutral-500 font-medium">Overview & Analytics</p>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">Total Sales</p>
              <p className="text-2xl font-bold text-neutral-900">${totalSales.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">Net Profit (Est.)</p>
              <p className="text-2xl font-bold text-neutral-900">${netProfit.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-4">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">Total Orders</p>
              <p className="text-2xl font-bold text-neutral-900">{orderCount}</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Items Bar Chart */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-900 mb-6">Top 5 Selling Items</h3>
            <div className="h-72 w-full">
              {topItems.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItems} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#737373', fontSize: 12 }} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#737373', fontSize: 12 }} 
                    />
                    <RechartsTooltip 
                      cursor={{ fill: '#f5f5f5' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="sales" fill="#171717" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-400">
                  No sales data available yet
                </div>
              )}
            </div>
          </div>

          {/* Payment Mode Pie Chart */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-900 mb-6">Revenue by Payment Mode</h3>
            <div className="h-72 w-full">
              {paymentModes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentModes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentModes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-400">
                  No payment data available yet
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
