import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ServiceViewer from './components/ServiceViewer';
import SettingsView from './components/SettingsView';
import DashboardHome from './components/DashboardHome';
import SplashScreen from './components/SplashScreen';
import PresentationMode from './components/PresentationMode';
import CommandPalette from './components/CommandPalette';
import TerminalWidget from './components/TerminalWidget';
import ApiDocsView from './components/ApiDocsView';
import { DEFAULT_MICROSERVICES } from './constants';
import { Microservice } from './types';

const App: React.FC = () => {
  // Application Modes
  const [showSplash, setShowSplash] = useState(true);
  const [showPresentation, setShowPresentation] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  
  // Active Microservice State
  const [activeServiceId, setActiveServiceId] = useState<string>(DEFAULT_MICROSERVICES[0].id);

  // Gemini / AI Integration State
  const [geminiEnabled, setGeminiEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('omni_gemini_enabled');
    return saved === 'true';
  });

  // Dynamic Services Configuration State (Persisted)
  const [services, setServices] = useState<Microservice[]>(() => {
    const saved = localStorage.getItem('omni_services_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge saved data with default constants to ensure new default items (like Dashboard) appear
        return DEFAULT_MICROSERVICES.map(def => {
          const savedService = parsed.find((p: any) => p.id === def.id);
          return savedService ? { ...def, url: savedService.url } : def;
        });
      } catch (e) {
        console.error("Failed to parse services settings", e);
        return DEFAULT_MICROSERVICES;
      }
    }
    return DEFAULT_MICROSERVICES;
  });

  // Handle Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2800); // slightly longer than animation to feel "settled"
    return () => clearTimeout(timer);
  }, []);

  // Handle Command Palette Shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Persist Services when changed
  const handleUpdateServices = (updatedServices: Microservice[]) => {
    setServices(updatedServices);
    const simpleData = updatedServices.map(({ id, name, description, url }) => ({
      id, name, description, url
    }));
    localStorage.setItem('omni_services_config', JSON.stringify(simpleData));
  };

  const handleResetDefaults = () => {
    setServices(DEFAULT_MICROSERVICES);
    localStorage.removeItem('omni_services_config');
  };

  // Persist Gemini Toggle
  const handleToggleGemini = (enabled: boolean) => {
    setGeminiEnabled(enabled);
    localStorage.setItem('omni_gemini_enabled', String(enabled));
  };

  // Handle Screen Size for Sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Get current service object
  const activeService = services.find(s => s.id === activeServiceId) || services[0];

  return (
    <>
      {/* 1. Splash Screen Overlay */}
      {showSplash && <SplashScreen />}

      {/* 2. Presentation Mode Overlay */}
      {showPresentation && (
        <PresentationMode onClose={() => setShowPresentation(false)} />
      )}

      {/* 3. Command Palette Modal */}
      <CommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)}
        services={services}
        onSelectService={setActiveServiceId}
        toggleTheme={toggleTheme}
        toggleTerminal={() => setShowTerminal(prev => !prev)}
      />

      {/* 4. Terminal Widget */}
      <TerminalWidget 
        isOpen={showTerminal} 
        onClose={() => setShowTerminal(false)} 
      />

      {/* 5. Main App Layout */}
      <div className={`flex h-screen w-full bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-300 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Navigation Sidebar */}
        <Sidebar 
          items={services}
          activeServiceId={activeServiceId}
          onSelectService={setActiveServiceId}
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          onStartPresentation={() => setShowPresentation(true)}
        />

        {/* Main Content Area */}
        <div 
          className={`
            flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300
            ${isSidebarOpen ? 'ml-64' : 'ml-20'}
          `}
        >
          <Header 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme}
            activeService={activeService}
            toggleSidebar={toggleSidebar}
          />

          <main className="flex-1 p-4 md:p-6 overflow-hidden relative overflow-y-auto custom-scrollbar">
            {activeService.id === 'settings' ? (
              <SettingsView 
                services={services}
                onUpdateServices={handleUpdateServices}
                geminiEnabled={geminiEnabled}
                onToggleGemini={handleToggleGemini}
                onResetDefaults={handleResetDefaults}
              />
            ) : activeService.id === 'dashboard' ? (
              <DashboardHome />
            ) : activeService.id === 'api-docs' ? (
              <ApiDocsView />
            ) : (
              <ServiceViewer service={activeService} />
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default App;