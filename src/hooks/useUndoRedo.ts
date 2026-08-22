import { useState, useCallback, useEffect, useRef } from 'react';

interface UndoRedoOptions<T> {
  maxHistory?: number;
  debounceMs?: number;
}

export function useUndoRedo<T>(
  initialPresent: T | (() => T),
  options: UndoRedoOptions<T> = {}
) {
  const { maxHistory = 30, debounceMs = 400 } = options;

  const [past, setPast] = useState<T[]>([]);
  const [present, setPresentState] = useState<T>(initialPresent);
  const [future, setFuture] = useState<T[]>([]);

  const presentRef = useRef<T>(present);
  presentRef.current = present;

  const debounceTimerRef = useRef<number | null>(null);
  const lastRecordedPresentRef = useRef<T>(present);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const set = useCallback(
    (newVal: T | ((prev: T) => T), recordHistory: boolean = true) => {
      const nextPresent = typeof newVal === 'function' ? (newVal as (prev: T) => T)(presentRef.current) : newVal;

      if (!recordHistory) {
        setPresentState(nextPresent);
        return;
      }

      // If debounced, wait for brief pause before pushing to history stack
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }

      setPresentState(nextPresent);

      debounceTimerRef.current = window.setTimeout(() => {
        setPast(prevPast => {
          const updatedPast = [...prevPast, lastRecordedPresentRef.current].slice(-maxHistory);
          return updatedPast;
        });
        lastRecordedPresentRef.current = nextPresent;
        setFuture([]);
      }, debounceMs);
    },
    [maxHistory, debounceMs]
  );

  const undo = useCallback(() => {
    if (past.length === 0) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture(prevFuture => [presentRef.current, ...prevFuture]);
    setPresentState(previous);
    lastRecordedPresentRef.current = previous;
  }, [past]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    const next = future[0];
    const newFuture = future.slice(1);

    setPast(prevPast => [...prevPast, presentRef.current].slice(-maxHistory));
    setFuture(newFuture);
    setPresentState(next);
    lastRecordedPresentRef.current = next;
  }, [future, maxHistory]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is inside an input, textarea or contenteditable element
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isInput) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if (modifier && e.key.toLowerCase() === 'y' && !isMac) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state: present,
    setState: set,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: past.length
  };
}
