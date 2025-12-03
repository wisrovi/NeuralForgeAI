import React, { useState, useEffect } from 'react';
import { Microservice } from '../types';
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react';

interface ServiceViewerProps {
  service: Microservice;
}

const ServiceViewer: React.FC<ServiceViewerProps> = ({ service }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Reset state when service changes
  useEffect(() => {
    setIsLoading(true);
    setLoadError(false);
  }, [service.id]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setLoadError(true);
  };

  // Helper to determine if we should show a placeholder for the demo
  const isDemoPlaceholder = service.url === 'about:blank' || !service.url;

  return (
    <div className="w-full h-full relative bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col animate-fade-in">
      
      {/* Absolute "Pop Out" Action */}
      {!isDemoPlaceholder && (
        <a 
          href={service.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute top-4 right-4 z-30 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur text-gray-500 hover:text-blue-500 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
          title="Open in new window (Fix display issues)"
        >
          <ExternalLink size={18} />
        </a>
      )}

      {/* Loading Overlay */}
      {isLoading && !isDemoPlaceholder && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white dark:bg-gray-900 transition-opacity">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Establishing secure connection...</p>
        </div>
      )}

      {/* Connection Error State */}
      {loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connection Failed</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
            We couldn't load the interface for <strong>{service.name}</strong>. The service might be offline or refusing the connection.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => { setIsLoading(true); setLoadError(false); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Retry Connection
            </button>
            <a
              href={service.url}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              Open External <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}

      {/* Actual Content Area */}
      {isDemoPlaceholder ? (
        // DEMO PLACEHOLDER: Shown when no URL is provided in constants.ts
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
          <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mb-6 shadow-inner animate-float">
            <div className="text-blue-500 dark:text-blue-400 transform scale-150">
              {service.icon}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
            {service.name}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg mb-8 leading-relaxed">
            This panel is ready to absorb your microservice. <br/>
            Map the URL in <code>constants.tsx</code> or settings to display your internal application here.
          </p>
          <div className="flex gap-4">
             <div className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm font-mono text-xs text-gray-500">
                ID: {service.id}
             </div>
             <div className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm font-mono text-xs text-green-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Node Ready
             </div>
          </div>
        </div>
      ) : (
        // REAL IFRAME INTEGRATION
        <iframe 
          src={service.url}
          title={`Microservice: ${service.name}`}
          className="w-full h-full border-0"
          onLoad={handleLoad}
          onError={handleError}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          loading="lazy"
        />
      )}
    </div>
  );
};

export default ServiceViewer;