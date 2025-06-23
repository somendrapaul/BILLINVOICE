
import React, { useState, useEffect } from 'react';
import { CompanyProfile } from '../types';
import { useAppContext } from '../contexts/AppContext';
import PageContainer from '../components/PageContainer';
import { SaveIcon } from '../components/icons';
import { fileToBase64, formatDate } from '../lib/utils';
import { DEFAULT_COMPANY_PROFILE_ID } from '../constants';

const SettingsPage: React.FC = () => {
  const { companyProfile, setCompanyProfile, updateCompanyProfile } = useAppContext();
  const [formData, setFormData] = useState<Omit<CompanyProfile, 'id'>>({
    companyName: '',
    address: '',
    contactNumber: '',
    email: '',
    website: '',
    taxId: '',
    upiId: '',
    logo: undefined,
  });
  const [logoPreview, setLogoPreview] = useState<string | undefined>(undefined);
  const [isInitialSetup, setIsInitialSetup] = useState(false);

  useEffect(() => {
    if (companyProfile) {
      setFormData({ ...companyProfile });
      setLogoPreview(companyProfile.logo);
      setIsInitialSetup(false);
    } else {
      setIsInitialSetup(true);
    }
  }, [companyProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        setFormData(prev => ({ ...prev, logo: base64 }));
        setLogoPreview(base64);
      } catch (error) {
        console.error("Error converting file to base64:", error);
        // Add user feedback here (e.g., toast notification)
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyProfile) {
        updateCompanyProfile({ ...formData, id: companyProfile.id });
    } else {
        setCompanyProfile(formData); // This will assign DEFAULT_COMPANY_PROFILE_ID
    }
    alert('Company profile saved successfully!'); // Replace with a nicer notification
  };

  return (
    <PageContainer title={isInitialSetup ? "Setup Company Profile" : "Company Settings"}>
      {isInitialSetup && (
        <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          <p className="font-bold">Welcome!</p>
          <p>Please complete your company profile to start using ProInvoice Suite.</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">Company Name *</label>
              <input type="text" name="companyName" id="companyName" value={formData.companyName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-700">Company Address *</label>
              <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows={3} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-slate-700">Contact Number *</label>
              <input type="tel" name="contactNumber" id="contactNumber" value={formData.contactNumber} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address *</label>
              <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
          </div>
          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-slate-700">Website (Optional)</label>
              <input type="url" name="website" id="website" value={formData.website || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-slate-700">Tax ID (e.g., GSTIN) *</label>
              <input type="text" name="taxId" id="taxId" value={formData.taxId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="upiId" className="block text-sm font-medium text-slate-700">UPI ID (for QR Code) *</label>
              <input type="text" name="upiId" id="upiId" value={formData.upiId} onChange={handleChange} required placeholder="yourname@bank" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-slate-700">Company Logo</label>
              <input type="file" name="logo" id="logo" accept="image/*" onChange={handleLogoChange} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" />
              {logoPreview && <img src={logoPreview} alt="Logo Preview" className="mt-2 h-24 w-auto rounded border border-slate-300 p-1" />}
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="submit" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors">
            <SaveIcon className="h-5 w-5 mr-2" />
            Save Settings
          </button>
        </div>
      </form>
    </PageContainer>
  );
};

export default SettingsPage;
