
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Invoice, InvoiceItem, Client, StockItem, InvoiceStatus, TaxRate } from '../types';
import { useAppContext } from '../contexts/AppContext';
import PageContainer from '../components/PageContainer';
import InvoiceView from '../components/InvoiceView';
import { SaveIcon, PlusCircleIcon, TrashIcon, DownloadIcon, PrinterIcon } from '../components/icons';
import { getTodaysDateISO, formatDate, generateId, calculateInvoiceTotals, getTaxRateLabel } from '../lib/utils';
import { downloadInvoiceAsPDF } from '../lib/pdfGenerator';
import { ROUTES } from '../constants';
import Modal from '../components/Modal';

const PDF_CONTENT_ID = "invoice-pdf-render-area";

const CreateInvoicePage: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId?: string }>();
  const navigate = useNavigate();
  const { 
    companyProfile, 
    clients, 
    items: stockItems, 
    addInvoice, 
    updateInvoice, 
    getInvoiceById, 
    getNewInvoiceNumber, 
    getClientById, 
    getItemById
  } = useAppContext();

  const [invoiceData, setInvoiceData] = useState<Partial<Invoice>>({});
  const [currentInvoiceItems, setCurrentInvoiceItems] = useState<InvoiceItem[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  const isEditing = Boolean(invoiceId);

  const initializeInvoice = useCallback(() => {
    let baseInvoice: Partial<Invoice>;
    if (isEditing && invoiceId) {
      const existingInvoice = getInvoiceById(invoiceId);
      if (existingInvoice) {
        baseInvoice = { ...existingInvoice };
        setCurrentInvoiceItems([...existingInvoice.items]);
      } else {
        alert('Invoice not found!');
        navigate(ROUTES.DASHBOARD);
        return; // Early exit
      }
    } else {
      // New invoice
      baseInvoice = {
        invoiceNumber: getNewInvoiceNumber(),
        billDate: getTodaysDateISO(),
        dueDate: getTodaysDateISO(),
        clientId: clients.length > 0 ? clients[0].id : '',
        items: [],
        discountType: 'percentage',
        discountValue: 0,
        termsAndConditions: companyProfile?.termsAndConditions || 'Payment due within 30 days.', // Example default
        notes: '',
        status: InvoiceStatus.DRAFT, // Default to draft for new invoices
      };
      setCurrentInvoiceItems([]);
    }
    setInvoiceData(baseInvoice);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, isEditing, getInvoiceById, navigate, getNewInvoiceNumber, clients, companyProfile]);


  useEffect(() => {
    if (!companyProfile) {
      alert("Please set up your company profile first in Settings.");
      navigate(ROUTES.SETTINGS);
      return;
    }
    initializeInvoice();
  }, [companyProfile, initializeInvoice, navigate]);


  // Recalculate totals whenever items, discount, etc. change
  useEffect(() => {
    if (!invoiceData.items && currentInvoiceItems.length === 0 && !invoiceData.discountType) return; // Not ready yet

    const { 
      subtotal, 
      discountAmountCalculated, 
      amountAfterDiscount, 
      totalTax, 
      grandTotal,
      updatedItems
    } = calculateInvoiceTotals(currentInvoiceItems, invoiceData.discountType || 'percentage', invoiceData.discountValue || 0);

    setInvoiceData(prev => ({
      ...prev,
      subtotal,
      discountAmountCalculated,
      amountAfterDiscount,
      totalTax,
      grandTotal,
    }));
    // This might cause an infinite loop if currentInvoiceItems is not carefully managed.
    // Only update if there's a structural difference.
    if (JSON.stringify(updatedItems) !== JSON.stringify(currentInvoiceItems)) {
         setCurrentInvoiceItems(updatedItems);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInvoiceItems, invoiceData.discountType, invoiceData.discountValue]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | InvoiceStatus = value;
    if (type === 'number' || name === 'discountValue') {
      processedValue = parseFloat(value);
      if (isNaN(processedValue)) processedValue = 0;
    }
    setInvoiceData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...currentInvoiceItems];
    const itemToUpdate = { ...updatedItems[index] };
    
    if (field === 'stockItemId') { // Selected a stock item
        const selectedStockItem = getItemById(value as string);
        if (selectedStockItem) {
            itemToUpdate.stockItemId = selectedStockItem.id;
            itemToUpdate.itemName = selectedStockItem.name;
            itemToUpdate.description = selectedStockItem.description || '';
            itemToUpdate.unitPrice = selectedStockItem.unitPrice;
            itemToUpdate.taxRate = selectedStockItem.taxRate;
        }
    } else if (field === 'quantity' || field === 'unitPrice') {
        itemToUpdate[field] = parseFloat(value as string) || 0;
    } else {
        // This case should ideally not happen for direct item field edits through this function
        // itemToUpdate[field] = value; // Needs type assertion
    }
    updatedItems[index] = itemToUpdate;
    setCurrentInvoiceItems(updatedItems);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      stockItemId: stockItems.length > 0 ? stockItems[0].id : '', // Default to first stock item
      itemName: stockItems.length > 0 ? stockItems[0].name : 'Select Item',
      description: stockItems.length > 0 ? stockItems[0].description : '',
      quantity: 1,
      unitPrice: stockItems.length > 0 ? stockItems[0].unitPrice : 0,
      taxRate: stockItems.length > 0 ? stockItems[0].taxRate : TaxRate.RATE_0,
      lineTotal: 0, // Will be recalculated
      taxAmount: 0, // Will be recalculated
      itemTotalWithTax: 0 // Will be recalculated
    };
    setCurrentInvoiceItems(prev => [...prev, newItem]);
  };

  const removeItem = (index: number) => {
    setCurrentInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveInvoice = (targetStatus?: InvoiceStatus) => {
    if (!companyProfile || !invoiceData.clientId) {
      alert("Company profile and client must be set.");
      return;
    }
    const clientDetails = getClientById(invoiceData.clientId);
    if (!clientDetails) {
      alert("Client details not found.");
      return;
    }

    // Ensure all calculations are up-to-date one last time before saving
    const finalTotals = calculateInvoiceTotals(currentInvoiceItems, invoiceData.discountType || 'percentage', invoiceData.discountValue || 0);

    const fullInvoiceData: Invoice = {
      id: isEditing && invoiceId ? invoiceId : generateId(),
      invoiceNumber: invoiceData.invoiceNumber || getNewInvoiceNumber(), // Ensure number exists
      billDate: invoiceData.billDate || getTodaysDateISO(),
      dueDate: invoiceData.dueDate || getTodaysDateISO(),
      clientId: invoiceData.clientId,
      items: finalTotals.updatedItems,
      discountType: invoiceData.discountType || 'percentage',
      discountValue: invoiceData.discountValue || 0,
      termsAndConditions: invoiceData.termsAndConditions,
      notes: invoiceData.notes,
      status: targetStatus || invoiceData.status || InvoiceStatus.DRAFT,
      // Snapshots and calculated fields
      companyProfileSnapshot: { ...companyProfile },
      clientDetails: { ...clientDetails },
      subtotal: finalTotals.subtotal,
      discountAmountCalculated: finalTotals.discountAmountCalculated,
      amountAfterDiscount: finalTotals.amountAfterDiscount,
      totalTax: finalTotals.totalTax,
      grandTotal: finalTotals.grandTotal,
    };

    try {
        if (isEditing) {
          updateInvoice(fullInvoiceData);
          alert('Invoice updated successfully!');
        } else {
          addInvoice(fullInvoiceData); // addInvoice now takes the full object structure after calculations
          alert('Invoice saved successfully!');
        }
        if (fullInvoiceData.status !== InvoiceStatus.DRAFT) { // Navigate away if finalized
             navigate(`${ROUTES.VIEW_INVOICE.replace(':invoiceId', fullInvoiceData.id)}`);
        } else { // If saved as draft, stay on page for further edits or allow explicit navigation
            // If it's a new draft, update URL to edit mode for this new draft ID.
            if (!isEditing) {
                 navigate(`${ROUTES.EDIT_INVOICE.replace(':invoiceId', fullInvoiceData.id)}`, { replace: true });
            }
        }
    } catch (error) {
        console.error("Error saving invoice:", error);
        alert(`Error saving invoice: ${error instanceof Error ? error.message : String(error)}`);
    }
  };


  const handleFinalizeInvoice = () => {
    // Check if invoice number is still a draft number, if so, assign a new one
    let finalInvoiceNumber = invoiceData.invoiceNumber;
    if (invoiceData.status === InvoiceStatus.DRAFT && (!finalInvoiceNumber || finalInvoiceNumber.startsWith("DRAFT-"))) {
        finalInvoiceNumber = getNewInvoiceNumber();
        setInvoiceData(prev => ({...prev, invoiceNumber: finalInvoiceNumber!}));
    }
    handleSaveInvoice(InvoiceStatus.UNPAID); // Finalize as UNPAID by default
  };
  
  const fullInvoiceForPreview = (): Invoice | null => {
    if (!companyProfile || !invoiceData.clientId) return null;
    const clientDetails = getClientById(invoiceData.clientId);
    if (!clientDetails) return null;

    const { subtotal, discountAmountCalculated, amountAfterDiscount, totalTax, grandTotal, updatedItems } = calculateInvoiceTotals(currentInvoiceItems, invoiceData.discountType || 'percentage', invoiceData.discountValue || 0);

    return {
        id: invoiceId || 'preview-id',
        invoiceNumber: invoiceData.invoiceNumber || 'PREVIEW-001',
        billDate: invoiceData.billDate || getTodaysDateISO(),
        dueDate: invoiceData.dueDate || getTodaysDateISO(),
        clientId: invoiceData.clientId,
        items: updatedItems,
        discountType: invoiceData.discountType || 'percentage',
        discountValue: invoiceData.discountValue || 0,
        termsAndConditions: invoiceData.termsAndConditions,
        notes: invoiceData.notes,
        status: invoiceData.status || InvoiceStatus.DRAFT,
        companyProfileSnapshot: { ...companyProfile },
        clientDetails: { ...clientDetails },
        subtotal,
        discountAmountCalculated,
        amountAfterDiscount,
        totalTax,
        grandTotal,
    };
  };

  const handleDownloadPDF = async () => {
    const inv = fullInvoiceForPreview();
    if (inv) {
        // Ensure the InvoiceView for PDF is rendered (it could be hidden)
        // For this setup, we'll use the one in the modal if open, or trigger a render.
        // A common pattern is to have a hidden div that gets populated and used by html2canvas.
        // For simplicity, we assume the preview modal is good enough or InvoiceView is always rendered.
        // The `PDF_CONTENT_ID` should be on the `InvoiceView` when it's rendered for PDF.
        setIsPreviewModalOpen(true); // Ensure it's rendered
        // Wait for modal to render, then download. This is a bit hacky.
        // A better way is to render InvoiceView into a hidden div specifically for PDF generation.
        setTimeout(async () => {
            await downloadInvoiceAsPDF(inv, PDF_CONTENT_ID);
        }, 500); // Give time for modal to render fully
    } else {
        alert("Cannot generate PDF. Invoice data incomplete.");
    }
  };

  if (!companyProfile) {
    // This case is handled by useEffect, but as a safeguard:
    return <PageContainer title="Loading..."><p>Loading company profile or redirecting...</p></PageContainer>;
  }
  if (Object.keys(invoiceData).length === 0 && !isEditing) { // Initial load for new invoice, before useEffect sets data
    return <PageContainer title="Loading Invoice Form..."><p>Preparing new invoice...</p></PageContainer>;
  }
  if (isEditing && !invoiceData.id && invoiceId) { // Initial load for editing, before useEffect sets data
    return <PageContainer title="Loading Invoice..."><p>Loading invoice data for editing...</p></PageContainer>;
  }


  return (
    <PageContainer title={isEditing ? `Edit Invoice #${invoiceData.invoiceNumber}` : 'Create New Invoice'}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        {/* Invoice Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border border-slate-200 rounded-lg bg-slate-50">
          <div>
            <label htmlFor="invoiceNumber" className="block text-sm font-medium text-slate-700">Invoice Number *</label>
            <input type="text" name="invoiceNumber" id="invoiceNumber" value={invoiceData.invoiceNumber || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors" />
          </div>
          <div>
            <label htmlFor="billDate" className="block text-sm font-medium text-slate-700">Bill Date *</label>
            <input type="date" name="billDate" id="billDate" value={invoiceData.billDate || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors" />
          </div>
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700">Due Date *</label>
            <input type="date" name="dueDate" id="dueDate" value={invoiceData.dueDate || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="clientId" className="block text-sm font-medium text-slate-700">Client *</label>
            <select name="clientId" id="clientId" value={invoiceData.clientId || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors">
              <option value="" disabled>Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
           {isEditing && (
             <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700">Status *</label>
                <select name="status" id="status" value={invoiceData.status || InvoiceStatus.DRAFT} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors">
                {Object.values(InvoiceStatus).map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
                </select>
            </div>
           )}
        </div>

        {/* Invoice Items */}
        <div className="p-6 border border-slate-200 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Items</h3>
          {currentInvoiceItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 mb-4 p-3 border border-slate-200 rounded bg-slate-50 items-end">
              <div className="col-span-12 md:col-span-4">
                <label className="block text-xs font-medium text-slate-600">Item/Service</label>
                <select 
                    value={item.stockItemId} 
                    onChange={(e) => handleItemChange(index, 'stockItemId', e.target.value)}
                    className="mt-1 block w-full px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors"
                >
                    <option value="" disabled>Select stock item</option>
                    {stockItems.map(si => <option key={si.id} value={si.id}>{si.name} (₹{si.unitPrice.toFixed(2)})</option>)}
                </select>
              </div>
              <div className="col-span-4 md:col-span-1">
                <label className="block text-xs font-medium text-slate-600">Qty</label>
                <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} min="1" className="mt-1 block w-full px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors" />
              </div>
              <div className="col-span-4 md:col-span-2">
                <label className="block text-xs font-medium text-slate-600">Unit Price</label>
                <input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} min="0" step="0.01" className="mt-1 block w-full px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors" readOnly />
              </div>
              <div className="col-span-4 md:col-span-2">
                <label className="block text-xs font-medium text-slate-600">Tax Rate</label>
                 <input type="text" value={getTaxRateLabel(item.taxRate)} readOnly className="mt-1 block w-full px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors bg-slate-100" />
              </div>
              <div className="col-span-8 md:col-span-2">
                <label className="block text-xs font-medium text-slate-600">Line Total (incl. Tax)</label>
                <input type="text" value={`₹${item.itemTotalWithTax.toFixed(2)}`} readOnly className="mt-1 block w-full px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors bg-slate-100 font-semibold" />
              </div>
              <div className="col-span-4 md:col-span-1 flex items-end justify-end">
                <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:text-red-700">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addItem} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
            <PlusCircleIcon className="h-5 w-5 mr-1" /> Add Item
          </button>
        </div>

        {/* Totals and Discount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border border-slate-200 rounded-lg bg-slate-50">
            <div> {/* Terms and Notes */}
                <div>
                    <label htmlFor="termsAndConditions" className="block text-sm font-medium text-slate-700">Terms & Conditions</label>
                    <textarea name="termsAndConditions" id="termsAndConditions" value={invoiceData.termsAndConditions || ''} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors" />
                </div>
                <div className="mt-4">
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Notes (Optional)</label>
                    <textarea name="notes" id="notes" value={invoiceData.notes || ''} onChange={handleChange} rows={2} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors" />
                </div>
            </div>
            <div className="space-y-3 text-sm"> {/* Calculations */}
                <div className="flex items-center">
                    <label htmlFor="discountType" className="mr-2 text-sm font-medium text-slate-700">Discount Type:</label>
                    <select name="discountType" id="discountType" value={invoiceData.discountType || 'percentage'} onChange={handleChange} className="block w-auto px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors">
                        <option value="percentage">Percentage (%)</option>
                        <option value="flat">Flat Amount (₹)</option>
                    </select>
                    <input type="number" name="discountValue" value={invoiceData.discountValue || 0} onChange={handleChange} min="0" step={invoiceData.discountType === 'percentage' ? "0.1" : "0.01"} className="ml-2 block w-24 px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors" />
                </div>
                 <div className="text-right space-y-1 pt-2">
                    <p>Subtotal: <span className="font-semibold">₹{invoiceData.subtotal?.toFixed(2) || '0.00'}</span></p>
                    <p>Discount: <span className="font-semibold">- ₹{invoiceData.discountAmountCalculated?.toFixed(2) || '0.00'}</span></p>
                    <p>Amount After Discount: <span className="font-semibold">₹{invoiceData.amountAfterDiscount?.toFixed(2) || '0.00'}</span></p>
                    <p>Total Tax: <span className="font-semibold">₹{invoiceData.totalTax?.toFixed(2) || '0.00'}</span></p>
                    <p className="text-xl font-bold text-sky-700 mt-1">Grand Total: ₹{invoiceData.grandTotal?.toFixed(2) || '0.00'}</p>
                </div>
            </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap justify-end space-x-0 sm:space-x-3 space-y-3 sm:space-y-0">
          <button type="button" onClick={() => setIsPreviewModalOpen(true)} className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-base font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors w-full sm:w-auto">
            <PrinterIcon className="h-5 w-5 mr-2" /> Preview Invoice
          </button>
          <button type="button" onClick={handleDownloadPDF} className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-base font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors w-full sm:w-auto">
            <DownloadIcon className="h-5 w-5 mr-2" /> Download PDF
          </button>
           {invoiceData.status === InvoiceStatus.DRAFT && (
            <button type="button" onClick={() => handleSaveInvoice(InvoiceStatus.DRAFT)} className="inline-flex items-center justify-center px-6 py-3 border border-sky-600 text-base font-medium rounded-md shadow-sm text-sky-600 bg-white hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors w-full sm:w-auto">
                <SaveIcon className="h-5 w-5 mr-2" /> Save as Draft
            </button>
           )}
          <button 
            type="button" 
            onClick={invoiceData.status === InvoiceStatus.DRAFT ? handleFinalizeInvoice : () => handleSaveInvoice()} 
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors w-full sm:w-auto"
          >
            <SaveIcon className="h-5 w-5 mr-2" /> 
            {invoiceData.status === InvoiceStatus.DRAFT ? 'Finalize & Save Invoice' : 'Save Changes'}
          </button>
        </div>
      </form>

      <Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} title="Invoice Preview" size="xl">
        {(() => { // IIFE to ensure re-render for preview
          const previewInv = fullInvoiceForPreview();
          if (previewInv) {
            return <InvoiceView invoice={previewInv} containerId={PDF_CONTENT_ID} />;
          }
          return <p>Loading preview...</p>;
        })()}
      </Modal>
      
      {/* Hidden div for PDF generation, populated when needed. This approach is more robust.
          Currently, the modal content is used. If issues arise, activate this.
      <div id="pdf-content-wrapper" className="fixed left-[-9999px] top-auto w-[210mm]">
          {isPreviewModalOpen && fullInvoiceForPreview() && ( // Only render if previewing
              <InvoiceView invoice={fullInvoiceForPreview()!} containerId={PDF_CONTENT_ID_HIDDEN} />
          )}
      </div>
      */}

    </PageContainer>
  );
};

export default CreateInvoicePage;

// const PDF_CONTENT_ID_HIDDEN = "invoice-pdf-render-area-hidden"; // If using hidden div strategy