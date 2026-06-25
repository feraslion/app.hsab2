import { Product, Customer, Invoice, Expense, BackupData } from '../types';

// Standard mock products for first initialization
const initialProducts: Product[] = [
  { id: 'p1', name: 'أرز بسمتي ممتاز 5 كجم', price: 65, costPrice: 48, stock: 45, barcode: '628100112233', category: 'غذائيات', minStockAlert: 10, createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
  { id: 'p2', name: 'زيت طهي نباتي 1.5 لتر', price: 18, costPrice: 13.5, stock: 8, barcode: '628100223344', category: 'غذائيات', minStockAlert: 15, createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
  { id: 'p3', name: 'شاي أحمر كبوس 100 كيس', price: 12, costPrice: 8.5, stock: 50, barcode: '628100334455', category: 'مشروبات', minStockAlert: 12, createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString() },
  { id: 'p4', name: 'قهوة هرري محوجة 500 جم', price: 35, costPrice: 24, stock: 25, barcode: '628100445566', category: 'مشروبات', minStockAlert: 5, createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString() },
  { id: 'p5', name: 'حليب كامل الدسم طويل الأجل', price: 6.5, costPrice: 4.8, stock: 120, barcode: '628100556677', category: 'ألبان', minStockAlert: 20, createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() },
  { id: 'p6', name: 'تمر خلاص فاخر 1 كجم', price: 25, costPrice: 15, stock: 4, barcode: '628100667788', category: 'غذائيات', minStockAlert: 8, createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
];

const initialCustomers: Customer[] = [
  { id: 'c1', name: 'عميل نقدي (عام)', phone: '-', email: '-', balance: 0, createdAt: new Date().toISOString() },
  { id: 'c2', name: 'عبد الله العتيبي', phone: '0501234567', email: 'abdul@example.com', balance: 150, createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() },
  { id: 'c3', name: 'مؤسسة آفاق الإعمار', phone: '0559876543', email: 'info@afaq.com', balance: -450, createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
  { id: 'c4', name: 'فاطمة الحربي', phone: '0543332211', email: 'fatima@example.com', balance: 0, createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
];

const initialExpenses: Expense[] = [
  { id: 'e1', title: 'إيجار المحل الشهري', category: 'إيجارات', amount: 1500, date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString().split('T')[0] },
  { id: 'e2', title: 'فاتورة الكهرباء والمياه', category: 'مرافق', amount: 340, date: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString().split('T')[0] },
  { id: 'e3', title: 'أكياس ومواد تغليف الفواتير', category: 'مستلزمات', amount: 85, date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString().split('T')[0] },
];

// Invoices distributed over several recent days to make graphs look nice
const getInitialInvoices = (): Invoice[] => [
  {
    id: 'inv-1001',
    customerId: 'c1',
    customerName: 'عميل نقدي (عام)',
    items: [
      { id: 'item1_1', productId: 'p1', productName: 'أرز بسمتي ممتاز 5 كجم', quantity: 2, unitPrice: 65, totalPrice: 130 },
      { id: 'item1_2', productId: 'p2', productName: 'زيت طهي نباتي 1.5 لتر', quantity: 3, unitPrice: 18, totalPrice: 54 },
    ],
    totalAmount: 184,
    taxRate: 15,
    taxAmount: 27.6,
    discountAmount: 10,
    finalAmount: 201.6,
    paymentMethod: 'cash',
    status: 'paid',
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'inv-1002',
    customerId: 'c2',
    customerName: 'عبد الله العتيبي',
    items: [
      { id: 'item2_1', productId: 'p4', productName: 'قهوة هرري محوجة 500 جم', quantity: 1, unitPrice: 35, totalPrice: 35 },
      { id: 'item2_2', productId: 'p5', productName: 'حليب كامل الدسم طويل الأجل', quantity: 10, unitPrice: 6.5, totalPrice: 65 },
    ],
    totalAmount: 100,
    taxRate: 15,
    taxAmount: 15,
    discountAmount: 0,
    finalAmount: 115,
    paymentMethod: 'card',
    status: 'paid',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'inv-1003',
    customerId: 'c3',
    customerName: 'مؤسسة آفاق الإعمار',
    items: [
      { id: 'item3_1', productId: 'p1', productName: 'أرز بسمتي ممتاز 5 كجم', quantity: 5, unitPrice: 65, totalPrice: 325 },
      { id: 'item3_2', productId: 'p3', productName: 'شاي أحمر كبوس 100 كيس', quantity: 4, unitPrice: 12, totalPrice: 48 },
      { id: 'item3_3', productId: 'p6', productName: 'تمر خلاص فاخر 1 كجم', quantity: 2, unitPrice: 25, totalPrice: 50 },
    ],
    totalAmount: 423,
    taxRate: 15,
    taxAmount: 63.45,
    discountAmount: 25,
    finalAmount: 461.45,
    paymentMethod: 'bank',
    status: 'paid',
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  }
];

export const getStorageData = () => {
  if (typeof window === 'undefined') {
    return { products: [], customers: [], invoices: [], expenses: [] };
  }

  const productsStr = localStorage.getItem('hisab_products');
  const customersStr = localStorage.getItem('hisab_customers');
  const invoicesStr = localStorage.getItem('hisab_invoices');
  const expensesStr = localStorage.getItem('hisab_expenses');

  let products: Product[] = productsStr ? JSON.parse(productsStr) : [];
  let customers: Customer[] = customersStr ? JSON.parse(customersStr) : [];
  let invoices: Invoice[] = invoicesStr ? JSON.parse(invoicesStr) : [];
  let expenses: Expense[] = expensesStr ? JSON.parse(expensesStr) : [];

  // Initialize with mock data if everything is empty
  if (products.length === 0 && customers.length === 0 && invoices.length === 0) {
    products = initialProducts;
    customers = initialCustomers;
    expenses = initialExpenses;
    invoices = getInitialInvoices();
    
    saveProducts(products);
    saveCustomers(customers);
    saveExpenses(expenses);
    saveInvoices(invoices);
  }

  return { products, customers, invoices, expenses };
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem('hisab_products', JSON.stringify(products));
};

export const saveCustomers = (customers: Customer[]) => {
  localStorage.setItem('hisab_customers', JSON.stringify(customers));
};

export const saveInvoices = (invoices: Invoice[]) => {
  localStorage.setItem('hisab_invoices', JSON.stringify(invoices));
};

export const saveExpenses = (expenses: Expense[]) => {
  localStorage.setItem('hisab_expenses', JSON.stringify(expenses));
};

export const importBackupData = (data: BackupData): boolean => {
  try {
    if (!Array.isArray(data.products) || !Array.isArray(data.customers) || !Array.isArray(data.invoices) || !Array.isArray(data.expenses)) {
      return false;
    }
    saveProducts(data.products);
    saveCustomers(data.customers);
    saveInvoices(data.invoices);
    saveExpenses(data.expenses);
    return true;
  } catch (e) {
    console.error('Failed to import backup data:', e);
    return false;
  }
};

export const getBackupData = (): BackupData => {
  const data = getStorageData();
  return {
    ...data,
    version: '1.0.0',
    exportedAt: new Date().toISOString()
  };
};

export const clearAllData = () => {
  localStorage.removeItem('hisab_products');
  localStorage.removeItem('hisab_customers');
  localStorage.removeItem('hisab_invoices');
  localStorage.removeItem('hisab_expenses');
};
