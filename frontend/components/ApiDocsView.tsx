import React, { useState } from 'react';
import { Copy, Check, Server, Shield, Key, Database, Cpu } from 'lucide-react';

interface EndpointDef {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  description: string;
  params?: { name: string; type: string; required: boolean; desc: string }[];
  body?: object;
  response: object;
}

const ApiDocsView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('jobs');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = [
    { id: 'auth', name: 'Authentication', icon: <Shield size={18} /> },
    { id: 'jobs', name: 'Training Jobs', icon: <Cpu size={18} /> },
    { id: 'workers', name: 'Cluster Nodes', icon: <Server size={18} /> },
    { id: 'models', name: 'Model Registry', icon: <Database size={18} /> },
  ];

  const endpoints: Record<string, EndpointDef[]> = {
    auth: [
      {
        id: 'auth-token',
        method: 'POST',
        path: '/v1/auth/token',
        title: 'Generate Access Token',
        description: 'Exchange client credentials for a JWT Bearer token to access protected endpoints.',
        body: { client_id: "neuroforge-cli", client_secret: "********" },
        response: { access_token: "eyJhbGciOiJIUz...", token_type: "bearer", expires_in: 3600 }
      }
    ],
    jobs: [
      {
        id: 'create-job',
        method: 'POST',
        path: '/v1/jobs/train',
        title: 'Launch Training Job',
        description: 'Submit a new YOLO training task to the Redis queue. The system will assign it to the next available GPU worker.',
        body: { 
          model_arch: "yolov8m", 
          dataset_id: "coco-2017-subset",
          hyperparameters: { epochs: 100, batch_size: 16, imgsz: 640 },
          priority: "normal"
        },
        response: { job_id: "job-8f92a", status: "queued", queue_position: 4 }
      },
      {
        id: 'list-jobs',
        method: 'GET',
        path: '/v1/jobs',
        title: 'List Active Jobs',
        description: 'Retrieve a paginated list of all currently running, pending, or recently completed jobs.',
        response: { 
          count: 2, 
          results: [
            { id: "job-1", status: "running", progress: 0.45 },
            { id: "job-2", status: "pending", progress: 0.0 }
          ]
        }
      }
    ],
    workers: [
      {
        id: 'get-workers',
        method: 'GET',
        path: '/v1/workers',
        title: 'Get Worker Status',
        description: 'Returns real-time telemetry from all connected compute nodes, including GPU temperature and memory usage.',
        response: {
          workers: [
            { id: "node-01", state: "active", gpu_util: 92, vram_used_mb: 14500 },
            { id: "node-02", state: "idle", gpu_util: 0, vram_used_mb: 400 }
          ]
        }
      }
    ],
    models: [
      {
        id: 'get-artifacts',
        method: 'GET',
        path: '/v1/models/{job_id}/weights',
        title: 'Download Weights',
        description: 'Generates a pre-signed MinIO URL to download the best.pt weights for a specific job.',
        response: { 
          url: "https://minio.neuroforge.internal/models/job-1/best.pt?signature=...",
          expires_at: "2024-03-20T14:00:00Z"
        }
      }
    ]
  };

  return (
    <div className="flex h-full flex-col md:flex-row max-w-7xl mx-auto animate-fade-in-up">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">API Reference</h3>
        <nav className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${activeCategory === cat.id 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              {cat.icon}
              {cat.name}
            </button>
          ))}
        </nav>
        
        <div className="mt-8 px-3">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1">
              <Key size={12} /> Authentication
            </h4>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Include <code>Authorization: Bearer &lt;token&gt;</code> in all requests.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white dark:bg-gray-950">
        <div className="mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {categories.find(c => c.id === activeCategory)?.name}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Base URL: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-sm font-mono text-pink-500">https://api.neuroforge.ai/v1</code>
          </p>
        </div>

        <div className="space-y-12">
          {endpoints[activeCategory]?.map((endpoint) => (
            <div key={endpoint.id} className="group">
              <div className="flex items-center gap-3 mb-4">
                <span className={`
                  px-3 py-1 rounded-md text-sm font-bold font-mono
                  ${endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : ''}
                  ${endpoint.method === 'POST' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : ''}
                  ${endpoint.method === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : ''}
                `}>
                  {endpoint.method}
                </span>
                <span className="font-mono text-gray-700 dark:text-gray-300 font-medium">
                  {endpoint.path}
                </span>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Description Column */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{endpoint.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    {endpoint.description}
                  </p>
                  
                  {endpoint.body && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">Request Body</h4>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 font-mono text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
                         {JSON.stringify(endpoint.body, null, 2)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Code Example Column */}
                <div className="w-full lg:w-1/2">
                  <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                      <span className="text-xs text-gray-400 font-medium">Response Example (JSON)</span>
                      <button 
                        onClick={() => handleCopy(JSON.stringify(endpoint.response, null, 2), endpoint.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {copiedId === endpoint.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="p-4 overflow-x-auto">
                      <pre className="text-xs font-mono leading-relaxed text-blue-300">
                        {JSON.stringify(endpoint.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-800 w-full mt-10"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApiDocsView;