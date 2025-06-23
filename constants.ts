
export const LOCAL_STORAGE_KEYS = {
  COMPANY_PROFILE: 'invoiceApp_companyProfile',
  CLIENTS: 'invoiceApp_clients',
  STOCK_ITEMS: 'invoiceApp_stockItems',
  INVOICES: 'invoiceApp_invoices',
  LAST_INVOICE_NUMBER_SUFFIX: 'invoiceApp_lastInvoiceNumberSuffix',
};

export const ROUTES = {
  DASHBOARD: '/',
  CREATE_INVOICE: '/invoice/new',
  EDIT_INVOICE: '/invoice/edit/:invoiceId', // Dynamic route
  VIEW_INVOICE: '/invoice/view/:invoiceId',  // Dynamic route
  CLIENTS: '/clients',
  ITEMS: '/items',
  SETTINGS: '/settings',
};

export const DEFAULT_COMPANY_PROFILE_ID = 'default_company_profile';
