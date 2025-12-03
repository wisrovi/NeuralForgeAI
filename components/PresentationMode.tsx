import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Monitor, Cpu, Database, Activity, Server, Brain, Layers, Eye, GitBranch, Zap, User, Linkedin } from 'lucide-react';
import { PRESENTATION_SLIDES, DEVELOPER_PROFILE } from '../constants';

interface PresentationModeProps {
  onClose: () => void;
}

// Map string icon names to Lucide components
const IconMap: Record<string, React.ReactNode> = {
  logo: <Brain size={80} />,
  server: <Server size={80} />,
  eye: <Eye size={80} />,
  dna: <Activity size={80} />, // Genetic algo metaphor
  zap: <Zap size={80} />,
  database: <Database size={80} />,
  activity: <GitBranch size={80} />,
  layers: <Layers size={80} />,
  code: <Monitor size={80} />
};

const PresentationMode: React.FC<PresentationModeProps> = ({ onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < PRESENTATION_SLIDES.length - 1) {
      setCurrentSlide(curr => curr + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(curr => curr - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const slide = PRESENTATION_SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col animate-fade-in">
      {/* Controls / Progress */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <div className="flex gap-2">
          {PRESENTATION_SLIDES.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-blue-500' : 'w-2 bg-gray-700'}`}
            />
          ))}
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Background FX */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black pointer-events-none"></div>
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl"></div>

        {/* Content Container */}
        <div className="relative max-w-5xl w-full flex flex-col md:flex-row items-center gap-12 animate-slide-up">
          
          {/* Left: Icon/Visual */}
          <div className="w-full md:w-1/3 flex justify-center">
             <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl bg-gradient-to-tr from-gray-800 to-gray-900 border border-gray-700 shadow-2xl flex items-center justify-center text-blue-400 relative">
                {slide.isProfile ? (
                   DEVELOPER_PROFILE.avatarUrl ? (
                     <img src={DEVELOPER_PROFILE.avatarUrl} alt="Profile" className="w-full h-full object-cover rounded-3xl opacity-90" />
                   ) : (
                     <User size={100} />
                   )
                ) : (
                   IconMap[slide.icon || 'code']
                )}
                {/* Decorative corner accents */}
                <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
             </div>
          </div>

          {/* Right: Text */}
          <div className="w-full md:w-2/3 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              {slide.title}
            </h1>
            <h2 className="text-2xl text-blue-400 font-light mb-6">
              {slide.subtitle}
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto md:mx-0">
              {slide.content}
            </p>

            {slide.isProfile && (
              <div className="mt-8 flex justify-center md:justify-start">
                 <a 
                   href={DEVELOPER_PROFILE.linkedin}
                   target="_blank"
                   rel="noreferrer" 
                   className="flex items-center gap-2 px-6 py-3 bg-[#0077b5] hover:bg-[#006396] rounded-full text-white font-medium transition-all transform hover:scale-105"
                 >
                   <Linkedin size={20} />
                   Connect on LinkedIn
                 </a>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Navigation Buttons */}
      <button 
        onClick={prevSlide}
        disabled={currentSlide === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-0 transition-all"
      >
        <ChevronLeft size={40} />
      </button>

      <button 
        onClick={nextSlide}
        disabled={currentSlide === PRESENTATION_SLIDES.length - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-0 transition-all"
      >
        <ChevronRight size={40} />
      </button>

    </div>
  );
};

export default PresentationMode;