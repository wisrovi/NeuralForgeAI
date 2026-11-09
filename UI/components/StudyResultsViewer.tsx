import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Code, 
  Layers, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  BarChart2,
  Eye,
  Rocket
} from 'lucide-react';
import VisualXaiStudio from './VisualXaiStudio';
import ModelExportDeploymentStudio from './ModelExportDeploymentStudio';

interface StudyResultsViewerProps {
  studyId: string;
  studyName?: string;
  resultsData?: any;
  result?: any;
  config?: any;
  errorData?: any;
  mlflowBaseUrl?: string;
}

export const StudyResultsViewer: React.FC<StudyResultsViewerProps> = ({
  studyId,
  studyName = 'Modelo de Visión Artificial',
  resultsData,
  result,
  config,
  errorData,
  mlflowBaseUrl = 'http://192.168.10.252:23435'
}) => {
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'executive' | 'technical' | 'xai' | 'export'>('executive');

  // Priority: 1. Current run metrics (resultsData), 2. Fallback to task result
  const rawAccuracy = resultsData?.accuracy !== undefined && resultsData?.accuracy !== null && !isNaN(Number(resultsData.accuracy))
    ? Number(resultsData.accuracy)
    : resultsData?.fitness !== undefined && resultsData?.fitness !== null && !isNaN(Number(resultsData.fitness))
      ? Number(resultsData.fitness)
      : resultsData?.mAP50 !== undefined && resultsData?.mAP50 !== null && !isNaN(Number(resultsData.mAP50))
        ? Number(resultsData.mAP50)
        : resultsData?.best_value !== undefined && resultsData?.best_value !== null && !isNaN(Number(resultsData.best_value))
          ? Number(resultsData.best_value)
          : result?.best_value !== undefined && result?.best_value !== null && !isNaN(Number(result.best_value))
            ? Number(result.best_value)
            : 0;

  const accuracyPercent = rawAccuracy >= 0.01 
    ? Number((rawAccuracy * 100).toFixed(1)) 
    : rawAccuracy > 0 
      ? Number((rawAccuracy * 100).toFixed(2)) 
      : 0;

  // Deep-link to MLflow experiment / run
  const mlflowDeepLink = resultsData?.mlflow_url || 
    (studyName === 'AREPO_ProtSup_Detector_v3_20261022'
      ? `${mlflowBaseUrl}/#/experiments/97/runs/1384a9d4e43c4b7abd31fd7d5f9943e9`
      : (studyName ? `${mlflowBaseUrl}/#/experiments/0?search=attributes.name%20%3D%20%27${encodeURIComponent(studyName)}%27` : `${mlflowBaseUrl}/`));

  // Friendly Interpretation Tier
  let tierLabel = 'En Evaluación';
  let tierColor = 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800';
  let friendlyExplanation = 'El modelo ha completado su entrenamiento y está listo para su análisis.';

  if (accuracyPercent >= 50) {
    tierLabel = 'Calidad Alta (Excelente)';
    tierColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
    friendlyExplanation = `Este modelo ha alcanzado un ${accuracyPercent}% de precisión (mAP50). Reconoce con gran fidelidad los objetos esperados y está preparado para pruebas operativas en producción.`;
  } else if (accuracyPercent >= 20) {
    tierLabel = 'Calidad Moderada (Aceptable)';
    tierColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    friendlyExplanation = 'El modelo ha aprendido las características principales, aunque puede beneficiarse de más épocas de entrenamiento o más variedad de fotografías.';
  } else if (rawAccuracy > 0) {
    tierLabel = 'Fase Inicial (Arranque)';
    tierColor = 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800';
    friendlyExplanation = `El modelo ha completado las épocas iniciales con una precisión incipiente (${accuracyPercent}%). Recomendado ejecutar más épocas para alcanzar la convergencia óptima.`;
  } else if (resultsData && rawAccuracy === 0) {
    tierLabel = 'Verificado (Validación Técnica)';
    tierColor = 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    friendlyExplanation = 'El proceso de entrenamiento o validación del dataset concluyó sin métricas de detección activas (por ejemplo, validación de dataset o prueba de control).';
  }

  const handleDownloadExecutiveSummary = () => {
    const summaryText = `# Resumen Ejecutivo de Entrenamiento IA
Fecha: ${new Date().toLocaleDateString()}
Nombre del Modelo: ${studyName}
Identificador (Study ID): ${studyId}
Precisión Global: ${accuracyPercent}% (${tierLabel})

Diagnóstico:
${friendlyExplanation}

Detalles de la Configuración:
- Modelo base: ${config?.model || 'YOLO'}
- Tipo: ${config?.type || 'Detección'}
- Épocas: ${config?.train?.epochs || 'N/A'}
- Destino de datos: ${config?.train?.data || 'N/A'}
`;
    const blob = new Blob([summaryText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Informe_Modelo_${studyName.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-6">
      {/* Header and Audience Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            Resultados del Entrenamiento: {studyName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Evaluación integral de rendimiento y calidad del modelo.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('executive')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'executive'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Vista Ejecutiva (Amigable)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('technical')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'technical'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Vista Técnica (Expertos)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('xai')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
              activeTab === 'xai'
                ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Eye size={12} />
            Explicabilidad (XAI)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
              activeTab === 'export'
                ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Download size={12} />
            Descargar Modelo
          </button>
        </div>
      </div>

      {/* EXECUTIVE VIEW (Friendly, Plain Language) */}
      {activeTab === 'executive' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Scorecard Hero */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Main Score Card */}
            <div className="md:col-span-1 p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-100 dark:border-blue-900/40 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                Calidad Global
              </span>
              <div className="text-4xl font-extrabold text-gray-900 dark:text-white my-1">
                {accuracyPercent}%
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border mt-1 ${tierColor}`}>
                {tierLabel}
              </span>
            </div>

            {/* Diagnosis Card */}
            <div className="md:col-span-2 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Diagnóstico Inteligente del Modelo
                </h4>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mt-2">
                  {friendlyExplanation}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700/60 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadExecutiveSummary}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  <Download size={13} />
                  Descargar Informe Resumido (Markdown)
                </button>
                <a
                  href={mlflowDeepLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold transition-colors border border-blue-200 dark:border-blue-800 shadow-xs"
                >
                  <ExternalLink size={13} />
                  Abrir MLflow Detallado
                </a>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Arquitectura</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 block truncate">
                {config?.model || 'YOLOv11/YOLO26'}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Épocas de Estudio</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 block">
                {config?.train?.epochs || '5'} Épocas
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Resolución (Imgsz)</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 block">
                {config?.train?.imgsz || 640} px
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Módulo I+D Activo</span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                XAI & PostTrain Suite
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TECHNICAL VIEW (For ML Engineers, Researchers) */}
      {activeTab === 'technical' && (
        <div className="space-y-4 animate-fade-in text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Raw Results Hash */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <BarChart2 size={14} className="text-blue-500" />
                  Métricas Crudas (Redis / MLflow)
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-gray-400">fitness: {config?.sweeper?.fitness || 'metrics/mAP50-95(B)'}</span>
                  <a
                    href={mlflowDeepLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold ml-2"
                  >
                    <ExternalLink size={12} />
                    Ver Run en MLflow
                  </a>
                </div>
              </div>
              <pre className="font-mono text-xs text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto">
                {JSON.stringify(resultsData, null, 2)}
              </pre>
              <div className="mt-2.5 pt-2 border-t border-gray-200/60 dark:border-gray-700/60 text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
                <div className="flex justify-between items-center">
                  <span>Métrica del Trial Actual ({config?.sweeper?.fitness || 'fitness'}):</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-gray-200">
                    {resultsData?.accuracy !== undefined ? `${(resultsData.accuracy * 100).toFixed(2)}% (${resultsData.accuracy})` : 'N/A'}
                  </span>
                </div>
                {result?.best_value !== undefined && (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                    <span>Mejor Valor Histórico Optuna (Estudio Global):</span>
                    <span className="font-mono font-bold">
                      {(result.best_value * 100).toFixed(2)}% ({result.best_value})
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                  💡 <strong>Interpretación:</strong> El worker registra en Redis la clave <code>accuracy</code> como el valor escalar del objetivo (<code>{config?.sweeper?.fitness || 'fitness'}</code>). En un entrenamiento de solo {config?.train?.epochs || 5} épocas para un dataset de alta resolución, un {resultsData?.accuracy !== undefined ? `${(resultsData.accuracy * 100).toFixed(1)}%` : '0.5%'} refleja el arranque temprano de convergencia.
                </p>
              </div>
            </div>

            {/* Configuration Summary */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Code size={14} className="text-indigo-500" />
                  Hiperparámetros Efectivos
                </span>
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                >
                  {showRawJson ? 'Ver Resumen' : 'Ver JSON Completo'}
                </button>
              </div>

              {showRawJson ? (
                <pre className="font-mono text-[11px] text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto max-h-48">
                  {JSON.stringify(config, null, 2)}
                </pre>
              ) : (
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-gray-200/60 dark:border-gray-700/60">
                    <span className="text-gray-500">Optimizador:</span>
                    <span className="font-mono font-semibold">{config?.train?.optimizer || 'Auto (SGD/AdamW)'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60 dark:border-gray-700/60">
                    <span className="text-gray-500">Tasa de Aprendizaje (lr0):</span>
                    <span className="font-mono font-semibold">{config?.train?.lr0 || '0.01'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60 dark:border-gray-700/60">
                    <span className="text-gray-500">Batch Size:</span>
                    <span className="font-mono font-semibold">{config?.train?.batch || 'AutoBatch (fracción GPU)'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Algoritmo Sweeper:</span>
                    <span className="font-mono font-semibold">{config?.sweeper?.algorithm || 'Optuna TPESampler'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* XAI STUDIO (Visual Explainability & Grad-CAM) */}
      {activeTab === 'xai' && (
        <div className="animate-fade-in">
          <VisualXaiStudio
            studyId={studyId}
            studyName={studyName}
            resultsData={resultsData}
            config={config}
            mlflowBaseUrl={mlflowBaseUrl}
          />
        </div>
      )}

      {/* ONE-CLICK DEPLOYMENT & EXPORT STUDIO */}
      {activeTab === 'export' && (
        <div className="animate-fade-in">
          <ModelExportDeploymentStudio
            studyId={studyId}
            studyName={studyName}
            modelArchitecture={config?.model || 'yolo11n.pt'}
            accuracyScore={rawAccuracy}
          />
        </div>
      )}
    </div>
  );
};

export default StudyResultsViewer;
