export const priority = {
  schedule(queue, idleCoresCount) {
    const sortedQueue = [...queue].sort((a, b) => b.priority - a.priority);
    const tasksToDispatch = sortedQueue.slice(0, idleCoresCount);
    return {
      tasksToDispatch,
    };
  },

  findPreemptions(newTask, runningTasks) {
    const preemptions = [];

    const runningList = Object.entries(runningTasks)
      .map(([coreId, task]) => ({ coreId: Number(coreId), ...task }))
      .filter((t) => t.id);

    if (runningList.length === 0) return preemptions;

    runningList.sort((a, b) => a.priority - b.priority);

    const lowestRunning = runningList[0];
    if (newTask.priority > lowestRunning.priority) {
      preemptions.push({
        coreId: lowestRunning.coreId,
        task: lowestRunning,
      });
    }

    return preemptions;
  },
};
