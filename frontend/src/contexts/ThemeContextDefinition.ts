import { createContext } from 'react';

// Type for the theme context
export type ThemeContextType = {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
};

// Create the context with a default value
export const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  toggleTheme: () => {},
});
