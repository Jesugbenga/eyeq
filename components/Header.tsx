
import React from 'react';
import { EyeIcon } from './Icon';

export const Header: React.FC = () => {
  return (
    <header className="bg-base-100 dark:bg-dark-base-300 shadow-md">
      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-brand-primary rounded-lg text-white">
             <EyeIcon className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-base-content dark:text-dark-base-content tracking-tight">
            EyeQ
          </h1>
        </div>
         <p className="text-sm text-base-content-secondary dark:text-dark-base-content-secondary mt-1">
          Real-time Audio Description for Live Events
        </p>
      </div>
    </header>
  );
};
