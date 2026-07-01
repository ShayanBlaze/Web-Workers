export const fifo = {
  schedule(queue, idleCoresCount) {
    const tasksToDispatch = queue.slice(0, idleCoresCount);
    return {
      tasksToDispatch,
    };
  },

  findPreemptions() {
    return [];
  },
};
