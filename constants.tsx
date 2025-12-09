import React from 'react';
import { 
  Activity, 
  Users, 
  Settings, 
  Database,
  Cpu, 
  Server, 
  GitBranch, 
  Layers,
  Brain,
  HardDrive,
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  Rocket, 
  Info,
  Library
} from 'lucide-react';
import { Microservice, UserProfile, ProjectDefinition } from './types';

export const APP_NAME = "WDarwin Ops";

// Helper for safe environment variable access
const getEnv = (key: string, fallback: string) => {
  try {
    // Verificación defensiva para evitar el error "Cannot read properties of undefined"
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || fallback;
    }
    return fallback;
  } catch (e) {
    console.warn(`Environment variable access failed for ${key}, using fallback.`);
    return fallback;
  }
};

const API_BASE = getEnv('VITE_API_URL', 'http://localhost:5809');
const UPLOAD_API_BASE = getEnv('VITE_API_URL', 'http://neuroforge-api:8000');

// === API CONFIGURATION ===

export const UPLOAD_API_CONFIG = {
  url: `${UPLOAD_API_BASE}/posts`,
  method: 'POST'
};

// Dashboard API Configuration
export const DASHBOARD_API_CONFIG = {
  activeWorkers: {
    url: `${API_BASE}/posts`,
    method: 'POST',
    payload: { metric: "workers", query: "count_active_nodes" }
  },
  gpuUtil: {
    url: `${API_BASE}/posts`,
    method: 'POST',
    payload: { metric: "gpu", query: "avg_gpu_utilization" }
  },
  queueDepth: {
    url: `${API_BASE}/posts`,
    method: 'POST',
    payload: { metric: "queue", query: "redis_queue_length" }
  },
  storageUsed: {
    url: `${API_BASE}/posts`,
    method: 'POST',
    payload: { metric: "storage", query: "minio_bucket_size" }
  },
  activeJobs: {
    url: `${API_BASE}/posts`,
    method: 'POST',
    payload: { metric: "jobs_list", status: "running", limit: 5 }
  },
  redisMemory: {
    url: `${API_BASE}/posts`,
    method: 'POST',
    payload: { metric: "redis_mem", instance: "primary_cache" }
  },
  minioBandwidth: {
    url: `${API_BASE}/posts`,
    method: 'POST',
    payload: { metric: "minio_bw", bucket: "training_data" }
  },
  estCompletion: {
    url: `${API_BASE}/posts`,
    method: 'POST',
    payload: { metric: "eta", job_ids: "active" }
  }
};

// === DEFAULT DATA ===

export const DEFAULT_USERS: UserProfile[] = [
  { id: 'u1', name: 'Wisrovi Rodriguez', email: 'wisrovi@neuroforge.ai', role: 'admin' },
  { id: 'u2', name: 'Guest Researcher', email: 'guest@neuroforge.ai', role: 'dev' },
];

export const DEFAULT_PROJECTS: ProjectDefinition[] = [
  { id: 'p1', name: 'wTicketFlow', description: 'The modern, secure and efficient solution for backend-free ticket management.', createdAt: '2025-11-01' },
  { id: 'p2', name: 'NeuralForgeAI', description: 'The Next Generation of AI Training Orchestration', createdAt: '2025-12-15' },
  { id: 'p3', name: 'wAgents', description: 'Fully equipped work environment for AI development', createdAt: '2025-11-15' },
  { id: 'p4', name: 'NexusFlow', description: 'Organizational Diagnostic System', createdAt: '2025-12-01' },
];

const MLFLOW_TRACKING_URI = getEnv('MLFLOW_TRACKING_URI', 'http://localhost:23435');
const REDIS_TRACKING_URL = getEnv('REDIS_TRACKING_URL', 'http://localhost:23439');
const FILEBROWSER_URL = getEnv('FILEBROWSER_URL', 'http://localhost:23443');

export const DEFAULT_MICROSERVICES: Microservice[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Cluster overview and telemetry',
    url: 'internal:dashboard',
    icon: <LayoutDashboard size={20} />,
  },
  {
    id: 'launch-training', 
    name: 'Launch Training',
    description: 'Deploy new experiments to the cluster',
    url: 'internal:launch',
    icon: <Rocket size={20} />,
  },
  {
    id: 'projects',
    name: 'Project Registry',
    description: 'Manage experiment namespaces',
    url: 'internal:projects',
    icon: <Library size={20} />,
    minRole: 'admin'
  },
  {
    id: 'api-docs',
    name: 'API Reference',
    description: 'REST API documentation for orchestration',
    url: 'internal:docs',
    icon: <BookOpen size={20} />,
    minRole: 'admin'
  },
  {
    id: 'training-monitor',
    name: 'Training Monitor',
    description: 'Real-time loss curves and GPU utilization metrics',
    url: 'https://en.wikipedia.org/wiki/Data_visualization', 
    icon: <Activity size={20} />,
    minRole: 'admin'
  },
  {
    id: 'mlflow',
    name: 'MLflow Tracking',
    description: 'Experiment logging, metrics, and artifact storage',
    url: MLFLOW_TRACKING_URI,
    icon: <GitBranch size={20} />,
  },
  {
    id: 'redis',
    name: 'Redis Queue',
    description: 'Job orchestration and task scheduling status',
    url: REDIS_TRACKING_URL,
    icon: <Layers size={20} />,
  },
  {
    id: 'datasets',
    name: 'Datasets',
    description: 'File Browser for Training Data management',
    url: FILEBROWSER_URL,
    icon: <FolderOpen size={20} />,
  },  
  {
    id: 'users',
    name: 'Team Access',
    description: 'User Registry and Role Management',
    url: 'internal:users',
    icon: <Users size={20} />,
    minRole: 'admin'
  },
  {
    id: 'about',
    name: 'About',
    description: 'Developer profile and system info',
    url: 'internal:about',
    icon: <Info size={20} />,
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Global API keys, Ray Tune, and env variables',
    url: 'internal:settings', 
    icon: <Settings size={20} />,
  },
];

export const DEVELOPER_PROFILE = {
  name: "Wisrovi Rodríguez",
  title: "Software Engineer & System Architect",
  bio: "Specialized in AI Infrastructure and Orchestration. Creator of NeuroForge, an advanced system for centralized YOLO training using Genetic Algorithms, Ray Tune, and distributed computing patterns.",
  location: "Bogotá, Colombia",
  linkedin: "https://www.linkedin.com/in/wisrovi-rodriguez/",
  linkedinSearch: "https://www.linkedin.com/in/wisrovi-rodriguez/",
  avatarUrl: "https://media.licdn.com/dms/image/v2/D4E03AQFvEdF-sFaNAg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1713247892716?e=1766016000&v=beta&t=t1VItss12ESC48cGJxrfp183GXvka8FbZ9oStnbfM28" 
};

export const PRESENTATION_SLIDES = [
  {
    title: "Welcome to WDarwin Ops",
    subtitle: "The Next Generation of AI Training Orchestration",
    content: "WDarwin Ops is a centralized command center designed to orchestrate complex YOLO model training across distributed GPU clusters. It bridges the gap between raw compute power and intelligent model evolution.",
    icon: "logo"
  },
  {
    title: "System Architecture",
    subtitle: "Centralized Brain, Distributed Muscle",
    content: "A Hub-and-Spoke architecture where the central WDarwin Ops server dispatches training jobs to remote worker nodes. It ensures data consistency and unified monitoring across the entire training fleet.",
    icon: "server"
  },
  {
    title: "YOLO Integration",
    subtitle: "Advanced Object Detection Pipelines",
    content: "Native support for YOLOv8 and YOLOv11 architectures. The system handles dataset formatting, anchor box calculation, and automated validation inference pipelines seamlessly.",
    icon: "eye"
  },
  {
    title: "Genetic Algorithms",
    subtitle: "Evolutionary Hyperparameter Optimization",
    content: "WDarwin Ops doesn't just train; it evolves. By applying genetic algorithms (mutation, crossover, selection), the system automatically discovers the optimal hyperparameters for your specific dataset.",
    icon: "dna"
  },
  {
    title: "Ray Tune or Optuna & Scalability",
    subtitle: "Massive Parallelism",
    content: "Leveraging Ray Tune for scalable hyperparameter tuning. The system can run hundreds of concurrent trials, efficiently pruning underperforming models to save GPU hours.",
    icon: "zap"
  },
  {
    title: "Data Backbone",
    subtitle: "MinIO & Redis",
    content: "Built on a rock-solid foundation. MinIO handles high-performance object storage for massive datasets and model weights, while Redis acts as the high-speed broker for job queues and real-time state management.",
    icon: "database"
  },
  {
    title: "MLflow Tracking",
    subtitle: "Full Lifecycle Visibility",
    content: "Every experiment, every metric, and every artifact is automatically logged to MLflow. Compare loss curves, visualize confusion matrices, and rollback to any previous model version instantly.",
    icon: "activity"
  },
  {
    title: "Task Queue System",
    subtitle: "Robust Job Scheduling",
    content: "An intelligent priority queue system that handles job preemption, retries on failure, and load balancing across available GPU resources to ensure maximum cluster utilization.",
    icon: "layers"
  },
  {
    title: "API-First Design",
    subtitle: "Automate the Automation",
    content: "A comprehensive REST API allows for external triggering of training jobs, status polling, and integration with CI/CD pipelines for continuous model deployment.",
    icon: "code"
  },
  {
    title: "The Architect",
    subtitle: "Wisrovi Rodríguez",
    content: "Software Engineer & System Architect. Expert in Microservices, AI Infrastructure, and Full-Stack Development. Dedicated to building tools that empower the next wave of AI innovation.",
    isProfile: true
  }
];

export const MOCK_LOGS = [
  "[SYSTEM] Initializing Ray Cluster connection...",
  "[WORKER-01] GPU 0 allocated for Trial #4a2b9",
  "[REDIS] Queue depth: 14 jobs pending",
  "[MLFLOW] Experiment 'yolo-v8-base' created",
  "[WARN] Node-03 high memory usage (92%)",
  "[SYSTEM] Auto-scaling trigger: requesting 2 spot instances",
];