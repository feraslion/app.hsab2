import { useState, useMemo } from 'react';
import { Product, Customer, Invoice, Expense } from '../types';
import { TrendingUp, ShoppingBag, Landmark, ArrowUpRight, DollarSign, AlertCircle, FileText, Calendar, Wallet } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  expenses: Expense[];
  onNavigate: (tab: string) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export default function Dashboard({ products, customers, invoices, expenses, onNavigate, onViewInvoice }: DashboardProps) {
  const [timeRange, setTimeRange] = useState<'all' | '30days' | '7days'>('all');

  // Filter invoices and expenses by selected time range
  const filteredData = useMemo(() => {
    const now = new Date();
    let minDate = new Date(0); // Epoch

    if (timeRange === '30days') {
      minDate = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    } else if (timeRange === '7days') {
      minDate = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    }

    const filteredInvoices = invoices.filter(inv => new Date(inv.createdAt) >= minDate);
    const filteredExpenses = expenses.filter(exp => new Date(exp.date) >= minDate);

    return { filteredInvoices, filteredExpenses };
  }, [invoices, expenses, timeRange]);

  // Statistics calculations
  const stats = useMemo(() => {
    const { filteredInvoices, filteredExpenses } = filteredData;

    // Total sales revenue
    const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0);

    // Cost of sold goods (COGS) to calculate net profit
    let cogs = 0;
    filteredInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const cost = product ? product.costPrice : (item.unitPrice * 0.7); // Fallback cost to 70% if product deleted
        cogs += cost * item.quantity;
      });
    });

    // Total expenses
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Net profit = sales revenue - COGS - expenses
    const grossProfit = totalSales - cogs;
    const netProfit = grossProfit - totalExpenses;

    // Current total stock valuation (cost and sale values)
    const stockCostValue = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);
    const stockSaleValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    // Low stock items counter
    const lowStockCount = products.filter(p => p.stock <= p.minStockAlert).length;

    // Total customer receivables/debts
    const customerDebts = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);

    return {
      totalSales,
      netProfit,
      totalExpenses,
      stockCostValue,
      stockSaleValue,
      lowStockCount,
      customerDebts,
      cogs
    };
  }, [products, customers, filteredData]);

  // Low stock warning items
  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stock <= p.minStockAlert).slice(0, 5);
  }, [products]);

  // Daily sales chart data preparing (last 7 days)
  const chartData = useMemo(() => {
    const days = 7;
    const result = [];
    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const dayName = arabicDays[d.getDay()];

      // calculate sales for this day
      const dailySales = invoices
        .filter(inv => inv.createdAt.startsWith(dateString))
        .reduce((sum, inv) => sum + inv.finalAmount, 0);

      result.push({
        label: dayName,
        value: dailySales,
        date: dateString
      });
    }

    return result;
  }, [invoices]);

  const maxSalesInChart = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.value));
    return max > 0 ? max : 100;
  }, [chartData]);

  // Expense categories percentage
  const expenseBreakdown = useMemo(() => {
    const categories: Record<string, number> = {};
    expenses.forEach(exp => {
      categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
    });

    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0) || 1;

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100)
    })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* Top filter section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900">نظرة عامة على الأداء</h1>
          <p className="text-xs text-gray-500 mt-1">تابع إيراداتك ومبيعاتك وحالة مخزونك الحالي في الوقت الفعلي.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${timeRange === 'all' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
          >
            كل الأوقات
          </button>
          <button
            onClick={() => setTimeRange('30days')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${timeRange === '30days' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
          >
            آخر 30 يوم
          </button>
          <button
            onClick={() => setTimeRange('7days')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${timeRange === '7days' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
          >
            آخر 7 أيام
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs relative overflow-hidden group hover:border-emerald-200 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">إجمالي المبيعات (الإيرادات)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2 font-mono">{stats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-sans text-gray-500">ر.س</span></h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5 mr-1 ml-1" />
            <span>مبيعات فواتير السلع المعتمدة</span>
          </div>
        </div>

        {/* Card 2: Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs relative overflow-hidden group hover:border-blue-200 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">صافي الأرباح (بعد المصاريف)</p>
              <h3 className={`text-2xl font-bold mt-2 font-mono ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs font-sans text-gray-500"> ر.س</span>
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${stats.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            هامش ربح إجمالي مخصوم منه التكاليف والمصاريف
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs relative overflow-hidden group hover:border-red-200 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">إجمالي المصروفات تشغيلياً</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2 font-mono">{stats.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-sans text-gray-500">ر.س</span></h3>
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-red-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-red-500 font-medium">
            <span>تشمل الإيجارات، الفواتير، والمشتريات الأخرى</span>
          </div>
        </div>

        {/* Card 4: Inventory Valuation & Low Stock */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs relative overflow-hidden group hover:border-amber-200 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">قيمة المخزون الحالي (بسعر التكلفة)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2 font-mono">{stats.stockCostValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-sans text-gray-500">ر.س</span></h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-gray-500">سعر البيع المقدر: {stats.stockSaleValue.toLocaleString()} ر.س</span>
            {stats.lowStockCount > 0 && (
              <span className="bg-red-50 text-red-600 font-medium px-2 py-0.5 rounded-sm flex items-center gap-1 animate-pulse">
                <AlertCircle className="w-3 h-3" />
                {stats.lowStockCount} سلع منخفضة
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Charts & Warning list Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Sales Custom Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-gray-900">مخطط حركة المبيعات اليومية</h3>
              <p className="text-xs text-gray-500 mt-1">حجم المبيعات لآخر 7 أيام عمل متتالية</p>
            </div>
            <div className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md font-medium">
              تحديث مباشر
            </div>
          </div>

          {/* SVG Custom Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-2 pt-6 px-2 border-b border-gray-100 relative">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-[10px] text-gray-400 font-mono">
              <div className="border-b border-gray-50 w-full pt-1 pr-1 text-left">{maxSalesInChart.toFixed(0)} ر.س</div>
              <div className="border-b border-gray-50 w-full pt-1 pr-1 text-left">{(maxSalesInChart * 0.66).toFixed(0)} ر.س</div>
              <div className="border-b border-gray-50 w-full pt-1 pr-1 text-left">{(maxSalesInChart * 0.33).toFixed(0)} ر.س</div>
              <div className="w-full pr-1 text-left">0 ر.س</div>
            </div>

            {/* Individual Bars */}
            {chartData.map((item, idx) => {
              const barHeightPercent = (item.value / maxSalesInChart) * 100;
              const formattedValue = item.value.toLocaleString('en-US');

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group z-10">
                  <div className="relative w-full flex justify-center h-44 items-end">
                    {/* Value Popover Tooltip on Hover */}
                    <div className="absolute -top-6 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 font-mono shadow-md">
                      {formattedValue} ر.س
                    </div>
                    {/* Dynamic Bar */}
                    <div
                      style={{ height: `${Math.max(barHeightPercent, 4)}%` }}
                      className={`w-8 sm:w-10 rounded-t-lg transition-all duration-500 ease-out cursor-pointer hover:opacity-85 ${
                        item.value > 0 ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-xs' : 'bg-gray-100'
                      }`}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-500 mt-2 text-center truncate w-full">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Alerts & Category breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">تنبيهات المخزون الحرج</h3>
              <button
                onClick={() => onNavigate('products')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
              >
                إدارة السلع <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-emerald-500 opacity-60 animate-bounce" />
                <p className="text-xs font-medium text-gray-500">لا توجد سلع منخفضة المخزون!</p>
                <p className="text-[10px] text-gray-400">جميع الكميات ممتازة ومستقرة.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-2.5 rounded-xl bg-amber-50/50 border border-amber-100">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">التصنيف: {p.category}</p>
                    </div>
                    <div className="text-right ml-2">
                      <span className="text-xs font-bold text-red-600 font-mono">{p.stock}</span>
                      <span className="text-[10px] text-gray-500"> / {p.minStockAlert}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expense Breakdown progress list */}
          <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
            <h4 className="text-xs font-bold text-gray-800">توزيع المصروفات حسب الفئة</h4>
            {expenseBreakdown.length === 0 ? (
              <p className="text-[11px] text-gray-400 text-center py-2">لا توجد مصروفات مسجلة بعد.</p>
            ) : (
              <div className="space-y-2">
                {expenseBreakdown.slice(0, 3).map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-gray-600">
                      <span>{item.name}</span>
                      <span className="font-mono">{item.value} ر.س ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className="bg-red-500 h-full rounded-full"
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">سجل الفواتير الأخيرة</h3>
            <p className="text-xs text-gray-500">أحدث فواتير تم إصدارها للعملاء.</p>
          </div>
          <button
            onClick={() => onNavigate('invoices')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1"
          >
            عرض الكل <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400 space-y-2">
            <FileText className="w-12 h-12 mx-auto opacity-30" />
            <p className="text-sm font-medium">لا توجد فواتير مسجلة بعد</p>
            <p className="text-xs text-gray-400">توجه إلى نافذة "فاتورة جديدة" لبدء عملية بيع.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-medium">
                  <th className="pb-3 pt-1 font-bold">رقم الفاتورة</th>
                  <th className="pb-3 pt-1 font-bold">العميل</th>
                  <th className="pb-3 pt-1 font-bold">التاريخ</th>
                  <th className="pb-3 pt-1 font-bold">طريقة الدفع</th>
                  <th className="pb-3 pt-1 font-bold">عدد الأصناف</th>
                  <th className="pb-3 pt-1 text-left font-bold">المجموع الكلي</th>
                  <th className="pb-3 pt-1 text-center font-bold">الخيارات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.slice(-5).reverse().map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 font-medium text-gray-900 font-mono">#{inv.id}</td>
                    <td className="py-3 text-gray-700">{inv.customerName || 'عميل نقدي (عام)'}</td>
                    <td className="py-3 text-gray-500 font-mono">
                      {new Date(inv.createdAt).toLocaleDateString('ar-SA', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        inv.paymentMethod === 'cash' ? 'bg-green-50 text-green-700' :
                        inv.paymentMethod === 'card' ? 'bg-blue-50 text-blue-700' :
                        inv.paymentMethod === 'bank' ? 'bg-purple-50 text-purple-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {inv.paymentMethod === 'cash' ? 'نقدي' :
                         inv.paymentMethod === 'card' ? 'بطاقة مداً' :
                         inv.paymentMethod === 'bank' ? 'تحويل بنكي' : 'آجل / ذمم'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 font-mono">
                      {inv.items.reduce((sum, item) => sum + item.quantity, 0)} أصناف
                    </td>
                    <td className="py-3 text-left font-bold text-gray-900 font-mono">
                      {inv.finalAmount.toFixed(2)} ر.س
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                      >
                        تفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
