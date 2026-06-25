import React, { useState, useRef } from 'react';
import { getBackupData, importBackupData, clearAllData } from '../lib/storage';
import { Download, Upload, Trash2, FileSpreadsheet, CheckCircle, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface BackupRestoreProps {
  onRefreshData: () => void;
}

export default function BackupRestore({ onRefreshData }: BackupRestoreProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFeedback = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  // Export database as JSON file
  const handleExportJSON = () => {
    try {
      const backup = getBackupData();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HisabApp_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      triggerFeedback('success', 'تم تصدير النسخة الاحتياطية بنجاح بصيغة JSON!');
    } catch (e) {
      triggerFeedback('error', 'عذراً! فشل تصدير النسخة الاحتياطية.');
    }
  };

  // Import JSON file and load state
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const ok = importBackupData(parsed);
        if (ok) {
          triggerFeedback('success', 'تهانينا! تم استعادة قواعد بيانات متجرك بالكامل بنجاح!');
          onRefreshData();
        } else {
          triggerFeedback('error', 'الملف المحدد لا يحتوي على البنية الصحيحة المعتمدة لبيانات حساب اب!');
        }
      } catch (err) {
        triggerFeedback('error', 'فشل في قراءة ملف النسخة الاحتياطية المرفوع.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Clear file input
  };

  // Convert array of objects into CSV string and download
  const handleExportCSV = (tableType: 'products' | 'customers' | 'invoices' | 'expenses') => {
    const backup = getBackupData();
    let headers: string[] = [];
    let rows: string[][] = [];

    if (tableType === 'products') {
      headers = ['ID', 'Name', 'Price', 'CostPrice', 'Stock', 'Barcode', 'Category', 'AlertLimit'];
      rows = backup.products.map(p => [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.price.toString(),
        p.costPrice.toString(),
        p.stock.toString(),
        p.barcode,
        p.category || 'عام',
        p.minStockAlert.toString()
      ]);
    } else if (tableType === 'customers') {
      headers = ['ID', 'Name', 'Phone', 'Email', 'Balance'];
      rows = backup.customers.map(c => [
        c.id,
        `"${c.name.replace(/"/g, '""')}"`,
        c.phone,
        c.email,
        c.balance.toString()
      ]);
    } else if (tableType === 'invoices') {
      headers = ['ID', 'Customer', 'Subtotal', 'TaxRate', 'TaxAmount', 'Discount', 'FinalTotal', 'PaymentMethod', 'Date'];
      rows = backup.invoices.map(inv => [
        inv.id,
        `"${(inv.customerName || '').replace(/"/g, '""')}"`,
        inv.totalAmount.toString(),
        inv.taxRate.toString(),
        inv.taxAmount.toString(),
        inv.discountAmount.toString(),
        inv.finalAmount.toString(),
        inv.paymentMethod,
        inv.createdAt
      ]);
    } else if (tableType === 'expenses') {
      headers = ['ID', 'Title', 'Category', 'Amount', 'Date'];
      rows = backup.expenses.map(exp => [
        exp.id,
        `"${exp.title.replace(/"/g, '""')}"`,
        exp.category,
        exp.amount.toString(),
        exp.date
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Add BOM for proper Arabic Excel encoding support
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HisabApp_${tableType}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    triggerFeedback('success', `تم تحويل وتصدير جدول [${tableType}] بصيغة ملف CSV بنجاح!`);
  };

  const handleResetDatabase = () => {
    if (confirm('تحذير شديد! هل أنت متأكد من رغبتك في تصفير وحذف جميع السلع، الفواتير، الحسابات والمصروفات من النظام بالكامل؟ (هذا الإجراء غير قابل للتراجع!)')) {
      clearAllData();
      triggerFeedback('success', 'تم تصفير قواعد البيانات وإعادة تثبيت البيانات النموذجية لمتجرك.');
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6" id="backup-restore-tab">
      {/* Intro details */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <h1 className="text-xl font-bold text-gray-900">إدارة الأمان والنسخ الاحتياطي</h1>
        <p className="text-xs text-gray-500 mt-1">
          قم بحماية بيانات متجرك واستيراد أو تصدير التقارير وجداول العمليات للمحاسبة الخارجية بسهولة تامة.
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-xs text-green-800 font-bold flex items-center gap-1.5 animate-pulse">
          <CheckCircle className="w-5 h-5 text-green-600" /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 font-bold flex items-center gap-1.5 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-600" /> {errorMessage}
        </div>
      )}

      {/* Main Tools Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* JSON Backup and Restore */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" /> النسخ الاحتياطي السحابي / المحلي (JSON)
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            يُوصى بتنزيل نسخة احتياطية من ملف قاعدة البيانات بشكل أسبوعي لحفظه بأمان على قرص صلب خارجي أو نقله لجهاز بيع آخر.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Download JSON CTA */}
            <button
              onClick={handleExportJSON}
              className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" /> تصدير نسخة JSON
            </button>

            {/* Upload JSON file (Restorer) */}
            <div>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleImportJSON}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-gray-200"
              >
                <Upload className="w-4 h-4" /> استعادة نسخة JSON
              </button>
            </div>
          </div>
        </div>

        {/* CSV Excel Exporters */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1">
            <FileSpreadsheet className="w-4.5 h-4.5 text-blue-600" /> تصدير التقارير والجداول لبرنامج Excel (CSV)
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            تصدير الجداول الفردية بتنسيق CSV متوافق بالكامل مع جداول بيانات Microsoft Excel لتسهيل الجرد والتدقيق المالي الخارجي.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { id: 'products', label: 'المخزون والسلع', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
              { id: 'customers', label: 'حسابات العملاء', color: 'text-blue-700 bg-blue-50 border-blue-100' },
              { id: 'invoices', label: 'سجلات الفواتير', color: 'text-purple-700 bg-purple-50 border-purple-100' },
              { id: 'expenses', label: 'المصاريف العامة', color: 'text-red-700 bg-red-50 border-red-100' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleExportCSV(tab.id as any)}
                className={`py-2 px-3 rounded-xl text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all hover:shadow-xs ${tab.color}`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danger Zone Purging */}
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-xs space-y-4 col-span-1 md:col-span-2">
          <h3 className="text-sm font-bold text-red-600 flex items-center gap-1">
            <AlertTriangle className="w-4.5 h-4.5 text-red-600 animate-pulse" /> منطقة الخطر والتهيئة الشاملة
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            سيؤدي تصفير قواعد البيانات إلى مسح كافة قيود المبيعات والعملاء والمنتجات نهائياً من متصفحك وإعادة تثبيت البيانات النموذجية لتهيئة المتجر للبدء من جديد.
          </p>

          <div className="flex justify-start pt-2">
            <button
              onClick={handleResetDatabase}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 py-2.5 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" /> تصفير وحذف جميع بيانات التطبيق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
