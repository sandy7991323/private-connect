import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '../../components/layout/AppHeader';

export const AppLayout: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      <AppHeader />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};
