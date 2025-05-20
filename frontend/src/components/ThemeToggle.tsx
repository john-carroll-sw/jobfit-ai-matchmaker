import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Dark mode icon
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Light mode icon
import { useTheme } from '../hooks/useThemeContext';

export const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useTheme();

  return (
    <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
      <IconButton
        onClick={toggleTheme}
        color="primary"
        aria-label="toggle dark/light mode"
        sx={{
          background: mode === 'dark' 
            ? 'rgba(93, 95, 239, 0.15)' 
            : 'rgba(74, 74, 244, 0.1)',
          padding: 1.2,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'rotate(20deg) scale(1.1)',
            background: mode === 'dark' 
              ? 'rgba(93, 95, 239, 0.25)'
              : 'rgba(74, 74, 244, 0.15)',
          },
        }}
      >
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
};
