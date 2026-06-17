import React, { useState, useEffect, useRef } from 'react';
import { X, Minimize2, Maximize2, Terminal } from 'lucide-react';
import { MOCK_LOGS } from '../constants';

interface TerminalWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

const TerminalWidget: React.FC<TerminalWidgetProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    // Initial Seed
    setLogs(MOCK_LOGS.slice(0, 3));

    // Simulation Interval
    const interval = setInterval(() => {
      const randomLog = MOCK_LOGS[Math.floor(Math.random() * MOCK_LOGS.length)];
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
      const newLog = `[${timestamp}] ${randomLog}`;
      
      setLogs(prev => {
        const updated = [...prev, newLog];
        if (updated.length > 50) return updated.slice(updated.length - 50);
        return updated;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isMinimized]);

  if (!isOpen) return null;

  return (
    <div 
      className={`
        fixed bottom-0 right-4 z-40 bg-gray-900 border-t border-x border-gray-700 rounded-t-lg shadow-2xl transition-all duration-300 flex flex-col
        ${isMinimized ? 'h-10 w-64' : 'h-64 w-full md:w-[600px]'}
      `}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-t-lg cursor-pointer select-none"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2 text-gray-300 text-xs font-mono">
          <Terminal size={12} className="text-green-500" />
          <span>NeuroForge-Kernel-v4.2</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:text-white">
            {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="hover:text-red-400">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Logs Area */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-black/90 text-green-400 custom-scrollbar">
          {logs.map((log, idx) => (
            <div key={idx} className="mb-1 break-words opacity-90 hover:opacity-100">
              <span className="text-blue-400 mr-2">$</span>
              {log}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

export default TerminalWidget;