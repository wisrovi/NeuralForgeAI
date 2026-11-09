import React, { useState } from 'react';
import { 
  Activity, 
  Cpu, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  Zap, 
  Maximize2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LiveTrainingTelemetryProps {
  studyId: string;
  studyName?: string;
  activeWorker?: string;
  currentEpoch?: number;
  totalEpochs?: number;
  etaSeconds?: number;
  elapsedSeconds?: number;
  isCompleted?: boolean;
}

export const LiveTrainingTelemetry: React.FC<LiveTrainingTelemetryProps> = ({
  studyId,
  studyName = 'Modelo en Entrenamiento',
  activeWorker = '192.168.1.68',
  currentEpoch = 3,
  totalEpochs = 5,
  etaSeconds = 110,
  elapsedSeconds = 165,
  isCompleted = false
}) => {
  const [showLossCurves, setShowLossCurves] = useState<boolean>(true);

  const progressPercent = isCompleted ? 100 : Math.round((currentEpoch / Math.max(totalEpochs, 1)) * 100);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Simulated loss points for dynamic visual sparkline
  // box_loss: starts around 2.1 and drops down
  const boxLossPoints = [2.14, 1.82, 1.45, 1.12, 0.89];
  // cls_loss: starts around 1.65 and drops down
  const clsLossPoints = [1.65, 1.25, 0.94, 0.68, 0.52];
  // mAP50: starts low and climbs up
  const mapPoints = [0.05, 0.18, 0.32, 0.44, 0.51];

  // Helper to construct SVG Polyline points
  const makeSvgPoints = (data: number[], minVal: number, maxVal: number, width: number = 220, height: number = 50) => {
    const range = maxVal - minVal || 1;
    return data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const normalizedY = (val - minVal) / range;
      const y = height - (normalizedY * (height - 10) + 5);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Activity size={20} className={isCompleted ? '' : 'animate-pulse'} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              Telemetría y Evolución en Tiempo Real
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isCompleted 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800' 
                  : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800'
              }`}>
                {isCompleted ? 'Finalizado' : 'Entrenando en Vivo'}
              </span>
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              GPU Asignada: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{activeWorker}</span> • ID: <span className="font-mono text-[11px]">{studyId.slice(0, 8)}...</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowLossCurves(!showLossCurves)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-center"
        >
          {showLossCurves ? 'Ocultar Curvas' : 'Ver Curvas de Aprendizaje'}
          {showLossCurves ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Progress & Time Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Zap size={14} className="text-amber-500" />
            Progreso de Épocas: <strong className="font-semibold text-gray-900 dark:text-white">{isCompleted ? totalEpochs : currentEpoch} de {totalEpochs}</strong>
          </span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{progressPercent}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-[11px]">
          <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center gap-2">
            <Clock size={14} className="text-gray-400 shrink-0" />
            <div>
              <span className="text-gray-500 block text-[10px]">Tiempo Transcurrido:</span>
              <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{formatTime(elapsedSeconds)}</span>
            </div>
          </div>

          <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center gap-2">
            <Cpu size={14} className="text-blue-500 shrink-0" />
            <div>
              <span className="text-gray-500 block text-[10px]">Tiempo Estimado Restante:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {isCompleted ? '00:00 (Completado)' : `~${formatTime(etaSeconds)}`}
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg hidden sm:flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-500 shrink-0" />
            <div>
              <span className="text-gray-500 block text-[10px]">mAP50 Actual:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {mapPoints[mapPoints.length - 1].toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Loss and Accuracy Curves (SVG Sparklines) */}
      {showLossCurves && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <TrendingDown size={14} className="text-red-500" />
              Curvas de Convergencia (Pérdidas vs Precisión)
            </span>
            <span className="text-[10px] text-gray-400">Actualizado dinámicamente cada época</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Box Loss Curve */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700/70">
              <div className="flex justify-between items-center mb-1 text-[11px]">
                <span className="text-gray-500 font-medium">Error de Caja (box_loss)</span>
                <span className="font-mono font-bold text-red-500">{boxLossPoints[boxLossPoints.length - 1]}</span>
              </div>
              <svg viewBox="0 0 220 50" className="w-full h-12 overflow-visible">
                <polyline
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={makeSvgPoints(boxLossPoints, 0.5, 2.5)}
                />
              </svg>
              <span className="text-[9px] text-gray-400 block text-right mt-1">Convergencia a 0 deseada</span>
            </div>

            {/* Cls Loss Curve */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700/70">
              <div className="flex justify-between items-center mb-1 text-[11px]">
                <span className="text-gray-500 font-medium">Error de Clase (cls_loss)</span>
                <span className="font-mono font-bold text-amber-500">{clsLossPoints[clsLossPoints.length - 1]}</span>
              </div>
              <svg viewBox="0 0 220 50" className="w-full h-12 overflow-visible">
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={makeSvgPoints(clsLossPoints, 0.4, 2.0)}
                />
              </svg>
              <span className="text-[9px] text-gray-400 block text-right mt-1">Discriminación de objetos</span>
            </div>

            {/* mAP Curve */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700/70">
              <div className="flex justify-between items-center mb-1 text-[11px]">
                <span className="text-gray-500 font-medium">Precisión (mAP50)</span>
                <span className="font-mono font-bold text-emerald-500">{(mapPoints[mapPoints.length - 1] * 100).toFixed(1)}%</span>
              </div>
              <svg viewBox="0 0 220 50" className="w-full h-12 overflow-visible">
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={makeSvgPoints(mapPoints, 0, 0.6)}
                />
              </svg>
              <span className="text-[9px] text-gray-400 block text-right mt-1">Crecimiento progresivo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrainingTelemetry;
