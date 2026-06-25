import { useState, useEffect, useMemo } from 'react';
import { getStorageData, saveProducts, saveCustomers, saveInvoices, saveExpenses } from './lib/storage';
import { ConnectionState, getSyncQueue } from './lib/syncSimulator';
import { Product, Customer, Invoice, Expense } from './types';
import Dashboard from './components/Dashboard';
import ProductManager from './components/ProductManager';
import CustomerManager from './components/CustomerManager';
import InvoiceCreator from './components/InvoiceCreator';
import ExpenseManager from './components/ExpenseManager';
import SyncSimulatorUI from './components/SyncSimulatorUI';
import BackupRestore from './components/BackupRestore';

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Wallet,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Wifi,
  WifiOff,
  User,
  ArrowRightLeft,
  ChevronLeft,
  Settings,
  X,
  FileText
} from 'lucide-react';

export default function App() {
  // Global React States populated from LocalStorage
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Layout states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [connectionState, setConnectionState] = useState<ConnectionState>('online');
  const [queueCount, setQueueCount] = useState(0);

  // Selected Invoice for detail preview popover
  const [previewingInvoice, setPreviewingInvoice] = useState<Invoice | null>(null);

  // AI Advisor States
  const [aiReport, setAiReport] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load all data on mount
  const loadAllData = () => {
    const data = getStorageData();
    setProducts(data.products);
    setCustomers(data.customers);
    setInvoices(data.invoices);
    setExpenses(data.expenses);
    setQueueCount(getSyncQueue().length);
  };

  useEffect(() => {
    loadAllData();

    // Event listener for sync queue changes to update badge counts
    const updateQueueBadge = () => {
      setQueueCount(getSyncQueue().length);
    };
    window.addEventListener('sync_queue_updated', updateQueueBadge);
    return () => {
      window.removeEventListener('sync_queue_updated', updateQueueBadge);
    };
  }, []);

  // Update Products handler
  const handleUpdateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
  };

  // Update Customers handler
  const handleUpdateCustomers = (updatedCustomers: Customer[]) => {
    setCustomers(updatedCustomers);
    saveCustomers(updatedCustomers);
  };

  // Update Expenses handler
  const handleUpdateExpenses = (updatedExpenses: Expense[]) => {
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
  };

  // Add new Invoice handler
  const handleAddInvoice = (newInvoice: Invoice) => {
    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);
    saveInvoices(updatedInvoices);
  };

  // Generate automated AI insights report
  const generateAIReport = async () => {
    setIsAiLoading(true);
    setAiReport('');

    // Prepare a structured financial summary payload
    const totalSales = invoices.reduce((sum, inv) => sum + inv.finalAmount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const lowStockItems = products.filter(p => p.stock <= p.minStockAlert).map(p => `${p.name} (المتبقي: ${p.stock})`);
    const totalCustomersCount = customers.length - 1; // subtract general guest client
    
    const summaryData = {
      sales: totalSales,
      expenses: totalExpenses,
      lowStock: lowStockItems,
      customers: totalCustomersCount,
      productsCount: products.length
    };

    try {
      const response = await fetch('/api/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summaryData)
      });

      if (response.ok) {
        const data = await response.json();
        setAiReport(data.report);
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      // Offline/Fallback simulation logic when Gemini API key is missing or server is offline
      setTimeout(() => {
        const fallbackText = `### 📊 تقرير المستشار المالي والتحليلي بالـ AI (الوضع الافتراضي):

بناءً على تحليل البيانات المالية الحالية لمتجر **حساب اب**، إليك أبرز المؤشرات والتوصيات الذكية لتحسين العوائد والتشغيل:

1. **📈 تقييم حجم الإيرادات**:
   - إجمالي المبيعات المحققة هو **${totalSales.toFixed(2)} ر.س**. الحركة جيدة جداً مقارنة بالمصروفات العامة البالغة **${totalExpenses.toFixed(2)} ر.س**. نسبة المصروفات إلى المبيعات آمنة وفي الحدود الممتازة.

2. **⚠️ سلامة المستودعات والمخزون**:
   - تم رصد **${lowStockItems.length}** سلع قاربت على النفاد من المستودع.
   ${lowStockItems.length > 0 ? `   - نوصي بسرعة توريد المنتجات التالية: **${lowStockItems.slice(0, 3).join('، ')}** لمنع خسارة مبيعات محتملة.` : '   - جميع السلع مستقرة ومؤشرات التوريد تقع ضمن النطاق الآمن.'}

3. **💡 فرص تعظيم صافي الأرباح**:
   - قم بالتركيز على السلع ذات الهوامش المرتفعة وتجنب البيع الآجل المفرط لحسابات العملاء الآجل للمحافظة على تدفقات السيولة النقدية اليومية مرتفعة لسداد التزامات الموردين.
   
*ملاحظة: يمكنك إعداد مفتاح GEMINI_API_KEY لتفعيل المحادثة بالذكاء الاصطناعي الحي مع خوادم Google.*`;
        setAiReport(fallbackText);
      }, 1500);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir="rtl">
      {/* HEADER BAR */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-40 shadow-xs">
        {/* Logo and store title */}
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-xl text-white shadow-md shadow-emerald-200">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-gray-900 leading-tight">HisabApp | حساب اب</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">نظام المحاسبة وإدارة نقاط البيع الذكي Offline-First</p>
          </div>
        </div>

        {/* Global Connection & Sync Indicators */}
        <div className="flex items-center gap-3">
          {/* Connection state pill */}
          <div
            onClick={() => setActiveTab('sync-hub')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-extrabold cursor-pointer transition-all border ${
              connectionState === 'online'
                ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
            }`}
          >
            {connectionState === 'online' ? <Wifi className="w-3.5 h-3.5 animate-pulse" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connectionState === 'online' ? 'متصل بالسحابة' : 'وضع عدم الاتصال'}
          </div>

          {/* Unsynced queue badge */}
          {queueCount > 0 && (
            <div
              onClick={() => setActiveTab('sync-hub')}
              className="bg-amber-500 text-white px-2.5 py-1 rounded-xl text-[9px] font-bold cursor-pointer hover:bg-amber-600 flex items-center gap-1 animate-pulse"
            >
              <RefreshCw className="w-3 h-3 animate-spin" />
              {queueCount} عملية معلقة للتزامن
            </div>
          )}

          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

          {/* Mock user profile */}
          <div className="items-center gap-2 hidden sm:flex">
            <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
              م
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-gray-800 block">مدير النظام</span>
              <span className="text-[9px] text-gray-400 block">متجر التجزئة العام</span>
            </div>
          </div>
        </div>
      </header>

      {/* CORE FRAMEWORK CONTAINER */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* SIDEBAR TABS (RIGHT SIDE IN ARABIC RTL) */}
        <aside className="w-full md:w-64 bg-white border-l border-gray-100 p-4 space-y-1 md:space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible no-scrollbar shrink-0 sticky top-16 z-30">
          {[
            { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
            { id: 'new-invoice', label: 'فاتورة جديدة (POS)', icon: ShoppingCart },
            { id: 'products', label: 'السلع والمخزن', icon: Package },
            { id: 'customers', label: 'حسابات العملاء', icon: Users },
            { id: 'expenses', label: 'سجل المصروفات', icon: Wallet },
            { id: 'sync-hub', label: 'مركز التزامن', icon: RefreshCw, badge: queueCount },
            { id: 'ai-advisor', label: 'المستشار الذكي بالـ AI', icon: Sparkles },
            { id: 'backup', label: 'الأمان والنسخ', icon: Settings }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-auto md:w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100/50'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`mr-auto px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                    isActive ? 'bg-white text-emerald-700' : 'bg-amber-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* WORKSPACE CENTRAL SCREEN */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-hidden">
          {activeTab === 'dashboard' && (
            <Dashboard
              products={products}
              customers={customers}
              invoices={invoices}
              expenses={expenses}
              onNavigate={setActiveTab}
              onViewInvoice={setPreviewingInvoice}
            />
          )}

          {activeTab === 'new-invoice' && (
            <InvoiceCreator
              products={products}
              customers={customers}
              onUpdateProducts={handleUpdateProducts}
              onUpdateCustomers={handleUpdateCustomers}
              onAddInvoice={handleAddInvoice}
            />
          )}

          {activeTab === 'products' && (
            <ProductManager
              products={products}
              onUpdateProducts={handleUpdateProducts}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerManager
              customers={customers}
              onUpdateCustomers={handleUpdateCustomers}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseManager
              expenses={expenses}
              onUpdateExpenses={handleUpdateExpenses}
            />
          )}

          {activeTab === 'sync-hub' && (
            <SyncSimulatorUI
              connectionState={connectionState}
              setConnectionState={setConnectionState}
            />
          )}

          {activeTab === 'ai-advisor' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">مستشار الأداء والذكاء الاصطناعي</h1>
                  <p className="text-xs text-gray-500 mt-1">يقوم نموذج AI المالي بتحليل مستودعاتك وأرباحك لتقديم نصائح تشغيلية لمتجرك.</p>
                </div>
                <button
                  onClick={generateAIReport}
                  disabled={isAiLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" /> {isAiLoading ? 'جاري التحليل والمراجعة...' : 'تحليل الأداء بالذكاء الاصطناعي'}
                </button>
              </div>

              {/* AI Insight report pane */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs min-h-[300px] flex flex-col justify-between">
                {isAiLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <Sparkles className="w-12 h-12 text-emerald-600 animate-spin" />
                    <p className="text-xs font-bold text-gray-700">جاري تجميع التقارير المالية والكميات المتوفرة...</p>
                    <p className="text-[10px] text-gray-400">نقوم بتصميم تقرير مخصص يناسب قطاع التجزئة العام الخاص بك.</p>
                  </div>
                ) : aiReport ? (
                  <div className="text-right text-xs leading-relaxed text-gray-800 space-y-4 whitespace-pre-wrap max-w-3xl">
                    {aiReport}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-2 text-gray-400">
                    <Sparkles className="w-12 h-12 text-emerald-600 opacity-30 animate-pulse" />
                    <p className="text-xs font-bold">المستشار جاهز لتحليل متجرك</p>
                    <p className="text-[10px] text-gray-400">انقر على الزر بالإنترنت لتوليد النصائح المالية المخصصة لمتجرك.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <BackupRestore onRefreshData={loadAllData} />
          )}
        </main>
      </div>

      {/* FOOTER METADATA */}
      <footer className="bg-white border-t border-gray-100 py-4 px-6 text-center text-[10px] text-gray-400">
        تطبيق HisabApp © 2026. كافة الحقوق محفوظة. صُمم بواجهات تدعم اللغة العربية والعمل بالكامل في وضع عدم الاتصال (Offline-First).
      </footer>

      {/* Invoice Detail popover on demand */}
      {previewingInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-150 shadow-xl max-w-sm w-full overflow-hidden flex flex-col justify-between max-h-[85vh]">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-900">تفاصيل الفاتورة #{previewingInvoice.id}</span>
              <button
                onClick={() => setPreviewingInvoice(null)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>اسم العميل:</span>
                <span className="font-bold text-gray-900">{previewingInvoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>التاريخ:</span>
                <span className="font-mono">{new Date(previewingInvoice.createdAt).toLocaleString('ar-SA')}</span>
              </div>
              <div className="flex justify-between">
                <span>طريقة السداد:</span>
                <span className="font-bold text-emerald-700">
                  {previewingInvoice.paymentMethod === 'cash' ? 'نقدي' :
                   previewingInvoice.paymentMethod === 'card' ? 'بطاقة' :
                   previewingInvoice.paymentMethod === 'bank' ? 'تحويل' : 'آجل'}
                </span>
              </div>

              <div className="border-t border-dashed border-gray-200 my-2 pt-2"></div>

              {/* Items in detailed view */}
              <div className="space-y-1.5 text-[11px]">
                {previewingInvoice.items.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.productName} × {item.quantity}</span>
                    <span className="font-mono">{item.totalPrice.toFixed(2)} ر.س</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-200 my-2 pt-2"></div>

              <div className="flex justify-between text-gray-900 font-black text-xs">
                <span>الصافي الكلي:</span>
                <span className="font-mono text-emerald-700">{previewingInvoice.finalAmount.toFixed(2)} ر.س</span>
              </div>
            </div>

            <div className="bg-gray-50 p-3.5 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setPreviewingInvoice(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg cursor-pointer"
              >
                موافق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
