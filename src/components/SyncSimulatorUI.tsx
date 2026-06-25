import { useState, useEffect } from 'react';
import { getSyncQueue, clearSyncQueue, addToSyncQueue, getCloudMirrorData, saveCloudMirrorData, ConnectionState, SyncQueueItem } from '../lib/syncSimulator';
import { Wifi, WifiOff, RefreshCw, Layers, CheckCircle, Database, HelpCircle, AlertTriangle, FileText } from 'lucide-react';

interface SyncSimulatorUIProps {
  connectionState: ConnectionState;
  setConnectionState: (state: ConnectionState) => void;
}

export default function SyncSimulatorUI({ connectionState, setConnectionState }: SyncSimulatorUIProps) {
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [syncStrategy, setSyncStrategy] = useState<'lww' | 'client' | 'server'>('lww');
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Initial fetch of un-synced queue
    setQueue(getSyncQueue());

    // Listen to custom local storage/sync queue changes
    const handleQueueChange = () => {
      setQueue(getSyncQueue());
    };
    window.addEventListener('sync_queue_updated', handleQueueChange);
    return () => {
      window.removeEventListener('sync_queue_updated', handleQueueChange);
    };
  }, []);

  const addLog = (msg: string) => {
    const stamp = new Date().toLocaleTimeString('ar-SA');
    setLogs(prev => [`[${stamp}] ${msg}`, ...prev]);
  };

  const handleSyncNow = () => {
    if (connectionState === 'offline') {
      alert('لا يمكن إتمام المزامنة حالياً! يرجى تحويل حالة الاتصال إلى "متصل بالإنترنت" أولاً.');
      return;
    }

    if (queue.length === 0) {
      alert('صف التغييرات المحلية فارغ! لا توجد تعديلات جديدة بانتظار المزامنة.');
      return;
    }

    setIsSyncing(true);
    setProgress(15);
    setLogs([]);
    
    addLog('بدء الاتصال بخوادم حساب اب السحابية الموزعة...');
    
    setTimeout(() => {
      setProgress(40);
      addLog(`تم تأسيس الاتصال. جاري تحليل صف التغييرات (${queue.length} عمليات مؤجلة)...`);
    }, 1000);

    setTimeout(() => {
      setProgress(70);
      addLog(`تم تفعيل استراتيجية حل النزاعات المحددة: ${
        syncStrategy === 'lww' ? 'الأحدث يفوز (Last-Write-Wins)' :
        syncStrategy === 'client' ? 'أولوية العميل المحلي (Client First)' : 'أولوية بيانات السحابة (Server First)'
      }`);

      // Apply changes to simulated Cloud storage mirror
      const cloud = getCloudMirrorData();
      
      queue.forEach(item => {
        addLog(`مزامنة الكيان [${item.entity}] صاحب المعرف ${item.entityId} بإجراء ${item.action}...`);
        
        // Simulating applying the local queue to cloud mirror
        if (item.action === 'CREATE' || item.action === 'UPDATE') {
          if (item.entity === 'product') {
            cloud.products = cloud.products.filter(p => p.id !== item.entityId);
            cloud.products.push(item.data);
          } else if (item.entity === 'customer') {
            cloud.customers = cloud.customers.filter(c => c.id !== item.entityId);
            cloud.customers.push(item.data);
          } else if (item.entity === 'invoice') {
            cloud.invoices = cloud.invoices.filter(i => i.id !== item.entityId);
            cloud.invoices.push(item.data);
          } else if (item.entity === 'expense') {
            cloud.expenses = cloud.expenses.filter(e => e.id !== item.entityId);
            cloud.expenses.push(item.data);
          }
        } else if (item.action === 'DELETE') {
          if (item.entity === 'product') cloud.products = cloud.products.filter(p => p.id !== item.entityId);
          if (item.entity === 'customer') cloud.customers = cloud.customers.filter(c => c.id !== item.entityId);
          if (item.entity === 'invoice') cloud.invoices = cloud.invoices.filter(i => i.id !== item.entityId);
          if (item.entity === 'expense') cloud.expenses = cloud.expenses.filter(e => e.id !== item.entityId);
        }
      });

      // Save to cloud mock database
      saveCloudMirrorData(cloud);

    }, 2200);

    setTimeout(() => {
      setProgress(100);
      addLog('تم نقل البيانات بنجاح! السحابة متطابقة الآن 100% مع جهازك المحلي.');
      addLog('تم تنظيف صف المزامنة المحلية.');
      setIsSyncing(false);
      clearSyncQueue();
    }, 3800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sync-hub-tab">
      {/* Left Column: Sync settings & simulator controller */}
      <div className="space-y-6 lg:col-span-1">
        {/* Connection card toggler */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900">محاكي حالة الاتصال بالإنترنت</h3>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              connectionState === 'online' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {connectionState === 'online' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {connectionState === 'online' ? 'متصل بالإنترنت' : 'يعمل بدون إنترنت'}
            </span>
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed">
            عند تحويل التطبيق لـ <strong className="text-gray-900">وضع عدم الاتصال</strong>، يمكنك الاستمرار في إضافة المنتجات وتسجيل فواتير العملاء والديون بالكامل، وسيتم جدولة هذه العمليات بأمان لتتم مزامنتها لاحقاً فور استعادة الشبكة!
          </p>

          <button
            onClick={() => {
              const nextState = connectionState === 'online' ? 'offline' : 'online';
              setConnectionState(nextState);
              addLog(`تم تحويل حالة التطبيق يدوياً لـ: ${nextState === 'online' ? 'متصل بالإنترنت (Online)' : 'بدون اتصال (Offline)'}`);
            }}
            className={`w-full py-2 rounded-xl text-xs font-bold shadow-xs text-center flex items-center justify-center gap-1 transition-all cursor-pointer ${
              connectionState === 'online'
                ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-100'
                : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-100'
            }`}
          >
            {connectionState === 'online' ? 'قطع الاتصال بالإنترنت (Offline)' : 'توصيل بالإنترنت (Go Online)'}
          </button>
        </div>

        {/* Conflict Resolution rules */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1">
            <Layers className="w-4 h-4 text-emerald-600" /> استراتيجية حل التضاربات الذكية
          </h3>
          <p className="text-[11px] text-gray-500">
            حدد سلوك المعالج عند اكتشاف اختلاف في تعديل نفس السلعة بين السحابة وجهازك المحلي.
          </p>

          <div className="space-y-2 pt-2">
            {[
              { id: 'lww', label: 'الأحدث يفوز (Last Write Wins)', desc: 'تعتمد الفاتورة أو التعديل الذي يحمل التاريخ والوقت الأحدث.' },
              { id: 'client', label: 'أولوية العميل المحلي', desc: 'يتم فرض بيانات جهاز البائع الحالي وتجاهل أي تعديلات سحابية مسبقة.' },
              { id: 'server', label: 'أولوية خادم السحاب', desc: 'يتم استبقاء البيانات المخزنة بالسحابة مسبقاً وتخطي الرفع للسلعة المتأثرة.' }
            ].map(opt => (
              <label
                key={opt.id}
                onClick={() => setSyncStrategy(opt.id as any)}
                className={`block p-3.5 border rounded-xl cursor-pointer transition-all ${
                  syncStrategy === opt.id
                    ? 'border-emerald-500 bg-emerald-50/20'
                    : 'border-gray-100 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-2 text-right">
                  <input
                    type="radio"
                    name="strategy-opt"
                    checked={syncStrategy === opt.id}
                    onChange={() => {}}
                    className="mt-1 h-3.5 w-3.5 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">{opt.label}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 block leading-normal">{opt.desc}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Right/Middle Column: Sync Queue & Log terminal */}
      <div className="lg:col-span-2 space-y-6">
        {/* Local Change queue table */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-gray-900">صف التغييرات المحلية المؤجلة</h3>
              <p className="text-[11px] text-gray-500">تعديلات قمت بإجرائها بانتظار استعادة الشبكة والرفع.</p>
            </div>
            
            <button
              onClick={handleSyncNow}
              disabled={queue.length === 0 || isSyncing}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                queue.length === 0 || isSyncing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'جاري المزامنة...' : 'مزامنة وتزامن الآن'}
            </button>
          </div>

          {isSyncing && (
            <div className="space-y-1.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 animate-pulse">
              <div className="flex justify-between text-[10px] font-bold text-emerald-800">
                <span>جاري إرسال حزم البيانات...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${progress}%` }}
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                ></div>
              </div>
            </div>
          )}

          {queue.length === 0 ? (
            <div className="text-center py-10 text-gray-400 space-y-1.5">
              <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 opacity-60 animate-bounce" />
              <p className="text-xs font-bold">جميع التعديلات متزامنة بالكامل!</p>
              <p className="text-[10px] text-gray-400">لا توجد أي تغييرات محلية غير مرفوعة للسحابة.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-medium">
                    <th className="pb-2 text-right">المعرف / الصنف</th>
                    <th className="pb-2 text-right">العملية الجارية</th>
                    <th className="pb-2 text-right">تاريخ الإجراء</th>
                    <th className="pb-2 text-left">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {queue.slice(0, 5).map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 pr-1">
                        <span className="font-semibold text-gray-800">{item.entityId}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md ml-1 inline-block text-[9px]">
                          {item.entity === 'product' ? 'سلعة' :
                           item.entity === 'customer' ? 'عميل' :
                           item.entity === 'invoice' ? 'فاتورة' : 'مصروف'}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          item.action === 'CREATE' ? 'bg-green-50 text-green-700' :
                          item.action === 'UPDATE' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {item.action === 'CREATE' ? 'إضافة' :
                           item.action === 'UPDATE' ? 'تعديل' : 'حذف وإزالة'}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-gray-400 text-[10px]">
                        {new Date(item.timestamp).toLocaleTimeString('ar-SA')}
                      </td>
                      <td className="py-2.5 text-left pl-1">
                        <span className="text-[10px] text-gray-500 max-w-[120px] truncate block font-mono">
                          {JSON.stringify(item.data).slice(0, 30)}...
                        </span>
                      </td>
                    </tr>
                  ))}
                  {queue.length > 5 && (
                    <tr>
                      <td colSpan={4} className="text-center pt-3 text-[10px] text-gray-400 font-medium italic">
                        وهناك {queue.length - 5} عمليات معلقة أخرى بصف المزامنة الحالي.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Interactive Log Terminal display console */}
        <div className="bg-gray-950 text-gray-100 p-5 rounded-2xl shadow-xs space-y-3 font-mono">
          <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-800">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Database className="w-4 h-4" /> موجه سجلات التزامن ومزامنة البيانات
            </span>
            <button
              onClick={() => setLogs([])}
              className="text-gray-500 hover:text-gray-300 cursor-pointer"
            >
              مسح السجلات
            </button>
          </div>

          <div className="h-44 overflow-y-auto space-y-1.5 text-[11px] leading-relaxed pr-1 no-scrollbar text-right" dir="rtl">
            {logs.length === 0 ? (
              <p className="text-gray-500 italic text-center pt-12">[الموجه بانتظار إجراء أي عملية مزامنة لطباعة السجلات الحية]</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-gray-300 font-mono">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
