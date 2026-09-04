import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShieldAlert, Sliders, CopyCheck, FileText, History,
  Upload, Plus, ShieldCheck, Menu, Bot, Sun, Moon
} from 'lucide-react';
import { CSVUploadModal } from './CSVUploadModal';
import { ManualOrderModal } from './ManualOrderModal';
import { CopilotDrawer } from './CopilotDrawer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleOrderSuccess = () => {
    // Don't close modal here — let the user see the score result first.
  };

  const handleModalClose = () => {
    // Full page reload to guarantee fresh data on dashboard
    window.location.href = '/';
  };
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Command Center' },
    { path: '/queue', icon: ShieldAlert, label: 'Risk Queue' },
    { path: '/policy', icon: Sliders, label: 'Policy Engine' },
    { path: '/duplicates', icon: CopyCheck, label: 'Duplicate Intent' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/overrides', icon: History, label: 'Audit Log' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-fintech-bg font-sans text-fintech-text transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col surface-sidebar z-20">
        <div className="h-16 flex items-center px-6 border-b border-fintech-border shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-fintech-primary" />
            <span className="font-bold text-lg tracking-tight text-fintech-text font-mono">Sentinel<span className="text-fintech-primary">.v4</span></span>
          </div>
        </div>

        <div className="p-4 border-b border-fintech-border shrink-0">
          <div className="text-[10px] font-bold uppercase text-fintech-muted mb-2 tracking-widest px-2">Merchant Account</div>
          <div className="bg-fintech-subcard border border-fintech-border rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-fintech-bg text-fintech-primary border border-fintech-border flex items-center justify-center font-bold">AC</div>
            <div>
              <div className="text-xs font-bold text-fintech-text">Apex Commerce</div>
              <div className="text-[9px] text-fintech-safe font-mono">Live Env</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="text-[10px] font-bold uppercase text-fintech-muted tracking-widest px-2 mb-2 mt-2">Operations</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                  isActive
                    ? 'bg-fintech-bg text-fintech-primary border border-fintech-border'
                    : 'text-fintech-muted hover:bg-fintech-subcard hover:text-fintech-text'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-fintech-border shrink-0 space-y-2">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-fintech-subcard hover:bg-fintech-border text-fintech-text text-[11px] font-bold rounded-xl border border-fintech-border transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Score Order
          </button>
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-fintech-subcard hover:bg-fintech-border text-fintech-text text-[11px] font-bold rounded-xl border border-fintech-border transition-all"
          >
            <Upload className="w-3.5 h-3.5" /> Batch CSV
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative w-full h-full">
        {/* Top Header */}
        <header className="h-16 bg-fintech-surface border-b border-fintech-border z-10 flex items-center justify-between px-4 sm:px-6 shrink-0 relative shadow-sm">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-fintech-muted p-1" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-fintech-subcard border border-fintech-border rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-fintech-safe animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-fintech-muted">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-lg text-fintech-muted hover:text-fintech-text hover:bg-fintech-subcard transition-all"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-fintech-subcard border border-fintech-border rounded-lg text-[10px] font-bold text-fintech-primary">
              <ShieldCheck className="w-3 h-3" /> Balanced Policy
            </div>
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="px-3 py-1.5 bg-fintech-primary hover:opacity-90 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all hover-lift"
            >
              <Bot className="w-3.5 h-3.5" /> Copilot
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
          {children}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative w-64 bg-fintech-surface border-r border-fintech-border flex flex-col h-full">
            <div className="p-4 flex items-center gap-2 border-b border-fintech-border">
              <ShieldCheck className="w-6 h-6 text-fintech-primary" />
              <span className="font-bold text-lg text-fintech-text font-mono">Sentinel.v4</span>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold ${
                      isActive ? 'bg-fintech-bg text-fintech-primary border border-fintech-border' : 'text-fintech-muted'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" /> {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Global Modals & Drawers */}
      {isCsvModalOpen && <CSVUploadModal isOpen={isCsvModalOpen} onClose={handleModalClose} onSuccess={handleOrderSuccess} />}
      {isManualModalOpen && <ManualOrderModal isOpen={isManualModalOpen} onClose={handleModalClose} onSuccess={handleOrderSuccess} />}
      <CopilotDrawer isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
    </div>
  );
};
