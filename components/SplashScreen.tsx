import React from 'react';
import { Hexagon } from 'lucide-react';
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
             {/* Abstract Neural Node SVG */}
             <svg viewBox="0 0 100 100" className="w-full h-full text-blue-500 animate-float drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
               <defs>
                 <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" style={{stopColor:'#60A5FA', stopOpacity:1}} />
                   <stop offset="100%" style={{stopColor:'#4F46E5', stopOpacity:1}} />
                 </linearGradient>
               </defs>
               
               {/* Central Hexagon */}
               <path d="M50 20 L80 35 L80 65 L50 80 L20 65 L20 35 Z" fill="none" stroke="url(#grad1)" strokeWidth="3" />
               <circle cx="50" cy="50" r="10" fill="url(#grad1)" />
               
               {/* Connections */}
               <line x1="50" y1="20" x2="50" y2="5" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
               <circle cx="50" cy="5" r="3" fill="#60A5FA" />
               
               <line x1="80" y1="35" x2="95" y2="25" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
               <circle cx="95" cy="25" r="3" fill="#60A5FA" />
               
               <line x1="80" y1="65" x2="95" y2="75" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
               <circle cx="95" cy="75" r="3" fill="#60A5FA" />
               
               <line x1="20" y1="65" x2="5" y2="75" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
               <circle cx="5" cy="75" r="3" fill="#60A5FA" />
               
               <line x1="20" y1="35" x2="5" y2="25" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
               <circle cx="5" cy="25" r="3" fill="#60A5FA" />
               
               <line x1="50" y1="80" x2="50" y2="95" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
               <circle cx="50" cy="95" r="3" fill="#60A5FA" />
             </svg>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-white">
          {APP_NAME}
        </h1>
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-4"></div>
        <p className="text-blue-200/60 font-mono text-sm tracking-widest uppercase">
          Initializing Neural Systems...
        </p>
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