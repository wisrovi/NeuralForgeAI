import React from 'react';
import { Moon, Sun, Menu, Bell, Search, Sparkles } from 'lucide-react';
import { Microservice } from '../types';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  activeService: Microservice;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme, activeService, toggleSidebar }) => {
  const isGeminiActive = localStorage.getItem('omni_gemini_enabled') === 'true';

  return (
    <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30">
      
      <div className="flex items-center gap-4">
        {/* Mobile Toggle */}
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <Menu size={24} />
        </button>

        {/* Current Page Title */}
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-gray-800 dark:text-white leading-tight flex items-center gap-2">
            {activeService.name}
            {isGeminiActive && (
              <span className="flex h-2 w-2 relative" title="Gemini AI Active">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            {activeService.description}
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search (Visual Only) */}
        <div className="hidden md:flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full border border-transparent focus-within:border-blue-500 transition-colors">
          <Search size={16} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search modules..." 
            className="bg-transparent border-none outline-none text-sm ml-2 text-gray-700 dark:text-gray-200 w-32 focus:w-48 transition-all"
          />
        </div>

        {isGeminiActive && (
           <button className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-full transition-colors" title="Ask Gemini">
             <Sparkles size={20} />
           </button>
        )}

        <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`
            relative p-1 rounded-full w-14 h-8 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50
            ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'}
          `}
          aria-label="Toggle Dark Mode"
        >
          <div
            className={`
              absolute top-1 left-1 w-6 h-6 rounded-full shadow-sm transform transition-transform duration-300 flex items-center justify-center
              ${isDarkMode ? 'translate-x-6 bg-gray-900' : 'translate-x-0 bg-white'}
            `}
          >
            {isDarkMode ? (
              <Moon size={14} className="text-blue-400" />
            ) : (
              <Sun size={14} className="text-amber-500" />
            )}
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;