import { Product, Customer, Invoice, Expense } from '../types';
import { getStorageData, saveProducts, saveCustomers, saveInvoices, saveExpenses } from './storage';

export type ConnectionState = 'online' | 'offline';

export interface SyncLog {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'product' | 'customer' | 'invoice' | 'expense';
  entityId: string;
  data: any;
  timestamp: string;
}

// Simulated cloud database storage keys
const CLOUD_PRODUCTS_KEY = 'hisab_cloud_products';
const CLOUD_CUSTOMERS_KEY = 'hisab_cloud_customers';
const CLOUD_INVOICES_KEY = 'hisab_cloud_invoices';
const CLOUD_EXPENSES_KEY = 'hisab_cloud_expenses';

export const getCloudMirrorData = () => {
  if (typeof window === 'undefined') return { products: [], customers: [], invoices: [], expenses: [] };
  
  // If not initialized, initialize with local storage data (simulating initial cloud backup)
  if (!localStorage.getItem(CLOUD_PRODUCTS_KEY)) {
    const local = getStorageData();
    localStorage.setItem(CLOUD_PRODUCTS_KEY, JSON.stringify(local.products));
    localStorage.setItem(CLOUD_CUSTOMERS_KEY, JSON.stringify(local.customers));
    localStorage.setItem(CLOUD_INVOICES_KEY, JSON.stringify(local.invoices));
    localStorage.setItem(CLOUD_EXPENSES_KEY, JSON.stringify(local.expenses));
  }

  return {
    products: JSON.parse(localStorage.getItem(CLOUD_PRODUCTS_KEY) || '[]') as Product[],
    customers: JSON.parse(localStorage.getItem(CLOUD_CUSTOMERS_KEY) || '[]') as Customer[],
    invoices: JSON.parse(localStorage.getItem(CLOUD_INVOICES_KEY) || '[]') as Invoice[],
    expenses: JSON.parse(localStorage.getItem(CLOUD_EXPENSES_KEY) || '[]') as Expense[]
  };
};

export const saveCloudMirrorData = (data: { products: Product[], customers: Customer[], invoices: Invoice[], expenses: Expense[] }) => {
  localStorage.setItem(CLOUD_PRODUCTS_KEY, JSON.stringify(data.products));
  localStorage.setItem(CLOUD_CUSTOMERS_KEY, JSON.stringify(data.customers));
  localStorage.setItem(CLOUD_INVOICES_KEY, JSON.stringify(data.invoices));
  localStorage.setItem(CLOUD_EXPENSES_KEY, JSON.stringify(data.expenses));
};

export const getSyncQueue = (): SyncQueueItem[] => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('hisab_sync_queue') || '[]') as SyncQueueItem[];
};

export const saveSyncQueue = (queue: SyncQueueItem[]) => {
  localStorage.setItem('hisab_sync_queue', JSON.stringify(queue));
};

export const addToSyncQueue = (
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: 'product' | 'customer' | 'invoice' | 'expense',
  entityId: string,
  data: any
) => {
  const queue = getSyncQueue();
  // Remove existing queued actions for the same entity if they are redundant
  const filteredQueue = queue.filter(item => !(item.entity === entity && item.entityId === entityId && action === 'UPDATE' && item.action === 'UPDATE'));
  
  const newItem: SyncQueueItem = {
    id: 'q-' + Math.random().toString(36).substr(2, 9),
    action,
    entity,
    entityId,
    data,
    timestamp: new Date().toISOString()
  };
  
  filteredQueue.push(newItem);
  saveSyncQueue(filteredQueue);
  
  // Trigger storage event for reactivity if needed
  window.dispatchEvent(new Event('sync_queue_updated'));
};

export const clearSyncQueue = () => {
  saveSyncQueue([]);
  window.dispatchEvent(new Event('sync_queue_updated'));
};
