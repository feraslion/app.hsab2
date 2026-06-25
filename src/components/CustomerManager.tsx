import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import { Search, Plus, Edit2, Trash2, Phone, Mail, DollarSign, Award, Users } from 'lucide-react';
import { addToSyncQueue } from '../lib/syncSimulator';

interface CustomerManagerProps {
  customers: Customer[];
  onUpdateCustomers: (customers: Customer[]) => void;
}

export default function CustomerManager({ customers, onUpdateCustomers }: CustomerManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [balance, setBalance] = useState(0);

  // Search & Filter
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      return c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             c.phone.includes(searchQuery) || 
             c.email.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [customers, searchQuery]);

  const totalReceivables = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
  }, [customers]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setBalance(0);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setEmail(customer.email);
    setBalance(customer.balance);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (id === 'c1') {
      alert('لا يمكن حذف العميل النقدي العام الافتراضي!');
      return;
    }
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا العميل؟ سيؤدي ذلك لإلغاء قيود حساباته في النظام.')) {
      const updated = customers.filter(c => c.id !== id);
      onUpdateCustomers(updated);
      addToSyncQueue('DELETE', 'customer', id, { id });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('الرجاء إدخال اسم العميل بشكل صحيح!');
      return;
    }

    if (editingCustomer) {
      // Edit Customer
      const updated = customers.map(c => {
        if (c.id === editingCustomer.id) {
          const updatedCustomer = {
            ...c,
            name,
            phone: phone || '-',
            email: email || '-',
            balance
          };
          addToSyncQueue('UPDATE', 'customer', c.id, updatedCustomer);
          return updatedCustomer;
        }
        return c;
      });
      onUpdateCustomers(updated);
    } else {
      // Add New Customer
      const newId = 'c-' + Math.random().toString(36).substr(2, 9);
      const newCustomer: Customer = {
        id: newId,
        name,
        phone: phone || '-',
        email: email || '-',
        balance,
        createdAt: new Date().toISOString()
      };
      const updated = [...customers, newCustomer];
      onUpdateCustomers(updated);
      addToSyncQueue('CREATE', 'customer', newId, newCustomer);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6" id="customers-tab">
      {/* Header section with Stats & Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900">سجل حسابات العملاء</h1>
          <p className="text-xs text-gray-500 mt-1">إجمالي العملاء المسجلين: {customers.length} عميل (نقدي وآجل).</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> إضافة عميل جديد
          </button>
        </div>
      </div>

      {/* Receivables summary widget & List layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customers table & search */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-3 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ابحث باسم العميل، رقم الجوال أو البريد..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
            />
          </div>

          <div className="overflow-x-auto">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-gray-400 space-y-2">
                <Users className="w-12 h-12 mx-auto opacity-30" />
                <p className="text-sm font-medium">لم يتم العثور على أي عميل</p>
                <p className="text-xs text-gray-400">تأكد من كتابة الاسم أو رقم الجوال بشكل صحيح.</p>
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-medium">
                    <th className="pb-3 text-right">اسم العميل</th>
                    <th className="pb-3 text-right">رقم الجوال</th>
                    <th className="pb-3 text-right">البريد الإلكتروني</th>
                    <th className="pb-3 text-right">مستحقات (المديونية آجل)</th>
                    <th className="pb-3 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCustomers.map(c => {
                    const isDefault = c.id === 'c1';
                    const hasDebt = c.balance > 0;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 pr-2">
                          <div className="font-semibold text-gray-900">{c.name}</div>
                          {isDefault && (
                            <span className="inline-block mt-0.5 bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded font-medium">
                              نقدي افتراضي
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 font-mono text-gray-600">
                          {c.phone !== '-' ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" /> {c.phone}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-3.5 text-gray-500">
                          {c.email !== '-' ? (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" /> {c.email}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                            hasDebt ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {c.balance.toFixed(2)} ر.س
                          </span>
                        </td>
                        <td className="py-3.5 text-left pl-2">
                          {!isDefault && (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openEditModal(c)}
                                className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="تعديل الحساب"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="حذف العميل"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Receivables analysis card */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center gap-1.5 text-gray-900">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold">ملخص الذمم والديون الخارجية</h3>
            </div>
            
            <div className="bg-red-50/50 p-4 border border-red-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-red-700 block">إجمالي الذمم المستحقة للتحصيل:</span>
              <span className="text-2xl font-black text-red-600 font-mono">{totalReceivables.toLocaleString()} <span className="text-xs font-sans text-gray-500">ر.س</span></span>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              هذه هي المستحقات المالية الآجلة المترتبة على عملائك. يُنصح بمتابعة التحصيلات دورياً وتحديث أرصدة العملاء فور استلام الدفعات النقدية.
            </p>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-gray-800">أكبر المدينين في النظام</h4>
              <div className="space-y-2">
                {customers
                  .filter(c => c.balance > 0)
                  .sort((a, b) => b.balance - a.balance)
                  .slice(0, 3)
                  .map((c, idx) => (
                    <div key={c.id} className="flex justify-between items-center text-xs p-1.5 rounded-lg bg-gray-50">
                      <span className="font-semibold text-gray-700">{c.name}</span>
                      <span className="font-bold text-red-600 font-mono">{c.balance.toFixed(2)} ر.س</span>
                    </div>
                  ))}
                {customers.filter(c => c.balance > 0).length === 0 && (
                  <p className="text-[10px] text-gray-400 text-center py-2">لا يوجد مدينين، جميع الأرصدة مسواة!</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 text-emerald-900 p-5 rounded-2xl border border-emerald-100 space-y-2">
            <h4 className="text-xs font-bold flex items-center gap-1">
              <Award className="w-4 h-4 text-emerald-600" /> تصنيف الحسابات والمصداقية
            </h4>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              تحديد أرصدة العملاء بشكل استباقي يساعد في تفادي البيع الآجل المفرط للعملاء ذوي المديونيات المرتفعة، مما يحافظ على سيولة المتجر النقدية بشكل مستمر ومستدام.
            </p>
          </div>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900">
                {editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد للنظام'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">اسم العميل بالكامل *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="مثال: صالح بن عبد الله"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">رقم الجوال</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="مثال: 0501234567"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">رصيد المديونية الابتدائي (ر.س)</label>
                <input
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={e => setBalance(parseFloat(e.target.value) || 0)}
                  placeholder="الديون الآجلة المترتبة على العميل إن وجدت"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  {editingCustomer ? 'حفظ التعديلات' : 'إضافة العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
