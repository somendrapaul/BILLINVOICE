
import React, { useState } from 'react';
import { Client } from '../types';
import { useAppContext } from '../contexts/AppContext';
import PageContainer from '../components/PageContainer';
import Modal from '../components/Modal';
import { PlusCircleIcon, EditIcon, TrashIcon } from '../components/icons';

// ClientForm component (can be in a separate file or inline)
interface ClientFormProps {
  initialData?: Client | null;
  onSubmit: (clientData: Omit<Client, 'id'> | Client) => void;
  onCancel: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Client, 'id'> | Client>(
    initialData || {
      name: '',
      billingAddress: '',
      shippingAddress: '',
      email: '',
      phoneNumber: '',
      taxId: '',
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">Client Name *</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email *</label>
        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700">Phone Number *</label>
        <input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="billingAddress" className="block text-sm font-medium text-slate-700">Billing Address *</label>
        <textarea name="billingAddress" id="billingAddress" value={formData.billingAddress} onChange={handleChange} rows={3} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
      </div>
       <div>
        <label htmlFor="shippingAddress" className="block text-sm font-medium text-slate-700">Shipping Address (Optional, if different)</label>
        <textarea name="shippingAddress" id="shippingAddress" value={formData.shippingAddress || ''} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="taxId" className="block text-sm font-medium text-slate-700">Client Tax ID (Optional)</label>
        <input type="text" name="taxId" id="taxId" value={formData.taxId || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm transition-colors">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 border border-transparent rounded-md shadow-sm transition-colors">
          {initialData ? 'Update Client' : 'Add Client'}
        </button>
      </div>
    </form>
  );
};


const ClientsListPage: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const handleOpenModal = (client?: Client) => {
    setEditingClient(client || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSubmitClient = (clientData: Omit<Client, 'id'> | Client) => {
    if ('id' in clientData && clientData.id) { // Editing existing client
      updateClient(clientData as Client);
    } else { // Adding new client
      addClient(clientData as Omit<Client, 'id'>);
    }
    handleCloseModal();
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      deleteClient(clientId);
    }
  };

  return (
    <PageContainer 
      title="Manage Clients"
      actions={
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Add Client
        </button>
      }
    >
      {clients.length === 0 ? (
        <p className="text-center text-slate-500">No clients found. Click "Add Client" to get started.</p>
      ) : (
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tax ID</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{client.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{client.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{client.phoneNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{client.taxId || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => handleOpenModal(client)} className="text-sky-600 hover:text-sky-800 transition-colors" title="Edit Client">
                      <EditIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteClient(client.id)} className="text-red-600 hover:text-red-800 transition-colors" title="Delete Client">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingClient ? 'Edit Client' : 'Add New Client'}>
        <ClientForm 
          initialData={editingClient}
          onSubmit={handleSubmitClient}
          onCancel={handleCloseModal}
        />
      </Modal>
    </PageContainer>
  );
};

export default ClientsListPage;
