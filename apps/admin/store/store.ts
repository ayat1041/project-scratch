import { combineReducers, configureStore } from '@reduxjs/toolkit';

// -----o----- reducers -----o----- //
// import toolReducer from './submit-ai';
import userReducer from './user-info';
// -----x----- reducers -----x----- //

const rootReducer = combineReducers({
  // tool: toolReducer,
  user: userReducer,
});

// Synchronously load state from localStorage to avoid flash
let initialState = null;
if (typeof window !== 'undefined') {
  try {
    const serializedState = localStorage.getItem('reduxState');
    if (serializedState) {
      initialState = JSON.parse(serializedState);
    }
  } catch (error) {
    // Silently fail if localStorage is corrupted
    initialState = null;
  }
}

export const store = configureStore({
  reducer: rootReducer,
  ...(initialState && { preloadedState: initialState }),
});

// Subscribe to store changes to persist to localStorage
store.subscribe(() => {
  try {
    if (typeof window !== 'undefined') {
      const state = store.getState();
      // Only persist user state to avoid storing unnecessary data
      const persistedState = {
        user: state.user,
      };
      localStorage.setItem('reduxState', JSON.stringify(persistedState));
    }
  } catch (error) {
    // Silently fail if localStorage is not available
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
