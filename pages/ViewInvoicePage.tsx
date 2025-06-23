
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Invoice, InvoiceStatus } from '../types';
import { useAppContext } from '../contexts/AppContext';
import PageContainer from '../components/PageContainer';
import InvoiceView from '../components/InvoiceView';
import { DownloadIcon, EditIcon, TrashIcon, PrinterIcon } from '../components/icons';
import { downloadInvoiceAsPDF } from '../lib/pdfGenerator';
import { ROUTES } from '../constants';
import Modal from '../components/Modal';

const PDF_VIEW_CONTENT_ID = "invoice-pdf-render-view-area";

const ViewInvoicePage: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { getInvoiceById, deleteInvoice, markInvoiceStatus } = useAppContext();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | undefined>(undefined);

  useEffect(() => {
    if (invoiceId) {
      const fetchedInvoice = getInvoiceById(invoiceId);
      if (fetchedInvoice) {
        setInvoice(fetchedInvoice);
        setSelectedStatus(fetchedInvoice.status);
      } else {
        alert('Invoice not found.');
        navigate(ROUTES.DASHBOARD);
      }
    }
  }, [invoiceId, getInvoiceById, navigate]);

  const handleDownloadPDF = async () => {
    if (invoice) {
      // Small delay to ensure any dynamic content in InvoiceView (like QR code) is rendered
      setTimeout(async () => {
          await downloadInvoiceAsPDF(invoice, PDF_VIEW_CONTENT_ID);
      }, 100);
    }
  };

  const handleDelete = () => {
    if (invoice && window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This cannot be undone.`)) {
      deleteInvoice(invoice.id);
      navigate(ROUTES.DASHBOARD);
    }
  };
  
  const handlePrint = () => {
      window.print();
  };

  const handleOpenStatusModal = () => {
    if(invoice) setSelectedStatus(invoice.status);
    setIsStatusModalOpen(true);
  };

  const handleSaveStatus = () => {
    if (invoice && selectedStatus) {
      markInvoiceStatus(invoice.id, selectedStatus);
      // Update local state to reflect change immediately
      setInvoice(prev => prev ? {...prev, status: selectedStatus} : null);
      setIsStatusModalOpen(false);
    }
  };

  if (!invoice) {
    return <PageContainer title="Loading Invoice..."><p>Loading...</p></PageContainer>;
  }

  const pageActions = (
    <div className="flex flex-wrap items-center gap-2">
       <button 
        onClick={handleOpenStatusModal} 
        className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
      >
        Change Status
      </button>
      <Link 
        to={ROUTES.EDIT_INVOICE.replace(':invoiceId', invoice.id)} 
        className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
      >
        <EditIcon className="h-4 w-4 mr-1.5" /> Edit
      </Link>
      <button 
        onClick={handlePrint} 
        className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors print:hidden"
      >
        <PrinterIcon className="h-4 w-4 mr-1.5" /> Print
      </button>
      <button 
        onClick={handleDownloadPDF} 
        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors print:hidden"
      >
        <DownloadIcon className="h-4 w-4 mr-1.5" /> Download PDF
      </button>
      <button 
        onClick={handleDelete} 
        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors print:hidden"
      >
        <TrashIcon className="h-4 w-4 mr-1.5" /> Delete
      </button>
    </div>
  );

  return (
    <>
      <PageContainer title={`Invoice ${invoice.invoiceNumber}`} actions={pageActions}>
        <InvoiceView invoice={invoice} containerId={PDF_VIEW_CONTENT_ID} />
      </PageContainer>
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Change Invoice Status">
        <div className="space-y-4">
          <p>Select new status for invoice <strong>{invoice.invoiceNumber}</strong>:</p>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value as InvoiceStatus)}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
          >
            {Object.values(InvoiceStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setIsStatusModalOpen(false)} 
              className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveStatus} 
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
            >
              Save Status
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ViewInvoicePage;