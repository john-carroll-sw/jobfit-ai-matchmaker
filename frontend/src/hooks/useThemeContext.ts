import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContextDefinition';

export const useTheme = () => useContext(ThemeContext);
