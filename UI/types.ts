import { ReactNode } from 'react';

export type UserRole = 'admin' | 'guest';

export interface Microservice {
  id: string;
  name: string;
  description: string;
  url: string; // The URL of the microservice to load
  icon: ReactNode;
  minRole?: UserRole; // If undefined, accessible by all
}

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'dev';
  avatar?: string;
}

export interface ProjectDefinition {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}
