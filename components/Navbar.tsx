
import React from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../constants';
import { useAppContext } from '../contexts/AppContext';
import { DashboardIcon, FilePlusIcon, ClientsIcon, ItemsIcon, SettingsIcon } from './icons';
import type { NavItem } from '../types';


const Navbar: React.FC = () => {
  const { companyProfile } = useAppContext();

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: DashboardIcon },
    { name: 'New Invoice', path: ROUTES.CREATE_INVOICE, icon: FilePlusIcon },
    { name: 'Clients', path: ROUTES.CLIENTS, icon: ClientsIcon },
    { name: 'Items', path: ROUTES.ITEMS, icon: ItemsIcon },
    { name: 'Settings', path: ROUTES.SETTINGS, icon: SettingsIcon },
  ];

  return (
    <nav className="bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-lg print:hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <NavLink to={ROUTES.DASHBOARD} className="flex items-center space-x-3 rtl:space-x-reverse">
            {companyProfile?.logo && (
              <img src={companyProfile.logo} className="h-10 w-10 rounded-full object-cover border-2 border-white" alt="Company Logo" />
            )}
            <span className="text-2xl font-semibold tracking-tight whitespace-nowrap">
              {companyProfile?.companyName || 'ProInvoice'}
            </span>
          </NavLink>
          
          <ul className="flex items-center space-x-2 md:space-x-4">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex flex-col md:flex-row items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out hover:bg-sky-700 hover:text-white ${
                      isActive ? 'bg-sky-700 text-white shadow-inner' : 'text-sky-100'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 mb-1 md:mb-0 md:mr-2" />
                  <span className="hidden md:inline">{item.name}</span>
                  <span className="md:hidden text-xs">{item.name.split(' ')[0]}</span>
                </NavLink>
              </li>
            ))}
          </ul>
         
      </div>
    </nav>
  );
};

export default Navbar;