import React from 'react';
import { Activity, Server, Database, Layers, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

const DashboardHome: React.FC = () => {
  return (
    <div className="p-2 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cluster Overview</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Real-time telemetry from connected worker nodes.</p>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-mono font-medium border border-green-200 dark:border-green-800">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          SYSTEM HEALTHY
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Active Workers" 
          value="12/16" 
          subValue="+2 provisioning" 
          icon={<Server size={20} className="text-blue-500" />}
          trend="up"
        />
        <MetricCard 
          title="GPU Utilization" 
          value="87%" 
          subValue="Avg across cluster" 
          icon={<Activity size={20} className="text-purple-500" />}
          trend="up"
        />
        <MetricCard 
          title="Queue Depth" 
          value="42" 
          subValue="Jobs pending" 
          icon={<Layers size={20} className="text-amber-500" />}
          trend="down"
        />
        <MetricCard 
          title="Storage Used" 
          value="14.2 TB" 
          subValue="MinIO Objects" 
          icon={<Database size={20} className="text-emerald-500" />}
          trend="neutral"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Jobs List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Training Jobs</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 group hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                    Y8
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">YOLOv8-Nano-Detect</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Epoch 45/100 • Batch 64 • Worker-0{i}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{(0.45 - (i * 0.02)).toFixed(3)} mAP</span>
                  </div>
                  <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${45 + (i * 10)}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status / Side Panel */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Infrastructure</h3>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Redis Memory</span>
                <span className="text-gray-900 dark:text-white font-mono">2.4 GB</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">MinIO Bandwidth</span>
                <span className="text-gray-900 dark:text-white font-mono">450 MB/s</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
               <div className="flex items-center gap-3 mb-2">
                 <Clock size={16} className="text-gray-400" />
                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Completion</span>
               </div>
               <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">04h 12m</p>
               <p className="text-xs text-gray-500">Based on current epoch velocity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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