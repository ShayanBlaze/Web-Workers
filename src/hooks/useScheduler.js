import { useState, useEffect, useRef, useCallback } from "react";
import { fifo } from "../schedulers/fifo";
import { priority } from "../schedulers/priority";
import { roundRobin } from "../schedulers/roundRobin";

const schedulers = {
  FIFO: fifo,
  PRIORITY: priority,
  ROUND_ROBIN: roundRobin,
};

const DEFAULT_TIME_QUANTUM = 3000;

export function useScheduler() {
  const hardwareCores = navigator.hardwareConcurrency || 4;

  const [maxCores, setMaxCores] = useState(hardwareCores);
  const [algorithm, setAlgorithm] = useState("FIFO");
  const [timeQuantum, setTimeQuantum] = useState(DEFAULT_TIME_QUANTUM);
  const [queue, setQueue] = useState([]);
  const [logs, setLogs] = useState([]);
  const simulationStartTimeRef = useRef(null);

  const getRelativeTime = () => {
    if (simulationStartTimeRef.current === null) {
      simulationStartTimeRef.current = Date.now();
    }
    return Date.now() - simulationStartTimeRef.current;
  };

  const [benchmarkMode, setBenchmarkMode] = useState(false);
  const [benchmarkTasks, setBenchmarkTasks] = useState([]);

  const [cores, setCores] = useState(
    Array.from({ length: hardwareCores }, (_, i) => ({
      id: i + 1,
      status: "idle",
      taskId: null,
      progress: 0,
    })),
  );

  const [runningTasks, setRunningTasks] = useState({});
  const [completedTasks, setCompletedTasks] = useState([]);

  const runningTasksRef = useRef(runningTasks);
  const timeQuantumRef = useRef(timeQuantum);
  const algorithmRef = useRef(algorithm);
  const benchmarkModeRef = useRef(benchmarkMode);

  useEffect(() => {
    runningTasksRef.current = runningTasks;
  }, [runningTasks]);

  useEffect(() => {
    timeQuantumRef.current = timeQuantum;
  }, [timeQuantum]);

  useEffect(() => {
    algorithmRef.current = algorithm;
  }, [algorithm]);

  useEffect(() => {
    benchmarkModeRef.current = benchmarkMode;
  }, [benchmarkMode]);

  const workerPool = useRef({});
  const taskIdCounter = useRef(1);

  const addLog = (message) => {
    setLogs((prev) =>
      [`[${new Date().toLocaleTimeString("fa-IR")}] ${message}`, ...prev].slice(
        0,
        50,
      ),
    );
  };

  const handleWorkerMessage = useCallback((coreId, data) => {
    const { type, taskId, progress, result, executionTime, resumeState } = data;

    if (type === "PROGRESS") {
      setCores((prev) =>
        prev.map((c) => (c.id === coreId ? { ...c, progress: progress } : c)),
      );
      return;
    }

    if (type === "COMPLETE") {
      const completionTime = getRelativeTime();
      const runningTask = runningTasksRef.current[coreId];

      if (runningTask) {
        const completedTask = {
          ...runningTask,
          status: "completed",
          completionTime,
          burstTime: executionTime * 1000,
          result,
          executionTime,
        };

        setCompletedTasks((prev) => [...prev, completedTask]);

        if (benchmarkModeRef.current) {
          setBenchmarkTasks((prev) =>
            prev.map((t) => (t.id === completedTask.id ? completedTask : t)),
          );
        }

        addLog(
          `تسک ${taskId} روی Core ${coreId} تکمیل شد. ${result} عدد اول در ${executionTime} ثانیه پیدا شد.`,
        );
      }

      setRunningTasks((prev) => {
        const newRunning = { ...prev };
        delete newRunning[coreId];
        return newRunning;
      });

      setCores((prev) =>
        prev.map((c) =>
          c.id === coreId
            ? { ...c, status: "idle", taskId: null, progress: 0 }
            : c,
        ),
      );

      return;
    }

    if (type === "CANCELLED") {
      const cancelledTask = runningTasksRef.current[coreId];

      setRunningTasks((prev) => {
        const newRunning = { ...prev };
        delete newRunning[coreId];
        return newRunning;
      });

      setCores((prev) =>
        prev.map((c) =>
          c.id === coreId
            ? { ...c, status: "idle", taskId: null, progress: 0 }
            : c,
        ),
      );

      if (cancelledTask) {
        const taskWithState = {
          ...cancelledTask,
          resumeState: resumeState || cancelledTask.resumeState,
        };

        setQueue((prev) => {
          const filteredQueue = prev.filter((t) => t.id !== cancelledTask.id);

          if (filteredQueue.some((t) => t.id === taskWithState.id)) {
            return filteredQueue;
          }

          const updatedQueue = [taskWithState, ...filteredQueue];
          if (algorithmRef.current === "PRIORITY") {
            return updatedQueue.sort((a, b) => b.priority - a.priority);
          }
          return updatedQueue;
        });

        addLog(
          `تسک ${taskId} روی Core ${coreId} به دلیل وقفه (preempted) به صف بازگردانده شد.`,
        );
      } else {
        addLog(`تسک ${taskId} روی Core ${coreId} لغو شد.`);
      }
      return;
    }

    if (type === "QUANTUM_EXPIRED") {
      const pausedTask = runningTasksRef.current[coreId];

      setRunningTasks((prev) => {
        const newRunning = { ...prev };
        delete newRunning[coreId];
        return newRunning;
      });

      setCores((prev) =>
        prev.map((c) =>
          c.id === coreId
            ? { ...c, status: "idle", taskId: null, progress: 0 }
            : c,
        ),
      );

      if (pausedTask) {
        const taskWithState = { ...pausedTask, resumeState };
        setQueue((prev) => {
          const filteredQueue = prev.filter((t) => t.id !== pausedTask.id);

          if (filteredQueue.some((t) => t.id === taskWithState.id)) {
            return filteredQueue;
          }

          return [...filteredQueue, taskWithState];
        });

        addLog(
          `تسک ${taskId} روی Core ${coreId} به دلیل اتمام کوانتوم زمانی متوقف و به انتهای صف منتقل شد.`,
        );
      }
      return;
    }
  }, []);

  const handleWorkerMessageRef = useRef(handleWorkerMessage);
  useEffect(() => {
    handleWorkerMessageRef.current = handleWorkerMessage;
  }, [handleWorkerMessage]);

  useEffect(() => {
    const currentWorkerIds = Object.keys(workerPool.current).map(Number);

    for (let i = 1; i <= maxCores; i++) {
      if (!workerPool.current[i]) {
        const worker = new Worker(new URL("../worker.js", import.meta.url), {
          type: "module",
        });

        worker.onmessage = (e) => handleWorkerMessageRef.current(i, e.data);
        workerPool.current[i] = worker;
      }
    }

    currentWorkerIds.forEach((id) => {
      if (id > maxCores) {
        if (workerPool.current[id]) {
          workerPool.current[id].terminate();
          delete workerPool.current[id];
        }
      }
    });

    setCores((prev) => {
      const newCores = prev.filter((c) => c.id <= maxCores);
      const currentCoreIds = new Set(newCores.map((c) => c.id));
      for (let i = 1; i <= maxCores; i++) {
        if (!currentCoreIds.has(i)) {
          newCores.push({ id: i, status: "idle", taskId: null, progress: 0 });
        }
      }
      return newCores.sort((a, b) => a.id - b.id);
    });

    return () => {
      Object.values(workerPool.current).forEach((w) => w.terminate());
      workerPool.current = {};
    };
  }, [maxCores]);

  const addTask = useCallback((complexity, priorityVal) => {
    const newTask = {
      id: `TSK-${taskIdCounter.current++}`,
      complexity,
      priority: priorityVal,
      status: "waiting",
      arrivalTime: getRelativeTime(),
      firstRunTime: null,
      completionTime: null,
      burstTime: 0,
    };

    setQueue((prevQueue) => {
      const activeScheduler = schedulers[algorithmRef.current];
      const preemptions = activeScheduler.findPreemptions(
        newTask,
        runningTasksRef.current,
      );

      preemptions.forEach(({ coreId, task }) => {
        if (workerPool.current[coreId]) {
          workerPool.current[coreId].postMessage({ type: "CANCEL" });
          addLog(
            `وقفه (Preemption): تسک ${task.id} روی Core ${coreId} برای تسک با اولویت بالاتر ${newTask.id} متوقف شد.`,
          );
        }
      });

      return [...prevQueue, newTask];
    });

    addLog(
      `تسک ${newTask.id} به صف آماده اضافه شد (Priority: ${priorityVal}, Complexity: ${complexity}x).`,
    );
  }, []);

  useEffect(() => {
    const idleCores = cores.filter((c) => c.status === "idle");
    if (queue.length === 0 || idleCores.length === 0) return;

    const activeScheduler = schedulers[algorithmRef.current];
    const { tasksToDispatch } = activeScheduler.schedule(
      queue,
      idleCores.length,
    );

    if (tasksToDispatch.length === 0) return;

    let dispatchedTaskIds = new Set();

    tasksToDispatch.forEach((task, index) => {
      const core = idleCores[index];
      if (core) {
        const taskToRun =
          task.firstRunTime === null
            ? { ...task, firstRunTime: getRelativeTime() }
            : task;

        workerPool.current[core.id].postMessage({
          taskId: taskToRun.id,
          complexity: taskToRun.complexity,
          resumeState: taskToRun.resumeState || null,
          timeQuantum:
            algorithmRef.current === "ROUND_ROBIN"
              ? timeQuantumRef.current
              : null,
        });

        setCores((prev) =>
          prev.map((c) =>
            c.id === core.id
              ? {
                  ...c,
                  status: "processing",
                  taskId: taskToRun.id,
                  progress: 0,
                }
              : c,
          ),
        );

        setRunningTasks((prev) => ({
          ...prev,
          [core.id]: taskToRun,
        }));

        dispatchedTaskIds.add(taskToRun.id);
        addLog(
          `زمان‌بند (Dispatcher) تسک ${taskToRun.id} را به Core ${core.id} اختصاص داد.`,
        );
      }
    });

    setQueue((prev) => prev.filter((t) => !dispatchedTaskIds.has(t.id)));
  }, [queue, cores]);

  const startBenchmark = useCallback((tasksConfig) => {
    setQueue([]);
    setCores((prev) =>
      prev.map((c) => ({ ...c, status: "idle", taskId: null, progress: 0 })),
    );
    setRunningTasks({});
    setCompletedTasks([]);
    setBenchmarkMode(true);
    setLogs([]);
    simulationStartTimeRef.current = Date.now();

    const tasks = tasksConfig.map((config) => ({
      id: `TSK-${taskIdCounter.current++}`,
      complexity: config.complexity || 1,
      priority: config.priority || 5,
      status: "waiting",
      arrivalTime: config.delay || 0,
      firstRunTime: null,
      completionTime: null,
      burstTime: 0,
    }));

    setBenchmarkTasks(tasks);

    tasks.forEach((task) => {
      if (task.arrivalTime > 0) {
        setTimeout(() => {
          const actualArrival = getRelativeTime();
          const taskWithRealArrival = { ...task, arrivalTime: actualArrival };
          setQueue((prev) => [...prev, taskWithRealArrival]);
          addLog(`تسک ${task.id} وارد صف شد (Benchmark Mode).`);
        }, task.arrivalTime);
      } else {
        const taskWithRealArrival = { ...task, arrivalTime: getRelativeTime() };
        setQueue((prev) => [...prev, taskWithRealArrival]);
        addLog(`تسک ${task.id} وارد صف شد (Benchmark Mode).`);
      }
    });

    addLog("🚀 حالت Benchmark شروع شد.");
  }, []);

  const exitBenchmark = useCallback(() => {
    setBenchmarkMode(false);
    setBenchmarkTasks([]);
    setCompletedTasks([]);
    addLog("🛑 حالت Benchmark خاتمه یافت.");
  }, []);

  return {
    cores,
    queue,
    logs,
    algorithm,
    maxCores,
    hardwareCores,
    timeQuantum,
    completedTasks,
    benchmarkMode,
    benchmarkTasks,
    setAlgorithm,
    setMaxCores,
    setTimeQuantum,
    addTask,
    startBenchmark,
    exitBenchmark,
    clearLogs: () => setLogs([]),
  };
}
