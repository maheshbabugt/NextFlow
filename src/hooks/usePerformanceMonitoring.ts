import { useEffect } from 'react';
import React from 'react';

/**
 * Hook to monitor and log performance metrics
 * Only runs in development mode
 */
export function usePerformanceMonitoring(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Measure component render time
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Only log if render time exceeds 16ms (60fps threshold)
      if (renderTime > 16) {
        console.warn(
          `⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
        );
      }
    };
  }, [componentName]);
}

/**
 * Hook to measure Web Vitals
 */
export function useWebVitals() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Measure Largest Contentful Paint
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('📊 LCP:', (entry as PerformanceEventTiming).processingStart || entry.startTime);
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }

    return () => observer.disconnect();
  }, []);
}

/**
 * Hook to debounce expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to throttle expensive operations
 */
export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = React.useState(value);
  const lastUpdated = React.useRef<number>(Date.now());

  React.useEffect(() => {
    const now = Date.now();

    if (now >= lastUpdated.current + interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const handler = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval);

      return () => clearTimeout(handler);
    }
  }, [value, interval]);

  return throttledValue;
}
