
export interface CompanyProfile {
  id: string; // Keep an ID for consistency, though there's only one profile
  logo?: string; // Base64 encoded image
  companyName: string;
  address: string;
  contactNumber: string;
  email: string;
  website?: string;
  taxId: string;
  upiId: string;
  termsAndConditions?: string; // Added field
}

export interface Client {
  id: string; // Auto-generated UUID
  name: string;
  billingAddress: string;
  shippingAddress?: string;
  email: string;
  phoneNumber: string;
  taxId?: string;
}

export enum TaxRate {
  RATE_0 = 0,
  RATE_5 = 5,
  RATE_12 = 12,
  RATE_18 = 18,
  RATE_28 = 28,
}

export const TaxRateOptions = [
  { value: TaxRate.RATE_0, label: "0%" },
  { value: TaxRate.RATE_5, label: "5%" },
  { value: TaxRate.RATE_12, label: "12%" },
  { value: TaxRate.RATE_18, label: "18%" },
  { value: TaxRate.RATE_28, label: "28%" },
];

export interface StockItem {
  id: string; // SKU or auto-generated UUID
  name: string;
  description?: string;
  unitPrice: number;
  taxRate: TaxRate;
}

export interface InvoiceItem {
  stockItemId: string; // Reference to StockItem.id for linking
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRate: TaxRate;
  lineTotal: number; // quantity * unitPrice (before tax)
  taxAmount: number; // tax for this line item
  itemTotalWithTax: number; // lineTotal + taxAmount
}

export enum InvoiceStatus {
  UNPAID = "Unpaid",
  PAID = "Paid",
  OVERDUE = "Overdue",
  DRAFT = "Draft",
}

export interface Invoice {
  id: string; // UUID
  invoiceNumber: string; // e.g., INV-2024-001
  billDate: string; // ISO Date string YYYY-MM-DD
  dueDate: string; // ISO Date string YYYY-MM-DD
  clientId: string; 
  clientDetails: Client; // Snapshot of client details
  items: InvoiceItem[];
  subtotal: number; // Sum of all lineTotals (before tax, before discount)
  discountType: 'percentage' | 'flat';
  discountValue: number; // Percentage (0-100) or flat amount
  discountAmountCalculated: number; // Calculated discount amount
  amountAfterDiscount: number; // subtotal - discountAmountCalculated
  totalTax: number; // Sum of taxAmount for all items
  grandTotal: number; // amountAfterDiscount + totalTax
  termsAndConditions?: string;
  notes?: string;
  status: InvoiceStatus;
  companyProfileSnapshot: CompanyProfile; // Snapshot of company profile
}

export type NavItem = {
  name: string;
  path: string;
  icon: React.ElementType;
};