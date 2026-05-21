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

// === API CONFIGURATION ===

export const UPLOAD_API_CONFIG = {
  url: `${import.meta.env.VITE_API_URL || 'http://192.168.1.137:23442'}/train`,
  method: 'POST'
};

// Dashboard API Configuration
const API_BASE = import.meta.env.VITE_API_URL || 'http://192.168.1.137:23442';

export const DASHBOARD_API_CONFIG = {
  activeWorkers: {
    url: `${API_BASE}/workers/count`,
    method: 'GET'
  },
  gpuUtil: {
    url: `${API_BASE}/metrics/gpu`,
    method: 'GET'
  },
  queueDepth: {
    url: `${API_BASE}/tasks/count`,
    method: 'GET'
  },
  storageUsed: {
    url: `${API_BASE}/metrics/storage`,
    method: 'GET'
  },
  activeJobs: {
    url: `${API_BASE}/tasks/active`,
    method: 'GET'
  },
  redisMemory: {
    url: `${API_BASE}/metrics/redis`,
    method: 'GET'
  },
  minioBandwidth: {
    url: `${API_BASE}/metrics/storage`,
    method: 'GET'
  },
  estCompletion: {
    url: `${API_BASE}/tasks/active`,
    method: 'GET'
  }
};

// === DEFAULT DATA ===

export const DEFAULT_USERS: UserProfile[] = [
  { id: 'u1', name: 'Wisrovi Rodriguez', email: 'wisrovi@darwin-ops.ai', role: 'admin' },
  { id: 'u2', name: 'Guest Researcher', email: 'guest@darwin-ops.ai', role: 'dev' },
  { id: 'u3', name: 'AI Worker Bot', email: 'bot-01@darwin-ops.ai', role: 'dev' },
];

export const DEFAULT_PROJECTS: ProjectDefinition[] = [
  { id: 'p1', name: 'wTicketFlow', description: 'The modern, secure and efficient solution for backend-free ticket management.', createdAt: '2025-11-01' },
  { id: 'p2', name: 'wDarwin Ops', description: 'The Next Generation of AI Training Orchestration', createdAt: '2025-12-15' },
  { id: 'p3', name: 'wAgents', description: 'Fully equipped work environment for AI development', createdAt: '2025-11-15' },
  { id: 'p4', name: 'NexusFlow', description: 'Organizational Diagnostic System', createdAt: '2025-12-01' },
];


const MLFLOW_TRACKING_URI = import.meta.env.VITE_MLFLOW_TRACKING_URI || 'http://192.168.1.137:23435/';
const REDIS_TRACKING_URL = import.meta.env.VITE_REDIS_TRACKING_URL || 'http://192.168.1.137:23438/';
const FILEBROWSER_URL = import.meta.env.VITE_FILEBROWSER_URL || 'http://192.168.1.137:23448/';

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
  // {
  //   id: 'minio',
  //   name: 'MinIO Storage',
  //   description: 'Object storage for datasets and model weights',
  //   url: `${import.meta.env.REDIS_TRACKING_URL || 'http://localhost:23439'}`,
  //   icon: <HardDrive size={20} />,
  // },
  {
    id: 'redis',
    name: 'Redis Queue',
    description: 'Job orchestration and task scheduling status',
    url: REDIS_TRACKING_URL,
    icon: <Layers size={20} />,
    minRole: 'admin'
  },
  {
    id: 'datasets',
    name: 'Datasets',
    description: 'File Browser for Training Data management',
    url: FILEBROWSER_URL,
    icon: <FolderOpen size={20} />,
  },
  
  // {
  //   id: 'genetic-opt',
  //   name: 'Genetic Optimization',
  //   description: 'Hyperparameter tuning with evolutionary algorithms',
  //   url: 'about:blank',
  //   icon: <Brain size={20} />,
  //   minRole: 'admin'
  // },
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
  bio: "Specialized in AI Infrastructure and Orchestration. Creator of WDarwin Ops, an advanced system for centralized YOLO training using Genetic Algorithms, Ray Tune, and distributed computing patterns.",
  location: "Bogotá, Colombia",
  linkedin: "https://www.linkedin.com/in/wisrovi-rodriguez/",
  linkedinSearch: "https://www.linkedin.com/in/wisrovi-rodriguez/",
  avatarUrl: "https://media.licdn.com/dms/image/v2/D4E03AQFvEdF-sFaNAg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1713247892716?e=1766016000&v=beta&t=t1VItss12ESC48cGJxrfp183GXvka8FbZ9oStnbfM28" 
};

export const PRESENTATION_SLIDES = [
  {
    title: "Welcome to WDarwin Ops",
    subtitle: "Evolutionary Intelligence",
    content: "An advanced orchestration platform designed for high-performance AI lifecycles. 'Darwin' represents the system's core philosophy: models are not just trained; they are evolved through genetic selection, ensuring only the fittest hyperparameters survive.",
    icon: "logo"
  },
  {
    title: "System Architecture",
    subtitle: "Centralized Brain, Distributed Muscle",
    content: "A Hub-and-Spoke architecture where the central server dispatches training jobs to remote worker nodes (The Hive). It ensures data consistency and unified monitoring across the entire training fleet.",
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
    content: "WDarwin Ops applies biological principles to machine learning. By utilizing mutation, crossover, and selection, the system automatically discovers the optimal hyperparameters for your specific dataset.",
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
    title: "The Hive Queue",
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
  "[HIVE-01] GPU 0 allocated for Trial #4a2b9",
  "[REDIS] Queue depth: 14 jobs pending",
  "[MLFLOW] Experiment 'yolo-v8-base' created",
  // "[MINIO] Downloading dataset 'coco-2017-subset.zip' (2.4GB)",
  // "[GENETIC] Generation 4 complete. Best fitness: 0.894 mAP",
  "[WARN] Node-03 high memory usage (92%)",
  "[SYSTEM] Auto-scaling trigger: requesting 2 spot instances",
];