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
import LaunchTrainingView from './components/LaunchTrainingView'; // Renamed import
import UserManagementView from './components/UserManagementView'; // New import
import ProjectManagementView from './components/ProjectManagementView'; // New import
import AboutView from './components/AboutView';
import { DEFAULT_MICROSERVICES, DEFAULT_USERS, DEFAULT_PROJECTS, PERSISTENCE_API_CONFIG } from './constants';
import { Microservice, UserRole, UserProfile, ProjectDefinition } from './types';

const App: React.FC = () => {
  // Application Modes
  const [showSplash, setShowSplash] = useState(true);
  const [showPresentation, setShowPresentation] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  
  // Role State
  const [userRole, setUserRole] = useState<UserRole>('guest');

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  
  // Active Microservice State
  const [activeServiceId, setActiveServiceId] = useState<string>(DEFAULT_MICROSERVICES[0].id);

  // Gemini / AI Integration State
  const [geminiEnabled, setGeminiEnabled] = useState<boolean>(false);

  // Favorites State
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // === DATA REGISTRIES (Users & Projects) ===
  const [users, setUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [projects, setProjects] = useState<ProjectDefinition[]>(DEFAULT_PROJECTS);
  const [services, setServices] = useState<Microservice[]>(DEFAULT_MICROSERVICES);

  const [hasLoadedPersistence, setHasLoadedPersistence] = useState(false);

  // Initial Load from API (Redis Persistence)
  useEffect(() => {
    const syncWithAPI = async () => {
      try {
        const [uRes, pRes, sRes, cRes] = await Promise.all([
          fetch(PERSISTENCE_API_CONFIG.users.url),
          fetch(PERSISTENCE_API_CONFIG.projects.url),
          fetch(PERSISTENCE_API_CONFIG.services.url),
          fetch(PERSISTENCE_API_CONFIG.appConfig.url)
        ]);
        
        if (uRes.ok) {
          const uData = await uRes.json();
          if (Array.isArray(uData) && uData.length > 0) {
            setUsers(uData);
          }
        }
        
        if (pRes.ok) {
          const pData = await pRes.json();
          if (Array.isArray(pData) && pData.length > 0) {
            setProjects(pData);
          }
        }

        if (sRes.ok) {
          const sData = await sRes.json();
          if (Array.isArray(sData) && sData.length > 0) {
            setServices(DEFAULT_MICROSERVICES.map(def => {
              const savedService = sData.find((p: any) => p.id === def.id);
              return savedService ? { ...def, url: savedService.url } : def;
            }));
          }
        }

        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData) {
            if (cData.gemini_enabled !== undefined) setGeminiEnabled(cData.gemini_enabled);
            if (cData.favorites !== undefined) setFavoriteIds(cData.favorites);
            if (cData.theme !== undefined) setIsDarkMode(cData.theme === 'dark');
            if (cData.user_role !== undefined) setUserRole(cData.user_role);
          }
        }
      } catch (e) {
        console.warn("Could not sync with Redis API.", e);
      } finally {
        setHasLoadedPersistence(true);
      }
    };
    syncWithAPI();
  }, []);

  // Handlers for Data Mutation
  const handleAddUser = (user: UserProfile) => {
    setUsers(prev => {
      const next = [...prev, user];
      fetch(PERSISTENCE_API_CONFIG.saveUsers.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
      return next;
    });
  };
  const handleUpdateUser = (updated: UserProfile) => {
    setUsers(prev => {
      const next = prev.map(u => u.id === updated.id ? updated : u);
      fetch(PERSISTENCE_API_CONFIG.saveUsers.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
      return next;
    });
  };
  const handleDeleteUser = (id: string) => {
    setUsers(prev => {
      const next = prev.filter(u => u.id !== id);
      fetch(PERSISTENCE_API_CONFIG.saveUsers.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
      return next;
    });
  };

  const handleAddProject = (project: ProjectDefinition) => {
    setProjects(prev => {
      const next = [...prev, project];
      fetch(PERSISTENCE_API_CONFIG.saveProjects.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
      return next;
    });
  };
  const handleUpdateProject = (updated: ProjectDefinition) => {
    setProjects(prev => {
      const next = prev.map(p => p.id === updated.id ? updated : p);
      fetch(PERSISTENCE_API_CONFIG.saveProjects.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
      return next;
    });
  };
  const handleDeleteProject = (id: string) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id);
      fetch(PERSISTENCE_API_CONFIG.saveProjects.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
      return next;
    });
  };

  // Filter Services based on Role
  const visibleServices = services.filter(s => {
    if (userRole === 'admin') return true;
    return s.minRole !== 'admin';
  });

  // Redirect if active service becomes hidden due to role change
  useEffect(() => {
    const currentService = services.find(s => s.id === activeServiceId);
    if (currentService && currentService.minRole === 'admin' && userRole !== 'admin') {
      setActiveServiceId('dashboard');
    }
  }, [userRole, activeServiceId, services]);

  // Handle Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2800); 
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

  const handleResetDefaults = () => {
    setServices(DEFAULT_MICROSERVICES);
    // Optionally clear from Redis too
    fetch(PERSISTENCE_API_CONFIG.saveServices.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([])
    });
  };

  const handleToggleGemini = (enabled: boolean) => {
    setGeminiEnabled(enabled);
  };

  const handleToggleFavorite = (id: string) => {
    setFavoriteIds(prev => {
      const newFavorites = prev.includes(id) 
        ? prev.filter(favId => favId !== id)
        : [...prev, id];
      return newFavorites;
    });
  };

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

  const activeService = services.find(s => s.id === activeServiceId) || services[0];

  return (
    <>
      {showSplash && <SplashScreen />}
      {showPresentation && <PresentationMode onClose={() => setShowPresentation(false)} />}

      <CommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)}
        services={visibleServices}
        onSelectService={setActiveServiceId}
        toggleTheme={toggleTheme}
        toggleTerminal={() => setShowTerminal(prev => !prev)}
      />

      <TerminalWidget 
        isOpen={showTerminal} 
        onClose={() => setShowTerminal(false)} 
      />

      <div className={`flex h-screen w-full bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-300 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        
        <Sidebar 
          items={visibleServices}
          activeServiceId={activeServiceId}
          onSelectService={setActiveServiceId}
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          onStartPresentation={() => setShowPresentation(true)}
          favoriteIds={favoriteIds}
          onToggleFavorite={handleToggleFavorite}
          userRole={userRole}
        />

        <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <Header 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme}
            activeService={activeService}
            toggleSidebar={toggleSidebar}
            isGeminiActive={geminiEnabled}
          />

          <main className="flex-1 p-4 md:p-6 overflow-hidden relative overflow-y-auto custom-scrollbar">
            {activeService.id === 'settings' ? (
              <SettingsView 
                services={services}
                onUpdateServices={handleUpdateServices}
                geminiEnabled={geminiEnabled}
                onToggleGemini={handleToggleGemini}
                onResetDefaults={handleResetDefaults}
                userRole={userRole}
                onChangeUserRole={setUserRole}
              />
            ) : activeService.id === 'dashboard' ? (
              <DashboardHome />
            ) : activeService.id === 'api-docs' ? (
              <ApiDocsView />
            ) : activeService.id === 'launch-training' ? (
              <LaunchTrainingView users={users} projects={projects} />
            ) : activeService.id === 'users' ? (
              <UserManagementView 
                users={users} 
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
              />
            ) : activeService.id === 'projects' ? (
              <ProjectManagementView 
                projects={projects}
                onAddProject={handleAddProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
              />
            ) : activeService.id === 'about' ? (
              <AboutView />
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
