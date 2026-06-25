import React, { useState, useRef } from 'react';
import { Rocket, File, FileCode, CheckCircle, AlertCircle, Loader2, X, Info, UploadCloud, HardDrive, ShieldAlert, Search, Server, Clock, Activity } from 'lucide-react';
import { UPLOAD_API_CONFIG } from '../constants';
import { UserProfile, ProjectDefinition, UserRole } from '../types';
import SearchableSelect from './SearchableSelect';

interface LaunchTrainingViewProps {
  users: UserProfile[];
  projects: ProjectDefinition[];
  userRole?: UserRole;
}

const LaunchTrainingView: React.FC<LaunchTrainingViewProps> = ({ users, projects, userRole }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [mode, setMode] = useState<'public' | 'private'>('public');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [workerName, setWorkerName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [responseMsg, setResponseMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showTemplate, setShowTemplate] = useState(false);

  const [studyQueryId, setStudyQueryId] = useState('');
  const [studyStatus, setStudyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [studyDetail, setStudyDetail] = useState<any>(null);
  const [studyError, setStudyError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studyCheckerRef = useRef<HTMLDivElement>(null);

  const validateFileContent = (fileToValidate: File): Promise<string[] | null> => {
    return new Promise((resolve) => {
      // 1. Check Empty File Object
      if (fileToValidate.size === 0) {
        return resolve(["The uploaded file is empty."]);
      }

      // 2. Check Size (5MB Limit)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (fileToValidate.size > MAX_SIZE) {
        return resolve(["File exceeds the maximum size limit of 5MB."]);
      }

      // 3. Check Content Keys
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        // Check for empty content string
        if (!content || content.trim().length === 0) {
          return resolve(["The file content is empty."]);
        }

        const lines = content.split('\n');
        const errors: string[] = [];

        // Helper: Check if a key exists at the top level (indentation 0) or loosely for JSON
        const hasTopLevelKey = (key: string) => {
          // Matches "key:" or "key": or "key" : at start of line
          const regex = new RegExp(`^[ \\t]*"?${key}"?[ \\t]*:`);
          return lines.some(line => regex.test(line));
        };

        // Helper: Check for nested key within a parent block (YAML indentation based or Inline JSON-like)
        const hasNestedKey = (parent: string, child: string) => {
          // 1. Find parent line index
          const parentRegex = new RegExp(`^[ \\t]*"?${parent}"?[ \\t]*:`);
          const parentIdx = lines.findIndex(line => parentRegex.test(line));
          
          if (parentIdx === -1) return false; // Parent not found

          const parentLine = lines[parentIdx];

          // 1.5 Check for Inline Definition (e.g., train: { data: "..." } or "train": { "data": ... })
          // We check the content after the first colon of the parent line
          const parts = parentLine.split(':');
          if (parts.length > 1) {
             // Rejoin the rest in case there are colons in the value, but skip the first one which is the parent's key separator
             const afterColon = parts.slice(1).join(':');
             // Look for the child key followed by a colon
             const childInlineRegex = new RegExp(`"?${child}"?[ \\t]*:`);
             if (childInlineRegex.test(afterColon)) {
               return true;
             }
          }

          // 2. Determine parent indentation for Block Definition
          const parentIndent = parentLine.search(/\S/); // Index of first non-whitespace char

          // 3. Scan subsequent lines for indented block content
          for (let i = parentIdx + 1; i < lines.length; i++) {
            const line = lines[i];
            
            // Skip empty lines or comments
            if (!line.trim() || line.trim().startsWith('#')) continue;

            const currentIndent = line.search(/\S/);
            
            // If we hit a line with same or less indentation than parent, the block has ended
            if (currentIndent !== -1 && currentIndent <= parentIndent) {
              return false;
            }

            // Check if this line contains the child key
            const childRegex = new RegExp(`^[ \\t]*"?${child}"?[ \\t]*:`);
            if (childRegex.test(line)) {
              return true;
            }
          }
          return false;
        };

        // Validation Rules
        if (!hasTopLevelKey('model')) {
          errors.push("Missing top-level key: 'model'");
        }

        if (!hasTopLevelKey('train')) {
          errors.push("Missing top-level key: 'train'");
        } else {
          // Only check nested if parent exists
          if (!hasNestedKey('train', 'data')) {
            errors.push("Missing required nested key: 'train' > 'data'");
          }
        }

        if (!hasTopLevelKey('sweeper')) {
          errors.push("Missing top-level key: 'sweeper'");
        } else {
           // Only check nested if parent exists
           if (!hasNestedKey('sweeper', 'study_name')) {
             errors.push("Missing required nested key: 'sweeper' > 'study_name'");
           }
        }

        if (errors.length > 0) {
          resolve(errors);
        } else {
          resolve(null); // Valid
        }
      };
      reader.onerror = () => resolve(["Error reading file content."]);
      reader.readAsText(fileToValidate);
    });
  };

  const processFile = async (selectedFile: File) => {
    setValidationErrors([]);
    setUploadStatus('idle');
    setResponseMsg('');

    const errors = await validateFileContent(selectedFile);
    
    if (errors && errors.length > 0) {
      setValidationErrors(errors);
      setFile(null);
    } else {
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedUserId || !selectedProjectId) return;

    setUploadStatus('uploading');
    setResponseMsg('');
    setValidationErrors([]);

    const project = projects.find(p => p.id === selectedProjectId);

    const formData = new FormData();
    // Fields expected by the API
    formData.append('config_file', file);
    formData.append('mode', mode);
    formData.append('priority', priority);
    if (mode === 'private' && workerName) {
      formData.append('worker_name', workerName);
    }

    try {
      const response = await fetch(UPLOAD_API_CONFIG.url, {
        method: UPLOAD_API_CONFIG.method,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Upload failed');
      }
      
      console.log('Submission success:', data);
      
      setUploadStatus('success');
      setResponseMsg(`Training job for '${project?.name}' submitted successfully. Study ID: ${data.study_id}`);
      
      // Auto-fill the study query field and select it for tracking
      setStudyQueryId(data.study_id);
      
      // Scroll to the status checker
      setTimeout(() => {
        studyCheckerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      // Trigger status check immediately
      setTimeout(async () => {
        setStudyStatus('loading');
        setStudyDetail(null);
        setStudyError('');
        try {
          const baseUrl = window.location.protocol + "//" + window.location.hostname + ":23442";
          const res = await fetch(`${baseUrl}/study/${data.study_id}`);
          const detailData = await res.json();
          if (!res.ok) {
            throw new Error(detailData.detail || 'Failed to fetch study status');
          }
          setStudyDetail(detailData);
          setStudyStatus('success');
        } catch (err: any) {
          setStudyError(err.message);
          setStudyStatus('error');
        }
      }, 500);

      setTimeout(() => {
        setFile(null);
        setUploadStatus('idle');
        setResponseMsg('');
      }, 5000);

    } catch (error: any) {
      console.error(error);
      setUploadStatus('error');
      setResponseMsg(error.message || 'Failed to connect to orchestration server. Please check your network.');
    }
  };

  const handleLaunchSmokeTest = async () => {
    setUploadStatus('uploading');
    setResponseMsg('');
    setValidationErrors([]);

    const smokeTestYaml = `model: yolov8n-cls.pt
type: yolo
dry_run: true
train:
  batch: -1
  data: "/datasets/examples/classification/colorball.v8i.multiclass/"
  epochs: 1
  imgsz: 640
  device: 0
sweeper:
  version: 1
  algorithm: optuna
  direction: maximize
  fitness: metrics/accuracy_top1
  study_name: "smoke_test_api_cancel_study"
  tune: true
  sampler: RandomSampler
  n_trials: 5
  priority: "low"
metadata:
  author: "Smoke Test Runner"
  content: "Automatic dry-run E2E integration test through UI."
`;

    const blob = new Blob([smokeTestYaml], { type: 'application/x-yaml' });
    const smokeTestFile = new window.File([blob], 'smoke_test_config.yaml', { type: 'application/x-yaml' });

    const formData = new FormData();
    formData.append('config_file', smokeTestFile);
    formData.append('mode', 'public');
    formData.append('priority', 'low');

    try {
      console.log('Sending smoke test request to URL:', UPLOAD_API_CONFIG.url);
      const response = await fetch(UPLOAD_API_CONFIG.url, {
        method: UPLOAD_API_CONFIG.method,
        body: formData,
      });

      console.log('Received response with status:', response.status);
      const data = await response.json();
      console.log('Parsed response JSON data:', data);

      if (!response.ok) {
        throw new Error(data.detail || 'Upload failed');
      }
      
      console.log('Smoke Test Submission success:', data);
      
      setUploadStatus('success');
      setResponseMsg(`Smoke test submitted successfully. Study ID: ${data.study_id}`);
      
      // Auto-fill the study query field and select it for tracking
      setStudyQueryId(data.study_id);
      
      // Prominent browser alert containing the Study ID for the user
      alert(`Smoke test successfully launched!\nStudy ID: ${data.study_id}`);
      
      // Scroll to the status checker
      setTimeout(() => {
        studyCheckerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
      // Trigger status check immediately
      setTimeout(async () => {
        setStudyStatus('loading');
        setStudyDetail(null);
        setStudyError('');
        try {
          const baseUrl = window.location.protocol + "//" + window.location.hostname + ":23442";
          const res = await fetch(`${baseUrl}/study/${data.study_id}`);
          const detailData = await res.json();
          if (!res.ok) {
            throw new Error(detailData.detail || 'Failed to fetch study status');
          }
          setStudyDetail(detailData);
          setStudyStatus('success');
        } catch (err: any) {
          setStudyError(err.message);
          setStudyStatus('error');
        }
      }, 500);

    } catch (error: any) {
      console.error('Smoke test launch caught error:', error);
      setUploadStatus('error');
      setResponseMsg(error.message || 'Failed to launch smoke test.');
      alert(`Error launching smoke test:\n${error.message || error}`);
    }
  };

  const checkStudyStatus = async () => {
    if (!studyQueryId.trim()) return;
    setStudyStatus('loading');
    setStudyDetail(null);
    setStudyError('');

    const baseUrl = UPLOAD_API_CONFIG.url.replace('/train', '');
    try {
      const res = await fetch(`${baseUrl}/study/${studyQueryId.trim()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Failed to fetch study status');
      }
      const data = await res.json();
      setStudyDetail(data);
      setStudyStatus('success');
    } catch (err: any) {
      setStudyError(err.message);
      setStudyStatus('error');
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    PENDING: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800',
    STARTED: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800',
    SUCCESS: 'text-green-500 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
    FAILURE: 'text-red-500 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
    RETRY: 'text-orange-500 bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800',
    REVOKED: 'text-gray-500 bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800',
  };

  const STATUS_ICONS: Record<string, any> = {
    PENDING: Clock,
    STARTED: Activity,
    SUCCESS: CheckCircle,
    FAILURE: AlertCircle,
    RETRY: Loader2,
    REVOKED: X,
  };

  const yamlTemplate = `debug: wisrovi
model: "yolov8n.pt"
type: "yolo"

# Data Configuration
train:
  data: /datasets/clasificacion/colorball.v8i.multiclass/
  epochs: 20
  imgsz: 640
  device: 0

# Hyperparameter Optimization
sweeper:
  # study
  version: 2
  study_name: "example_classification"

  # optimization
  n_trials: 5
  sampler: "TPESampler"
  search_space:
    model: ["choice", "yolov8n-cls.pt"]
    train:
      imgsz: ["choice", 416, 512, 640]
      lr0: ["loguniform", 1e-5, 1e-2]

  # evolutionary algorithm
  algorithm: optuna
  direction: maximize
  fitness: "metrics/accuracy_top1"
  tune: false

metadata:
  content: "Este es un experimento de xxx de imágenes."
  author: "William Rodriguez"
  documentation: "Este modelo fue entrenado con datos del 2026."`;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up pb-10">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            Launch Training
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={handleLaunchSmokeTest}
                className="opacity-[0.08] hover:opacity-80 transition-all duration-300 p-1 text-gray-400 hover:text-blue-500 rounded cursor-pointer"
                title="Launch Integration Smoke Test"
              >
                <Activity size={16} className="animate-pulse" />
              </button>
            )}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Configure and deploy new training jobs to the GPU cluster.</p>
        </div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Mode Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dispatch Mode
                </label>
                <select 
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="public">Public (Shared Queue)</option>
                  <option value="private">Private (Specific Worker)</option>
                </select>
              </div>

              {/* Priority Selector (Visible in Public Mode) */}
              {mode === 'public' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              )}

              {/* Worker Name (Visible in Private Mode) */}
              {mode === 'private' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Worker
                  </label>
                  <input 
                    type="text"
                    value={workerName}
                    onChange={(e) => setWorkerName(e.target.value)}
                    placeholder="e.g. gpu_node_01"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Custom Drag & Drop Component */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Experiment Config
                </label>
                <button 
                  type="button"
                  onClick={() => setShowTemplate(!showTemplate)}
                  className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline focus:outline-none"
                >
                  <FileCode size={12} />
                  {showTemplate ? 'Hide Template' : 'View YAML Template'}
                </button>
              </div>

              {/* Template Preview */}
              {showTemplate && (
                <div className="mb-4 bg-gray-950 rounded-lg p-4 border border-gray-800 overflow-x-auto shadow-inner">
                  <pre className="text-xs font-mono text-green-400 leading-relaxed">{yamlTemplate}</pre>
                </div>
              )}
              
              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative group border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ease-in-out
                    flex flex-col items-center justify-center min-h-[250px]
                    ${isDragging 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[0.99] ring-4 ring-blue-500/10' 
                      : validationErrors.length > 0
                        ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/5'
                        : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }
                  `}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect}
                    accept=".yaml,.yml,.json,application/json,text/yaml,text/x-yaml,application/x-yaml"
                  />
                  
                  {/* Icon Area */}
                  <div className={`
                    w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-colors duration-300
                    ${isDragging ? 'bg-blue-100 text-blue-600' : validationErrors.length > 0 ? 'bg-red-100 text-red-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-gray-700 group-hover:text-blue-500'}
                  `}>
                    {validationErrors.length > 0 ? <ShieldAlert size={36} /> : <UploadCloud size={36} />}
                  </div>

                  {/* Main Action Text */}
                  <h3 className={`text-lg font-bold mb-2 ${validationErrors.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {validationErrors.length > 0 ? 'Configuration Rejected' : 'Click or Drag Configuration'}
                  </h3>
                  
                  {validationErrors.length > 0 ? (
                    <div className="text-sm text-red-500 dark:text-red-400 mb-6 max-w-sm mx-auto text-left bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800/50">
                      <p className="font-semibold mb-1 border-b border-red-200 dark:border-red-800/50 pb-1">Validation Errors:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {validationErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed">
                      Upload your training manifest to initialize the cluster job.
                    </p>
                  )}

                  {/* Enhanced Limits and Types Indicator */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                      <FileCode size={12} className="text-blue-500" />
                      .yaml, .yml, .json
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                      <HardDrive size={12} className="text-amber-500" />
                      Max 5MB
                    </span>
                  </div>

                </div>
              ) : (
                // Selected File State
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-5 flex items-center justify-between animate-fade-in shadow-sm min-h-[100px]">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 dark:border-blue-900 shadow-sm">
                      <File size={24} />
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-md">{file.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                          {(file.size / 1024).toFixed(2)} KB
                        </span>
                        <span className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                          <CheckCircle size={12} fill="currentColor" className="text-green-100 dark:text-green-900" /> Validated
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-3 hover:bg-white dark:hover:bg-gray-800 rounded-xl text-gray-400 hover:text-red-500 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    title="Remove file"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {uploadStatus === 'error' && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-200 rounded-xl text-sm flex items-start gap-3 animate-fade-in">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Submission Failed</p>
                  <p className="opacity-90 mt-0.5">{responseMsg}</p>
                </div>
              </div>
            )}
            
            {uploadStatus === 'success' && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 text-green-800 dark:text-green-200 rounded-xl text-sm flex items-start gap-3 animate-fade-in">
                <CheckCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Successfully Launched</p>
                  <p className="opacity-90 mt-0.5">{responseMsg}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!file || !selectedUserId || !selectedProjectId || uploadStatus === 'uploading'}
              className={`
                w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2.5 transition-all duration-200
                ${!file || !selectedUserId || !selectedProjectId || uploadStatus === 'uploading'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-0.5'
                }
              `}
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>Provisioning Resources...</span>
                </>
              ) : (
                <>
                  <Rocket size={24} />
                  <span>Launch Training Job</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800 sticky top-6">
             <div className="flex items-center gap-2 mb-4">
               <Info size={18} className="text-blue-500" />
               <h3 className="font-semibold text-gray-900 dark:text-white">Submission Policy</h3>
             </div>
             <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
               <li className="flex gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                 <div>
                   <strong className="block text-gray-900 dark:text-gray-200 mb-0.5">File Format</strong>
                   Must be a valid YAML or JSON file containing <code>model</code>, <code>train</code>, and <code>sweeper</code> blocks.
                 </div>
               </li>
               <li className="flex gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                 <div>
                   <strong className="block text-gray-900 dark:text-gray-200 mb-0.5">Required Data</strong>
                   Ensure <code>train</code> block contains <code>data</code> path and <code>sweeper</code> contains <code>study_name</code>.
                 </div>
               </li>
               <li className="flex gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                 <div>
                   <strong className="block text-gray-900 dark:text-gray-200 mb-0.5">Size Limit</strong>
                   Configuration files must not exceed 5MB. Large datasets should be referenced via path, not embedded.
                 </div>
               </li>
             </ul>
          </div>
        </div>

      </div>

      {/* Study Status Checker */}
      <div ref={studyCheckerRef} className="mt-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Search size={20} className="text-blue-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Check Study Status</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Paste a Study ID to check its current state, active invoker, and configuration.
        </p>

        {uploadStatus === 'success' && responseMsg && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 text-green-800 dark:text-green-200 rounded-xl text-sm flex items-start gap-3 animate-fade-in">
            <CheckCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Successfully Launched</p>
              <p className="opacity-90 mt-0.5">{responseMsg}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={studyQueryId}
            onChange={(e) => setStudyQueryId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkStudyStatus()}
            placeholder="Paste Study ID (UUID)..."
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={checkStudyStatus}
            disabled={studyStatus === 'loading' || !studyQueryId.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {studyStatus === 'loading' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            Check
          </button>
        </div>

        {studyStatus === 'error' && (
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-200 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Lookup Failed</p>
              <p className="opacity-90 mt-0.5">{studyError}</p>
            </div>
          </div>
        )}

        {studyStatus === 'success' && studyDetail && (
          <div className="animate-fade-in space-y-4">
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold ${
              STATUS_COLORS[studyDetail.state] || 'text-gray-500 bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800'
            }`}>
              {(() => {
                const Icon = STATUS_ICONS[studyDetail.state] || Info;
                return <Icon size={18} className={studyDetail.state === 'RETRY' ? 'animate-spin' : ''} />;
              })()}
              {studyDetail.state}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Study ID */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Study ID</span>
                <span className="font-mono text-gray-900 dark:text-white break-all">{studyDetail.study_id}</span>
              </div>

              {/* Study Name */}
              {studyDetail.study_name && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Study Name</span>
                  <span className="font-medium text-gray-900 dark:text-white">{studyDetail.study_name}</span>
                </div>
              )}

              {/* Active Invoker */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Active / Last Invoker</span>
                {studyDetail.active_worker ? (
                  <div className="flex items-center gap-2">
                    <Server size={16} className="text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{studyDetail.active_worker}</span>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No active invoker (pending or finished)</span>
                )}
                {studyDetail.all_invokers && studyDetail.all_invokers.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs">
                    <span className="text-gray-500 dark:text-gray-400 block mb-1">All Participating Invokers:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {studyDetail.all_invokers.map((inv: string) => (
                        <span key={inv} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-mono text-[11px] border border-blue-200 dark:border-blue-800/50">
                          {inv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Active Task */}
              {studyDetail.active_task && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Active Task</span>
                  <span className="font-mono text-xs text-gray-900 dark:text-white break-all">{studyDetail.active_task.name}</span>
                </div>
              )}

              {/* Config */}
              {studyDetail.config && (
                <div className="md:col-span-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Configuration</span>
                  <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 overflow-x-auto max-h-40">
                    {JSON.stringify(studyDetail.config, null, 2)}
                  </pre>
                </div>
              )}

              {/* Results */}
              {studyDetail.results_data && (
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                  <span className="block text-xs font-medium text-green-600 dark:text-green-400 mb-1">Results</span>
                  <pre className="text-xs font-mono text-green-800 dark:text-green-200">
                    {JSON.stringify(studyDetail.results_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error */}
              {studyDetail.error_data && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <span className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1">Error</span>
                  <pre className="text-xs font-mono text-red-800 dark:text-red-200">
                    {JSON.stringify(studyDetail.error_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Traceback */}
              {studyDetail.traceback && (
                <div className="md:col-span-2 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <span className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1">Traceback</span>
                  <pre className="text-xs font-mono text-red-800 dark:text-red-200 overflow-x-auto max-h-60 whitespace-pre-wrap">
                    {studyDetail.traceback}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default LaunchTrainingView;