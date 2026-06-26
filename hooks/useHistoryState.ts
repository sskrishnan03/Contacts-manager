import { useState, useCallback } from 'react';

// Define the structure for a single history entry, now with a descriptive label
type HistoryEntry<T> = {
  state: T;
  label: string;
};

// Define the structure for the entire history state
type HistoryState<T> = {
  past: HistoryEntry<T>[];
  present: HistoryEntry<T>;
  future: HistoryEntry<T>[];
};

/**
 * A custom hook for managing state with undo/redo functionality.
 * @param initialPresent The initial state value.
 * @param initialLabel A descriptive label for the initial state.
 */
export const useHistoryState = <T>(initialPresent: T, initialLabel: string = 'Initial State') => {
  const [state, setState] = useState<HistoryState<T>>({
    past: [],
    present: { state: initialPresent, label: initialLabel },
    future: [],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  /**
   * Reverts to the previous state in the history.
   */
  const undo = useCallback(() => {
    if (!canUndo) return;

    setState(currentState => {
        const previous = currentState.past[currentState.past.length - 1];
        const newPast = currentState.past.slice(0, currentState.past.length - 1);
        
        return {
          past: newPast,
          present: previous,
          future: [currentState.present, ...currentState.future],
        };
    });
  }, [canUndo]);
  
  /**
   * Advances to the next state in the history.
   */
  const redo = useCallback(() => {
    if (!canRedo) return;

    setState(currentState => {
        const next = currentState.future[0];
        const newFuture = currentState.future.slice(1);

        return {
          past: [...currentState.past, currentState.present],
          present: next,
          future: newFuture,
        };
    });
  }, [canRedo]);

  /**
   * Sets a new state, clearing the redo history.
   * @param newPresentState The new state or a function that returns the new state.
   * @param label A descriptive label for this state change.
   */
  const set = useCallback((
    newPresentState: T | ((currentState: T) => T),
    label: string = `Update at ${new Date().toLocaleTimeString()}`
  ) => {
    setState(currentState => {
        const resolvedPresentState = typeof newPresentState === 'function' 
            ? (newPresentState as (currentState: T) => T)(currentState.present.state) 
            : newPresentState;
        
        if (resolvedPresentState === currentState.present.state) {
            return currentState; // Don't add to history if state is the same
        }
        
        const newPresentEntry: HistoryEntry<T> = { state: resolvedPresentState, label };

        return {
          past: [...currentState.past, currentState.present],
          present: newPresentEntry,
          future: [], // Clear future on new state
        };
    });
  }, []);
  
  /**
   * Sets the initial state of the hook, clearing all history.
   * @param initialState The new initial state.
   * @param label A descriptive label for the new initial state.
   */
  const setInitial = useCallback((
    initialState: T,
    label: string = 'Initial State'
  ) => {
    setState({
        past: [],
        present: { state: initialState, label },
        future: [],
    });
  }, []);

  /**
   * Clears the undo and redo history, keeping the present state.
   */
  const clearHistory = useCallback(() => {
      setState(currentState => ({
          ...currentState,
          past: [],
          future: [],
      }));
  }, []);

  return { 
    state: state.present.state, 
    set, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    setInitial,
    clearHistory,
    history: [...state.past, state.present],
    currentLabel: state.present.label,
  };
};
