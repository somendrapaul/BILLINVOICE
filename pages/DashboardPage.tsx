
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Invoice, InvoiceStatus } from '../types';
import { useAppContext } from '../contexts/AppContext';
import PageContainer from '../components/PageContainer';
import { PlusCircleIcon, ViewIcon, EditIcon, TrashIcon, SearchIcon } from '../components/icons';
import { formatDate } from '../lib/utils';
import { ROUTES } from '../constants';

const DashboardPage: React.FC = () => {
  const { invoices, deleteInvoice } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(invoice => {
        const term = searchTerm.toLowerCase();
        const matchesTerm = 
          invoice.invoiceNumber.toLowerCase().includes(term) ||
          invoice.clientDetails.name.toLowerCase().includes(term) ||
          invoice.grandTotal.toString().includes(term);
        
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

        return matchesTerm && matchesStatus;
      })
      .sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime()); // Sort by most recent
  }, [invoices, searchTerm, statusFilter]);

  const handleDeleteInvoice = (invoiceId: string, invoiceNumber: string) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      deleteInvoice(invoiceId);
    }
  };

  const getStatusColorClass = (status: InvoiceStatus): string => {
    switch (status) {
      case InvoiceStatus.PAID: return 'bg-green-100 text-green-700';
      case InvoiceStatus.UNPAID: return 'bg-orange-100 text-orange-700';
      case InvoiceStatus.OVERDUE: return 'bg-red-100 text-red-700';
      case InvoiceStatus.DRAFT: return 'bg-slate-100 text-slate-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  // Summary Cards
  const totalInvoices = invoices.length;
  const totalPaid = invoices.filter(inv => inv.status === InvoiceStatus.PAID).reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalUnpaid = invoices.filter(inv => inv.status === InvoiceStatus.UNPAID || inv.status === InvoiceStatus.OVERDUE).reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalDrafts = invoices.filter(inv => inv.status === InvoiceStatus.DRAFT).length;


  return (
    <PageContainer 
      title="Invoice Dashboard"
      actions={
        <Link
          to={ROUTES.CREATE_INVOICE}
          className="inline-flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Create New Invoice
        </Link>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard title="Total Invoices" value={totalInvoices.toString()} />
        <SummaryCard title="Total Paid" value={`₹${totalPaid.toFixed(2)}`} color="green" />
        <SummaryCard title="Total Unpaid/Overdue" value={`₹${totalUnpaid.toFixed(2)}`} color="orange" />
        <SummaryCard title="Draft Invoices" value={totalDrafts.toString()} color="slate" />
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by Invoice #, Client, Amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-300 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors"
          />
        </div>
        <div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
            className="block w-full sm:w-auto pl-3 pr-8 py-2 border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors"
          >
            <option value="all">All Statuses</option>
            {Object.values(InvoiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <p className="text-center text-slate-500 py-8">
          {invoices.length === 0 ? 'No invoices created yet. Start by creating one!' : 'No invoices match your current filters.'}
        </p>
      ) : (
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Invoice #</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Bill Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Due Date</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-sky-600 hover:text-sky-800">
                    <Link to={ROUTES.VIEW_INVOICE.replace(':invoiceId', invoice.id)}>{invoice.invoiceNumber}</Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{invoice.clientDetails.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatDate(invoice.billDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatDate(invoice.dueDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-semibold text-right">₹{invoice.grandTotal.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-xs">
                    <span className={`px-2 py-1 font-semibold leading-tight rounded-full ${getStatusColorClass(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link to={ROUTES.VIEW_INVOICE.replace(':invoiceId', invoice.id)} className="text-blue-600 hover:text-blue-800 transition-colors" title="View Invoice">
                      <ViewIcon className="h-5 w-5" />
                    </Link>
                    <Link to={ROUTES.EDIT_INVOICE.replace(':invoiceId', invoice.id)} className="text-sky-600 hover:text-sky-800 transition-colors" title="Edit Invoice">
                      <EditIcon className="h-5 w-5" />
                    </Link>
                    <button onClick={() => handleDeleteInvoice(invoice.id, invoice.invoiceNumber)} className="text-red-600 hover:text-red-800 transition-colors" title="Delete Invoice">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
};

interface SummaryCardProps {
  title: string;
  value: string;
  color?: 'green' | 'orange' | 'slate' | 'blue';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, color = 'blue' }) => {
  const colorClasses = {
    green: 'border-green-500 bg-green-50',
    orange: 'border-orange-500 bg-orange-50',
    slate: 'border-slate-500 bg-slate-50',
    blue: 'border-sky-500 bg-sky-50',
  };
  return (
    <div className={`p-4 rounded-lg shadow border-l-4 ${colorClasses[color]}`}>
      <h3 className="text-sm font-medium text-slate-500 uppercase">{title}</h3>
      <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  );
};


export default DashboardPage;
