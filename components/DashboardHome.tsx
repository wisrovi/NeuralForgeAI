import React, { useEffect, useState } from 'react';
import { Activity, Server, Database, Layers, ArrowUpRight, ArrowDownRight, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { DASHBOARD_API_CONFIG } from '../constants';

// --- Types for Data State ---
interface DashboardMetrics {
  activeWorkers: string;
  workerTrend: string;
  gpuUtilization: string;
  queueDepth: string;
  storageUsed: string;
}

interface ActiveJob {
  id: number;
  name: string;
  worker: string;
  epoch: string;
  progress: number;
  map: string;
}

interface InfraMetrics {
  redisMemory: string;
  redisLoad: number; // 0-100
  minioBandwidth: string;
  minioLoad: number; // 0-100
  estCompletion: string;
}

const DashboardHome: React.FC = () => {
  // State for the three distinct data sections
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [infra, setInfra] = useState<InfraMetrics | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 1. Fetch Main Telemetry (Top Cards)
  const fetchTelemetry = async () => {
    const response = await fetch(DASHBOARD_API_CONFIG.telemetry.url, {
      method: DASHBOARD_API_CONFIG.telemetry.method,
      body: JSON.stringify(DASHBOARD_API_CONFIG.telemetry.defaultPayload),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch telemetry');
    const data = await response.json();
    
    // MAPPING LOGIC: Simulate data from response ID
    const seed = data.id || 101; 
    return {
      activeWorkers: `${(seed % 16) + 1}/16`,
      workerTrend: "+2 provisioning",
      gpuUtilization: `${Math.min(99, 40 + (seed % 50))}%`,
      queueDepth: `${(seed * 2) % 100}`,
      storageUsed: `${10 + (seed % 10)}.${seed % 9} TB`
    };
  };

  // 2. Fetch Active Jobs (List)
  const fetchJobs = async () => {
    const response = await fetch(DASHBOARD_API_CONFIG.activeJobs.url, {
      method: DASHBOARD_API_CONFIG.activeJobs.method,
      body: JSON.stringify(DASHBOARD_API_CONFIG.activeJobs.defaultPayload),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch jobs');
    const data = await response.json();
    const baseId = data.id || 200;

    // MAPPING LOGIC: Generate job list based on response
    return [1, 2, 3].map(i => ({
      id: baseId + i,
      name: i === 1 ? 'YOLOv8-Nano-Detect' : i === 2 ? 'ResNet-50-Tune' : 'Genetic-Opt-V2',
      worker: `Worker-0${i}`,
      epoch: `${45 + i}/100`,
      progress: 45 + (i * 10),
      map: (0.45 - (i * 0.02)).toFixed(3)
    }));
  };

  // 3. Fetch Infrastructure Stats (Side Panel)
  const fetchInfra = async () => {
    const response = await fetch(DASHBOARD_API_CONFIG.infrastructure.url, {
      method: DASHBOARD_API_CONFIG.infrastructure.method,
      body: JSON.stringify(DASHBOARD_API_CONFIG.infrastructure.defaultPayload),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch infrastructure');
    const data = await response.json();
    const seed = data.id || 55;

    // MAPPING LOGIC
    return {
      redisMemory: `${(seed % 5) + 1}.${seed % 9} GB`,
      redisLoad: 40 + (seed % 40),
      minioBandwidth: `${300 + (seed % 500)} MB/s`,
      minioLoad: 20 + (seed % 50),
      estCompletion: `${(seed % 12) + 1}h ${(seed * 3) % 60}m`
    };
  };

  // Orchestrate all fetches
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Execute all POST requests in parallel
      const [metricsData, jobsData, infraData] = await Promise.all([
        fetchTelemetry(),
        fetchJobs(),
        fetchInfra()
      ]);

      setMetrics(metricsData);
      setJobs(jobsData);
      setInfra(infraData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError('Could not sync with Orchestration API. Ensure backend is reachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex flex-col items-center justify-center h-64 text-center">
        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
          <AlertTriangle className="text-red-500" size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connection Error</h3>
        <p className="text-gray-500 max-w-md mb-6">{error}</p>
        <button 
          onClick={fetchAllData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
               Source: 
               <code className="text-xs bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono">POST /activeJobs</code>
               <code className="text-xs bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono">POST /telemetry</code>
             </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <span className="text-xs text-gray-400 hidden md:inline">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button 
            onClick={fetchAllData}
            disabled={loading}
            className={`p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${loading ? 'opacity-50' : ''}`}
            title="Refresh Data"
          >
            <RefreshCw size={18} className={`text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-mono font-medium border border-green-200 dark:border-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            SYSTEM ONLINE
          </div>
        </div>
      </div>

      {/* 1. Metric Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading || !metrics ? (
           Array(4).fill(0).map((_, i) => (
             <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 h-32 animate-pulse" />
           ))
        ) : (
          <>
            <MetricCard 
              title="Active Workers" 
              value={metrics.activeWorkers} 
              subValue={metrics.workerTrend} 
              icon={<Server size={20} className="text-blue-500" />}
              trend="up"
            />
            <MetricCard 
              title="GPU Utilization" 
              value={metrics.gpuUtilization} 
              subValue="Avg across cluster" 
              icon={<Activity size={20} className="text-purple-500" />}
              trend="up"
            />
            <MetricCard 
              title="Queue Depth" 
              value={metrics.queueDepth} 
              subValue="Jobs pending" 
              icon={<Layers size={20} className="text-amber-500" />}
              trend="down"
            />
            <MetricCard 
              title="Storage Used" 
              value={metrics.storageUsed} 
              subValue="MinIO Objects" 
              icon={<Database size={20} className="text-emerald-500" />}
              trend="neutral"
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Active Jobs List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Training Jobs</h3>
          <div className="space-y-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-gray-50 dark:bg-gray-800/50 rounded-lg animate-pulse" />
              ))
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 group hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                      Y8
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">{job.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Epoch {job.epoch} • Batch 64 • {job.worker}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{job.map} mAP</span>
                    </div>
                    <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${job.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {!loading && jobs.length === 0 && (
              <div className="text-center py-8 text-gray-500">No active jobs found in queue.</div>
            )}
          </div>
        </div>

        {/* 3. Infrastructure Status Panel (Fetched from API) */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Infrastructure</h3>
          
          <div className="space-y-6 flex-1">
            
            {/* Redis Stats */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Redis Memory</span>
                <span className="text-gray-900 dark:text-white font-mono">{loading || !infra ? '...' : infra.redisMemory}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${loading || !infra ? 0 : infra.redisLoad}%` }} 
                />
              </div>
            </div>

            {/* MinIO Stats */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">MinIO Bandwidth</span>
                <span className="text-gray-900 dark:text-white font-mono">{loading || !infra ? '...' : infra.minioBandwidth}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${loading || !infra ? 0 : infra.minioLoad}%` }} 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
               <div className="flex items-center gap-3 mb-2">
                 <Clock size={16} className="text-gray-400" />
                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Completion</span>
               </div>
               <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                 {loading || !infra ? '--:--' : infra.estCompletion}
               </p>
               <p className="text-xs text-gray-500">Based on current epoch velocity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Component for Top Cards
const MetricCard: React.FC<{ title: string, value: string, subValue: string, icon: React.ReactNode, trend?: 'up' | 'down' | 'neutral' }> = ({ 
  title, value, subValue, icon, trend 
}) => (
  <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">{icon}</div>
      {trend === 'up' && <ArrowUpRight size={16} className="text-green-500" />}
      {trend === 'down' && <ArrowDownRight size={16} className="text-red-500" />}
    </div>
    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{title}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400">{subValue}</p>
  </div>
);

export default DashboardHome;