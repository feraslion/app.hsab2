export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  barcode: string;
  category: string;
  minStockAlert: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  balance: number;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  customerId?: string;
  customerName?: string;
  items: InvoiceItem[];
  totalAmount: number; // Subtotal before tax and discount
  taxRate: number; // Percentage, e.g., 15
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: 'cash' | 'card' | 'bank' | 'debt';
  status: 'paid' | 'unpaid' | 'partially_paid';
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
}

export interface BackupData {
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  expenses: Expense[];
  version: string;
  exportedAt: string;
}
