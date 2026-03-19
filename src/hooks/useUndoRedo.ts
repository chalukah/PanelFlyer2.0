import { useState, useCallback, useRef } from 'react';

type UndoRedoOptions = {
  maxHistory?: number;
};

/**
 * Generic undo/redo hook.
 * Tracks state history and allows stepping backward/forward.
 */
export function useUndoRedo<T>(initialState: T, options: UndoRedoOptions = {}) {
  const { maxHistory = 50 } = options;

  const [state, setState] = useState<T>(initialState);
  const history = useRef<T[]>([initialState]);
  const pointer = useRef(0);

  const set = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof newState === 'function'
        ? (newState as (prev: T) => T)(prev)
        : newState;

      // Truncate any redo history beyond current pointer
      history.current = history.current.slice(0, pointer.current + 1);

      // Push new state
      history.current.push(next);

      // Trim if exceeding max
      if (history.current.length > maxHistory) {
        history.current = history.current.slice(history.current.length - maxHistory);
      }

      pointer.current = history.current.length - 1;
      return next;
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    if (pointer.current > 0) {
      pointer.current--;
      const prev = history.current[pointer.current];
      setState(prev);
      return prev;
    }
    return undefined;
  }, []);

  const redo = useCallback(() => {
    if (pointer.current < history.current.length - 1) {
      pointer.current++;
      const next = history.current[pointer.current];
      setState(next);
      return next;
    }
    return undefined;
  }, []);

  const canUndo = pointer.current > 0;
  const canRedo = pointer.current < history.current.length - 1;

  const reset = useCallback((newState: T) => {
    history.current = [newState];
    pointer.current = 0;
    setState(newState);
  }, []);

  return {
    state,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    historyLength: history.current.length,
  };
}
