import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select...",
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (opt.subLabel && opt.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm(''); // Clear search on close
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Trigger Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 
          bg-gray-50 dark:bg-gray-800 border rounded-lg cursor-pointer transition-all
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
        `}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
          {selectedOption ? (
             <div className="flex flex-col items-start truncate">
               <span className="text-gray-900 dark:text-white font-medium text-sm truncate">{selectedOption.label}</span>
             </div>
          ) : (
             <span className="text-gray-400 text-sm truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden animate-fade-in">
          
          {/* Search Input */}
          <div className="flex items-center px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <Search size={14} className="text-gray-400 shrink-0 mr-2" />
            <input 
              ref={inputRef}
              type="text" 
              className="w-full bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
              placeholder="Type to filter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div 
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`
                    px-4 py-2.5 cursor-pointer flex flex-col transition-colors
                    ${value === opt.value 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-transparent'
                    }
                  `}
                >
                  <span className={`text-sm font-medium ${value === opt.value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                    {opt.label}
                  </span>
                  {opt.subLabel && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {opt.subLabel}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                No matching results.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
