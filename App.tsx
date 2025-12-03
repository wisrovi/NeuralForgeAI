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
import { DEFAULT_MICROSERVICES, DEFAULT_USERS, DEFAULT_PROJECTS } from './constants';
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
  const [geminiEnabled, setGeminiEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('omni_gemini_enabled');
    return saved === 'true';
  });

  // Favorites State
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('omni_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // === DATA REGISTRIES (Users & Projects) ===
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('omni_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [projects, setProjects] = useState<ProjectDefinition[]>(() => {
    const saved = localStorage.getItem('omni_projects');
    return saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
  });

  // Persist Users/Projects on change
  useEffect(() => {
    localStorage.setItem('omni_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('omni_projects', JSON.stringify(projects));
  }, [projects]);

  // Handlers for Data Mutation
  const handleAddUser = (user: UserProfile) => setUsers(prev => [...prev, user]);
  const handleUpdateUser = (updated: UserProfile) => setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  const handleDeleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

  const handleAddProject = (project: ProjectDefinition) => setProjects(prev => [...prev, project]);
  const handleUpdateProject = (updated: ProjectDefinition) => setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  const handleDeleteProject = (id: string) => setProjects(prev => prev.filter(p => p.id !== id));

  // Dynamic Services Configuration State (Persisted)
  const [services, setServices] = useState<Microservice[]>(() => {
    const saved = localStorage.getItem('omni_services_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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

  const handleToggleGemini = (enabled: boolean) => {
    setGeminiEnabled(enabled);
    localStorage.setItem('omni_gemini_enabled', String(enabled));
  };

  const handleToggleFavorite = (id: string) => {
    setFavoriteIds(prev => {
      const newFavorites = prev.includes(id) 
        ? prev.filter(favId => favId !== id)
        : [...prev, id];
      localStorage.setItem('omni_favorites', JSON.stringify(newFavorites));
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
