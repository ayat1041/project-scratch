import { combineReducers, configureStore } from '@reduxjs/toolkit';

// -----o----- reducers -----o----- //
// import toolReducer from './submit-ai';
import userReducer from './user-info';
// -----x----- reducers -----x----- //

const REDUX_STORAGE_KEY = 'reduxState:v1';
const LEGACY_REDUX_STORAGE_KEY = 'reduxState';

const rootReducer = combineReducers({
  // tool: toolReducer,
  user: userReducer,
});

type PersistedReduxState = {
  user: ReturnType<typeof userReducer>;
};

// Synchronously load state from localStorage to avoid flash
let initialState: PersistedReduxState | null = null;

if (typeof window !== 'undefined') {
  try {
    const serializedState = localStorage.getItem(REDUX_STORAGE_KEY);

    if (serializedState) {
      initialState = JSON.parse(serializedState) as PersistedReduxState;
    }

    // Optional cleanup for the old unversioned key.
    localStorage.removeItem(LEGACY_REDUX_STORAGE_KEY);
  } catch {
    initialState = null;
    localStorage.removeItem(REDUX_STORAGE_KEY);
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
      const persistedState: PersistedReduxState = {
        user: state.user,
      };

      localStorage.setItem(
        REDUX_STORAGE_KEY,
        JSON.stringify(persistedState),
      );
    }
  } catch {
    // Silently fail if localStorage is not available
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;