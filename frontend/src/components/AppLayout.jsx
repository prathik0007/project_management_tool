import { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import TopHeader from './TopHeader.jsx';
import CommandPalette from './CommandPalette.jsx';
import TaskForm from './TaskForm.jsx';

export default function AppLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-layout">
      {/* Left Sidebar (240px Sticky Desktop / Drawer Mobile) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Body Area: Full Remaining Width to the right */}
      <div className="app-body">
        <TopHeader
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenQuickTask={() => setIsQuickTaskOpen(true)}
        />

        <main className="app-main-content">
          {children}
        </main>
      </div>

      {/* Global Quick Search (Ctrl+K) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Quick Task Creation Modal */}
      {isQuickTaskOpen && (
        <TaskForm
          onSuccess={() => {
            setIsQuickTaskOpen(false);
            window.dispatchEvent(new CustomEvent('projectflow:refresh'));
          }}
          onClose={() => setIsQuickTaskOpen(false)}
        />
      )}
    </div>
  );
}
