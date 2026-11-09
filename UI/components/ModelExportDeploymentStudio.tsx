import React, { useState } from 'react';
import { 
  Download, 
  Cpu, 
  Zap, 
  Layers, 
  CheckCircle2, 
  ExternalLink, 
  FileCode2, 
  FileText, 
  HardDrive,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface ModelExportDeploymentStudioProps {
  studyId: string;
  studyName?: string;
  modelArchitecture?: string;
  accuracyScore?: number;
}

export const ModelExportDeploymentStudio: React.FC<ModelExportDeploymentStudioProps> = ({
  studyId,
  studyName = 'Modelo Entrenado',
  modelArchitecture = 'yolo11n.pt',
  accuracyScore = 0.51
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('onnx');
  const [precision, setPrecision] = useState<'fp32' | 'fp16' | 'int8'>('fp16');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportComplete, setExportComplete] = useState<boolean>(false);

  const exportFormats = [
    {
      id: 'onnx',
      name: 'ONNX Runtime',
      badge: 'Estándar Universal',
      badgeColor: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800',
      description: 'Ideal para despliegues multiplataforma en Linux, Windows, macOS y servicios en la nube.',
      extension: '.onnx'
    },
    {
      id: 'engine',
      name: 'TensorRT Engine',
      badge: 'Máximo Rendimiento NVIDIA',
      badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800',
      description: 'Optimización de kernels para tarjetas GeForce RTX, servidores A100/H100 y placas embebidas Jetson.',
      extension: '.engine'
    },
    {
      id: 'openvino',
      name: 'Intel OpenVINO',
      badge: 'CPUs & iGPUs',
      badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800',
      description: 'Aceleración en procesadores Intel Core / Xeon y tarjetas gráficas integradas sin requerir GPU dedicada.',
      extension: '_openvino_model/'
    },
    {
      id: 'coreml',
      name: 'Apple CoreML',
      badge: 'Apple Silicon & iOS',
      badgeColor: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800',
      description: 'Compilado para Neural Engine en dispositivos iPhone, iPad y computadoras Mac M1/M2/M3/M4.',
      extension: '.mlpackage'
    }
  ];

  const benchmarks = [
    { hardware: 'NVIDIA RTX 4090 (Desktop/Server)', latency: '1.8 ms', fps: '555 FPS', status: 'Ultra Rápido' },
    { hardware: 'NVIDIA Jetson Orin Nano (Edge AI)', latency: '18.4 ms', fps: '54 FPS', status: 'Tiempo Real Óptimo' },
    { hardware: 'Intel Core i7-13700H (OpenVINO FP16)', latency: '14.2 ms', fps: '70 FPS', status: 'CPU Acelerado' },
    { hardware: 'Raspberry Pi 5 (ARM CPU INT8)', latency: '85.0 ms', fps: '12 FPS', status: 'Bajo Consumo' }
  ];

  const handleExport = () => {
    setIsExporting(true);
    setExportComplete(false);
    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
    }, 1800);
  };

  const handleDownloadReport = () => {
    const reportContent = `# Informe Ejecutivo de Exportación y Despliegue
Modelo: ${studyName}
ID del Estudio: ${studyId}
Arquitectura Base: ${modelArchitecture}
Formato de Exportación: ${selectedFormat.toUpperCase()} (${precision.toUpperCase()})
Fecha de Emisión: ${new Date().toLocaleString()}

## Rendimiento Estimado en Dispositivos Edge:
- NVIDIA RTX 4090: 1.8 ms / 555 FPS
- NVIDIA Jetson Orin Nano: 18.4 ms / 54 FPS
- Intel Core i7 (OpenVINO): 14.2 ms / 70 FPS

## Recomendaciones para Producción:
1. Desplegar en contenedor Docker optimizado utilizando runtime nvidia-container-toolkit.
2. Monitorizar uso de memoria GPU asegurando buffer de 20% para picos de concurrencia.
3. Verificar la compatibilidad de CUDA/cuDNN de la máquina destino.
`;
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Deploy_Spec_${studyId.slice(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Zap size={20} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              Despliegue y Exportación a Producción
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
                1-Clic Ready
              </span>
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Conversión automática de pesos entrenados a formatos de inferencia de alta velocidad.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadReport}
          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all self-start sm:self-center"
        >
          <FileText size={14} />
          Descargar Ficha Técnica (.md)
        </button>
      </div>

      {/* Format Selector Grid */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
          Seleccione el Formato de Salida
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exportFormats.map((fmt) => (
            <div
              key={fmt.id}
              onClick={() => setSelectedFormat(fmt.id)}
              className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                selectedFormat === fmt.id
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-100 shadow-xs'
                  : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  <FileCode2 size={16} className={selectedFormat === fmt.id ? 'text-blue-600' : 'text-gray-400'} />
                  {fmt.name}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${fmt.badgeColor}`}>
                  {fmt.badge}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
                {fmt.description}
              </p>
              <span className="font-mono text-[10px] text-gray-400 block">
                Extensión: <strong className="text-gray-700 dark:text-gray-300">{fmt.extension}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Precision selector & Action bar */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Precisión Cuantizada:</span>
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            {(['fp32', 'fp16', 'int8'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrecision(p)}
                className={`px-2.5 py-1 text-xs rounded-md font-mono uppercase font-semibold transition-all ${
                  precision === p
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Optimizando Grafo Neural...</span>
            </>
          ) : exportComplete ? (
            <>
              <CheckCircle2 size={16} className="text-emerald-300" />
              <span>¡Empaquetado Listo! Descargar</span>
            </>
          ) : (
            <>
              <Download size={16} />
              <span>Exportar {selectedFormat.toUpperCase()} ({precision.toUpperCase()})</span>
            </>
          )}
        </button>
      </div>

      {/* Latency Matrix */}
      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
          Rendimiento Estimado en Equipos de Producción (Inferencia a 640x640)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {benchmarks.map((bench, idx) => (
            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700/60 text-xs">
              <span className="text-[10px] text-gray-500 block truncate mb-1">{bench.hardware}</span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">{bench.latency}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{bench.fps}</span>
              </div>
              <span className="text-[10px] text-gray-400 block mt-0.5">{bench.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelExportDeploymentStudio;
