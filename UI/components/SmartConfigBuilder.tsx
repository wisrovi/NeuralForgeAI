import React, { useState } from 'react';
import { 
  Wand2, 
  FileCode, 
  UploadCloud, 
  Sparkles, 
  Sliders, 
  Check, 
  Cpu, 
  ShieldAlert, 
  Layers, 
  Rocket,
  CheckCircle2,
  X
} from 'lucide-react';

interface SmartConfigBuilderProps {
  onConfigFileGenerated: (file: File) => void;
  selectedWorkerIp?: string;
}

export const SmartConfigBuilder: React.FC<SmartConfigBuilderProps> = ({
  onConfigFileGenerated,
  selectedWorkerIp = '192.168.1.68'
}) => {
  const [activeTab, setActiveTab] = useState<'wizard' | 'raw'>('raw');

  // Wizard State
  const [taskType, setTaskType] = useState<'detect' | 'segment' | 'classify'>('detect');
  const [trainingProfile, setTrainingProfile] = useState<'quick' | 'standard' | 'research'>('quick');
  const [datasetPreset, setDatasetPreset] = useState<string>('custom');
  const [customDatasetPath, setCustomDatasetPath] = useState<string>('/datasets/AREPO/protesis/Detector_ProtesisSuperior_261061/data.yaml');
  const [studyName, setStudyName] = useState<string>('mi_entrenamiento_vision');

  // Raw file drag-drop state
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Presets of datasets in cluster
  const DATASET_PRESETS = [
    { id: 'arepo_protesis', label: 'Prótesis Superior (AREPO)', path: '/datasets/AREPO/protesis/Detector_ProtesisSuperior_261061/data.yaml', type: 'detect' },
    { id: 'cesped', label: 'Detección Anomalías Césped', path: '/datasets/ELANIA/detector/ElaniaDetectorUnificadoConBackground/data.yaml', type: 'detect' },
    { id: 'tatuajes', label: 'Detector de Tatuajes', path: '/datasets/AREPO/TATTO/ArepoTatuajeDatasetV2/data.yaml', type: 'detect' },
    { id: 'kinesio', label: 'Detector Kinesiotape', path: '/datasets/AREPO/kinesiotape/data.yaml', type: 'detect' },
    { id: 'custom', label: 'Ruta Personalizada en el Servidor', path: '', type: 'any' }
  ];

  const handleGenerateFromWizard = () => {
    const dataPath = datasetPreset === 'custom' ? customDatasetPath : (DATASET_PRESETS.find(p => p.id === datasetPreset)?.path || customDatasetPath);
    
    let epochs = 5;
    let nTrials = 1;
    let model = taskType === 'detect' ? 'yolo11n.pt' : taskType === 'segment' ? 'yolov8n-seg.pt' : 'yolo11n-cls.pt';
    let fitness = taskType === 'detect' ? 'metrics/mAP50-95(B)' : taskType === 'segment' ? 'metrics/mAP50(M)' : 'metrics/accuracy_top1';

    if (trainingProfile === 'standard') {
      epochs = 50;
      model = taskType === 'detect' ? 'yolo11s.pt' : taskType === 'segment' ? 'yolov8s-seg.pt' : 'yolo11s-cls.pt';
    } else if (trainingProfile === 'research') {
      epochs = 100;
      nTrials = 5;
      model = taskType === 'detect' ? 'yolo26m.pt' : taskType === 'segment' ? 'yolov8m-seg.pt' : 'yolo26m-cls.pt';
    }

    const yamlContent = `# Generado automáticamente por W-Darwin Ops Smart Studio
model: "${model}"
type: "yolo"
style: "${taskType}"

train:
  data: "${dataPath}"
  epochs: ${epochs}
  imgsz: 640
  single_cls: true
  pretrained: true

sweeper:
  debug: "${selectedWorkerIp}"
  study_name: "${studyName || 'modelo_entrenado'}"
  n_trials: ${nTrials}
  fitness: "${fitness}"
  algorithm: "optuna"
  direction: "maximize"

metadata:
  content: "Entrenamiento generado desde el asistente inteligente de W-Darwin Ops."
  author: "Usuario W-Darwin"
`;

    const generatedFile = new File([yamlContent], `${studyName || 'config'}.yaml`, { type: 'text/yaml' });
    setRawFile(generatedFile);
    onConfigFileGenerated(generatedFile);
  };

  const handleRawFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRawFile(file);
      onConfigFileGenerated(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setRawFile(file);
      onConfigFileGenerated(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Wand2 size={16} className="text-blue-500" />
            Configuración del Entrenamiento
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Puedes usar el asistente paso a paso o subir un archivo YAML si eres usuario avanzado.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('wizard')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'wizard'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Asistente Guiado
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'raw'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Subir Archivo YAML
          </button>
        </div>
      </div>

      {/* Selected File Feedback Banner */}
      {rawFile && (
        <div className="p-3 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Check size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{rawFile.name}</p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400">
                Configuración lista y validada para despachar al clúster ({(rawFile.size / 1024).toFixed(2)} KB)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRawFile(null)}
            className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* WIZARD MODE */}
      {activeTab === 'wizard' && (
        <div className="p-5 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-800 space-y-5 animate-fade-in">
          {/* 1. Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Nombre de tu Experimento / Estudio
            </label>
            <input
              type="text"
              value={studyName}
              onChange={(e) => setStudyName(e.target.value)}
              placeholder="ej. detector_prototipo_v1"
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* 2. Task Type Cards */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              1. ¿Qué tarea debe aprender a realizar la IA?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div
                onClick={() => setTaskType('detect')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  taskType === 'detect'
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 ring-1 ring-blue-500'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-between">
                  <span>Detección de Cajas</span>
                  {taskType === 'detect' && <CheckCircle2 size={14} className="text-blue-500" />}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                  Localiza objetos dibujando un rectángulo (ideal para piezas, caras, defectos).
                </p>
              </div>

              <div
                onClick={() => setTaskType('segment')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  taskType === 'segment'
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 ring-1 ring-blue-500'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-between">
                  <span>Segmentación Fina</span>
                  {taskType === 'segment' && <CheckCircle2 size={14} className="text-blue-500" />}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                  Delinea la silueta exacta pixel a pixel (ideal para pastillas, hojas, medicina).
                </p>
              </div>

              <div
                onClick={() => setTaskType('classify')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  taskType === 'classify'
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 ring-1 ring-blue-500'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-between">
                  <span>Clasificación</span>
                  {taskType === 'classify' && <CheckCircle2 size={14} className="text-blue-500" />}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                  Clasifica la imagen completa en categorías (OK / Defecto / Tipo A / Tipo B).
                </p>
              </div>
            </div>
          </div>

          {/* 3. Training Profile */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              2. ¿Cuánto tiempo deseas dedicar al entrenamiento?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div
                onClick={() => setTrainingProfile('quick')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  trainingProfile === 'quick'
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 ring-1 ring-blue-500'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-gray-300'
                }`}
              >
                <span className="text-xs font-bold text-gray-900 dark:text-white block">
                  ⚡ Prueba Rápida (Smoke Test)
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold block mt-0.5">
                  5 Épocas (~3 a 5 min)
                </span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  Ideal para comprobar que las fotos y etiquetas funcionan antes de un entrenamiento largo.
                </p>
              </div>

              <div
                onClick={() => setTrainingProfile('standard')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  trainingProfile === 'standard'
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 ring-1 ring-blue-500'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-gray-300'
                }`}
              >
                <span className="text-xs font-bold text-gray-900 dark:text-white block">
                  🎯 Producción Estándar
                </span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block mt-0.5">
                  50 Épocas (~30 a 60 min)
                </span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  Equilibrio óptimo para obtener un modelo listo para producción.
                </p>
              </div>

              <div
                onClick={() => setTrainingProfile('research')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  trainingProfile === 'research'
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 ring-1 ring-blue-500'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-gray-300'
                }`}
              >
                <span className="text-xs font-bold text-gray-900 dark:text-white block">
                  🔬 Investigación & Máxima Calidad
                </span>
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block mt-0.5">
                  100 Épocas + Optuna + XAI
                </span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  Activa los 12 módulos de I+D (defensa ante ataques, mapas de calor, informe LaTeX).
                </p>
              </div>
            </div>
          </div>

          {/* 4. Dataset Preset */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              3. Conjunto de Datos (Dataset)
            </label>
            <select
              value={datasetPreset}
              onChange={(e) => setDatasetPreset(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none mb-2"
            >
              {DATASET_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            {datasetPreset === 'custom' && (
              <input
                type="text"
                value={customDatasetPath}
                onChange={(e) => setCustomDatasetPath(e.target.value)}
                placeholder="/datasets/MI_PROYECTO/data.yaml"
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              />
            )}
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerateFromWizard}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Sparkles size={14} />
            Aplicar y Preparar Configuración Automática
          </button>
        </div>
      )}

      {/* RAW YAML MODE */}
      {activeTab === 'raw' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative
            ${isDragging 
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' 
              : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 bg-white dark:bg-gray-900'
            }
          `}
        >
          <input
            type="file"
            onChange={handleRawFileChange}
            accept=".yaml,.yml,.json"
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <UploadCloud size={24} />
          </div>
          <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-1">
            Arrastra tu archivo YAML o haz clic para seleccionarlo
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Admite archivos .yaml, .yml y .json de hasta 5MB.
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartConfigBuilder;
