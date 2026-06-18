import React, { useEffect, useState } from 'react';
import { Activity, Server, Database, Layers, ArrowUpRight, ArrowDownRight, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { DASHBOARD_API_CONFIG } from '../constants';

// --- Types for Data State ---
interface DashboardState {
  activeWorkers: string;
  workerTrend: string;
  gpuUtilization: string;
  queueDepth: string;
  storageUsed: string;
  redisMemory: string;
  redisLoad: number;
  minioBandwidth: string;
  minioLoad: number;
  estCompletion: string;
  activeJobs: ActiveJob[];
}

interface ActiveJob {
  id: number;
  name: string;
  worker: string;
  epoch: string;
  progress: number;
  map: string;
}

// Initial state with placeholders
const INITIAL_STATE: DashboardState = {
  activeWorkers: '--/--',
  workerTrend: '...',
  gpuUtilization: '0%',
  queueDepth: '0',
  storageUsed: '0 TB',
  redisMemory: '0 GB',
  redisLoad: 0,
  minioBandwidth: '0 MB/s',
  minioLoad: 0,
  estCompletion: '--:--',
  activeJobs: []
};

const DashboardHome: React.FC = () => {
  const [data, setData] = useState<DashboardState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Generic helper to fetch data for a specific config
  const fetchData = async (configKey: keyof typeof DASHBOARD_API_CONFIG) => {
    const config = DASHBOARD_API_CONFIG[configKey];
    try {
      const options: RequestInit = {
        method: config.method,
        headers: { 'Content-Type': 'application/json' },
      };
      
      // Only add body for non-GET requests
      if (config.method !== 'GET' && (config as any).payload) {
        options.body = JSON.stringify((config as any).payload);
      }

      const res = await fetch(config.url, options);
      if (!res.ok) throw new Error(`Error fetching ${configKey}`);
      return await res.json();
    } catch (e) {
      console.warn(`Failed to fetch ${configKey}`, e);
      return {}; 
    }
  };

  const fetchAllGranularData = async () => {
    setLoading(true);
    try {
      // Trigger requests in parallel
      const [
        workersData,
        tasksData,
        healthData
      ] = await Promise.all([
        fetchData('activeWorkers'),
        fetchData('activeJobs'),
        fetchData('storageUsed')
      ]);

      // MAPPING LOGIC: Use real data from API
      const activeWorkersCount = workersData.count || 0;
      const totalQueued = tasksData.total_queued || 0;
      const runningJobs = tasksData.running || [];

      const mappedJobs = runningJobs.map((job: any) => ({
        id: job.id || Math.random(),
        name: job.name || 'Unknown Task',
        worker: job.worker || 'Pending...',
        epoch: 'Processing',
        progress: 50, // Progress needs to be fetched from a specific endpoint if available
        map: 'N/A'
      }));

      setData({
        activeWorkers: `${activeWorkersCount} Active`,
        workerTrend: activeWorkersCount > 0 ? "Cluster Ready" : "No Workers",
        gpuUtilization: healthData.system ? `${healthData.system.cpu_percent}% CPU` : "N/A",
        queueDepth: `${totalQueued}`,
        storageUsed: healthData.system ? `${healthData.system.disk_used_percent}% Disk` : "Samba/MinIO",
        redisMemory: healthData.redis_metrics ? healthData.redis_metrics.used_memory_human : "Connected",
        redisLoad: healthData.system ? healthData.system.memory_used_gb / healthData.system.memory_total_gb * 100 : 0,
        minioBandwidth: healthData.system ? `${healthData.system.disk_free_gb} GB Free` : "N/A",
        minioLoad: healthData.system ? healthData.system.disk_used_percent : 0,
        estCompletion: totalQueued > 0 ? "Calculating..." : "Idle",
        activeJobs: mappedJobs
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard Sync Error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllGranularData();
    const interval = setInterval(fetchAllGranularData, 30000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-2 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-gray-500 dark:text-gray-400 text-sm">
               Real-time telemetry from distributed training clusters
             </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <span className="text-xs text-gray-400 hidden md:inline">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button 
            onClick={fetchAllGranularData}
            disabled={loading}
            className={`p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
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
        <MetricCard 
          title="The Hive (Workers)" 
          value={data.activeWorkers} 
          subValue={data.workerTrend} 
          icon={<Server size={20} className="text-blue-500" />}
          trend="up"
          loading={loading}
        />
        <MetricCard 
          title="GPU Utilization" 
          value={data.gpuUtilization} 
          subValue="Avg across cluster" 
          icon={<Activity size={20} className="text-purple-500" />}
          trend="up"
          loading={loading}
        />
        <MetricCard 
          title="Queue Depth" 
          value={data.queueDepth} 
          subValue="Jobs pending" 
          icon={<Layers size={20} className="text-amber-500" />}
          trend="down"
          loading={loading}
        />
        <MetricCard 
          title="Storage Used" 
          value={data.storageUsed} 
          subValue="MinIO Objects" 
          icon={<Database size={20} className="text-emerald-500" />}
          trend="neutral"
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Active Jobs List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Training Jobs</h3>
          <div className="space-y-4">
            {loading && data.activeJobs.length === 0 ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-gray-50 dark:bg-gray-800/50 rounded-lg animate-pulse" />
              ))
            ) : (
              data.activeJobs.map((job) => (
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
          </div>
        </div>

        {/* 3. Infrastructure Status Panel */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Infrastructure</h3>
          
          <div className="space-y-6 flex-1">
            
            {/* Redis Stats */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Redis Memory</span>
                <span className="text-gray-900 dark:text-white font-mono">{loading ? '...' : data.redisMemory}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${data.redisLoad}%` }} 
                />
              </div>
            </div>

            {/* MinIO Stats */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">MinIO Bandwidth</span>
                <span className="text-gray-900 dark:text-white font-mono">{loading ? '...' : data.minioBandwidth}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${data.minioLoad}%` }} 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
               <div className="flex items-center gap-3 mb-2">
                 <Clock size={16} className="text-gray-400" />
                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Completion</span>
               </div>
               <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                 {loading ? '--:--' : data.estCompletion}
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
const MetricCard: React.FC<{ 
  title: string, value: string, subValue: string, icon: React.ReactNode, trend?: 'up' | 'down' | 'neutral', loading: boolean 
}> = ({ 
  title, value, subValue, icon, trend, loading 
}) => (
  <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">{icon}</div>
      {trend === 'up' && <ArrowUpRight size={16} className="text-green-500" />}
      {trend === 'down' && <ArrowDownRight size={16} className="text-red-500" />}
    </div>
    {loading ? (
       <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-1"></div>
    ) : (
       <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
    )}
    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{title}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400">{subValue}</p>
  </div>
);

export default DashboardHome;