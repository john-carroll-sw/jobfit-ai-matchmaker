// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';  // Import rootReducer

// Configure and export the store
export const store = configureStore({
  reducer: rootReducer,  // Use rootReducer here
});

// Export RootState and AppDispatch for type safety
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
