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
  FolderOpen
} from 'lucide-react';
import { Microservice } from './types';

export const APP_NAME = "NeuroForge AI";

export const DEFAULT_MICROSERVICES: Microservice[] = [
  {
    id: 'dashboard',
    name: 'Command Center',
    description: 'Cluster overview and telemetry',
    url: 'internal:dashboard',
    icon: <LayoutDashboard size={20} />,
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
    url: 'about:blank',
    icon: <GitBranch size={20} />,
  },
  {
    id: 'minio',
    name: 'MinIO Storage',
    description: 'Object storage for datasets and model weights',
    url: 'about:blank',
    icon: <HardDrive size={20} />,
    minRole: 'admin'
  },
  {
    id: 'redis',
    name: 'Redis Queue',
    description: 'Job orchestration and task scheduling status',
    url: 'about:blank',
    icon: <Layers size={20} />,
  },
  {
    id: 'datasets',
    name: 'Datasets',
    description: 'File Browser for Training Data management',
    url: 'about:blank',
    icon: <FolderOpen size={20} />,
  },
  {
    id: 'genetic-opt',
    name: 'Genetic Optimization',
    description: 'Hyperparameter tuning with evolutionary algorithms',
    url: 'about:blank',
    icon: <Brain size={20} />,
    minRole: 'admin'
  },
  {
    id: 'users',
    name: 'Team Access',
    description: 'RBAC for data scientists and engineers',
    url: 'https://jsonplaceholder.typicode.com/users',
    icon: <Users size={20} />,
    minRole: 'admin'
  },
  {
    id: 'settings',
    name: 'System Config',
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
  avatarUrl: "" 
};

export const PRESENTATION_SLIDES = [
  {
    title: "Welcome to NeuroForge AI",
    subtitle: "The Next Generation of AI Training Orchestration",
    content: "NeuroForge is a centralized command center designed to orchestrate complex YOLO model training across distributed GPU clusters. It bridges the gap between raw compute power and intelligent model evolution.",
    icon: "logo"
  },
  {
    title: "System Architecture",
    subtitle: "Centralized Brain, Distributed Muscle",
    content: "A Hub-and-Spoke architecture where the central NeuroForge server dispatches training jobs to remote worker nodes. It ensures data consistency and unified monitoring across the entire training fleet.",
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
    content: "NeuroForge doesn't just train; it evolves. By applying genetic algorithms (mutation, crossover, selection), the system automatically discovers the optimal hyperparameters for your specific dataset.",
    icon: "dna"
  },
  {
    title: "Ray Tune & Scalability",
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
  "[MINIO] Downloading dataset 'coco-2017-subset.zip' (2.4GB)",
  "[GENETIC] Generation 4 complete. Best fitness: 0.894 mAP",
  "[WARN] Node-03 high memory usage (92%)",
  "[SYSTEM] Auto-scaling trigger: requesting 2 spot instances",
];