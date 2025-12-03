import React from 'react';
import { ChevronLeft, ChevronRight, Presentation, Hexagon } from 'lucide-react';
import { Microservice } from '../types';
import { APP_NAME } from '../constants';

interface SidebarProps {
  items: Microservice[];
  activeServiceId: string;
  onSelectService: (id: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  onStartPresentation: () => void;
}

// Simple hash function to simulate stable random status per service
const getServiceStatus = (id: string) => {
  if (id === 'dashboard' || id === 'settings') return 'online';
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash % 5 === 0 ? 'error' : 'online';
};

const Sidebar: React.FC<SidebarProps> = ({ 
  items, 
  activeServiceId, 
  onSelectService, 
  isOpen, 
  toggleSidebar,
  onStartPresentation
}) => {
  return (
    <aside 
      className={`
        fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transition-all duration-300 ease-in-out flex flex-col shadow-xl
        ${isOpen ? 'w-64' : 'w-20'}
      `}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
        <div className={`flex items-center gap-3 overflow-hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shrink-0 shadow-lg shadow-blue-500/20">
            <Hexagon className="text-white" size={20} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg tracking-tight whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
            {APP_NAME}
          </span>
        </div>
        
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {items.map((item) => {
          const isActive = activeServiceId === item.id;
          const status = getServiceStatus(item.id);
          
          return (
            <button
              key={item.id}
              onClick={() => onSelectService(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }
              `}
              title={!isOpen ? item.name : ''}
            >
              <div className="relative shrink-0">
                <span className={`${!isActive && 'group-hover:scale-110 transition-transform'}`}>
                  {item.icon}
                </span>
                {/* Health Dot */}
                {isOpen && status === 'online' && (
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-gray-900 bg-green-500 ${!isActive ? 'opacity-70' : ''}`}></span>
                )}
                {isOpen && status === 'error' && (
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-gray-900 bg-red-500 ${!isActive ? 'opacity-70' : ''}`}></span>
                )}
              </div>
              
              <span className={`
                font-medium whitespace-nowrap transition-all duration-300 origin-left flex-1 text-left
                ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 overflow-hidden'}
              `}>
                {item.name}
              </span>

              {/* Active Indicator Dot (Only when collapsed) */}
              {!isOpen && isActive && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Presentation Mode */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
        
        <button 
          onClick={onStartPresentation}
          className={`
            w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 
            text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20
            mb-3
          `}
          title="Start Presentation Mode"
        >
          <Presentation size={20} className="shrink-0" />
          <span className={`
            font-medium whitespace-nowrap transition-all duration-300 origin-left
            ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 overflow-hidden'}
          `}>
            Presentation Mode
          </span>
        </button>

        <div className={`flex items-center gap-3 ${!isOpen ? 'justify-center' : ''} pt-2 border-t border-gray-200 dark:border-gray-700/50`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 shrink-0 border-2 border-white dark:border-gray-700 flex items-center justify-center text-white font-bold text-xs">
            WR
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">System Admin</p>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;