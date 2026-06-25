import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { Search, Plus, Edit2, Trash2, ShieldAlert, Barcode, HelpCircle, Package, RefreshCw, Layers } from 'lucide-react';
import { addToSyncQueue } from '../lib/syncSimulator';

interface ProductManagerProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

export default function ProductManager({ products, onUpdateProducts }: ProductManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Scanner Simulator State
  const [simulatedScanCode, setSimulatedScanCode] = useState('');
  const [scannerFeedback, setScannerFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [minStockAlert, setMinStockAlert] = useState(5);

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const list = products.map(p => p.category).filter(Boolean);
    return ['all', ...Array.from(new Set(list))];
  }, [products]);

  // Filter & Search products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.barcode.includes(searchQuery);
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice(0);
    setCostPrice(0);
    setStock(0);
    setBarcode('');
    setCategory('غذائيات');
    setMinStockAlert(5);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price);
    setCostPrice(product.costPrice);
    setStock(product.stock);
    setBarcode(product.barcode);
    setCategory(product.category);
    setMinStockAlert(product.minStockAlert);
    setIsModalOpen(true);
  };

  const generateRandomBarcode = () => {
    const randomCode = '628' + Math.floor(100000000 + Math.random() * 900000000).toString();
    setBarcode(randomCode);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذه السلعة من المخزن؟')) {
      const updated = products.filter(p => p.id !== id);
      onUpdateProducts(updated);
      addToSyncQueue('DELETE', 'product', id, { id });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price <= 0) {
      alert('الرجاء إدخال اسم السلعة وسعر بيع صحيح!');
      return;
    }

    if (editingProduct) {
      // Edit Product
      const updated = products.map(p => {
        if (p.id === editingProduct.id) {
          const updatedProduct = {
            ...p,
            name,
            price,
            costPrice,
            stock,
            barcode: barcode || p.id,
            category,
            minStockAlert
          };
          addToSyncQueue('UPDATE', 'product', p.id, updatedProduct);
          return updatedProduct;
        }
        return p;
      });
      onUpdateProducts(updated);
    } else {
      // Add New Product
      const newId = 'p-' + Math.random().toString(36).substr(2, 9);
      const newProduct: Product = {
        id: newId,
        name,
        price,
        costPrice,
        stock,
        barcode: barcode || newId,
        category,
        minStockAlert,
        createdAt: new Date().toISOString()
      };
      const updated = [...products, newProduct];
      onUpdateProducts(updated);
      addToSyncQueue('CREATE', 'product', newId, newProduct);
    }

    setIsModalOpen(false);
  };

  // Simulate Barcode Scanning physically
  const handleSimulatedScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedScanCode) return;
    const found = products.find(p => p.barcode === simulatedScanCode);
    if (found) {
      setScannerFeedback({
        type: 'success',
        message: `تم التعرف: ${found.name} (المخزون الحالي: ${found.stock} حبة)`
      });
      // Optionally open the edit modal directly
      setTimeout(() => {
        openEditModal(found);
        setScannerFeedback(null);
        setSimulatedScanCode('');
      }, 1000);
    } else {
      setScannerFeedback({
        type: 'error',
        message: 'عذراً، لم يتم العثور على أي سلعة مسجلة بهذا الباركود!'
      });
      setTimeout(() => setScannerFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6" id="products-tab">
      {/* Header section with Stats & Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900">مستودع السلع والمخزون</h1>
          <p className="text-xs text-gray-500 mt-1">إجمالي السلع المسجلة: {products.length} سلعة منفصلة.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> إضافة سلعة جديدة
          </button>
        </div>
      </div>

      {/* Grid of Search, Filters, and Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column: Products List with filter tools */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ابحث باسم السلعة أو رمز الباركود..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
              />
            </div>

            {/* Category selection */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 bg-white"
              >
                <option value="all">كل التصنيفات ({categories.length - 1})</option>
                {categories.filter(cat => cat !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-400 space-y-2">
                <Package className="w-12 h-12 mx-auto opacity-30" />
                <p className="text-sm font-medium">لم يتم العثور على سلع تطابق بحثك</p>
                <p className="text-xs text-gray-400">تأكد من كتابة الاسم بشكل صحيح أو تصفية الفئة المناسبة.</p>
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-medium">
                    <th className="pb-3 text-right">اسم السلعة / الرمز</th>
                    <th className="pb-3 text-right">التصنيف</th>
                    <th className="pb-3 text-right">سعر التكلفة</th>
                    <th className="pb-3 text-right">سعر البيع</th>
                    <th className="pb-3 text-right">المخزون الحالي</th>
                    <th className="pb-3 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map(p => {
                    const isLowStock = p.stock <= p.minStockAlert;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 pr-2">
                          <div className="font-semibold text-gray-900">{p.name}</div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                            <Barcode className="w-3 h-3" />
                            <span className="font-mono">{p.barcode}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-gray-600">
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-[10px] font-medium">
                            {p.category || 'عام'}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono text-gray-600">{p.costPrice.toFixed(2)} ر.س</td>
                        <td className="py-3.5 font-mono font-semibold text-gray-900">{p.price.toFixed(2)} ر.س</td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                            isLowStock ? 'bg-red-50 text-red-700 animate-pulse' : 'bg-green-50 text-green-700'
                          }`}>
                            {p.stock} حبة
                            {isLowStock && <ShieldAlert className="w-3 h-3 ml-1 text-red-600" />}
                          </span>
                        </td>
                        <td className="py-3.5 text-left pl-2">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="تعديل السلعة"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف السلعة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Scanner Simulator */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center gap-1.5 text-gray-900">
              <Barcode className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold">محاكي القارئ الضوئي (الباركود)</h3>
            </div>
            <p className="text-[11px] text-gray-500">
              قم بكتابة رمز باركود مسجل أو محاكاته للوصول المباشر والتلقائي للسلعة في المخزن.
            </p>

            <form onSubmit={handleSimulatedScan} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">رمز الباركود المدخل</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={simulatedScanCode}
                    onChange={e => setSimulatedScanCode(e.target.value)}
                    placeholder="مثال: 628100112233"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="bg-gray-950 hover:bg-gray-800 text-white text-xs px-4 py-2 rounded-xl font-semibold cursor-pointer transition-colors"
                  >
                    مسح الرمز
                  </button>
                </div>
              </div>
            </form>

            {/* Quick click suggestions of existing barcodes to simulate scan easily */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 block">انقر لمحاكاة مسح باركود سلعة نشطة:</span>
              <div className="flex flex-wrap gap-1">
                {products.slice(0, 4).map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSimulatedScanCode(p.barcode)}
                    className="text-[10px] px-2 py-1 bg-gray-50 border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 rounded-lg text-gray-600 font-mono"
                  >
                    {p.name.split(' ')[0]} ({p.barcode.slice(-4)})
                  </button>
                ))}
              </div>
            </div>

            {/* Scanner Feedback Display */}
            {scannerFeedback && (
              <div className={`p-3 rounded-xl text-xs border ${
                scannerFeedback.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
              }`}>
                {scannerFeedback.message}
              </div>
            )}
          </div>

          {/* Mini info panel about Margin pricing help */}
          <div className="bg-gradient-to-tr from-emerald-900 to-emerald-800 text-white p-5 rounded-2xl shadow-xs space-y-2">
            <h4 className="text-xs font-bold flex items-center gap-1">
              <Layers className="w-4 h-4 text-emerald-400" /> إرشادات تسعير السلع والمستودعات
            </h4>
            <p className="text-[11px] text-emerald-100 leading-relaxed">
              تأكد دائماً من تسجيل <strong className="text-white">سعر التكلفة</strong> بشكل صحيح ودقيق لتتمكن لوحة التحليل الذكية من احتساب هوامش الربح الحقيقية الصافية لمتجرك بدقة فائقة.
            </p>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900">
                {editingProduct ? 'تعديل بيانات السلعة' : 'إضافة سلعة جديدة للمخزون'}
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
                <label className="block text-[10px] font-bold text-gray-500 mb-1">اسم السلعة *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="مثال: تمر سكري فاخر 1 كجم"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">سعر التكلفة (ر.س)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">سعر البيع المعترف *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">الكمية المتوفرة</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={e => setStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">تنبيه عند كمية (أو أقل)</label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={e => setMinStockAlert(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">رمز الباركود (يُولد عشوائياً إذا ترك فارغاً)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    placeholder="مثال: 628100112233"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={generateRandomBarcode}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-xl font-medium cursor-pointer"
                  >
                    توليد باركود
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">التصنيف</label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="مثل: غذائيات، مشروبات، إلكترونيات"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة إلى المخزن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
