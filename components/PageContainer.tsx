
import React, { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  actions?: ReactNode; // Optional action buttons or elements for the page header
  children: ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ title, actions, children }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-slate-700 mb-2 sm:mb-0">{title}</h1>
        {actions && <div className="flex space-x-2">{actions}</div>}
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6 min-h-[calc(100vh-250px)]">
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
