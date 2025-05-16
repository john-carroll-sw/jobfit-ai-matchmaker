import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the state type
interface LoaderState {
  loadingStack: string[]; // Array of identifiers (API keys, action names, etc.)
}

// Initial state with type
const initialState: LoaderState = {
  loadingStack: [],
};

// Create the slice with TypeScript types
const loaderSlice = createSlice({
  name: "loader",
  initialState,
  reducers: {
    startLoader: (state, action: PayloadAction<string>) => {
      state.loadingStack.push(action.payload); // Add an identifier to track loading
    },
    stopLoader: (state, action: PayloadAction<string>) => {
      state.loadingStack = state.loadingStack.filter(
        (item) => item !== action.payload
      );
    },
  },
});

// Export actions and reducer
export const { startLoader, stopLoader } = loaderSlice.actions;
export default loaderSlice.reducer;
