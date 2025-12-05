import React from 'react';
import { DEVELOPER_PROFILE } from '../constants';
import { User, Linkedin, Globe } from 'lucide-react';

const AboutView: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto pb-10 animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">About</h2>
        <p className="text-gray-500 dark:text-gray-400">Information about the developer and the NeuroForge system.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-90"></div>
          
          <div className="relative px-8 pt-16 pb-8">
            <div className="flex flex-col md:flex-row gap-6">
              
              {/* Profile Image / Avatar */}
              <div className="shrink-0 flex justify-center md:justify-start">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-800 shadow-xl flex items-center justify-center overflow-hidden">
                  {DEVELOPER_PROFILE.avatarUrl ? (
                    <img 
                      src={DEVELOPER_PROFILE.avatarUrl} 
                      alt={DEVELOPER_PROFILE.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={64} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 pt-2 text-center md:text-left">
                 <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{DEVELOPER_PROFILE.name}</h2>
                 <p className="text-emerald-600 dark:text-emerald-400 font-medium text-lg mb-4">{DEVELOPER_PROFILE.title}</p>
                 
                 <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mb-6">
                    {DEVELOPER_PROFILE.bio}
                 </p>

                 <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <a 
                      href={DEVELOPER_PROFILE.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#0077b5] hover:bg-[#006396] text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                      <Linkedin size={18} />
                      <span>Connect on LinkedIn</span>
                    </a>
                    
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700">
                      <Globe size={18} />
                      <span>{DEVELOPER_PROFILE.location}</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-black/20 p-8 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Project Contributions</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Microservices', 'React Architecture', 'UI/UX Design', 'System Integration'].map((skill) => (
                <div key={skill} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutView;