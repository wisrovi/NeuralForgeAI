import React, { useState } from 'react';
import { Copy, Check, Server, Shield, Key, Database, Cpu, Code } from 'lucide-react';

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
    { id: 'jobs', name: 'Training Jobs', icon: <Cpu size={18} /> },
    { id: 'workers', name: 'Cluster Nodes', icon: <Server size={18} /> },
    { id: 'models', name: 'Model Registry', icon: <Database size={18} /> },
    { id: 'examples', name: 'Automation Examples', icon: <Code size={18} /> },
  ];

  const pythonExample = `import requests

# API Configuration
API_URL = "http://192.168.10.252:23442/train"

def launch_training(yaml_path, mode="public", priority="medium"):
    """Launches a training job via script."""
    try:
        with open(yaml_path, "rb") as f:
            files = {"config_file": f}
            data = {
                "mode": mode,
                "priority": priority
            }
            
            response = requests.post(API_URL, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Success! Study ID: {result['study_id']}")
                return result['study_id']
            else:
                print(f"❌ Failed: {response.text}")
    except Exception as e:
        print(f"⚠️ Error: {e}")

# Usage
if __name__ == "__main__":
    launch_training("my_config.yaml", mode="public", priority="high")`;

  const endpoints: Record<string, EndpointDef[]> = {
    jobs: [
      {
        id: 'create-job',
        method: 'POST',
        path: '/train',
        title: 'Launch Training Job',
        description: 'Submit a new YOLO training task using a YAML configuration file. The system handles priority routing and worker allocation.',
        body: { 
          config_file: "File (.yaml)", 
          mode: "public | private",
          priority: "high | medium | low",
          worker_name: "string (optional)"
        },
        response: { status: "Queued", study_id: "uuid-v4-string", mode: "public", routing: "public:medium" }
      },
      {
        id: 'list-tasks',
        method: 'GET',
        path: '/tasks',
        title: 'Monitor Queues',
        description: 'Retrieve real-time status of all task queues and currently running jobs across the cluster.',
        response: { 
          queued: { managers: 1, gpus_high: 0 },
          running: [{ worker: "gpu_node_01", id: "task-1", name: "train_yolo" }],
          total_queued: 1
        }
      }
    ],
    workers: [
      {
        id: 'get-workers',
        method: 'GET',
        path: '/workers',
        title: 'List Cluster Workers',
        description: 'Get a list of all active Celery workers and their assigned queues.',
        response: {
          count: 2,
          workers: { "gpu_node_01": ["worker_gpu1", "gpus_high"], "gpu_node_02": ["gpus_low"] }
        }
      }
    ],
    models: [
      {
        id: 'health-metrics',
        method: 'GET',
        path: '/health',
        title: 'System Health & Telemetry',
        description: 'Get real-time system metrics (CPU, RAM, Disk) and Redis connection status.',
        response: { 
          status: "ok",
          system: { cpu_percent: 45.2, memory_used_gb: 8.4, disk_free_gb: 120.5 },
          redis: "connected"
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
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1">
              <Shield size={12} /> Active Access
            </h4>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Your API is currently open for local network requests.
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
            Base URL: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-sm font-mono text-pink-500">http://192.168.10.252:23442</code>
          </p>
        </div>

        {activeCategory === 'examples' ? (
          <div className="space-y-8">
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Code className="text-blue-500" size={24} /> Python Automation Script
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Use the following Python snippet to programmatically submit training jobs to the cluster. This script handles the multi-part form data required by the <code>/train</code> endpoint.
              </p>
              
              <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                  <span className="text-xs text-gray-400 font-medium">launch_train.py</span>
                  <button 
                    onClick={() => handleCopy(pythonExample, 'python-example')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedId === 'python-example' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="p-6 overflow-x-auto">
                  <pre className="text-sm font-mono leading-relaxed text-blue-300">
                    {pythonExample}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">Request Parameters</h4>
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
        )}
      </div>
    </div>
  );
};

export default ApiDocsView;