import React, { useState, useEffect } from 'react';
import { Search, Command, ArrowRight, Monitor, Moon, Sun, Terminal } from 'lucide-react';
import { Microservice } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  services: Microservice[];
  onSelectService: (id: string) => void;
  toggleTheme: () => void;
  toggleTerminal: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  services, 
  onSelectService,
  toggleTheme,
  toggleTerminal
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) || 
    s.description.toLowerCase().includes(query.toLowerCase())
  );

  const systemCommands = [
    { id: 'cmd-theme', name: 'Toggle Theme', icon: <Moon size={16} />, action: toggleTheme },
    { id: 'cmd-terminal', name: 'Toggle System Terminal', icon: <Terminal size={16} />, action: toggleTerminal },
  ];

  const allItems = [...filteredServices, ...systemCommands];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = allItems[selectedIndex];
        if ('url' in item) {
          onSelectService((item as Microservice).id);
        } else {
          (item as any).action();
        }
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allItems, onSelectService, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[20vh] animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[60vh]">
        
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <Search className="text-gray-400" size={20} />
          <input 
            type="text" 
            autoFocus
            placeholder="Search commands or microservices..." 
            className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="text-xs font-mono text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">ESC</div>
        </div>

        <div className="overflow-y-auto p-2">
          {filteredServices.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Navigation</div>
              {filteredServices.map((service, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={service.id}
                    onClick={() => { onSelectService(service.id); onClose(); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isSelected ? 'text-blue-200' : 'text-gray-500'}>{service.icon}</span>
                      <span>{service.name}</span>
                    </div>
                    {isSelected && <ArrowRight size={16} />}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mb-1">
             <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Commands</div>
             {systemCommands.map((cmd, idx) => {
                const realIdx = idx + filteredServices.length;
                const isSelected = realIdx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => { cmd.action(); onClose(); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isSelected ? 'text-blue-200' : 'text-gray-500'}>{cmd.icon}</span>
                      <span>{cmd.name}</span>
                    </div>
                    {isSelected && <Command size={14} />}
                  </button>
                );
             })}
          </div>

          {allItems.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No results found for "{query}"
            </div>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500">
           <span>Select with arrows, Enter to confirm</span>
           <div className="flex items-center gap-1">
             <Monitor size={12} />
             NeuroForge AI
           </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;