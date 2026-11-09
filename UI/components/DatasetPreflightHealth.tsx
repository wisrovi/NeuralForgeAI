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
  Sparkles,
  FolderArchive
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

  if (!dataPath || !dataPath.trim()) {
    return null;
  }

  const cleanPath = dataPath.trim();
  const lowerPath = cleanPath.toLowerCase();
  const normPath = cleanPath.replace(/\\/g, '/').replace(/\/$/, '');

  // Pre-flight automated checks based on official server validation (api/utils/preflight.py)
  const isCifsMounted = cleanPath.startsWith('/datasets/') || cleanPath.startsWith('//');
  const hasYamlExt = lowerPath.endsWith('.yaml') || lowerPath.endsWith('.yml');
  const isSegmentModel = modelName.includes('-seg') || modelName.includes('seg');

  // Check placeholders (<path/to/...>, YOUR_DATASET, etc.)
  const hasPlaceholder = (cleanPath.startsWith('<') && cleanPath.endsWith('>')) 
    || cleanPath.includes('path/to/') 
    || cleanPath.includes('YOUR_DATASET') 
    || ['todo', 'dummy', 'undefined', 'null'].includes(lowerPath);

  // Check invalid extensions (.jpg, .png, .pt, etc.)
  const invalidExts = ['.txt', '.csv', '.png', '.jpg', '.jpeg', '.json', '.pt', '.pth', '.onnx', '.py'];
  const hasInvalidExt = invalidExts.some(ext => lowerPath.endsWith(ext));

  // Check overly generic root
  const isTooGeneric = normPath === '/datasets' || normPath === '/datasets/data.yaml' || normPath === '/datasets/dataset.yaml';

  let healthScore = 100;
  let statusTier = 'Verificado';
  let statusColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
  let summaryMessage = 'Descriptor del dataset conforme a las normas de validación pre-vuelo de NeuralForge.';
  const issues: { type: 'warning' | 'info' | 'error'; message: string; suggestion: string }[] = [];

  if (hasPlaceholder) {
    healthScore = 20;
    statusTier = 'Placeholder Detectado';
    statusColor = 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
    summaryMessage = 'La ruta contiene marcadores de posición sin configurar que serán rechazados por el servidor.';
    issues.push({
      type: 'error',
      message: 'Ruta no configurada (contiene texto de plantilla).',
      suggestion: 'Reemplaza el marcador de posición por la ruta absoluta real de tu dataset en el cluster.'
    });
  } else if (hasInvalidExt) {
    healthScore = 30;
    statusTier = 'Extensión Inválida';
    statusColor = 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
    summaryMessage = 'La ruta especificada no apunta a un descriptor YAML válido.';
    issues.push({
      type: 'error',
      message: 'Extensión de archivo no admitida para la clave data.',
      suggestion: 'La clave train.data debe apuntar a un descriptor .yaml / .yml o a la carpeta raíz del dataset estructurado.'
    });
  } else if (isTooGeneric) {
    healthScore = 50;
    statusTier = 'Ruta Demasiado Genérica';
    statusColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    summaryMessage = 'La ruta apunta directamente a /datasets sin especificar el subdirectorio del proyecto.';
    issues.push({
      type: 'warning',
      message: 'Falta subcarpeta de proyecto en /datasets.',
      suggestion: 'Especifica la ruta completa incluyendo el proyecto (ejemplo: /datasets/MI_PROYECTO/data.yaml).'
    });
  } else if (!isCifsMounted) {
    healthScore = 75;
    statusTier = 'Ruta Fuera de /datasets';
    statusColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    summaryMessage = 'La ruta no se encuentra bajo el punto de montaje estándar /datasets/.';
    issues.push({
      type: 'warning',
      message: 'Ruta fuera de /datasets/.',
      suggestion: 'Asegúrate de que la ruta esté accesible en el sistema de archivos de los workers GPU.'
    });
  } else if (!hasYamlExt) {
    healthScore = 90;
    statusTier = 'Directorio de Dataset';
    statusColor = 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800';
    summaryMessage = 'La ruta apunta a un directorio. El worker buscará automáticamente data.yaml en su interior.';
    issues.push({
      type: 'info',
      message: 'Directorio seleccionado para auto-descubrimiento.',
      suggestion: 'Se espera encontrar un archivo data.yaml dentro del directorio indicado.'
    });
  } else {
    issues.push({
      type: 'info',
      message: 'Ruta y descriptor completamente validados.',
      suggestion: `Descriptor: ${cleanPath.split('/').pop()} localizado en volumen compartido.`
    });
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4 animate-fade-in">
      {/* Header */}
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
              Verificación preventiva de la ruta especificada en tu archivo YAML.
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

      {/* Summary Banner */}
      <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-lg text-xs flex items-start gap-2.5">
        <Sparkles size={16} className="text-indigo-500 shrink-0 mt-0.5" />
        <span className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
          {summaryMessage}
        </span>
      </div>

      {/* Issues or Status Messages */}
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
                  : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {issue.type === 'error' ? (
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              ) : issue.type === 'warning' ? (
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
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
              <span className="text-gray-800 dark:text-gray-200 break-all font-semibold">{cleanPath}</span>
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
              <span className="text-gray-800 dark:text-gray-200">{epochs} ciclos completos</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetPreflightHealth;