import React, { useState } from 'react';
import { 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Eye, 
  Info, 
  FolderArchive, 
  Cpu, 
  Layers, 
  Sliders,
  X,
  FileCheck
} from 'lucide-react';

export interface YamlParsedData {
  model?: string;
  dataPath?: string;
  epochs?: number;
  imgsz?: number;
  batch?: number;
  studyName?: string;
  fitness?: string;
  taskType?: string;
  optimizer?: string;
  lr0?: number;
}

export interface YamlValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
  parsed: YamlParsedData;
}

export const inspectYamlContent = (content: string): YamlValidationResult => {
  const result: YamlValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: [],
    parsed: {}
  };

  if (!content || !content.trim()) {
    result.isValid = false;
    result.errors.push("El archivo está completamente vacío. Por favor, selecciona un archivo YAML con configuración válida.");
    return result;
  }

  const lines = content.split('\n');
  let inTrainBlock = false;
  let inSweeperBlock = false;
  let trainIndent = 0;
  let sweeperIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip empty lines or pure comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = rawLine.search(/\S/);

    // Root-level blocks
    if (indent === 0) {
      inTrainBlock = false;
      inSweeperBlock = false;

      if (/^train\s*:/i.test(trimmed)) {
        inTrainBlock = true;
        trainIndent = 0;
      } else if (/^sweeper\s*:/i.test(trimmed)) {
        inSweeperBlock = true;
        sweeperIndent = 0;
      } else if (/^model\s*:/i.test(trimmed)) {
        const val = trimmed.replace(/^model\s*:\s*/i, '').replace(/["']/g, '').trim();
        result.parsed.model = val;
      } else if (/^(style|type)\s*:/i.test(trimmed)) {
        const val = trimmed.replace(/^(style|type)\s*:\s*/i, '').replace(/["']/g, '').trim();
        result.parsed.taskType = val;
      }
      continue;
    }

    // Inside train block
    if (inTrainBlock) {
      if (/^data\s*:/i.test(trimmed)) {
        const val = trimmed.replace(/^data\s*:\s*/i, '').replace(/["']/g, '').trim();
        result.parsed.dataPath = val;
      } else if (/^epochs\s*:/i.test(trimmed)) {
        const val = parseInt(trimmed.replace(/^epochs\s*:\s*/i, '').trim(), 10);
        if (!isNaN(val)) result.parsed.epochs = val;
      } else if (/^imgsz\s*:/i.test(trimmed)) {
        const val = parseInt(trimmed.replace(/^imgsz\s*:\s*/i, '').trim(), 10);
        if (!isNaN(val)) result.parsed.imgsz = val;
      } else if (/^batch\s*:/i.test(trimmed)) {
        const val = parseInt(trimmed.replace(/^batch\s*:\s*/i, '').trim(), 10);
        if (!isNaN(val)) result.parsed.batch = val;
      } else if (/^optimizer\s*:/i.test(trimmed)) {
        result.parsed.optimizer = trimmed.replace(/^optimizer\s*:\s*/i, '').replace(/["']/g, '').trim();
      } else if (/^lr0\s*:/i.test(trimmed)) {
        const val = parseFloat(trimmed.replace(/^lr0\s*:\s*/i, '').trim());
        if (!isNaN(val)) result.parsed.lr0 = val;
      }
    }

    // Inside sweeper block
    if (inSweeperBlock) {
      if (/^study_name\s*:/i.test(trimmed)) {
        result.parsed.studyName = trimmed.replace(/^study_name\s*:\s*/i, '').replace(/["']/g, '').trim();
      } else if (/^fitness\s*:/i.test(trimmed)) {
        result.parsed.fitness = trimmed.replace(/^fitness\s*:\s*/i, '').replace(/["']/g, '').trim();
      }
    }
  }

  // --- Strict Validation Rules ---
  const hasTrain = lines.some(l => /^[ \t]*train\s*:/i.test(l));
  if (!hasTrain) {
    result.isValid = false;
    result.errors.push("Falta el bloque obligatorio 'train:' en la raíz del YAML. Todo entrenamiento YOLO requiere este bloque.");
  } else if (!result.parsed.dataPath) {
    result.isValid = false;
    result.errors.push("Falta la clave obligatoria 'data:' dentro del bloque 'train:'. Debes indicar la ruta absoluta del dataset en el cluster (ejemplo: 'data: /datasets/MI_DATASET/data.yaml').");
  }

  // Validations & Warnings
  if (result.parsed.dataPath && !result.parsed.dataPath.startsWith('/datasets/')) {
    result.warnings.push(`La ruta del dataset ('${result.parsed.dataPath}') no comienza por '/datasets/'. Asegúrate de que corresponda al montaje Samba/CIFS compartido.`);
  }

  if (!result.parsed.model) {
    result.info.push("No se ha definido 'model:'. Se asignará automáticamente el modelo por defecto 'yolo11n.pt'.");
  }

  if (result.parsed.epochs === undefined) {
    result.info.push("No se ha definido 'epochs:' en 'train:'. Se usarán 5 épocas por defecto.");
  }

  if (!result.parsed.studyName) {
    result.info.push("No se definió 'sweeper.study_name'. La plataforma asignará un identificador automático.");
  }

  return result;
};

interface YamlFileInspectorProps {
  fileName: string;
  fileSize: number;
  rawContent: string;
  onClearFile: () => void;
}

export const YamlFileInspector: React.FC<YamlFileInspectorProps> = ({
  fileName,
  fileSize,
  rawContent,
  onClearFile
}) => {
  const [showRawCode, setShowRawCode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const diag = inspectYamlContent(rawContent);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = rawContent.split('\n');

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4 animate-fade-in">
      {/* File Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
            diag.isValid 
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50' 
              : 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50'
          }`}>
            <FileCode size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[220px] sm:max-w-md">
                {fileName}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                {(fileSize / 1024).toFixed(1)} KB
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                diag.isValid
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:border-red-800'
              }`}>
                {diag.isValid ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                {diag.isValid ? 'YAML Válido' : 'YAML Inválido'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {diag.isValid 
                ? 'Estructura verificada: claves obligatorias presentes para el motor YOLO.' 
                : 'El archivo presenta inconsistencias estructurales que impiden el despliegue.'}
            </p>
          </div>
        </div>

        {/* Change / Replace Action */}
        <button
          type="button"
          onClick={onClearFile}
          className="text-xs text-gray-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-950/30 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors self-start sm:self-center shrink-0"
          title="Quitar este archivo para cargar otro YAML"
        >
          <X size={13} />
          <span>Reemplazar archivo</span>
        </button>
      </div>

      {/* Validation Diagnostic Status Card */}
      {!diag.isValid && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400">
            <XCircle size={16} />
            <span>¿Por qué tu archivo YAML no sirve para entrenar?</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs text-red-600 dark:text-red-300">
            {diag.errors.map((err, idx) => (
              <li key={idx} className="leading-relaxed">{err}</li>
            ))}
          </ul>
          <div className="pt-2 border-t border-red-200 dark:border-red-900/40 text-[11px] text-red-500 dark:text-red-400">
            💡 <strong>Solución rápida:</strong> Puedes hacer clic en <em>"Reemplazar archivo"</em> y usar el <strong>Asistente Guiado (W-Darwin Studio)</strong> para generar una configuración garantizada con 1 clic.
          </div>
        </div>
      )}

      {/* Extracted Parameters Grid */}
      {diag.isValid && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
            Parámetros Detectados en tu Archivo
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700/60">
              <span className="text-[10px] text-gray-400 block">Modelo Base:</span>
              <strong className="font-mono text-gray-900 dark:text-white truncate block">
                {diag.parsed.model || 'yolo11n.pt (defecto)'}
              </strong>
            </div>

            <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700/60">
              <span className="text-[10px] text-gray-400 block">Épocas de Entrenamiento:</span>
              <strong className="font-mono text-gray-900 dark:text-white block">
                {diag.parsed.epochs ?? 5} épocas
              </strong>
            </div>

            <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700/60">
              <span className="text-[10px] text-gray-400 block">Resolución (imgsz):</span>
              <strong className="font-mono text-gray-900 dark:text-white block">
                {diag.parsed.imgsz || 640} px
              </strong>
            </div>

            <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700/60">
              <span className="text-[10px] text-gray-400 block">Estudio Sweeper:</span>
              <strong className="font-mono text-indigo-600 dark:text-indigo-400 truncate block">
                {diag.parsed.studyName || 'Trial Único'}
              </strong>
            </div>
          </div>

          <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <FolderArchive size={14} className="text-blue-500 shrink-0" />
              <span className="text-gray-500 text-[11px]">Ruta Dataset:</span>
              <strong className="font-mono text-blue-900 dark:text-blue-200 truncate text-[11px]">
                {diag.parsed.dataPath}
              </strong>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0 ml-2">
              ✓ Especificado
            </span>
          </div>
        </div>
      )}

      {/* Warnings & Notices */}
      {diag.warnings.length > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400">
            <AlertTriangle size={14} />
            <span>Advertencias:</span>
          </div>
          {diag.warnings.map((w, i) => (
            <p key={i} className="text-amber-700 dark:text-amber-300 text-[11px] leading-relaxed pl-5">{w}</p>
          ))}
        </div>
      )}

      {/* Code Inspector Collapsible */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowRawCode(!showRawCode)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
          >
            {showRawCode ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showRawCode ? 'Ocultar código del archivo YAML' : `Inspeccionar contenido del YAML (${lines.length} líneas)`}
          </button>

          {showRawCode && (
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              {copied ? 'Copiado' : 'Copiar YAML'}
            </button>
          )}
        </div>

        {showRawCode && (
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-950 text-gray-200 font-mono text-[11px]">
            <div className="p-3 overflow-x-auto max-h-64 leading-relaxed space-y-0.5">
              {lines.map((line, idx) => (
                <div key={idx} className="flex gap-3 hover:bg-white/5 px-1 rounded">
                  <span className="text-gray-600 select-none text-right w-6 shrink-0">{idx + 1}</span>
                  <span className={line.trim().startsWith('#') ? 'text-gray-500 italic' : line.includes(':') ? 'text-blue-300' : 'text-gray-100'}>
                    {line}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YamlFileInspector;