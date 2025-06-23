
import React from 'react';
import { Invoice, InvoiceStatus, CompanyProfile, Client, InvoiceItem } from '../types';
import QRCodeComponent from './QRCodeComponent';
import { formatDate, generateUpiQrString, getTaxRateLabel } from '../lib/utils';

interface InvoiceViewProps {
  invoice: Invoice;
  containerId?: string; // ID for the main container, useful for PDF generation
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice, containerId }) => {
  const { 
    companyProfileSnapshot: company, 
    clientDetails: client, 
    items,
    invoiceNumber,
    billDate,
    dueDate,
    subtotal,
    discountType,
    discountValue,
    discountAmountCalculated,
    amountAfterDiscount,
    totalTax,
    grandTotal,
    termsAndConditions,
    notes,
    status
  } = invoice;

  const upiQrString = company.upiId && grandTotal > 0 ? generateUpiQrString(company.upiId, company.companyName, grandTotal, invoiceNumber) : '';

  const getStatusColor = (currentStatus: InvoiceStatus) => {
    switch (currentStatus) {
      case InvoiceStatus.PAID: return 'text-green-600 bg-green-100 border-green-500';
      case InvoiceStatus.OVERDUE: return 'text-red-600 bg-red-100 border-red-500';
      case InvoiceStatus.UNPAID: return 'text-orange-600 bg-orange-100 border-orange-500';
      case InvoiceStatus.DRAFT: return 'text-slate-600 bg-slate-100 border-slate-500';
      default: return 'text-slate-700 bg-slate-200 border-slate-400';
    }
  };


  return (
    <div id={containerId || "invoice-view-content"} className="p-4 md:p-8 bg-white shadow-lg rounded-lg max-w-4xl mx-auto my-5 print:shadow-none print:m-0 print:p-0">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start mb-8 pb-4 border-b border-slate-200">
        <div className="mb-4 md:mb-0">
          {company.logo && <img src={company.logo} alt={`${company.companyName} Logo`} className="h-20 w-auto mb-2 object-contain"/>}
          <h1 className="text-2xl font-bold text-slate-800">{company.companyName}</h1>
          <p className="text-sm text-slate-600 whitespace-pre-line">{company.address}</p>
          <p className="text-sm text-slate-600">Phone: {company.contactNumber}</p>
          <p className="text-sm text-slate-600">Email: {company.email}</p>
          {company.website && <p className="text-sm text-slate-600">Website: {company.website}</p>}
          <p className="text-sm text-slate-600">Tax ID: {company.taxId}</p>
        </div>
        <div className="text-left md:text-right">
          <h2 className="text-3xl font-bold uppercase text-sky-600">Invoice</h2>
          <p className="text-sm text-slate-600"><strong>Invoice #:</strong> {invoiceNumber}</p>
          <p className="text-sm text-slate-600"><strong>Date:</strong> {formatDate(billDate)}</p>
          <p className="text-sm text-slate-600"><strong>Due Date:</strong> {formatDate(dueDate)}</p>
          <div className={`mt-2 py-1 px-3 inline-block rounded-full text-sm font-semibold border ${getStatusColor(status)}`}>
            Status: {status}
          </div>
        </div>
      </header>

      {/* Client Info */}
      <section className="flex flex-col md:flex-row justify-between mb-8">
        <div className="mb-4 md:mb-0">
          <h3 className="text-base font-semibold text-slate-700 mb-1">Bill To:</h3>
          <p className="text-sm font-medium text-slate-800">{client.name}</p>
          <p className="text-sm text-slate-600 whitespace-pre-line">{client.billingAddress}</p>
          <p className="text-sm text-slate-600">{client.email}</p>
          <p className="text-sm text-slate-600">{client.phoneNumber}</p>
          {client.taxId && <p className="text-sm text-slate-600">Tax ID: {client.taxId}</p>}
        </div>
        {client.shippingAddress && (
          <div className="md:text-right">
            <h3 className="text-base font-semibold text-slate-700 mb-1">Ship To:</h3>
            <p className="text-sm text-slate-600 whitespace-pre-line">{client.shippingAddress}</p>
          </div>
        )}
      </section>

      {/* Items Table */}
      <section className="mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 border border-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Item & Description</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Unit Price</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Tax Rate</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Tax Amt.</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Line Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600">{index + 1}</td>
                  <td className="px-4 py-2 whitespace-normal text-sm text-slate-800">
                    <span className="font-medium">{item.itemName}</span>
                    {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 text-right">{item.quantity}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 text-right">₹{item.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 text-right">{getTaxRateLabel(item.taxRate)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600 text-right">₹{item.taxAmount.toFixed(2)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-800 font-medium text-right">₹{item.itemTotalWithTax.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Totals Section */}
      <section className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div className="w-full md:w-1/2 mb-4 md:mb-0">
          {termsAndConditions && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-1">Terms & Conditions:</h4>
              <p className="text-xs text-slate-600 whitespace-pre-line">{termsAndConditions}</p>
            </div>
          )}
          {notes && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">Notes:</h4>
              <p className="text-xs text-slate-600 whitespace-pre-line">{notes}</p>
            </div>
          )}
           {upiQrString && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Pay using UPI:</h4>
              <div className="flex items-center">
                <QRCodeComponent value={upiQrString} size={100} />
                <div className="ml-3 text-xs text-slate-600">
                  <p>Scan to pay with any UPI app.</p>
                  <p>UPI ID: {company.upiId}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="w-full md:w-2/5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal:</span>
              <span className="text-slate-800 font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmountCalculated > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">
                  Discount ({discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue.toFixed(2)}` }):
                </span>
                <span className="text-slate-800 font-medium">- ₹{discountAmountCalculated.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
                <span className="text-slate-600">Amount after Discount:</span>
                <span className="text-slate-800 font-medium">₹{amountAfterDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total Tax:</span>
              <span className="text-slate-800 font-medium">₹{totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-sky-700 pt-2 border-t border-slate-300 mt-2">
              <span>Grand Total:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200">
        <p>Thank you for your business!</p>
        {company.companyName && <p>{company.companyName} - {company.email} - {company.contactNumber}</p>}
      </footer>
    </div>
  );
};

export default InvoiceView;
