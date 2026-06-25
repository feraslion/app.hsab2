import React, { useState, useMemo } from 'react';
import { Product, Customer, Invoice, InvoiceItem } from '../types';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, CreditCard, DollarSign, Percent, ArrowLeft, Printer, CheckCircle } from 'lucide-react';
import { addToSyncQueue } from '../lib/syncSimulator';

interface InvoiceCreatorProps {
  products: Product[];
  customers: Customer[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateCustomers: (customers: Customer[]) => void;
  onAddInvoice: (invoice: Invoice) => void;
}

export default function InvoiceCreator({ products, customers, onUpdateProducts, onUpdateCustomers, onAddInvoice }: InvoiceCreatorProps) {
  // Active Invoice State
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('c1'); // c1 is the default cash customer
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(15); // Default 15% Saudi VAT
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank' | 'debt'>('cash');
  const [paymentReceived, setPaymentReceived] = useState<string>(''); // For calculating cash change

  // Product Search State
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Completed Invoice Receipt Modal State
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Available categories for fast filter
  const categories = useMemo(() => {
    const list = products.map(p => p.category).filter(Boolean);
    return ['all', ...Array.from(new Set(list))];
  }, [products]);

  // Filter products for POS grid
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                            p.barcode.includes(productSearch);
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, selectedCategory]);

  // Cart totals
  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = Math.max(0, (subtotal - discountAmount) * (taxRate / 100));
    const finalAmount = Math.max(0, subtotal - discountAmount + taxAmount);
    return {
      subtotal,
      taxAmount,
      finalAmount
    };
  }, [cartItems, discountAmount, taxRate]);

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('عذراً! هذه السلعة نفدت تماماً من المخزن.');
      return;
    }

    const existingIndex = cartItems.findIndex(item => item.productId === product.id);
    if (existingIndex > -1) {
      const existing = cartItems[existingIndex];
      if (existing.quantity >= product.stock) {
        alert(`لا يمكنك إضافة المزيد! الكمية المطلوبة تتجاوز المخزون المتاح (${product.stock} حبة)`);
        return;
      }
      const updated = [...cartItems];
      updated[existingIndex] = {
        ...existing,
        quantity: existing.quantity + 1,
        totalPrice: (existing.quantity + 1) * existing.unitPrice
      };
      setCartItems(updated);
    } else {
      const newItem: InvoiceItem = {
        id: 'item-' + Math.random().toString(36).substr(2, 9),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  // Adjust quantity in cart
  const updateQuantity = (itemId: string, delta: number) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    const product = products.find(p => p.id === item.productId);
    if (!product) return;

    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }

    if (newQty > product.stock) {
      alert(`عذراً! الكمية المحددة تتجاوز المتوفر في المخزن (${product.stock} حبة)`);
      return;
    }

    const updated = cartItems.map(i => {
      if (i.id === itemId) {
        return {
          ...i,
          quantity: newQty,
          totalPrice: newQty * i.unitPrice
        };
      }
      return i;
    });
    setCartItems(updated);
  };

  // Remove single item from cart
  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(i => i.id !== itemId));
  };

  // Check out and submit invoice
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('الرجاء إضافة صنف واحد على الأقل لإتمام الفاتورة!');
      return;
    }

    const activeCustomer = customers.find(c => c.id === selectedCustomerId);
    if (!activeCustomer) return;

    // Validate debt/credit limit
    if (paymentMethod === 'debt' && selectedCustomerId === 'c1') {
      alert('عذراً! لا يمكن البيع بالآجل (الديون) للعميل النقدي العام الافتراضي. الرجاء اختيار عميل مسجل!');
      return;
    }

    const invoiceId = 'inv-' + Math.floor(1000 + Math.random() * 9000).toString();
    const newInvoice: Invoice = {
      id: invoiceId,
      customerId: selectedCustomerId,
      customerName: activeCustomer.name,
      items: [...cartItems],
      totalAmount: totals.subtotal,
      taxRate,
      taxAmount: totals.taxAmount,
      discountAmount,
      finalAmount: totals.finalAmount,
      paymentMethod,
      status: paymentMethod === 'debt' ? 'unpaid' : 'paid',
      createdAt: new Date().toISOString()
    };

    // 1. Deduct Product Stock counts
    const updatedProducts = products.map(p => {
      const cartItem = cartItems.find(item => item.productId === p.id);
      if (cartItem) {
        return {
          ...p,
          stock: Math.max(0, p.stock - cartItem.quantity)
        };
      }
      return p;
    });
    onUpdateProducts(updatedProducts);

    // 2. Increase Customer debt if payment method is 'debt' (آجل)
    let updatedCustomers = customers;
    if (paymentMethod === 'debt') {
      updatedCustomers = customers.map(c => {
        if (c.id === selectedCustomerId) {
          return {
            ...c,
            balance: c.balance + totals.finalAmount
          };
        }
        return c;
      });
      onUpdateCustomers(updatedCustomers);
    }

    // 3. Log invoice to overall storage and Sync queue
    onAddInvoice(newInvoice);
    addToSyncQueue('CREATE', 'invoice', invoiceId, newInvoice);

    // Synchronize client changes as well
    updatedProducts.forEach(p => {
      const cartItem = cartItems.find(item => item.productId === p.id);
      if (cartItem) {
        addToSyncQueue('UPDATE', 'product', p.id, p);
      }
    });
    if (paymentMethod === 'debt') {
      const client = updatedCustomers?.find(c => c.id === selectedCustomerId);
      if (client) {
        addToSyncQueue('UPDATE', 'customer', client.id, client);
      }
    }

    // Launch beautiful Print Receipt Modal
    setCompletedInvoice(newInvoice);
    setIsReceiptOpen(true);

    // Clear active POS terminal
    setCartItems([]);
    setDiscountAmount(0);
    setPaymentReceived('');
    setPaymentMethod('cash');
  };

  const cashChange = useMemo(() => {
    const receivedNum = parseFloat(paymentReceived) || 0;
    if (receivedNum <= 0 || !completedInvoice) return 0;
    return Math.max(0, receivedNum - completedInvoice.finalAmount);
  }, [paymentReceived, completedInvoice]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="invoice-creator-tab">
      {/* LEFT: Product Selection list - spans 7/12 cols */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search and Category Quick Pill Filters */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-3 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ابحث عن سلعة لتسجيلها بالفاتورة (الاسم أو الباركود)..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
            />
          </div>

          {/* Quick categories pills selection */}
          <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === cat 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {cat === 'all' ? 'كل الأقسام' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products POS Grid selection */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.map(p => {
            const isOutOfStock = p.stock <= 0;
            const inCartCount = cartItems.find(item => item.productId === p.id)?.quantity || 0;

            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && addToCart(p)}
                className={`bg-white p-3.5 rounded-2xl border text-right transition-all cursor-pointer select-none flex flex-col justify-between h-36 group ${
                  isOutOfStock 
                    ? 'opacity-50 border-gray-100 bg-gray-50/50 cursor-not-allowed' 
                    : 'border-gray-100 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[8px] font-bold truncate">
                      {p.category}
                    </span>
                    {inCartCount > 0 && (
                      <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black font-mono shadow-xs">
                        {inCartCount}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 mt-2 line-clamp-2 leading-relaxed group-hover:text-emerald-700">
                    {p.name}
                  </h4>
                </div>

                <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-50">
                  <span className={`text-[10px] font-semibold ${p.stock <= p.minStockAlert ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                    {isOutOfStock ? 'نفد المخزون' : `${p.stock} متاح`}
                  </span>
                  <span className="text-xs font-extrabold text-gray-900 font-mono">
                    {p.price.toFixed(2)} <span className="text-[10px] font-sans font-normal text-gray-500">ر.س</span>
                  </span>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full bg-white p-12 text-center text-gray-400 rounded-2xl border border-gray-100">
              لا توجد سلع نشطة في هذا القسم مطابقة لبحثك.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Current Cart items and checkout totals - spans 5/12 cols */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between h-[520px] overflow-hidden">
        {/* Terminal Header */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-emerald-600" /> سلة الشراء النشطة
          </h3>
          <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
            {cartItems.reduce((sum, item) => sum + item.quantity, 0)} أصناف
          </span>
        </div>

        {/* Scrollable Cart items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-gray-50">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2 py-12">
              <ShoppingCart className="w-10 h-10 opacity-30 animate-pulse text-gray-400" />
              <p className="text-xs font-bold">السلة فارغة حالياً</p>
              <p className="text-[10px] text-gray-400">انقر على السلع من اليمين لإضافتها وتجميع الفاتورة.</p>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className="pt-2 flex justify-between items-center gap-2">
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-gray-800 truncate">{item.productName}</h5>
                  <span className="text-[10px] font-mono text-gray-400">{item.unitPrice.toFixed(2)} ر.س / للواحدة</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Plus / Minus adjusters */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-100">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-white rounded-md cursor-pointer transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold font-mono text-gray-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-white rounded-md cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Total price & remove button */}
                  <span className="w-16 text-left font-bold text-xs text-gray-900 font-mono">
                    {item.totalPrice.toFixed(2)}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* checkout Options & Summary footer */}
        <div className="bg-gray-50 border-t border-gray-100 p-4 space-y-3.5">
          {/* Customer & Discount Selectors */}
          <div className="grid grid-cols-2 gap-2">
            {/* Customer selector */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-500 block flex items-center gap-0.5">
                <User className="w-3 h-3 text-gray-400" /> اختيار العميل
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Discount selector */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-gray-500 block flex items-center gap-0.5">
                <Percent className="w-3 h-3 text-gray-400" /> قيمة الخصم (ر.س)
              </label>
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                onChange={e => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0.00"
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 bg-white"
              />
            </div>
          </div>

          {/* Payment Method Selectors */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-gray-500 block flex items-center gap-0.5">
              <CreditCard className="w-3 h-3 text-gray-400" /> طريقة السداد والدفع المعتمدة:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'cash', label: 'نقدي' },
                { id: 'card', label: 'بطاقة' },
                { id: 'bank', label: 'تحويل' },
                { id: 'debt', label: 'آجل' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaymentMethod(opt.id as any)}
                  className={`py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border text-center ${
                    paymentMethod === opt.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mathematical breakdowns */}
          <div className="space-y-1 text-xs border-t border-gray-150 pt-2 text-gray-600">
            <div className="flex justify-between font-mono">
              <span>المجموع الفرعي:</span>
              <span>{totals.subtotal.toFixed(2)} ر.س</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600 font-mono">
                <span>إجمالي الخصم:</span>
                <span>-{discountAmount.toFixed(2)} ر.س</span>
              </div>
            )}
            <div className="flex justify-between font-mono">
              <span>ضريبة القيمة المضافة ({taxRate}%):</span>
              <span>{totals.taxAmount.toFixed(2)} ر.س</span>
            </div>

            <div className="flex justify-between text-gray-900 font-black text-sm border-t border-dashed border-gray-200 pt-1.5">
              <span>المجموع الكلي النهائي:</span>
              <span className="font-mono text-emerald-700">{totals.finalAmount.toFixed(2)} ر.س</span>
            </div>
          </div>

          {/* Checkout checkout button */}
          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
            className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-xs text-center flex items-center justify-center gap-1 cursor-pointer transition-colors ${
              cartItems.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <CheckCircle className="w-4 h-4" /> إتمام البيع وطباعة الفاتورة
          </button>
        </div>
      </div>

      {/* POS Thermal-Style Print Receipt Modal */}
      {isReceiptOpen && completedInvoice && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 flex flex-col justify-between max-h-[90vh]">
            {/* Modal actions header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> تم إصدار الفاتورة بنجاح
              </span>
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
              >
                إغلاق (موافق)
              </button>
            </div>

            {/* Thermal Print Receipt body */}
            <div className="flex-1 overflow-y-auto p-6 bg-amber-50/10 font-sans text-xs text-gray-800 space-y-4" id="print-area">
              {/* Receipt Header */}
              <div className="text-center space-y-1">
                <h2 className="text-base font-black text-gray-900">سوبرماركت حساب اب</h2>
                <p className="text-[10px] text-gray-500">مؤسسة حساب اب لخدمات التجزئة المحدودة</p>
                <p className="text-[9px] text-gray-400">الرقم الضريبي: 300012345600003</p>
                <p className="text-[9px] text-gray-400 font-mono">هاتف: 0501234567</p>
                <div className="border-b border-dashed border-gray-300 pt-2"></div>
              </div>

              {/* Invoice Metadata */}
              <div className="space-y-1 text-[10px] text-gray-600">
                <div className="flex justify-between">
                  <span>رقم الفاتورة:</span>
                  <span className="font-mono font-bold text-gray-900">#{completedInvoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>التاريخ والوقت:</span>
                  <span className="font-mono">
                    {new Date(completedInvoice.createdAt).toLocaleString('ar-SA')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>اسم العميل:</span>
                  <span className="font-bold text-gray-900">{completedInvoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>حالة الدفع:</span>
                  <span className="font-semibold text-emerald-700">
                    {completedInvoice.paymentMethod === 'debt' ? 'مستحق الدفع (آجل)' : 'مدفوعة بالكامل'}
                  </span>
                </div>
                <div className="border-b border-dashed border-gray-300 pt-2"></div>
              </div>

              {/* Items list */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-gray-900 text-[10px]">
                  <span>السلعة / الكمية</span>
                  <span>المجموع</span>
                </div>

                <div className="space-y-1.5 text-[10px]">
                  {completedInvoice.items.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <div className="max-w-[70%]">
                        <p className="font-bold text-gray-800">{item.productName}</p>
                        <p className="text-[9px] text-gray-500 font-mono">
                          {item.quantity} حبة × {item.unitPrice.toFixed(2)} ر.س
                        </p>
                      </div>
                      <span className="font-mono font-semibold text-gray-900">{item.totalPrice.toFixed(2)} ر.س</span>
                    </div>
                  ))}
                </div>
                <div className="border-b border-dashed border-gray-300 pt-2"></div>
              </div>

              {/* Calculations and receipt bottom */}
              <div className="space-y-1 text-[10px] font-medium text-gray-600">
                <div className="flex justify-between">
                  <span>المجموع غير شامل الضريبة:</span>
                  <span className="font-mono">{completedInvoice.totalAmount.toFixed(2)} ر.س</span>
                </div>
                {completedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>الخصم المطبق:</span>
                    <span className="font-mono">-{completedInvoice.discountAmount.toFixed(2)} ر.س</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>ضريبة القيمة المضافة ({completedInvoice.taxRate}%):</span>
                  <span className="font-mono">{completedInvoice.taxAmount.toFixed(2)} ر.س</span>
                </div>

                <div className="flex justify-between text-gray-900 font-black text-xs border-t border-dashed border-gray-300 pt-1.5">
                  <span>الصافي الكلي المطلوب:</span>
                  <span className="font-mono text-emerald-700">{completedInvoice.finalAmount.toFixed(2)} ر.س</span>
                </div>

                {completedInvoice.paymentMethod === 'cash' && (
                  <div className="border-t border-dotted border-gray-200 mt-2 pt-2 space-y-1 text-[9px]">
                    <div className="flex justify-between">
                      <span>المدفوع نقداً من العميل:</span>
                      <div className="flex gap-1 items-center">
                        <input
                          type="number"
                          placeholder="المبلغ النقدي"
                          value={paymentReceived}
                          onChange={e => setPaymentReceived(e.target.value)}
                          className="w-16 px-1.5 py-0.5 border border-gray-200 rounded font-mono text-[9px] text-left"
                        />
                        <span>ر.س</span>
                      </div>
                    </div>
                    {cashChange > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>المبلغ المتبقي للعميل (الخردة):</span>
                        <span className="font-mono">{cashChange.toFixed(2)} ر.س</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footnotes / QR placeholder */}
              <div className="text-center pt-4 space-y-1.5">
                <div className="w-16 h-16 bg-gray-100 border border-gray-200 mx-auto flex items-center justify-center text-[8px] text-gray-400 rounded-sm">
                  [رمز QR مالي]
                </div>
                <p className="text-[9px] text-gray-500 font-bold">شكراً لزيارتكم وثقتكم بنا!</p>
              </div>
            </div>

            {/* Print trigger CTA */}
            <div className="bg-gray-50 px-4 py-3.5 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4" /> محاكاة طباعة الإيصال
              </button>
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
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
