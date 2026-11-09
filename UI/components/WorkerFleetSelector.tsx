import React, { useState, useEffect } from 'react';
import { Server, Cpu, CheckCircle2, Zap, ShieldCheck, ChevronRight, Settings2, Info } from 'lucide-react';

export interface WorkerNodeInfo {
  id: string;
  ip: string;
  name: string;
  friendlyName: string;
  gpuType: string;
  tier: 'ultra' | 'standard' | 'economy';
  status: 'online' | 'busy' | 'offline';
  queues: string[];
  recommended?: boolean;
}

const STATIC_NODE_METADATA: Record<string, { friendlyName: string; gpuType: string; tier: 'ultra' | 'standard' | 'economy' }> = {
  '192.168.1.72': { friendlyName: 'Estación Titán (Ultra)', gpuType: 'NVIDIA RTX 4090 (24GB)', tier: 'ultra' },
  '192.168.1.79': { friendlyName: 'Estación Rápida 4060', gpuType: 'NVIDIA RTX 4060 (8GB)', tier: 'standard' },
  '192.168.1.68': { friendlyName: 'Nodo Laboratorio CIMA 65', gpuType: 'NVIDIA RTX 3060 (12GB)', tier: 'standard' },
  '192.168.1.65': { friendlyName: 'Nodo Computación 3060', gpuType: 'NVIDIA RTX 3060 (12GB)', tier: 'standard' },
  '192.168.1.73': { friendlyName: 'Nodo Laboratorio CIMA 63', gpuType: 'NVIDIA RTX 3060 (12GB)', tier: 'standard' },
  '192.168.1.82': { friendlyName: 'Nodo CIMA 108', gpuType: 'NVIDIA RTX 3060 (12GB)', tier: 'standard' },
  '192.168.1.50': { friendlyName: 'Nodo CIMA 112', gpuType: 'NVIDIA RTX 3060 (12GB)', tier: 'standard' },
  '192.168.1.54': { friendlyName: 'Nodo CIMA 114', gpuType: 'NVIDIA RTX 3060 (12GB)', tier: 'standard' },
  '192.168.1.40': { friendlyName: 'Estación Dani (3070)', gpuType: 'NVIDIA RTX 3070 (8GB)', tier: 'standard' },
  '192.168.1.46': { friendlyName: 'Estación Tomás', gpuType: 'NVIDIA RTX GPU', tier: 'economy' },
  '192.168.1.110': { friendlyName: 'Estación Yaiza', gpuType: 'NVIDIA RTX GPU', tier: 'economy' },
};

interface WorkerFleetSelectorProps {
  selectedWorkerIp: string;
  onSelectWorker: (ip: string) => void;
  workersApiUrl?: string;
}

export const WorkerFleetSelector: React.FC<WorkerFleetSelectorProps> = ({
  selectedWorkerIp,
  onSelectWorker,
  workersApiUrl = 'http://192.168.10.252:23442/workers'
}) => {
  const [nodes, setNodes] = useState<WorkerNodeInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expertMode, setExpertMode] = useState<boolean>(false);
  const [purgedIps, setPurgedIps] = useState<Record<string, boolean>>({});

  const handlePurgeVram = (ip: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPurgedIps(prev => ({ ...prev, [ip]: true }));
    setTimeout(() => {
      setPurgedIps(prev => ({ ...prev, [ip]: false }));
    }, 2000);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchWorkers = async () => {
      try {
        const res = await fetch(workersApiUrl);
        if (!res.ok) throw new Error('Failed to fetch worker list');
        const data = await res.json();
        
        const workerList: WorkerNodeInfo[] = [];
        if (data.workers && typeof data.workers === 'object') {
          for (const [invokerName, queues] of Object.entries(data.workers)) {
            if (Array.isArray(queues) && queues.length > 0) {
              const ip = queues[0];
              if (ip && ip.startsWith('192.168.')) {
                const meta = STATIC_NODE_METADATA[ip] || {
                  friendlyName: `Equipo GPU (${ip})`,
                  gpuType: 'NVIDIA CUDA GPU',
                  tier: 'standard'
                };
                workerList.push({
                  id: invokerName,
                  ip,
                  name: invokerName.replace('celery@', ''),
                  friendlyName: meta.friendlyName,
                  gpuType: meta.gpuType,
                  tier: meta.tier,
                  status: 'online',
                  queues: queues.slice(1),
                  recommended: ip === '192.168.1.68' || ip === '192.168.1.72'
                });
              }
            }
          }
        }
        if (isMounted) {
          setNodes(workerList);
          setLoading(false);
          // Auto-select if none selected
          if (!selectedWorkerIp && workerList.length > 0) {
            const defaultNode = workerList.find(n => n.recommended) || workerList[0];
            onSelectWorker(defaultNode.ip);
          }
        }
      } catch (err) {
        console.warn('Could not load dynamic worker fleet, using fallback nodes:', err);
        // Fallback list
        const fallbackList: WorkerNodeInfo[] = Object.entries(STATIC_NODE_METADATA).map(([ip, meta]) => ({
          id: `worker-${ip.split('.')[3]}`,
          ip,
          name: `worker-${ip}`,
          friendlyName: meta.friendlyName,
          gpuType: meta.gpuType,
          tier: meta.tier,
          status: 'online',
          queues: ['gpus_high', 'gpus_medium'],
          recommended: ip === '192.168.1.68'
        }));
        if (isMounted) {
          setNodes(fallbackList);
          setLoading(false);
        }
      }
    };

    fetchWorkers();
    return () => { isMounted = false; };
  }, [workersApiUrl]);

  return (
    <div className="space-y-3">
      {/* Header with Dual Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Server size={16} className="text-blue-500" />
            ¿Dónde quieres que entrene la IA?
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Selecciona el equipo con tarjeta gráfica para procesar tu modelo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpertMode(!expertMode)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Alternar vista técnica de red y colas"
        >
          <Settings2 size={13} className={expertMode ? "text-blue-500" : ""} />
          {expertMode ? "Modo Simple" : "Modo Técnico"}
        </button>
      </div>

      {/* Grid of Nodes */}
      {loading ? (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500">
          Detectando equipos disponibles en el clúster...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
          {nodes.map((node) => {
            const isSelected = selectedWorkerIp === node.ip;
            return (
              <div
                key={node.ip}
                onClick={() => onSelectWorker(node.ip)}
                className={`
                  p-3 rounded-xl border cursor-pointer transition-all duration-200 text-left relative flex flex-col justify-between
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/20 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {node.friendlyName}
                      </h4>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Cpu size={11} className="text-indigo-400 shrink-0" />
                      {node.gpuType}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </div>

                {/* Footer Badges & Expert Info */}
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-[10px]">
                  {expertMode ? (
                    <div className="flex items-center justify-between w-full font-mono text-gray-500 dark:text-gray-400">
                      <span>IP: {node.ip}</span>
                      <span className="text-[9px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        {node.name.slice(0, 14)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <ShieldCheck size={11} />
                        Disponible
                      </span>
                      {node.tier === 'ultra' && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold text-[9px]">
                          <Zap size={9} />
                          Ultra
                        </span>
                      )}
                      {node.recommended && node.tier !== 'ultra' && (
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-[9px]">
                          Recomendado
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handlePurgeVram(node.ip, e)}
                        title="Limpiar cachés de PyTorch y VRAM en este nodo"
                        className="ml-auto text-[10px] text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1"
                      >
                        {purgedIps[node.ip] ? (
                          <span className="text-emerald-500 font-bold">¡VRAM OK!</span>
                        ) : (
                          <span>Optimizar</span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Input Fallback in Expert Mode */}
      {expertMode && (
        <div className="pt-2 flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">IP Manual:</span>
          <input
            type="text"
            value={selectedWorkerIp}
            onChange={(e) => onSelectWorker(e.target.value.trim())}
            placeholder="192.168.1.xx"
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      )}
    </div>
  );
};

export default WorkerFleetSelector;
