# Performance Review: Spec 017 - Browser Foundation

## Executive Summary

This document outlines performance requirements, optimization strategies, and benchmarking criteria for the WebContentsView Service.

---

## Performance Targets

| Metric | Target | Acceptable | Critical Threshold |
|--------|--------|------------|-------------------|
| View creation | <50ms | <100ms | >200ms = bug |
| IPC round-trip | <10ms | <50ms | >100ms = bug |
| Bounds update | <16ms | <32ms | >50ms = visual jank |
| Memory per view | <100MB | <150MB | >200MB = leak |
| Event forwarding | <5ms | <10ms | >20ms = UI lag |

---

## Memory Management

### View Lifecycle Memory

```typescript
// Memory tracking (development only)
const viewMemoryMap = new Map<string, {
  createdAt: Date;
  lastMemoryUsage: number;
}>();

function trackViewMemory(id: string, view: WebContentsView): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const checkMemory = () => {
    if (!view.webContents.isDestroyed()) {
      view.webContents.getProcessMemoryInfo().then((info) => {
        const entry = viewMemoryMap.get(id);
        if (entry) {
          entry.lastMemoryUsage = info.private;
          if (info.private > 200 * 1024 * 1024) { // 200MB
            console.warn(`[PERF] View ${id} exceeds memory threshold: ${Math.round(info.private / 1024 / 1024)}MB`);
          }
        }
      });
    }
  };
  
  viewMemoryMap.set(id, { createdAt: new Date(), lastMemoryUsage: 0 });
  setInterval(checkMemory, 30000); // Check every 30s
}
```

### Cleanup Verification

```typescript
// Verify cleanup on destroy
function verifyCleanup(id: string): void {
  // Ensure all references are cleared
  const weakRef = new WeakRef(views.get(id));
  views.delete(id);
  
  // Schedule verification
  setTimeout(() => {
    if (weakRef.deref()) {
      console.error(`[PERF] Memory leak detected for view ${id}`);
    }
  }, 5000);
}
```

---

## IPC Optimization

### Batching Strategy

```typescript
// Batch rapid state updates
class StateBatcher {
  private pending = new Map<string, Partial<BrowserViewState>>();
  private timer: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 16; // One frame at 60fps

  queue(viewId: string, update: Partial<BrowserViewState>): void {
    const existing = this.pending.get(viewId) ?? {};
    this.pending.set(viewId, { ...existing, ...update });
    
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.BATCH_DELAY);
    }
  }

  private flush(): void {
    this.timer = null;
    
    for (const [viewId, state] of this.pending) {
      this.mainWindow?.webContents.send('browser:state-batch', {
        viewId,
        state,
      });
    }
    
    this.pending.clear();
  }
}
```

### Message Compression

For large payloads (future):
```typescript
// Compress large messages
function sendCompressed(channel: string, data: unknown): void {
  const json = JSON.stringify(data);
  if (json.length > 10000) {
    // Use compression for large payloads
    const compressed = zlib.deflateSync(json);
    mainWindow.webContents.send(channel + ':compressed', compressed);
  } else {
    mainWindow.webContents.send(channel, data);
  }
}
```

---

## Bounds Update Optimization

### Throttling Strategy

```typescript
// Throttle bounds updates to 60fps max
class BoundsThrottler {
  private lastUpdate = 0;
  private pendingBounds: ViewBounds | null = null;
  private rafId: number | null = null;
  private readonly MIN_INTERVAL = 16; // ~60fps

  update(bounds: ViewBounds): void {
    this.pendingBounds = bounds;
    
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => this.flush());
    }
  }

  private flush(): void {
    this.rafId = null;
    
    const now = performance.now();
    if (now - this.lastUpdate < this.MIN_INTERVAL) {
      // Re-schedule if too soon
      this.rafId = requestAnimationFrame(() => this.flush());
      return;
    }
    
    if (this.pendingBounds) {
      this.applyBounds(this.pendingBounds);
      this.pendingBounds = null;
      this.lastUpdate = now;
    }
  }

  private applyBounds(bounds: ViewBounds): void {
    const activeView = views.get(activeViewId);
    if (activeView) {
      activeView.setBounds(bounds);
    }
  }
}
```

---

## Caching Strategies

### View State Cache

```typescript
// Cache view state to reduce IPC calls
class ViewStateCache {
  private cache = new Map<string, {
    state: BrowserViewState;
    timestamp: number;
  }>();
  private readonly TTL = 100; // 100ms TTL

  get(id: string): BrowserViewState | null {
    const entry = this.cache.get(id);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(id);
      return null;
    }
    
    return entry.state;
  }

  set(id: string, state: BrowserViewState): void {
    this.cache.set(id, {
      state,
      timestamp: Date.now(),
    });
  }

  invalidate(id: string): void {
    this.cache.delete(id);
  }
}
```

---

## Benchmarking

### Performance Test Suite

```typescript
// packages/desktop/__tests__/performance/browser-service.perf.test.ts

describe('BrowserService Performance', () => {
  it('should create view within 50ms', async () => {
    const start = performance.now();
    const id = browserService.createView('perf-test');
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(50);
    
    browserService.destroyView(id);
  });

  it('should handle 100 rapid bounds updates without dropping frames', async () => {
    const id = browserService.createView('bounds-test');
    browserService.setActiveView(id);
    
    const durations: number[] = [];
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      browserService.setBounds({
        x: i, y: i,
        width: 800 + i, height: 600 + i,
      });
      durations.push(performance.now() - start);
    }
    
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    expect(avgDuration).toBeLessThan(16);
    
    browserService.destroyView(id);
  });

  it('should maintain memory under 150MB per view', async () => {
    const id = browserService.createView('memory-test');
    const view = browserService.getView(id)!;
    
    // Load a heavy page
    await view.webContents.loadURL('https://www.google.com');
    await new Promise(r => setTimeout(r, 3000));
    
    const memInfo = await view.webContents.getProcessMemoryInfo();
    expect(memInfo.private).toBeLessThan(150 * 1024 * 1024);
    
    browserService.destroyView(id);
  });
});
```

---

## Monitoring

### Performance Metrics Collection

```typescript
// Collect and report performance metrics
interface PerformanceMetrics {
  viewCreationTimes: number[];
  ipcRoundTrips: number[];
  boundsUpdateTimes: number[];
  memoryUsage: number[];
}

const metrics: PerformanceMetrics = {
  viewCreationTimes: [],
  ipcRoundTrips: [],
  boundsUpdateTimes: [],
  memoryUsage: [],
};

function reportMetrics(): void {
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  
  console.log('[PERF] Metrics Report:', {
    avgViewCreation: `${avg(metrics.viewCreationTimes).toFixed(2)}ms`,
    avgIpcRoundTrip: `${avg(metrics.ipcRoundTrips).toFixed(2)}ms`,
    avgBoundsUpdate: `${avg(metrics.boundsUpdateTimes).toFixed(2)}ms`,
    avgMemory: `${(avg(metrics.memoryUsage) / 1024 / 1024).toFixed(2)}MB`,
  });
}

// Report every 5 minutes in development
if (process.env.NODE_ENV === 'development') {
  setInterval(reportMetrics, 5 * 60 * 1000);
}
```

---

## Optimization Checklist

- [ ] View creation optimized (<50ms)
- [ ] Memory cleanup verified (no leaks)
- [ ] IPC messages batched where appropriate
- [ ] Bounds updates throttled to 60fps
- [ ] State caching implemented
- [ ] Performance tests passing
- [ ] Memory thresholds enforced
- [ ] Monitoring in place
