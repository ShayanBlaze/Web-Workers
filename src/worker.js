let shouldCancel = false;
let currentTask = null;

let quantumMs = null;
let quantumStartTime = null;
let chunkStartTime = null;

self.onmessage = function (e) {
  const { taskId, complexity, type, resumeState, timeQuantum } = e.data;

  if (type === "CANCEL") {
    shouldCancel = true;
    return;
  }

  shouldCancel = false;
  quantumMs = timeQuantum ?? null;
  quantumStartTime = performance.now();
  chunkStartTime = performance.now();

  if (resumeState) {
    currentTask = {
      taskId,
      complexity,
      target: complexity * 2000000,
      primesFound: resumeState.primesFound,
      lastReportedProgress: resumeState.lastReportedProgress,
      startTime: resumeState.originalStartTime,
      currentVal: resumeState.currentVal,
      originalStartTime: resumeState.originalStartTime,
      accumulatedTime: resumeState.accumulatedTime || 0, 
    };
  } else {
    const now = performance.now();
    currentTask = {
      taskId,
      complexity,
      target: complexity * 2000000,
      primesFound: 0,
      lastReportedProgress: -1,
      startTime: now,
      currentVal: 2,
      originalStartTime: now,
      accumulatedTime: 0,
    };
  }

  runChunk();
};

function runChunk() {
  if (!currentTask) return;

  const { taskId, target } = currentTask;

  if (shouldCancel) {
    const timeSpent = performance.now() - chunkStartTime;
    postMessage({
      type: "CANCELLED",
      taskId,
      resumeState: {
        currentVal: currentTask.currentVal,
        primesFound: currentTask.primesFound,
        lastReportedProgress: currentTask.lastReportedProgress,
        originalStartTime: currentTask.originalStartTime,
        accumulatedTime: currentTask.accumulatedTime + timeSpent,
      },
    });

    currentTask = null;
    shouldCancel = false;
    return;
  }

  const CHUNK_SIZE = 100000;
  const end = Math.min(currentTask.currentVal + CHUNK_SIZE, target);

  for (let i = currentTask.currentVal; i < end; i++) {
    if (
      quantumMs !== null &&
      performance.now() - quantumStartTime >= quantumMs
    ) {
      currentTask.currentVal = i;
      const timeSpent = performance.now() - chunkStartTime;

      postMessage({
        type: "QUANTUM_EXPIRED",
        taskId,
        resumeState: {
          currentVal: currentTask.currentVal,
          primesFound: currentTask.primesFound,
          lastReportedProgress: currentTask.lastReportedProgress,
          originalStartTime: currentTask.originalStartTime,
          accumulatedTime: currentTask.accumulatedTime + timeSpent,
        },
        progress: Math.floor((currentTask.currentVal / target) * 100),
      });
      currentTask = null;
      return;
    }

    let isPrime = true;
    const limit = Math.sqrt(i);
    for (let j = 2; j <= limit; j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) currentTask.primesFound++;
  }

  currentTask.currentVal = end;
  const progress = Math.floor((currentTask.currentVal / target) * 100);
  if (progress > currentTask.lastReportedProgress) {
    postMessage({ type: "PROGRESS", taskId, progress });
    currentTask.lastReportedProgress = progress;
  }

  if (end >= target) {
    const timeSpent = performance.now() - chunkStartTime;
    const totalActiveTimeMs = currentTask.accumulatedTime + timeSpent;
    const executionTime = (totalActiveTimeMs / 1000).toFixed(2);

    postMessage({
      type: "COMPLETE",
      taskId,
      result: currentTask.primesFound,
      executionTime,
    });
    currentTask = null;
  } else {
    setTimeout(runChunk, 0);
  }
}
