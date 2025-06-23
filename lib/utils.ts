
import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => {
  return uuidv4();
};

export const formatDate = (dateString: string | Date, format: 'YYYY-MM-DD' | 'DD MMM YYYY' = 'DD MMM YYYY'): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  if (format === 'YYYY-MM-DD') {
    return date.toISOString().split('T')[0];
  }
  
  // DD MMM YYYY
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const getTodaysDateISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Simple file to base64 converter
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const getTaxRateLabel = (value: number): string => {
    return `${value}%`;
};

// Sanitize string for use in filenames
export const sanitizeFilename = (name: string): string => {
  return name.replace(/[^a-z0-9_\-\s\.]/gi, '').replace(/\s+/g, '_').substring(0, 50);
};

export const calculateInvoiceTotals = (
  items: import('../types').InvoiceItem[],
  discountType: 'percentage' | 'flat',
  discountValue: number
): {
  subtotal: number;
  discountAmountCalculated: number;
  amountAfterDiscount: number;
  totalTax: number;
  grandTotal: number;
  updatedItems: import('../types').InvoiceItem[];
} => {
  const updatedItems = items.map(item => {
    const lineTotal = item.quantity * item.unitPrice;
    const taxAmount = lineTotal * (item.taxRate / 100);
    const itemTotalWithTax = lineTotal + taxAmount;
    return { ...item, lineTotal, taxAmount, itemTotalWithTax };
  });

  const subtotal = updatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  
  let discountAmountCalculated = 0;
  if (discountType === 'percentage') {
    discountAmountCalculated = subtotal * (discountValue / 100);
  } else {
    discountAmountCalculated = discountValue;
  }
  // Ensure discount doesn't exceed subtotal
  discountAmountCalculated = Math.min(discountAmountCalculated, subtotal);


  const amountAfterDiscount = subtotal - discountAmountCalculated;
  const totalTax = updatedItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const grandTotal = amountAfterDiscount + totalTax;

  return { 
    subtotal, 
    discountAmountCalculated, 
    amountAfterDiscount, 
    totalTax, 
    grandTotal,
    updatedItems 
  };
};

// Generates UPI QR string
export const generateUpiQrString = (
  upiId: string, 
  companyName: string, 
  amount: number, 
  invoiceNumber: string
): string => {
  const sanitizedCompanyName = encodeURIComponent(companyName);
  const sanitizedInvoiceNumber = encodeURIComponent(`Invoice-${invoiceNumber}`);
  // upi://pay?pa=[Your-UPI-ID]&pn=[Your-Company-Name]&am=[Grand-Total]&cu=INR&tn=Invoice-[InvoiceNumber]
  return `upi://pay?pa=${upiId}&pn=${sanitizedCompanyName}&am=${amount.toFixed(2)}&cu=INR&tn=${sanitizedInvoiceNumber}`;
};
