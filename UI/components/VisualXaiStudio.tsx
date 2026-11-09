import React, { useState } from 'react';
import { 
  Eye, 
  Layers, 
  Sparkles, 
  AlertTriangle, 
  Sliders, 
  CheckCircle2, 
  HelpCircle, 
  ShieldAlert,
  ChevronRight,
  Maximize2
} from 'lucide-react';

interface VisualXaiStudioProps {
  studyId: string;
  studyName?: string;
  resultsData?: any;
}

export const VisualXaiStudio: React.FC<VisualXaiStudioProps> = ({
  studyId,
  studyName = 'Modelo de Visión',
  resultsData
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(0);

  const samples = [
    {
      id: 'sample_1',
      title: 'Muestra #1: Detección Nítida y Focalizada',
      confidence: 0.94,
      status: 'success',
      description: 'El mapa Grad-CAM concentra más del 88% de la atención sobre la silueta principal, ignorando el ruido del entorno.',
      attentionScore: '88% Focalización Alta',
      recommendation: 'Excelente respuesta invariante a traslación.'
    },
    {
      id: 'sample_2',
      title: 'Muestra #2: Oclusión Parcial con Sombras',
      confidence: 0.71,
      status: 'warning',
      description: 'Se observa activación moderada en los bordes inferiores debido al contraste con sombras proyectadas.',
      attentionScore: '65% Focalización Media',
      recommendation: 'Añadir 20 imágenes con iluminación cenital para consolidar los bordes.'
    },
    {
      id: 'sample_3',
      title: 'Muestra #3: Caso Límite (Falso Negativo Potencial)',
      confidence: 0.38,
      status: 'danger',
      description: 'El modelo presenta dispersión en el mapa de atención debido a similitud cromática con el fondo.',
      attentionScore: '38% Atención Dispersa',
      recommendation: 'Revisar etiquetado en el dataset y verificar que no existan polígonos solapados.'
    }
  ];

  const currentSample = samples[selectedSampleIndex];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Eye size={20} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              Estudio de Explicabilidad Visual (XAI & Grad-CAM)
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800">
                Auditoría I+D
              </span>
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Inspección visual de las regiones neuronales que determinan las predicciones del modelo.
            </p>
          </div>
        </div>

        {/* Preset quick buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setSliderPosition(0)}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              sliderPosition === 0 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Solo Imagen
          </button>
          <button
            type="button"
            onClick={() => setSliderPosition(50)}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              sliderPosition === 50 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Split 50%
          </button>
          <button
            type="button"
            onClick={() => setSliderPosition(100)}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
              sliderPosition === 100 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Solo Heatmap
          </button>
        </div>
      </div>

      {/* Main Interactive Split Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Visual Viewport (Interactive Before/After Slider) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-950 select-none group shadow-inner">
            {/* Background: Raw Original Image */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-slate-900 to-indigo-950">
              {/* Simulated object representation */}
              <div className="relative w-3/5 h-3/5 border-2 border-dashed border-gray-600/50 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                <Layers size={42} className="text-gray-400 mb-2 opacity-80" />
                <span className="text-xs font-mono text-gray-300 font-semibold">{studyName}</span>
                <span className="text-[10px] text-gray-500 font-mono mt-1">Fotografía de Entrada (RGB)</span>
              </div>
            </div>

            {/* Foreground: Grad-CAM Thermal Heatmap Layer clipped by sliderPosition */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <div className="w-full h-full relative bg-gradient-to-tr from-amber-600/40 via-red-600/50 to-purple-800/40 backdrop-blur-[1px] flex items-center justify-center">
                {/* Hotspot attention glowing core */}
                <div className="w-48 h-48 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 opacity-70 blur-xl animate-pulse" />
                <div className="absolute top-3 left-3 bg-red-600/80 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow">
                  Grad-CAM Heatmap
                </div>
              </div>
            </div>

            {/* Vertical Divider Line & Draggable Handle */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-white dark:bg-gray-900 text-blue-600 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <Sliders size={14} className="rotate-90" />
              </div>
            </div>

            {/* Range Slider for Accessible Touch & Mouse scrubbing */}
            <input
              type="range"
              min={0}
              max={100}
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-10"
              aria-label="Grad-CAM comparison slider"
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-gray-500">
            <span>◀ Desliza para comparar: Original (RGB)</span>
            <span>Atención Neuronal (Grad-CAM) ▶</span>
          </div>
        </div>

        {/* Diagnosis & Sample Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
              Muestras Analizadas por ImageECamYOLO
            </span>
            <div className="space-y-1.5">
              {samples.map((sample, idx) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => setSelectedSampleIndex(idx)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${
                    selectedSampleIndex === idx
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 font-semibold shadow-xs'
                      : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="block">{sample.title}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                      Confianza: {(sample.confidence * 100).toFixed(0)}% • {sample.attentionScore}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Diagnostic Card for Selected Sample */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
              <Sparkles size={16} className="text-indigo-500 shrink-0" />
              Diagnóstico en Lenguaje Natural:
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[11px]">
              {currentSample.description}
            </p>

            <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex items-start gap-2">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-800 dark:text-gray-200 block text-[11px]">Recomendación Práctica:</strong>
                <span className="text-gray-600 dark:text-gray-400 text-[11px]">{currentSample.recommendation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualXaiStudio;
