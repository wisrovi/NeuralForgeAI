import React, { useState, useRef } from 'react';
import { Rocket, File, FileCode, CheckCircle, AlertCircle, Loader2, X, Info, UploadCloud, HardDrive, ShieldAlert } from 'lucide-react';
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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showTemplate, setShowTemplate] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Helper: Check for nested key within a parent block (YAML indentation based)
        const hasNestedKey = (parent: string, child: string) => {
          // 1. Find parent line index
          const parentRegex = new RegExp(`^[ \\t]*"?${parent}"?[ \\t]*:`);
          const parentIdx = lines.findIndex(line => parentRegex.test(line));
          
          if (parentIdx === -1) return false; // Parent not found

          // 2. Determine parent indentation
          const parentLine = lines[parentIdx];
          const parentIndent = parentLine.search(/\S/); // Index of first non-whitespace char

          // 3. Scan subsequent lines
          for (let i = parentIdx + 1; i < lines.length; i++) {
            const line = lines[i];
            
            // Skip empty lines or comments
            if (!line.trim() || line.trim().startsWith('#')) continue;

            const currentIndent = line.search(/\S/);
            
            // If we hit a line with same or less indentation than parent, the block has ended
            // (Note: This is a simplified check; JSON works differently but usually has braces. 
            // For mixed support we assume standard indentation for YAML/readable JSON)
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
            errors.push("Missing required key in 'train': 'data'");
          }
        }

        if (!hasTopLevelKey('sweeper')) {
          errors.push("Missing top-level key: 'sweeper'");
        } else {
           // Only check nested if parent exists
           if (!hasNestedKey('sweeper', 'study_name')) {
             errors.push("Missing required key in 'sweeper': 'study_name'");
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
    </div>
  );
};

export default LaunchTrainingView;