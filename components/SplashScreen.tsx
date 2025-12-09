import React from 'react';
import { APP_NAME } from '../constants';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 text-white overflow-hidden">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-950 to-gray-950"></div>
      
      {/* Grid Lines */}
      <div 
        className="absolute inset-0 opacity-10" 
        style={{
          backgroundImage: `linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      ></div>

      <div className="relative flex flex-col items-center animate-fade-in-up">
        {/* Animated Logo Container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-30 rounded-full animate-pulse-slow"></div>
          
          <div className="relative w-32 h-32 flex items-center justify-center">
             {/* DNA Helix / Network SVG */}
             <svg viewBox="0 0 100 100" className="w-full h-full text-blue-500 animate-float drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
               <defs>
                 <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" style={{stopColor:'#60A5FA', stopOpacity:1}} />
                   <stop offset="100%" style={{stopColor:'#4F46E5', stopOpacity:1}} />
                 </linearGradient>
               </defs>
               
               {/* Left Strand */}
               <path d="M30 10 Q 70 30 30 50 Q 70 70 30 90" fill="none" stroke="url(#grad1)" strokeWidth="4" strokeLinecap="round" />
               
               {/* Right Strand */}
               <path d="M70 10 Q 30 30 70 50 Q 30 70 70 90" fill="none" stroke="url(#grad1)" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
               
               {/* Rungs */}
               <line x1="30" y1="10" x2="70" y2="10" stroke="#60A5FA" strokeWidth="2" strokeDasharray="4 4" />
               <line x1="50" y1="30" x2="50" y2="30" stroke="#60A5FA" strokeWidth="6" strokeLinecap="round" />
               <line x1="30" y1="50" x2="70" y2="50" stroke="#60A5FA" strokeWidth="2" strokeDasharray="4 4" />
               <line x1="50" y1="70" x2="50" y2="70" stroke="#60A5FA" strokeWidth="6" strokeLinecap="round" />
               <line x1="30" y1="90" x2="70" y2="90" stroke="#60A5FA" strokeWidth="2" strokeDasharray="4 4" />
               
               {/* Particles */}
               <circle cx="30" cy="10" r="3" fill="#fff" />
               <circle cx="70" cy="50" r="3" fill="#fff" />
               <circle cx="30" cy="90" r="3" fill="#fff" />
             </svg>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-white">
          {APP_NAME}
        </h1>
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-6"></div>
        
        {/* Explanation / Tagline */}
        <div className="flex flex-col items-center space-y-2 text-blue-200/80 font-mono text-xs tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <span>Evolutionary</span>
            <span className="w-1 h-1 rounded-full bg-blue-500/50"></span>
            <span>Architecture</span>
            <span className="w-1 h-1 rounded-full bg-blue-500/50"></span>
            <span>Operations</span>
          </div>
        </div>

      </div>

      <div className="absolute bottom-10 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-0"></div>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-150"></div>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-300"></div>
      </div>
    </div>
  );
};

export default SplashScreen;