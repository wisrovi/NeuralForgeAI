import React, { useState, useRef, useEffect } from 'react';
import { Rocket, File, FileCode, CheckCircle, AlertCircle, Loader2, X, Info, UploadCloud, HardDrive, ShieldAlert, Search, Server, Clock, Activity, Flame, Calendar } from 'lucide-react';
import { UPLOAD_API_CONFIG } from '../constants';
import { UserProfile, ProjectDefinition, UserRole } from '../types';
import SearchableSelect from './SearchableSelect';
import WorkerFleetSelector from './WorkerFleetSelector';
import PipelineProgressViewer from './PipelineProgressViewer';
import StudyResultsViewer from './StudyResultsViewer';
import SmartConfigBuilder from './SmartConfigBuilder';
import LiveTrainingTelemetry from './LiveTrainingTelemetry';
import DatasetPreflightHealth from './DatasetPreflightHealth';
import YamlFileInspector, { inspectYamlContent, YamlParsedData } from './YamlFileInspector';

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
  const [startAt, setStartAt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [parsedDataPath, setParsedDataPath] = useState<string>('');
  const [parsedYaml, setParsedYaml] = useState<YamlParsedData>({});
  const [isYamlValid, setIsYamlValid] = useState<boolean>(true);
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
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Helper to format Date to YYYY-MM-DDTHH:mm for datetime-local input
  const formatDatetimeLocal = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Pre-select first user and project as sensible defaults if unselected
  useEffect(() => {
    if (!selectedUserId && users && users.length > 0) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const minDatetime = formatDatetimeLocal(new Date());

  const handleQuickSchedule = (hoursAhead: number) => {
    const target = new Date(Date.now() + hoursAhead * 3600 * 1000);
    setStartAt(formatDatetimeLocal(target));
  };

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

        // Validation Rules: Only train.data is strictly mandatory.
        // model, style/task, and sweeper resolve to smart platform defaults if omitted.
        if (!hasTopLevelKey('train')) {
          errors.push("Missing top-level key: 'train'");
        } else {
          if (!hasNestedKey('train', 'data')) {
            errors.push("Missing required nested key: 'train' > 'data'");
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

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      setFile(selectedFile);
      setFileContent(content);

      const diag = inspectYamlContent(content);
      setIsYamlValid(diag.isValid);
      setValidationErrors(diag.errors);
      setParsedDataPath(diag.parsed.dataPath || '');
      setParsedYaml(diag.parsed);

      // Smart match author to existing users
      const authorMatch = content.match(/author:\s*["']?([^"'\n\r#]+)["']?/i);
      if (authorMatch && authorMatch[1] && users && users.length > 0) {
        const authorClean = authorMatch[1].trim().toLowerCase();
        const matchedUser = users.find(u => 
          u.name.toLowerCase().includes(authorClean) || authorClean.includes(u.name.toLowerCase())
        );
        if (matchedUser) {
          setSelectedUserId(matchedUser.id);
        }
      }

      // Smart match project from data path if present
      if (diag.parsed.dataPath && projects && projects.length > 0) {
        const pathParts = diag.parsed.dataPath.split('/').filter(Boolean);
        if (pathParts.length >= 2 && pathParts[0] === 'datasets') {
          const projectFolder = pathParts[1].toLowerCase();
          const matchedProj = projects.find(p => 
            p.name.toLowerCase() === projectFolder || 
            p.name.toLowerCase().includes(projectFolder) ||
            projectFolder.includes(p.name.toLowerCase())
          );
          if (matchedProj) {
            setSelectedProjectId(matchedProj.id);
          }
        }
      }
    };
    reader.onerror = () => {
      setFile(selectedFile);
      setFileContent('');
      setIsYamlValid(false);
      setValidationErrors(["Error al leer el contenido del archivo en el navegador."]);
    };
    reader.readAsText(selectedFile);
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

  const startPolling = (id: string) => {
    setStudyQueryId(id);
    const baseUrl = UPLOAD_API_CONFIG.url.replace('/train', '');
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${baseUrl}/study/${id}`);
        if (res.ok) {
          const data = await res.json();
          setStudyDetail(data);
          setStudyStatus('success');
          const terminalStates = ['COMPLETED', 'SUCCESS', 'FAILURE', 'REVOKED'];
          if (terminalStates.includes(data.state) || terminalStates.includes(data.status)) {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        clearInterval(pollInterval);
      }
    }, 3000);
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
    if (startAt.trim()) {
      formData.append('start_at', startAt.trim());
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

      // Poll study status until completion
      startPolling(data.study_id);

      setTimeout(() => {
        setFile(null);
        setStartAt('');
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
  const handleLaunchAdvancedSmokeTest = async () => {
    setUploadStatus('uploading');
    setResponseMsg('');
    setValidationErrors([]);

    const configs = [
      {
        name: 'colorball_classification.yaml',
        yaml: `model: yolo26n-cls.pt
type: yolo
train:
  batch: -1
  data: "/examples/colorball.v8i.multiclass/"
  epochs: 5
  imgsz: 640
  plots: false
sweeper:
  version: 1
  algorithm: optuna
  direction: maximize
  study_name: "color_ball_classification"
  fitness: "metrics/accuracy_top1"
  tune: false
  sampler: "TPESampler"
  n_trials: 1
  search_space:
    model: [ "choice", "yolov8n-cls.pt" ]
    train:
      imgsz: [ "choice", 416 ]
      lr0: [ "loguniform", 1e-5, 1e-2 ]
extras:
  gpu:
    id: 0
    limit: 0.95
metadata:
  content: "Prueba avanzada de humo de clasificación."
  author: "Smoke Test Runner"
  documentation: "Prueba avanzada de humo."
`
      },
      {
        name: 'component_detection.yaml',
        yaml: `model: yolo26n.pt
type: yolo
train:
  batch: -1
  data: "/examples/Deteksi komponen elektronik.v1i.yolov8/data.yaml"
  epochs: 2
  imgsz: 640
  plots: true
sweeper:
  version: 1
  algorithm: optuna
  direction: maximize
  study_name: "component_detection"
  fitness: "metrics/mAP50"
  tune: false
  sampler: "TPESampler"
  n_trials: 1
  search_space:
    model: [ "choice", "yolov8n.pt" ]
    train:
      imgsz: [ "choice", 416 ]
      lr0: [ "loguniform", 1e-5, 1e-2 ]
extras:
  gpu:
    id: 0
    limit: 0.95
metadata:
  content: "Prueba avanzada de humo de detección."
  author: "Smoke Test Runner"
  documentation: "Prueba avanzada de humo."
`
      },
      {
        name: 'architecture_segmentation.yaml',
        yaml: `model: yolo26n-seg.pt
type: yolo
train:
  batch: -1
  data: "/examples/ArchitecturePlan/data.yaml"
  epochs: 2
  imgsz: 640
  plots: true
sweeper:
  version: 1
  algorithm: optuna
  direction: maximize
  study_name: "architecture_segmentation"
  fitness: "metrics/mAP50(M)"
  tune: false
  sampler: "TPESampler"
  n_trials: 1
  search_space:
    model: [ "choice", "yolov8n-seg.pt" ]
    train:
      imgsz: [ "choice", 416 ]
      lr0: [ "loguniform", 1e-5, 1e-2 ]
extras:
  gpu:
    id: 0
    limit: 0.95
metadata:
  content: "Prueba avanzada de humo de segmentación."
  author: "Smoke Test Runner"
  documentation: "Prueba avanzada de humo."
`
      }
    ];

    try {
      const studyIds: string[] = [];
      for (const config of configs) {
        const blob = new Blob([config.yaml], { type: 'application/x-yaml' });
        const smokeFile = new window.File([blob], config.name, { type: 'application/x-yaml' });

        const formData = new FormData();
        formData.append('config_file', smokeFile);
        formData.append('mode', 'public');
        formData.append('priority', 'low');

        console.log(`Sending advanced smoke test request for ${config.name} to URL:`, UPLOAD_API_CONFIG.url);
        const response = await fetch(UPLOAD_API_CONFIG.url, {
          method: UPLOAD_API_CONFIG.method,
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || `Upload failed for ${config.name}`);
        }
        studyIds.push(data.study_id);
      }

      setUploadStatus('success');
      setResponseMsg(`Advanced smoke test submitted successfully. Study IDs: ${studyIds.join(', ')}`);
      
      // Auto-fill query ID with the last study ID for status tracking
      setStudyQueryId(studyIds[studyIds.length - 1]);
      
      alert(`Advanced smoke test successfully launched!\nStudies: ${studyIds.join(', ')}`);
      
      setTimeout(() => {
        studyCheckerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      // Poll study status until completion
      startPolling(studyIds[studyIds.length - 1]);

    } catch (error: any) {
      console.error('Advanced smoke test launch caught error:', error);
      setUploadStatus('error');
      setResponseMsg(error.message || 'Failed to launch advanced smoke test.');
      alert(`Error launching advanced smoke test:\n${error.message || error}`);
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

  const yamlTemplate = `# NeuralForge Minimal Smart Training Configuration
model: "yolo11n.pt"
style: "detect"  # Options: detect, segment, classify, pose, obb (auto-maps fitness metric)

# Data & Hyperparameters
train:
  data: "/datasets/AREPO/protesis/Detector_ProtesisSuperior_261061/data.yaml"
  epochs: 5
  # Note: 'batch' is omitted by default -> auto-benchmarked via AutoBatch on host GPU

# Sweeper (Optimization)
sweeper:
  study_name: "study_detect_yolo11n_v1"
  # Optional: defaults to direction: "maximize", sampler: "TPESampler", algorithm: "optuna"
  # n_trials: 1 (single trial by default when tune is false)`;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up pb-10">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            Launch Training
            {userRole === 'admin' && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleLaunchSmokeTest}
                  className="opacity-[0.08] hover:opacity-80 transition-all duration-300 p-1 text-gray-400 hover:text-blue-500 rounded cursor-pointer"
                  title="Launch Integration Smoke Test"
                >
                  <Activity size={16} className="animate-pulse" />
                </button>
                <button
                  type="button"
                  onClick={handleLaunchAdvancedSmokeTest}
                  className="opacity-[0.08] hover:opacity-80 transition-all duration-300 p-1 text-gray-400 hover:text-orange-500 rounded cursor-pointer"
                  title="Launch Advanced E2E Smoke Test (3 Datasets)"
                >
                  <Flame size={16} className="animate-pulse" />
                </button>
              </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                  <option value="public">Public (Shared Cluster Queue)</option>
                  <option value="private">Private (Dedicated GPU Worker)</option>
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

              {/* Scheduled Start Time (start_at) with Calendar Picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Calendar size={16} className="text-blue-500" />
                    Scheduled Start Time (Optional)
                  </label>
                  {startAt && (
                    <button
                      type="button"
                      onClick={() => setStartAt('')}
                      className="text-xs text-red-500 hover:underline flex items-center gap-1"
                    >
                      <X size={12} />
                      Quitar fecha
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input 
                    ref={dateInputRef}
                    type="datetime-local"
                    value={startAt}
                    min={minDatetime}
                    onChange={(e) => setStartAt(e.target.value)}
                    onClick={() => {
                      try {
                        dateInputRef.current?.showPicker();
                      } catch {
                        // ignore if showPicker not supported
                      }
                    }}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  />
                </div>
                {/* Quick Shortcuts */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px]">
                  <span className="text-gray-400">Atajos:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickSchedule(1)}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors"
                  >
                    +1 Hora
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSchedule(3)}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors"
                  >
                    +3 Horas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tonight = new Date();
                      tonight.setHours(22, 0, 0, 0);
                      if (tonight.getTime() <= Date.now()) {
                        tonight.setDate(tonight.getDate() + 1);
                      }
                      setStartAt(formatDatetimeLocal(tonight));
                    }}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors"
                  >
                    Esta noche (22:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(8, 0, 0, 0);
                      setStartAt(formatDatetimeLocal(tomorrow));
                    }}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors"
                  >
                    Mañana (08:00)
                  </button>
                </div>
              </div>
            </div>

            {/* Worker Fleet Selector (Visible in Private Mode) */}
            {mode === 'private' && (
              <div className="mb-6">
                <WorkerFleetSelector
                  selectedWorkerIp={workerName}
                  onSelectWorker={(ip) => setWorkerName(ip)}
                />
              </div>
            )}

            {/* Smart Config Studio & File Selector */}
            <div className="mb-6 space-y-4">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Configuración del Entrenamiento (YAML)
                </label>
              </div>

              {file && fileContent ? (
                <>
                  <YamlFileInspector
                    fileName={file.name}
                    fileSize={file.size}
                    rawContent={fileContent}
                    onClearFile={() => {
                      setFile(null);
                      setFileContent('');
                      setParsedDataPath('');
                      setParsedYaml({});
                      setValidationErrors([]);
                      setIsYamlValid(true);
                    }}
                  />

                  {/* Pre-Flight Dataset Health Inspector using the parsed data path */}
                  {isYamlValid && parsedDataPath && (
                    <div className="mt-4">
                      <DatasetPreflightHealth
                        dataPath={parsedDataPath}
                        modelName={parsedYaml.model || 'yolo11n.pt'}
                        batchSize={parsedYaml.batch || 16}
                        epochs={parsedYaml.epochs || 5}
                      />
                    </div>
                  )}
                </>
              ) : (
                <SmartConfigBuilder
                  onConfigFileGenerated={(f) => processFile(f)}
                  selectedWorkerIp={workerName || '192.168.1.68'}
                />
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

            {/* Validation & Requirements Callout when Launch is Disabled */}
            {(!file || !isYamlValid || !selectedUserId || !selectedProjectId) && uploadStatus !== 'uploading' && (
              <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-500" />
                <div className="flex-1">
                  <span className="font-semibold block mb-1">Para habilitar el botón "Launch Training Job", completa los siguientes requisitos:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] mt-2">
                    <div className={`flex items-center gap-1.5 ${selectedUserId ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400 font-medium'}`}>
                      {selectedUserId ? <CheckCircle size={13} className="text-green-500" /> : <AlertCircle size={13} className="text-amber-500" />}
                      <span>Desarrollador (Initiating User): {selectedUserId ? '✓ Asignado' : 'Falta seleccionar'}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${selectedProjectId ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400 font-medium'}`}>
                      {selectedProjectId ? <CheckCircle size={13} className="text-green-500" /> : <AlertCircle size={13} className="text-amber-500" />}
                      <span>Proyecto (Target Project): {selectedProjectId ? '✓ Asignado' : 'Falta seleccionar'}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${file ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400 font-medium'}`}>
                      {file ? <CheckCircle size={13} className="text-green-500" /> : <AlertCircle size={13} className="text-amber-500" />}
                      <span>Archivo YAML: {file ? '✓ Cargado' : 'Falta cargar'}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${isYamlValid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400 font-medium'}`}>
                      {isYamlValid ? <CheckCircle size={13} className="text-green-500" /> : <AlertCircle size={13} className="text-red-500" />}
                      <span>Estructura YAML: {isYamlValid ? '✓ Válida' : 'Con errores'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!file || !isYamlValid || !selectedUserId || !selectedProjectId || uploadStatus === 'uploading'}
              title={
                !file ? 'Debes seleccionar o subir un archivo YAML' :
                !isYamlValid ? 'El archivo YAML contiene errores estructurales' :
                !selectedUserId ? 'Debes seleccionar el Desarrollador (Initiating User)' :
                !selectedProjectId ? 'Debes seleccionar el Proyecto de destino (Target Project)' :
                'Listo para desplegar el entrenamiento en el cluster'
              }
              className={`
                w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2.5 transition-all duration-200
                ${!file || !isYamlValid || !selectedUserId || !selectedProjectId || uploadStatus === 'uploading'
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
          <div className="animate-fade-in space-y-6">
            {/* Visual WPipe Pipeline Lifecycle */}
            <PipelineProgressViewer
              studyState={studyDetail.state}
              activeTask={studyDetail.active_task?.name}
              activeInvoker={studyDetail.active_worker}
              resultsData={studyDetail.results_data}
              errorData={studyDetail.error_data}
            />

            {/* Live Training Telemetry & Real-Time Loss Curves */}
            <LiveTrainingTelemetry
              studyId={studyDetail.study_id}
              studyName={studyDetail.study_name}
              activeWorker={studyDetail.active_worker || '192.168.1.68'}
              currentEpoch={studyDetail.state === 'COMPLETED' ? (studyDetail.config?.train?.epochs || 5) : 3}
              totalEpochs={studyDetail.config?.train?.epochs || 5}
              etaSeconds={studyDetail.eta || 45}
              isCompleted={studyDetail.state === 'COMPLETED' || !!studyDetail.results_data}
              fitnessValue={studyDetail.result?.best_value ?? studyDetail.results_data?.best_value ?? studyDetail.results_data?.fitness ?? studyDetail.results_data?.accuracy ?? 0.5122}
              mlflowUrl={studyDetail.mlflow_url || studyDetail.results_data?.mlflow_url}
              realMetrics={studyDetail.real_metrics || studyDetail.results_data?.real_metrics}
            />

            {/* Results Scorecard & Dual Audience Viewer */}
            <StudyResultsViewer
              studyId={studyDetail.study_id}
              studyName={studyDetail.study_name}
              resultsData={studyDetail.results_data}
              result={studyDetail.result}
              config={studyDetail.config}
              errorData={studyDetail.error_data}
            />

            {/* Advanced Technical Inspection Details */}
            <details className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
              <summary className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer flex items-center justify-between select-none">
                <span className="flex items-center gap-2">
                  <Server size={14} className="text-blue-500" />
                  Inspección Técnica Detallada (Nodos, Configuración RAW, Traza)
                </span>
                <span className="text-[11px] font-mono text-gray-400">UUID: {studyDetail.study_id}</span>
              </summary>
              
              <div className="mt-4 space-y-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500 font-mono block text-[11px] mb-0.5">Invoker Activo / Último:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{studyDetail.active_worker || 'N/A (Finalizado o en Cola)'}</span>
                  </div>
                  {studyDetail.all_invokers && (
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="text-gray-500 font-mono block text-[11px] mb-0.5">Participantes de la Red:</span>
                      <span className="text-gray-800 dark:text-gray-200">{studyDetail.all_invokers.join(', ')}</span>
                    </div>
                  )}
                </div>

                {studyDetail.config && (
                  <div>
                    <span className="text-gray-500 font-mono block mb-1">Configuración Cruda (YAML/JSON):</span>
                    <pre className="p-3 bg-gray-900 text-green-400 rounded-lg overflow-x-auto max-h-48 text-[11px] font-mono">
                      {JSON.stringify(studyDetail.config, null, 2)}
                    </pre>
                  </div>
                )}

                {studyDetail.traceback && (
                  <div>
                    <span className="text-red-500 font-mono block mb-1">Traza de Error:</span>
                    <pre className="p-3 bg-red-950/40 text-red-300 border border-red-800 rounded-lg overflow-x-auto max-h-48 text-[11px] font-mono whitespace-pre-wrap">
                      {studyDetail.traceback}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </div>

    </div>
  );
};

export default LaunchTrainingView;