import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-6 px-6 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          © {currentYear} <span className="font-semibold text-gray-700 dark:text-gray-200">WDarwin Ops</span>. All rights reserved.
        </div>
        
        <div className="flex items-center gap-6">
          <a 
            href="https://wisrovi.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline transition-all"
          >
            wisrovi.dev
          </a>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
          <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
            v1.0.0-stable
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
