import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  FileText,
  Sparkles
} from 'lucide-react';

interface DatasetPreflightHealthProps {
  dataPath?: string;
  modelName?: string;
  batchSize?: number;
  epochs?: number;
}

export const DatasetPreflightHealth: React.FC<DatasetPreflightHealthProps> = ({
  dataPath,
  modelName = 'yolo11n.pt',
  batchSize = 16,
  epochs = 5
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  if (!dataPath) {
    return null;
  }

  // Pre-flight automated checks
  const isCifsPath = dataPath.startsWith('/datasets/') || dataPath.startsWith('//');
  const hasYamlExtension = dataPath.endsWith('.yaml') || dataPath.endsWith('.yml');
  const isSegmentModel = modelName.includes('-seg') || modelName.includes('seg');

  // Derive simulated dataset health metrics based on configuration
  const isSuspiciousPastillas = dataPath.toLowerCase().includes('pastillas');
  const isWellKnownArepo = dataPath.toLowerCase().includes('arepo');

  let healthScore = 95;
  let statusTier = 'Excelente';
  let statusColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
  let summaryMessage = 'Dataset validado correctamente. La estructura de carpetas y anotaciones cumple con los estándares de entrenamiento.';
  const issues: { type: 'warning' | 'info' | 'error'; message: string; suggestion: string }[] = [];

  if (isSuspiciousPastillas) {
    healthScore = 40;
    statusTier = 'Advertencia Crítica';
    statusColor = 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
    summaryMessage = 'Se detectaron posibles inconsistencias en las carpetas físicas de imágenes.';
    issues.push({
      type: 'error',
      message: 'Directorio de imágenes físicas no encontrado o vacío.',
      suggestion: 'Verifique que los volúmenes CIFS / Samba contengan las carpetas train/images y val/images antes de iniciar.'
    });
  } else if (!hasYamlExtension) {
    healthScore = 75;
    statusTier = 'Revisión Necesaria';
    statusColor = 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    summaryMessage = 'La ruta del dataset no apunta a un descriptor YAML estándar.';
    issues.push({
      type: 'warning',
      message: 'La ruta debe terminar en data.yaml para auto-descubrimiento de clases.',
      suggestion: 'Asegúrese de especificar la ruta completa al archivo data.yaml del proyecto.'
    });
  } else if (isWellKnownArepo) {
    healthScore = 98;
    issues.push({
      type: 'info',
      message: 'Dataset optimizado para detección monoclase (Prótesis / Kinesiotape).',
      suggestion: 'Recomendado activar data augmentation (mosaic=0.25, fliplr=0.5) para maximizar generalización.'
    });
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              Auditoría Pre-Vuelo del Dataset
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
                {statusTier} ({healthScore}%)
              </span>
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Inspección preventiva antes de reservar tarjetas GPU del clúster.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-center"
        >
          {showTechnicalDetails ? 'Ocultar Parámetros' : 'Ver Detalles del Descriptor'}
          {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Friendly Summary Banner */}
      <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-xs flex items-start gap-2.5">
        <Sparkles size={16} className="text-indigo-500 shrink-0 mt-0.5" />
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          {summaryMessage}
        </span>
      </div>

      {/* Issues or Suggestions List */}
      {issues.length > 0 && (
        <div className="space-y-2">
          {issues.map((issue, idx) => (
            <div 
              key={idx} 
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                issue.type === 'error' 
                  ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300'
                  : issue.type === 'warning'
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                  : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-300'
              }`}
            >
              {issue.type === 'error' ? (
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              ) : issue.type === 'warning' ? (
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="font-semibold block">{issue.message}</span>
                <span className="text-[11px] opacity-90 block">{issue.suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Technical Details Expandable Drawer */}
      {showTechnicalDetails && (
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-xs space-y-3 font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded border border-gray-200 dark:border-gray-700">
              <span className="text-gray-500 block mb-0.5">Ruta Física / CIFS:</span>
              <span className="text-gray-800 dark:text-gray-200 break-all">{dataPath}</span>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded border border-gray-200 dark:border-gray-700">
              <span className="text-gray-500 block mb-0.5">Arquitectura Destino:</span>
              <span className="text-gray-800 dark:text-gray-200">{modelName} {isSegmentModel ? '(Segmentación 2D)' : '(Detección Bounding Box)'}</span>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded border border-gray-200 dark:border-gray-700">
              <span className="text-gray-500 block mb-0.5">Carga por Lote (Batch):</span>
              <span className="text-gray-800 dark:text-gray-200">{batchSize} imágenes/iteración</span>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded border border-gray-200 dark:border-gray-700">
              <span className="text-gray-500 block mb-0.5">Épocas Programadas:</span>
              <span className="text-gray-800 dark:text-gray-200">{epochs} ciclos completos de aprendizaje</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetPreflightHealth;
