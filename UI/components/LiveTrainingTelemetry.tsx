import React, { useState, useEffect } from 'react';
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
  ChevronUp,
  Target,
  ExternalLink,
  ShieldCheck,
  Flame
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
  fitnessValue?: number | null;
  mlflowUrl?: string;
  realMetrics?: Record<string, number>;
}

export const LiveTrainingTelemetry: React.FC<LiveTrainingTelemetryProps> = ({
  studyId,
  studyName = 'Modelo en Entrenamiento',
  activeWorker = '192.168.1.68',
  currentEpoch = 0,
  totalEpochs = 5,
  etaSeconds = 0,
  elapsedSeconds = 0,
  isCompleted = false,
  fitnessValue = null,
  mlflowUrl,
  realMetrics
}) => {
  const [showLossCurves, setShowLossCurves] = useState<boolean>(true);

  const progressPercent = isCompleted ? 100 : Math.round((currentEpoch / Math.max(totalEpochs, 1)) * 100);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Real recorded telemetry metrics from MLflow run
  const hasRealMetrics = Boolean(realMetrics && Object.keys(realMetrics).length > 0);
  const boxLoss = realMetrics ? (realMetrics['train/box_loss'] ?? realMetrics['box_loss']) : undefined;
  const valBoxLoss = realMetrics ? (realMetrics['val/box_loss'] ?? realMetrics['val_box_loss']) : undefined;
  const clsLoss = realMetrics ? (realMetrics['train/cls_loss'] ?? realMetrics['cls_loss']) : undefined;
  const valClsLoss = realMetrics ? (realMetrics['val/cls_loss'] ?? realMetrics['val_cls_loss']) : undefined;
  const recallVal = realMetrics ? (realMetrics['metrics/recall(B)'] ?? realMetrics['metrics/recallB'] ?? realMetrics['recall']) : undefined;
  const map50Val = realMetrics ? (realMetrics['metrics/mAP50(B)'] ?? realMetrics['metrics/mAP50B'] ?? realMetrics['mAP50']) : undefined;

  // Resolve deep link to MLflow experiment / run
  const [resolvedExperimentId, setResolvedExperimentId] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    if (!studyName || studyName === 'Modelo en Entrenamiento') return;

    if (studyName === 'Detector_Cesped_V3') {
      setResolvedExperimentId('109');
      return;
    }
    if (studyName === 'AREPO_ProtSup_Detector_v3_20261022') {
      setResolvedExperimentId('97');
      return;
    }
    if (studyName === 'Tattoo_detector') {
      setResolvedExperimentId('110');
      return;
    }

    const isBrowser = typeof window !== 'undefined';
    const apiBase = isBrowser ? '/mlflow-proxy' : 'http://192.168.10.252:23435';

    fetch(`${apiBase}/api/2.0/mlflow/experiments/get-by-name?experiment_name=${encodeURIComponent(studyName)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!isCancelled && data?.experiment?.experiment_id) {
          setResolvedExperimentId(data.experiment.experiment_id);
        }
      })
      .catch(() => {});

    return () => { isCancelled = true; };
  }, [studyName]);

  const targetMlflowUrl = mlflowUrl || 
    (resolvedExperimentId 
      ? `http://192.168.10.252:23435/#/experiments/${resolvedExperimentId}` 
      : 'http://192.168.10.252:23435/');

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
          {showLossCurves ? 'Ocultar Telemetría' : 'Ver Telemetría Real'}
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

          <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900/40 hidden sm:flex items-center gap-2">
            <Target size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Fitness Actual (Optuna):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                {fitnessValue !== null && fitnessValue !== undefined && !isNaN(Number(fitnessValue))
                  ? Number(fitnessValue).toFixed(4)
                  : (isCompleted ? 'N/A' : 'Pendiente')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real Convergence Telemetry and Verified Losses */}
      {showLossCurves && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <TrendingDown size={14} className="text-blue-500" />
              Métricas Reales de Pérdida y Convergencia (MLflow)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck size={11} />
                {hasRealMetrics ? 'Telemetría 100% Auténtica' : 'Sincronización en Espera'}
              </span>
              <a
                href={targetMlflowUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Abrir en MLflow
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {!hasRealMetrics ? (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isCompleted 
                  ? 'No se registraron curvas de telemetría continuas en MLflow para este estudio.' 
                  : 'Sincronizando con MLflow... Las curvas de pérdida y convergencia se mostrarán en vivo conforme concluyan las épocas de entrenamiento en el worker.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Box Loss Metric Card */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700/70">
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="text-gray-500 font-medium">Error de Caja (box_loss)</span>
                  <span className="font-mono font-bold text-red-500">
                    {boxLoss !== undefined ? boxLoss.toFixed(3) : '--'}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 flex justify-between pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                  <span>Train: <strong className="font-mono">{boxLoss !== undefined ? boxLoss.toFixed(3) : '--'}</strong></span>
                  <span>Val: <strong className="font-mono">{valBoxLoss !== undefined ? valBoxLoss.toFixed(3) : '--'}</strong></span>
                </div>
                <span className="text-[9px] text-gray-400 block text-right mt-1">Convergencia de localización</span>
              </div>

              {/* Cls Loss Metric Card */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700/70">
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="text-gray-500 font-medium">Error de Clase (cls_loss)</span>
                  <span className="font-mono font-bold text-amber-500">
                    {clsLoss !== undefined ? clsLoss.toFixed(3) : '--'}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 flex justify-between pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                  <span>Train: <strong className="font-mono">{clsLoss !== undefined ? clsLoss.toFixed(3) : '--'}</strong></span>
                  <span>Val: <strong className="font-mono">{valClsLoss !== undefined ? valClsLoss.toFixed(3) : '--'}</strong></span>
                </div>
                <span className="text-[9px] text-gray-400 block text-right mt-1">Separación de clases</span>
              </div>

              {/* Recall Metric Card */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700/70">
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="text-gray-500 font-medium">Capacidad Recall</span>
                  <span className="font-mono font-bold text-emerald-500">
                    {recallVal !== undefined ? `${(recallVal * 100).toFixed(1)}%` : '--'}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 flex justify-between pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                  <span>Objetos detectados:</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                    {recallVal !== undefined ? `${(recallVal * 100).toFixed(1)}%` : '--'}
                  </strong>
                </div>
                <span className="text-[9px] text-gray-400 block text-right mt-1">Minimización de falsos negativos</span>
              </div>

              {/* Fitness Metric Card */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700/70">
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <span className="text-gray-500 font-medium">Fitness Óptimo</span>
                  <span className="font-mono font-bold text-blue-500">
                    {fitnessValue !== null && fitnessValue !== undefined && !isNaN(Number(fitnessValue))
                      ? Number(fitnessValue).toFixed(4)
                      : (map50Val !== undefined ? map50Val.toFixed(4) : '--')}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 flex justify-between pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                  <span>Objetivo sweeper:</span>
                  <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">mAP50-95(B)</span>
                </div>
                <span className="text-[9px] text-gray-400 block text-right mt-1">Métrica rectora de Optuna</span>
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-lg flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400 text-[11px]">
              Para inspeccionar las curvas dinámicas paso a paso, historial de épocas, gradientes y consumo de GPU/VRAM en tiempo real:
            </span>
            <a
              href={targetMlflowUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shrink-0 ml-3 transition-colors shadow-xs"
            >
              <ExternalLink size={12} />
              Ver Gráficas en MLflow
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrainingTelemetry;
