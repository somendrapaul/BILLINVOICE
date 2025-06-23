
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import ClientsListPage from './pages/ClientsListPage';
import ItemsListPage from './pages/ItemsListPage';
import SettingsPage from './pages/SettingsPage';
import ViewInvoicePage from './pages/ViewInvoicePage';
import { ROUTES } from './constants';
import { useAppContext } from './contexts/AppContext';
import Modal from './components/Modal'; // Assuming Modal component exists

const App: React.FC = () => {
  const { companyProfile } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

  useEffect(() => {
    // Check if company profile is set. If not, and not on settings page, prompt or redirect.
    if (!companyProfile && location.pathname !== ROUTES.SETTINGS) {
      setShowProfilePrompt(true);
    } else {
      setShowProfilePrompt(false);
    }
  }, [companyProfile, location.pathname, navigate]);

  const handleGoToSettings = () => {
    setShowProfilePrompt(false);
    navigate(ROUTES.SETTINGS);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.CREATE_INVOICE} element={<CreateInvoicePage />} />
          <Route path={ROUTES.EDIT_INVOICE} element={<CreateInvoicePage />} /> {/* Use same component for edit */}
          <Route path={ROUTES.VIEW_INVOICE} element={<ViewInvoicePage />} />
          <Route path={ROUTES.CLIENTS} element={<ClientsListPage />} />
          <Route path={ROUTES.ITEMS} element={<ItemsListPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        </Routes>
      </main>
      <footer className="bg-slate-800 text-slate-300 text-center p-4 print:hidden">
        <p>&copy; {new Date().getFullYear()} ProInvoice Suite. All rights reserved.</p>
        <p className="text-xs mt-1">Client-side application. All data stored in your browser.</p>
      </footer>

      <Modal
        isOpen={showProfilePrompt}
        onClose={() => setShowProfilePrompt(false)} /* Allow closing, but it might reappear */
        title="Company Profile Required"
      >
        <div className="text-center">
          <p className="mb-4 text-slate-700">
            Please set up your company profile to use all features of the application.
          </p>
          <button
            onClick={handleGoToSettings}
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Go to Settings
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default App;
