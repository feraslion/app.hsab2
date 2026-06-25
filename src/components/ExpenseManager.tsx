import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { Plus, Search, Trash2, Wallet, Calendar, AlertCircle } from 'lucide-react';
import { addToSyncQueue } from '../lib/syncSimulator';

interface ExpenseManagerProps {
  expenses: Expense[];
  onUpdateExpenses: (expenses: Expense[]) => void;
}

export default function ExpenseManager({ expenses, onUpdateExpenses }: ExpenseManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('مرافق');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Filters & search
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      return exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             exp.category.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [expenses, searchQuery]);

  const totalExpenseSum = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const openAddModal = () => {
    setTitle('');
    setCategory('مرافق');
    setAmount(0);
    setDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا المصروف؟')) {
      const updated = expenses.filter(exp => exp.id !== id);
      onUpdateExpenses(updated);
      addToSyncQueue('DELETE', 'expense', id, { id });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || amount <= 0) {
      alert('الرجاء إدخال تفاصيل المصروف والمبلغ بشكل صحيح!');
      return;
    }

    const newId = 'exp-' + Math.random().toString(36).substr(2, 9);
    const newExpense: Expense = {
      id: newId,
      title,
      category,
      amount,
      date
    };

    const updated = [...expenses, newExpense];
    onUpdateExpenses(updated);
    addToSyncQueue('CREATE', 'expense', newId, newExpense);

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6" id="expenses-tab">
      {/* Header section with Stats & Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900">سجل المصاريف والمشترات التشغيلية</h1>
          <p className="text-xs text-gray-500 mt-1">تتبع كافة مخرجات متجرك المالي لحساب صافي الأرباح بذكاء ودقة.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openAddModal}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> إضافة مصروف جديد
          </button>
        </div>
      </div>

      {/* Grid containing list and analysis widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Expenses Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-3 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ابحث عن مصروف بالاسم أو فئة المصروف..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
            />
          </div>

          <div className="overflow-x-auto">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12 text-gray-400 space-y-2">
                <Wallet className="w-12 h-12 mx-auto opacity-30 text-gray-400" />
                <p className="text-sm font-medium">لا توجد مصاريف مسجلة</p>
                <p className="text-xs text-gray-400">ابدأ بإدخال أول مصروف مثل فواتير المياه، الكهرباء، أو إيجار المحل.</p>
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-medium">
                    <th className="pb-3 text-right">بيان المصروف</th>
                    <th className="pb-3 text-right">التصنيف</th>
                    <th className="pb-3 text-right">التاريخ والوقت</th>
                    <th className="pb-3 text-right">قيمة المبلغ</th>
                    <th className="pb-3 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 pr-2">
                        <div className="font-semibold text-gray-900">{exp.title}</div>
                      </td>
                      <td className="py-3.5 text-gray-600">
                        <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-md text-[10px] font-medium">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {exp.date}
                      </td>
                      <td className="py-3.5 font-mono font-bold text-red-600">{exp.amount.toFixed(2)} ر.س</td>
                      <td className="py-3.5 text-left pl-2">
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="حذف المصروف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Mini analytics card */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center gap-1.5 text-gray-900">
              <Wallet className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-bold">ملخص ميزان المصروفات الكلية</h3>
            </div>

            <div className="bg-red-50/50 p-4 border border-red-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-red-700 block">إجمالي ما تم إنفاقه تشغيلياً:</span>
              <span className="text-2xl font-black text-red-600 font-mono">{totalExpenseSum.toLocaleString()} <span className="text-xs font-sans text-gray-500">ر.س</span></span>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              تسجيل كافة المصاريف يساعد في حماية ميزانية متجرك والحصول على هوامش ربح صافية دقيقة، كما يوفر لك نظرة حقيقية على مكامن الإنفاق الزائد لتخفيض التكاليف بنجاح.
            </p>
          </div>

          <div className="bg-amber-50 text-amber-900 p-5 rounded-2xl border border-amber-100 space-y-2">
            <h4 className="text-xs font-bold flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-amber-600" /> تذكير بمراجعة التدفقات النقدية
            </h4>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              تأكد دائماً من تسجيل فواتير الإيجارات والمرافق والضرائب في تواريخ استحقاقها المحددة لتظل المخططات المالية ممتثلة ومعبرة عن الأرباح التشغيلية الحقيقية لكل شهر بدقة.
            </p>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900">إضافة مصروف جديد</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">بيان المصروف (الاسم) *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: فاتورة كهرباء متجر يونيو"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">المبلغ المطلوب (ر.س) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount || ''}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">تاريخ الإنفاق *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">التصنيف</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="مرافق">مرافق وفواتير</option>
                  <option value="إيجارات">إيجارات ومقرات</option>
                  <option value="مشتريات">مشتريات سلع</option>
                  <option value="صيانة">أعمال صيانة</option>
                  <option value="عام">مصاريف إدارية أخرى</option>
                </select>
              </div>

              <div className="pt-2 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  تسجيل المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
