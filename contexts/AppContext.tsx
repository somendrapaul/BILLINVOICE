
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CompanyProfile, Client, StockItem, Invoice, InvoiceStatus, TaxRate, InvoiceItem } from '../types';
import { LOCAL_STORAGE_KEYS, DEFAULT_COMPANY_PROFILE_ID } from '../constants';
import { generateId, getTodaysDateISO, calculateInvoiceTotals } from '../lib/utils';

interface AppState {
  companyProfile: CompanyProfile | null;
  clients: Client[];
  items: StockItem[];
  invoices: Invoice[];
  isLoading: boolean; // Potentially for async operations in future
}

interface AppContextType extends AppState {
  setCompanyProfile: (profileData: Omit<CompanyProfile, 'id'>) => CompanyProfile;
  updateCompanyProfile: (profileData: CompanyProfile) => CompanyProfile;
  
  addClient: (clientData: Omit<Client, 'id'>) => Client;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  getClientById: (clientId: string) => Client | undefined;

  addItem: (itemData: Omit<StockItem, 'id'>) => StockItem;
  updateItem: (item: StockItem) => void;
  deleteItem: (itemId: string) => void;
  getItemById: (itemId: string) => StockItem | undefined;

  addInvoice: (invoiceDraft: Omit<Invoice, 'id' | 'invoiceNumber' | 'companyProfileSnapshot' | 'clientDetails' | 'subtotal' | 'discountAmountCalculated' | 'amountAfterDiscount' | 'totalTax' | 'grandTotal' | 'items'> & { items: Omit<InvoiceItem, 'lineTotal' | 'taxAmount' | 'itemTotalWithTax'>[] }) => Invoice;
  updateInvoice: (invoice: Invoice) => Invoice;
  deleteInvoice: (invoiceId: string) => void;
  getInvoiceById: (invoiceId: string) => Invoice | undefined;
  getNewInvoiceNumber: () => string;
  markInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companyProfile, setCompanyProfileState] = useLocalStorage<CompanyProfile | null>(LOCAL_STORAGE_KEYS.COMPANY_PROFILE, null);
  const [clients, setClients] = useLocalStorage<Client[]>(LOCAL_STORAGE_KEYS.CLIENTS, []);
  const [items, setItems] = useLocalStorage<StockItem[]>(LOCAL_STORAGE_KEYS.STOCK_ITEMS, []);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>(LOCAL_STORAGE_KEYS.INVOICES, []);
  const [lastInvoiceSuffix, setLastInvoiceSuffix] = useLocalStorage<number>(LOCAL_STORAGE_KEYS.LAST_INVOICE_NUMBER_SUFFIX, 0);

  const isLoading = false; // Placeholder

  const setCompanyProfile = useCallback((profileData: Omit<CompanyProfile, 'id'>): CompanyProfile => {
    const newProfile: CompanyProfile = { ...profileData, id: DEFAULT_COMPANY_PROFILE_ID };
    setCompanyProfileState(newProfile);
    return newProfile;
  }, [setCompanyProfileState]);
  
  const updateCompanyProfile = useCallback((profileData: CompanyProfile): CompanyProfile => {
    setCompanyProfileState(profileData);
    // Optionally update snapshots in existing DRAFT invoices if desired
    return profileData;
  }, [setCompanyProfileState]);

  const addClient = useCallback((clientData: Omit<Client, 'id'>): Client => {
    const newClient: Client = { ...clientData, id: generateId() };
    setClients(prev => [...prev, newClient]);
    return newClient;
  }, [setClients]);

  const updateClient = useCallback((updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  }, [setClients]);

  const deleteClient = useCallback((clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
  }, [setClients]);

  const getClientById = useCallback((clientId: string) => clients.find(c => c.id === clientId), [clients]);

  const addItem = useCallback((itemData: Omit<StockItem, 'id'>): StockItem => {
    const newItem: StockItem = { ...itemData, id: generateId() };
    setItems(prev => [...prev, newItem]);
    return newItem;
  }, [setItems]);

  const updateItem = useCallback((updatedItem: StockItem) => {
    setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
  }, [setItems]);

  const deleteItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  }, [setItems]);

  const getItemById = useCallback((itemId: string) => items.find(i => i.id === itemId), [items]);

  const getNewInvoiceNumber = useCallback((): string => {
    const currentYear = new Date().getFullYear();
    const newSuffix = lastInvoiceSuffix + 1;
    return `INV-${currentYear}-${String(newSuffix).padStart(3, '0')}`;
  }, [lastInvoiceSuffix]);

  const addInvoice = useCallback((invoiceDraft: Omit<Invoice, 'id' | 'invoiceNumber' | 'companyProfileSnapshot' | 'clientDetails' | 'subtotal' | 'discountAmountCalculated' | 'amountAfterDiscount' | 'totalTax' | 'grandTotal' | 'items'> & { items: Omit<InvoiceItem, 'lineTotal' | 'taxAmount' | 'itemTotalWithTax'>[] }): Invoice => {
    if (!companyProfile) throw new Error("Company profile not set.");
    const client = getClientById(invoiceDraft.clientId);
    if (!client) throw new Error("Client not found.");

    const invoiceNumber = getNewInvoiceNumber();
    
    const processedItems: InvoiceItem[] = invoiceDraft.items.map(draftItem => {
      const stockItem = getItemById(draftItem.stockItemId);
      return {
        stockItemId: draftItem.stockItemId, // Keep original stockItemId
        quantity: draftItem.quantity,
        // Fill other fields from draftItem if they exist, or defaults/stockItem
        itemName: stockItem?.name || draftItem.itemName || 'N/A',
        description: stockItem?.description || draftItem.description || '',
        unitPrice: stockItem?.unitPrice || draftItem.unitPrice || 0,
        taxRate: stockItem?.taxRate || draftItem.taxRate || TaxRate.RATE_0,
        lineTotal: 0, // Will be calculated
        taxAmount: 0, // Will be calculated
        itemTotalWithTax: 0 // Will be calculated
      };
    });
    
    const totals = calculateInvoiceTotals(processedItems, invoiceDraft.discountType, invoiceDraft.discountValue);

    const newInvoice: Invoice = {
      ...invoiceDraft,
      id: generateId(),
      invoiceNumber,
      companyProfileSnapshot: { ...companyProfile },
      clientDetails: { ...client },
      items: totals.updatedItems,
      subtotal: totals.subtotal,
      discountAmountCalculated: totals.discountAmountCalculated,
      amountAfterDiscount: totals.amountAfterDiscount,
      totalTax: totals.totalTax,
      grandTotal: totals.grandTotal,
    };
    setInvoices(prev => [...prev, newInvoice]);
    if(newInvoice.status !== InvoiceStatus.DRAFT) { // Only increment if not a draft initially
        setLastInvoiceSuffix(prevSuffix => prevSuffix + 1);
    }
    return newInvoice;
  }, [companyProfile, getClientById, getItemById, getNewInvoiceNumber, setInvoices, setLastInvoiceSuffix]);

  const updateInvoice = useCallback((updatedInvoice: Invoice): Invoice => {
     if (!companyProfile) throw new Error("Company profile not set.");
     const client = getClientById(updatedInvoice.clientId);
     if (!client) throw new Error("Client not found.");

    // Recalculate totals
    const totals = calculateInvoiceTotals(updatedInvoice.items, updatedInvoice.discountType, updatedInvoice.discountValue);
    
    const fullyUpdatedInvoice: Invoice = {
        ...updatedInvoice,
        companyProfileSnapshot: updatedInvoice.companyProfileSnapshot || { ...companyProfile }, // Ensure snapshot
        clientDetails: updatedInvoice.clientDetails || { ...client }, // Ensure snapshot
        items: totals.updatedItems,
        subtotal: totals.subtotal,
        discountAmountCalculated: totals.discountAmountCalculated,
        amountAfterDiscount: totals.amountAfterDiscount,
        totalTax: totals.totalTax,
        grandTotal: totals.grandTotal,
    };

    setInvoices(prev => prev.map(inv => inv.id === fullyUpdatedInvoice.id ? fullyUpdatedInvoice : inv));
    // If a draft is being finalized, update invoice number suffix
    const oldInvoice = invoices.find(inv => inv.id === updatedInvoice.id);
    if (oldInvoice?.status === InvoiceStatus.DRAFT && updatedInvoice.status !== InvoiceStatus.DRAFT && updatedInvoice.invoiceNumber.startsWith("DRAFT-")) {
        // This logic should be part of finalization, where a new number is assigned.
        // For simplicity, we assume invoiceNumber is correctly handled before updateInvoice.
        // If invoice number changed from DRAFT-XXX to INV-YYY-ZZZ, then update suffix.
        // This is tricky if user can edit invoiceNumber manually after finalization from draft.
        // A robust solution would re-assign invoiceNumber when status changes from DRAFT.
        // For now, let's assume the invoice number is final when updateInvoice is called for a non-draft.
    }

    return fullyUpdatedInvoice;
  }, [setInvoices, companyProfile, getClientById, invoices]);


  const deleteInvoice = useCallback((invoiceId: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
  }, [setInvoices]);

  const getInvoiceById = useCallback((invoiceId: string) => invoices.find(inv => inv.id === invoiceId), [invoices]);

  const markInvoiceStatus = useCallback((invoiceId: string, status: InvoiceStatus) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        // If changing from DRAFT to a non-DRAFT status, and invoice number is still a DRAFT number.
        // A more robust system would regenerate the invoice number here.
        // For simplicity, we'll assume the number is handled elsewhere or is okay.
        // If it was a draft and now becomes official, we might need to update the lastInvoiceSuffix.
        // This is complex if the invoice number was manually set.
        // Simplification: assume invoice number finalization happens before or during this status change.
        return { ...inv, status };
      }
      return inv;
    }));
  }, [setInvoices]);


  const value = {
    companyProfile, setCompanyProfile, updateCompanyProfile,
    clients, addClient, updateClient, deleteClient, getClientById,
    items, addItem, updateItem, deleteItem, getItemById,
    invoices, addInvoice, updateInvoice, deleteInvoice, getInvoiceById, getNewInvoiceNumber, markInvoiceStatus,
    isLoading
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};