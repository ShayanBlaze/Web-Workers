export function calculateTaskMetrics(task) {
  const { arrivalTime, firstRunTime, completionTime, burstTime } = task;

  if (!completionTime) {
    return null;
  }

  const turnaroundTime = completionTime - arrivalTime;
  const waitingTime = Math.max(0, turnaroundTime - (burstTime || 0));
  const responseTime = firstRunTime ? firstRunTime - arrivalTime : null;

  return {
    turnaroundTime,
    waitingTime,
    responseTime,
  };
}

export function calculateAverageMetrics(tasks, coreCount = 1) {
  const completedTasks = tasks.filter((t) => t.completionTime);

  if (completedTasks.length === 0) {
    return {
      avgTurnaround: 0,
      avgWaiting: 0,
      avgResponse: 0,
      cpuUtilization: 0,
      throughput: 0,
      completedCount: 0,
    };
  }

  let totalTAT = 0;
  let totalWT = 0;
  let totalRT = 0;

  completedTasks.forEach((task) => {
    const metrics = calculateTaskMetrics(task);
    if (metrics) {
      totalTAT += metrics.turnaroundTime;
      totalWT += metrics.waitingTime;
      if (metrics.responseTime !== null) {
        totalRT += metrics.responseTime;
      }
    }
  });

  const count = completedTasks.length;
  const avgTurnaround = totalTAT / count;
  const avgWaiting = totalWT / count;
  const avgResponse = totalRT / count;

  const minArrival = Math.min(...completedTasks.map((t) => t.arrivalTime));
  const maxCompletion = Math.max(
    ...completedTasks.map((t) => t.completionTime),
  );
  const totalTimeElapsed = maxCompletion - minArrival;

  const totalTimeAcrossAllCores = totalTimeElapsed * coreCount;

  const totalBurstTime = completedTasks.reduce(
    (sum, t) => sum + t.burstTime,
    0,
  );

  const cpuUtilization =
    totalTimeAcrossAllCores > 0
      ? ((totalBurstTime / totalTimeAcrossAllCores) * 100).toFixed(2)
      : "0.00";

  const throughput =
    totalTimeElapsed > 0
      ? (count / (totalTimeElapsed / 1000)).toFixed(2)
      : "0.00";

  return {
    avgTurnaround: avgTurnaround.toFixed(2),
    avgWaiting: avgWaiting.toFixed(2),
    avgResponse: avgResponse.toFixed(2),
    cpuUtilization,
    throughput,
    completedCount: count,
  };
}

export function formatTime(ms) {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
