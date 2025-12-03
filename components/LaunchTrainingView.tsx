import React, { useState, useRef } from 'react';
import { Rocket, File, FileCode, CheckCircle, AlertCircle, Loader2, X, Info } from 'lucide-react';
import { UPLOAD_API_CONFIG } from '../constants';
import { UserProfile, ProjectDefinition } from '../types';
import SearchableSelect from './SearchableSelect';

interface LaunchTrainingViewProps {
  users: UserProfile[];
  projects: ProjectDefinition[];
}

const LaunchTrainingView: React.FC<LaunchTrainingViewProps> = ({ users, projects }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [responseMsg, setResponseMsg] = useState('');
  const [showTemplate, setShowTemplate] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadStatus('idle');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedUserId || !selectedProjectId) return;

    setUploadStatus('uploading');
    setResponseMsg('');

    const user = users.find(u => u.id === selectedUserId);
    const project = projects.find(p => p.id === selectedProjectId);

    const formData = new FormData();
    formData.append('username', user?.name || 'unknown');
    formData.append('project_id', project?.id || 'unknown');
    formData.append('project_name', project?.name || 'unknown');
    formData.append('file', file);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating network

      const response = await fetch(UPLOAD_API_CONFIG.url, {
        method: UPLOAD_API_CONFIG.method,
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      console.log('Submission success:', data);
      
      setUploadStatus('success');
      setResponseMsg(`Training job for '${project?.name}' submitted successfully. Job ID: ${data.id || 'Job-X99'}`);
      
      setTimeout(() => {
        setFile(null);
        setUploadStatus('idle');
        setResponseMsg('');
      }, 5000);

    } catch (error) {
      console.error(error);
      setUploadStatus('error');
      setResponseMsg('Failed to connect to orchestration server. Please check your network.');
    }
  };

  const yamlTemplate = `debug: wisrovi
model: "yolov8n-cls.pt"

# Data Configuration
train:
  data: /datasets/clasificacion/colorball.v8i.multiclass/
  epochs: 20
  imgsz: 640

# Hyperparameter Optimization
sweeper:
  version: 2
  study_name: "example_classification"
  n_trials: 5
  search_space:
    model: ["choice", "yolov8n-cls.pt"]
    train:
      imgsz: ["choice", 416, 512, 640]
      lr0: ["loguniform", 1e-5, 1e-2]`;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Launch Training</h2>
        <p className="text-gray-500 dark:text-gray-400">Configure and deploy new training jobs to the GPU cluster.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* User Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Initiating User
                </label>
                <SearchableSelect 
                  options={users.map(u => ({ value: u.id, label: u.name, subLabel: u.email }))}
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                  placeholder="Select Developer..."
                />
              </div>

              {/* Project Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Project
                </label>
                <SearchableSelect 
                  options={projects.map(p => ({ value: p.id, label: p.name, subLabel: `ID: ${p.id}` }))}
                  value={selectedProjectId}
                  onChange={setSelectedProjectId}
                  placeholder="Select Experiment..."
                />
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Experiment Config (.yaml)
                </label>
                <button 
                  type="button"
                  onClick={() => setShowTemplate(!showTemplate)}
                  className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                >
                  <FileCode size={12} />
                  {showTemplate ? 'Hide Template' : 'View YAML Template'}
                </button>
              </div>

              {/* Template Preview */}
              {showTemplate && (
                <div className="mb-4 bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-x-auto">
                  <pre className="text-xs font-mono text-green-400">{yamlTemplate}</pre>
                </div>
              )}
              
              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                    ${isDragging 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect}
                    accept=".yaml,.yml,.json"
                  />
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileCode size={32} />
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium mb-1">Upload YAML Configuration</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Drag and drop or click to browse</p>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-gray-900 rounded-lg text-blue-600">
                      <File size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{file.name}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-300">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1 hover:bg-white/50 rounded-full text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {uploadStatus === 'error' && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {responseMsg}
              </div>
            )}
            
            {uploadStatus === 'success' && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle size={16} />
                {responseMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!file || !selectedUserId || !selectedProjectId || uploadStatus === 'uploading'}
              className={`
                w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all
                ${!file || !selectedUserId || !selectedProjectId || uploadStatus === 'uploading'
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'
                }
              `}
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting Job...
                </>
              ) : (
                <>
                  <Rocket size={18} />
                  Launch Training Job
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
             <div className="flex items-center gap-2 mb-4">
               <Info size={18} className="text-blue-500" />
               <h3 className="font-semibold text-gray-900 dark:text-white">Submission Policy</h3>
             </div>
             <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                 <div>
                   <strong className="block text-gray-700 dark:text-gray-300">File Format</strong>
                   Must be a valid YAML file containing <code>model</code> and <code>train</code> blocks.
                 </div>
               </li>
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                 <div>
                   <strong className="block text-gray-700 dark:text-gray-300">Registry Check</strong>
                   You must be registered in the Team Access list to submit jobs.
                 </div>
               </li>
             </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LaunchTrainingView;
