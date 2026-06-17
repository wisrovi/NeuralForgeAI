import React, { useState } from 'react';
import { Microservice, UserRole } from '../types';
import { 
  Save, 
  Cpu, 
  Globe, 
  User, 
  RotateCcw,
  Sparkles,
  Shield,
  ShieldAlert,
  Loader2,
  Check
} from 'lucide-react';

interface SettingsViewProps {
  services: Microservice[];
  onUpdateServices: (updated: Microservice[]) => void;
  geminiEnabled: boolean;
  onToggleGemini: (enabled: boolean) => void;
  onResetDefaults: () => void;
  userRole: UserRole;
  onChangeUserRole: (role: UserRole) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  services, 
  onUpdateServices, 
  geminiEnabled, 
  onToggleGemini,
  onResetDefaults,
  userRole,
  onChangeUserRole
}) => {
  const [activeTab, setActiveTab] = useState<'platform' | 'intelligence'>('platform');
  const [localServices, setLocalServices] = useState<Microservice[]>(services);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleUrlChange = (id: string, newUrl: string) => {
    const updated = localServices.map(s => s.id === id ? { ...s, url: newUrl } : s);
    setLocalServices(updated);
    setHasChanges(true);
    if (saveStatus !== 'idle') setSaveStatus('idle');
  };

  const handleSave = () => {
    setSaveStatus('saving');
    
    // Simulate network/processing delay for better UX
    setTimeout(() => {
        onUpdateServices(localServices);
        setHasChanges(false);
        setSaveStatus('saved');
        
        // Reset back to idle after display
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-10 animate-fade-in-up">
      
      {/* Settings Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage microservice connections, AI integration, and platform details.</p>
        </div>

        {/* User Role Switcher */}
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
           <span className="text-xs font-bold text-gray-500 uppercase px-2">Role:</span>
           <button 
             onClick={() => onChangeUserRole('admin')}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${userRole === 'admin' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
           >
             <Shield size={14} /> Admin
           </button>
           <button 
             onClick={() => onChangeUserRole('guest')}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${userRole === 'guest' ? 'bg-gray-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
           >
             <User size={14} /> Guest
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('platform')}
          className={`px-4 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'platform' 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Globe size={18} /> Platform & Links
          </div>
          {activeTab === 'platform' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400" />}
        </button>
        
        <button
          onClick={() => setActiveTab('intelligence')}
          className={`px-4 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'intelligence' 
              ? 'text-purple-600 dark:text-purple-400' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Cpu size={18} /> Intelligence (AI)
          </div>
          {activeTab === 'intelligence' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 dark:bg-purple-400" />}
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        
        {/* === PLATFORM CONFIGURATION === */}
        {activeTab === 'platform' && (
          <div className="p-6">
            {userRole === 'guest' ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShieldAlert size={48} className="text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Access Denied</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mt-2">
                  Guest users do not have permission to modify platform URLs or system configurations. Please switch to the Admin role to edit these settings.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Microservice Endpoints</h3>
                  <button 
                    onClick={onResetDefaults}
                    className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={14} /> Reset all to defaults
                  </button>
                </div>
                
                <div className="space-y-4">
                  {localServices.filter(s => s.id !== 'settings' && s.id !== 'about').map((service) => (
                    <div key={service.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                      <div className="md:col-span-4 flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-gray-600 dark:text-gray-300">
                          {service.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{service.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{service.id}</p>
                            {service.minRole === 'admin' && (
                              <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 rounded border border-red-200 dark:border-red-800">ADMIN</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-8">
                        <input 
                          type="text" 
                          value={service.url}
                          onChange={(e) => handleUrlChange(service.id, e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={handleSave}
                    disabled={(!hasChanges && saveStatus === 'idle') || saveStatus === 'saving' || saveStatus === 'saved'}
                    className={`
                      flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-300 transform min-w-[160px]
                      ${saveStatus === 'saved' 
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 scale-105 ring-2 ring-green-500/50' 
                        : saveStatus === 'saving'
                          ? 'bg-blue-600 text-white cursor-wait opacity-90'
                          : hasChanges
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 hover:-translate-y-0.5' 
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <span className={`flex items-center gap-2 transition-all duration-300 ${saveStatus === 'saved' ? 'scale-110' : ''}`}>
                      {saveStatus === 'saving' ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : saveStatus === 'saved' ? (
                        <>
                          <Check size={18} strokeWidth={3} />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          <span>Save Changes</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* === INTELLIGENCE (GEMINI) === */}
        {activeTab === 'intelligence' && (
          <div className="p-8">
            {userRole === 'guest' ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                 <ShieldAlert size={48} className="text-red-500 mb-4" />
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white">Admin Restricted</h3>
                 <p className="text-gray-500 dark:text-gray-400 mt-2">AI Integration settings are managed by system administrators.</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg text-white">
                      <Sparkles size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Gemini Integration</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    Activate the Gemini model to enable advanced predictive analytics, natural language querying across your microservices, and automated reporting.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl mb-6">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 text-sm mb-1">System Capability</h4>
                    <p className="text-blue-700 dark:text-blue-300 text-xs">
                      Current OmniShell Version 2.4 supports Gemini Pro and Flash models. Enabling this will inject the AI assistant into the Sidebar.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => onToggleGemini(!geminiEnabled)}
                      className={`
                        relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                        ${geminiEnabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                          ${geminiEnabled ? 'translate-x-7' : 'translate-x-1'}
                        `}
                      />
                    </button>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {geminiEnabled ? 'AI Model Active' : 'AI Model Disabled'}
                    </span>
                  </div>
                </div>

                {/* Visual Decorative Element */}
                <div className="w-full md:w-1/3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${geminiEnabled ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shadow-xl shadow-purple-500/20' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                     <Cpu size={40} />
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {geminiEnabled ? 'System is ready to process requests.' : 'Enable to access AI features.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsView;