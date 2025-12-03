import { ReactNode } from 'react';

export interface Microservice {
  id: string;
  name: string;
  description: string;
  url: string; // The URL of the microservice to load
  icon: ReactNode;
}

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}
