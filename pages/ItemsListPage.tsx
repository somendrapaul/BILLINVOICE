
import React, { useState } from 'react';
import { StockItem, TaxRate, TaxRateOptions } from '../types';
import { useAppContext } from '../contexts/AppContext';
import PageContainer from '../components/PageContainer';
import Modal from '../components/Modal';
import { PlusCircleIcon, EditIcon, TrashIcon } from '../components/icons';
import { getTaxRateLabel } from '../lib/utils';

// ItemForm component
interface ItemFormProps {
  initialData?: StockItem | null;
  onSubmit: (itemData: Omit<StockItem, 'id'> | StockItem) => void;
  onCancel: () => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Omit<StockItem, 'id'> | StockItem>(
    initialData || {
      name: '',
      description: '',
      unitPrice: 0,
      taxRate: TaxRate.RATE_0,
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number = value;
    if (type === 'number' || name === 'unitPrice' || name === 'taxRate') {
      processedValue = parseFloat(value);
      if (isNaN(processedValue)) processedValue = 0; // default for safety
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">Item Name / SKU *</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description (Optional)</label>
        <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="unitPrice" className="block text-sm font-medium text-slate-700">Unit Price *</label>
        <input type="number" name="unitPrice" id="unitPrice" value={formData.unitPrice} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="taxRate" className="block text-sm font-medium text-slate-700">Applicable Tax Rate *</label>
        <select name="taxRate" id="taxRate" value={formData.taxRate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
          {TaxRateOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm transition-colors">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 border border-transparent rounded-md shadow-sm transition-colors">
          {initialData ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </form>
  );
};

const ItemsListPage: React.FC = () => {
  const { items, addItem, updateItem, deleteItem } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  const handleOpenModal = (item?: StockItem) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmitItem = (itemData: Omit<StockItem, 'id'> | StockItem) => {
    if ('id' in itemData && itemData.id) {
      updateItem(itemData as StockItem);
    } else {
      addItem(itemData as Omit<StockItem, 'id'>);
    }
    handleCloseModal();
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteItem(itemId);
    }
  };

  return (
    <PageContainer 
      title="Manage Stock / Items"
      actions={
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Add Item
        </button>
      }
    >
      {items.length === 0 ? (
        <p className="text-center text-slate-500">No items found. Click "Add Item" to manage your products or services.</p>
      ) : (
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name / SKU</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Unit Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tax Rate</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-slate-600 max-w-xs truncate">{item.description || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">₹{item.unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{getTaxRateLabel(item.taxRate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => handleOpenModal(item)} className="text-sky-600 hover:text-sky-800 transition-colors" title="Edit Item">
                      <EditIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-800 transition-colors" title="Delete Item">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Edit Item' : 'Add New Item'}>
        <ItemForm 
          initialData={editingItem}
          onSubmit={handleSubmitItem}
          onCancel={handleCloseModal}
        />
      </Modal>
    </PageContainer>
  );
};

export default ItemsListPage;
