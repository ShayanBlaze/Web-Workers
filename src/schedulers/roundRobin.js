export const roundRobin = {

  schedule(queue, idleCoreCount) {
    const tasksToDispatch = queue.slice(0, idleCoreCount);
    return { tasksToDispatch };
  },

  findPreemptions() {
    return [];
  },

  meta: {
    label: "Round Robin",
    preemptive: true,
    preemptionTrigger: "time-quantum",
    requiresQuantum: true,
  },
};
