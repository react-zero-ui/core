'use client';

import { AnimatePresence, motion } from 'motion/react';

import { useEffect, useRef, useSyncExternalStore } from 'react';

interface RenderMetrics {
  count: number;
  lastRenderTime: number;
  totalRenderTime: number;
}

// External store for render metrics
class RenderStore {
  private data = new Map<string, RenderMetrics>();
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => {
    return this.data;
  };

  updateMetrics(componentName: string, renderTime: number) {
    const existing = this.data.get(componentName) || {
      count: 0,
      lastRenderTime: 0,
      totalRenderTime: 0,
    };

    this.data.set(componentName, {
      count: existing.count + 1,
      lastRenderTime: renderTime,
      totalRenderTime: existing.totalRenderTime + renderTime,
    });

    this.listeners.forEach(listener => listener());
  }
}

const renderStore = new RenderStore();

// Global state for tracker visibility
let isTrackerEnabled = true;
const trackerListeners = new Set<() => void>();

const setTrackerEnabled = (enabled: boolean) => {
  isTrackerEnabled = enabled;
  trackerListeners.forEach(listener => listener());
};

// Flash animations store
interface RenderFlash {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  renderTime: number;
}

let flashStore: RenderFlash[] = [];
let flashListeners = new Set<() => void>();

const addFlash = (element: HTMLElement, componentName: string, renderTime: number) => {
  if (!isTrackerEnabled || !element) return;

  const rect = element.getBoundingClientRect();
  const flash: RenderFlash = {
    id: `${componentName}-${Date.now()}-${Math.random()}`,
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
    renderTime,
  };

  flashStore = [...flashStore, flash];
  flashListeners.forEach(listener => listener());

  setTimeout(() => {
    flashStore = flashStore.filter(f => f.id !== flash.id);
    flashListeners.forEach(listener => listener());
  }, 1500);
};

// Standalone Render Tracker Component
export function RenderTracker() {
  const renderMetrics = useSyncExternalStore(renderStore.subscribe, renderStore.getSnapshot, renderStore.getSnapshot);

  const showTracker = useSyncExternalStore(
    listener => {
      trackerListeners.add(listener);
      return () => trackerListeners.delete(listener);
    },
    () => isTrackerEnabled,
    () => isTrackerEnabled
  );

  const flashes = useSyncExternalStore(
    listener => {
      flashListeners.add(listener);
      return () => flashListeners.delete(listener);
    },
    () => flashStore,
    () => flashStore
  );

  return (
    <>
      {/* Render Metrics Display */}
      <AnimatePresence>
        {renderMetrics?.size > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed right-2 bottom-2 z-40 w-48 rounded bg-black/70 p-2 text-xs text-white shadow-xl backdrop-blur-sm max-md:hidden"
          >
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-bold text-gray-100">Renders</h3>
              <button
                onClick={() => setTrackerEnabled(!showTracker)}
                className="flex h-4 w-4 items-center justify-center text-3xl text-gray-400 hover:text-white"
              >
                {showTracker ? '-' : '+'}
              </button>
            </div>

            <motion.div
              className="space-y-0.5 overflow-hidden"
              animate={{ maxHeight: showTracker ? '275px' : '0px' }}
              transition={{ duration: 0.3 }}
            >
              {Array.from(renderMetrics.entries()).map(([id, metrics]) => (
                <div
                  key={id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex-1 truncate font-mono text-[10px] text-gray-300">{id.replace('Component', '').replace('Deep', 'D.')}</span>
                  <span className="font-bold text-white tabular-nums">{metrics.count}</span>
                </div>
              ))}
            </motion.div>

            {renderMetrics.size > 0 && (
              <div className="mt-1 flex justify-between border-t border-gray-700 pt-1 text-[10px]">
                <span>
                  Total: <span className="font-bold text-red-400">{Array.from(renderMetrics.values()).reduce((sum, m) => sum + m.count, 0)}</span>
                </span>
                <span>
                  <span className="font-bold text-blue-400">
                    {Array.from(renderMetrics.values())
                      .reduce((sum, m) => sum + m.totalRenderTime, 0)
                      .toFixed(1)}
                    ms
                  </span>
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash Overlays */}
      <div className="pointer-events-none fixed inset-0 z-50">
        <AnimatePresence>
          {showTracker &&
            flashes.map(flash => (
              <motion.div
                key={flash.id}
                className="absolute"
                style={{
                  left: flash.x,
                  top: flash.y,
                  width: flash.width,
                  height: flash.height,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Ripple effect */}
                <motion.div
                  className="absolute inset-0 border-2 border-dotted border-red-500"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />

                {/* Glow effect */}
                <motion.div
                  className={`absolute inset-0 rounded ${
                    flash.renderTime < 1 ? 'bg-green-500/20' : flash.renderTime < 5 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                  }`}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                />

                {/* Render time badge */}
                {flash.renderTime > 0 && (
                  <motion.div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-black px-2 py-1 text-xs whitespace-nowrap text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {flash.renderTime.toFixed(2)}ms
                  </motion.div>
                )}
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </>
  );
}

// Hook to track renders
export function useRenderTracker(componentName: string) {
  const ref = useRef<HTMLDivElement>(null);
  const renderStartTimeRef = useRef<number>(0);

  // Capture render start time
  if (isTrackerEnabled) {
    renderStartTimeRef.current = performance.now();
  }

  useEffect(() => {
    if (!isTrackerEnabled) return;

    // Calculate render time
    const renderTime = performance.now() - renderStartTimeRef.current;

    // Update metrics
    renderStore.updateMetrics(componentName, renderTime);

    // Add flash effect
    queueMicrotask(() => {
      if (ref.current) {
        addFlash(ref.current, componentName, renderTime);
      }
    });
  });

  return ref;
}
