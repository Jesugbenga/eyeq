
import React from 'react';
import { EyeIcon } from './Icon';

export const Header: React.FC = () => {
  return (
    <header className="relative z-10">
      <div className="container mx-auto px-6 py-6 lg:px-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-glow-orange to-glow-orange-dark rounded-lg blur-sm opacity-50"></div>
              <div className="relative p-2 bg-gradient-to-br from-glow-orange to-glow-orange-dark rounded-lg">
                <EyeIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              EyeQ
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};
