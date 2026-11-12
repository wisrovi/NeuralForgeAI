import React, { useState } from 'react';
import { 
  CheckCircle2, 
  CircleDot, 
  Clock, 
  AlertCircle, 
  Brain, 
  Database, 
  Cpu, 
  FileText, 
  ShieldAlert, 
  Eye, 
  Settings2,
  Sparkles
} from 'lucide-react';

export interface PipelineStepState {
  id: string;
  name: string;
  technicalName: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  duration?: string;
  detail?: string;
}

interface PipelineProgressViewerProps {
  studyState: string; // 'PENDING' | 'STARTED' | 'COMPLETED' | 'FAILURE' | 'RETRY'
  activeTask?: string;
  activeInvoker?: string;
  resultsData?: any;
  errorData?: any;
}

export const PipelineProgressViewer: React.FC<PipelineProgressViewerProps> = ({
  studyState,
  activeTask,
  activeInvoker,
  resultsData,
  errorData
}) => {
  const [showTechnical, setShowTechnical] = useState<boolean>(false);

  // Derive stage status based on study lifecycle
  const isStarted = studyState === 'STARTED' || studyState === 'SUCCESS' || studyState === 'COMPLETED';
  const isFinished = studyState === 'COMPLETED' || (resultsData && Object.keys(resultsData).length > 0);
  const isFailed = studyState === 'FAILURE' || (errorData && !isFinished);
  const errStr = typeof errorData === 'string' ? errorData : JSON.stringify(errorData || {});
  const isDataCheckFailed = Boolean(isFailed && (errStr.includes('check_dataset') || errStr.includes('Dataset') || errStr.includes('502')));
  const isEnvCheckFailed = Boolean(isFailed && (errStr.includes('GPU') || errStr.includes('MinIO') || errStr.includes('501') || errStr.includes('503')));

  const steps: PipelineStepState[] = [
    {
      id: 'step_env',
      name: '1. Comprobación del Equipo',
      technicalName: 'check_gpu & check_minio',
      description: 'Verificación de tarjeta gráfica, memoria VRAM y conexión al almacenamiento seguro.',
      icon: <Cpu size={16} />,
      status: isEnvCheckFailed ? 'failed' : isStarted ? 'completed' : 'pending',
      detail: isEnvCheckFailed ? 'Error en GPU o Almacenamiento' : isStarted ? (activeInvoker || 'GPU Asignada') : 'En espera'
    },
    {
      id: 'step_data',
      name: '2. Validación de Fotos y Datos',
      technicalName: 'check_dataset',
      description: 'Inspección de las imágenes de entrenamiento y sus etiquetas anotadas.',
      icon: <Database size={16} />,
      status: isDataCheckFailed ? 'failed' : isStarted && !isEnvCheckFailed ? 'completed' : 'pending',
      detail: isDataCheckFailed ? 'Error: Ruta de Dataset no encontrada' : isStarted ? 'Conjunto validado' : 'Pendiente'
    },
    {
      id: 'step_train',
      name: '3. Aprendizaje de la Inteligencia Artificial',
      technicalName: 'train_model (YOLO & Optuna)',
      description: 'El modelo neuronal ajusta sus millones de parámetros visuales sobre los datos.',
      icon: <Brain size={16} />,
      status: isDataCheckFailed || isEnvCheckFailed ? 'pending' : isFinished ? 'completed' : isStarted ? 'running' : 'pending',
      detail: isDataCheckFailed ? 'Cancelado por fallo en dataset' : isFinished ? 'Entrenamiento finalizado' : isStarted ? 'Entrenando épocas en GPU...' : 'En cola'
    },
    {
      id: 'step_rd',
      name: '4. Auditoría de Calidad y Seguridad (I+D)',
      technicalName: 'PostTrain Suite (XAI, Adversarial, Latent)',
      description: 'Mapas de atención visual (Grad-CAM), resistencia a ruido y cálculo de precisión científica.',
      icon: <Eye size={16} />,
      status: isFinished ? 'completed' : 'pending',
      detail: isFinished ? 'Auditoría completada' : 'Pendiente de entreno'
    },
    {
      id: 'step_report',
      name: '5. Informe y Publicación de Resultados',
      technicalName: 'publish_results & LlmAnalyzer',
      description: 'Generación del diagnóstico en lenguaje natural y registro en el catálogo de modelos.',
      icon: <Sparkles size={16} />,
      status: isFinished ? 'completed' : isFailed ? 'failed' : 'pending',
      detail: isFinished ? 'Informe disponible' : isFailed ? 'Fallo en proceso' : 'Pendiente'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain size={17} className="text-blue-500" />
            Flujo de Trabajo del Entrenamiento (Pipeline WPipe)
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Seguimiento en directo de cada fase del modelo desde el inicio hasta el informe final.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTechnical(!showTechnical)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Settings2 size={13} className={showTechnical ? 'text-blue-500' : ''} />
          {showTechnical ? 'Nombres Amigables' : 'Nombres Técnicos (DAG)'}
        </button>
      </div>

      {/* Progress Steps Timeline */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
        {steps.map((s, idx) => {
          const isDone = s.status === 'completed';
          const isCur = s.status === 'running';
          const isFail = s.status === 'failed';

          return (
            <div key={s.id} className="relative group">
              {/* Bullet Node */}
              <div 
                className={`
                  absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all
                  ${isDone 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : isCur 
                      ? 'bg-blue-600 border-blue-400 text-white animate-pulse ring-4 ring-blue-500/20' 
                      : isFail 
                        ? 'bg-red-500 border-red-500 text-white' 
                        : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-400'
                  }
                `}
              >
                {isDone ? <CheckCircle2 size={12} /> : isCur ? <CircleDot size={12} /> : idx + 1}
              </div>

              {/* Step Content */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    <span className="text-gray-400 dark:text-gray-500">{s.icon}</span>
                    {showTechnical ? s.technicalName : s.name}
                  </h5>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {s.description}
                  </p>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  <span 
                    className={`
                      inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full
                      ${isDone 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                        : isCur 
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
                          : isFail 
                            ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }
                    `}
                  >
                    {s.detail}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineProgressViewer;
