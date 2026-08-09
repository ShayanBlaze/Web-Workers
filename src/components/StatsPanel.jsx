import {
  calculateTaskMetrics,
  calculateAverageMetrics,
} from "../utils/metrics";
import { formatTime } from "../utils/formatTime";

export default function StatsPanel({ tasks, coreCount, onClose }) {
  const averages = calculateAverageMetrics(tasks, coreCount);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-800">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">📊</span>
                آمار نهایی Benchmark
              </h2>
              <p className="text-sm mt-1 text-indigo-100">
                {averages.completedCount} از {tasks.length} تسک تکمیل‌شده
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
              aria-label="بستن"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-gray-800/50">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-indigo-500/50 transition-colors">
            <p className="text-xs text-gray-400 mb-1">میانگین Turnaround</p>
            <p className="text-2xl font-bold text-indigo-400">
              {averages.avgTurnaround}
            </p>
            <p className="text-xs text-gray-500 mt-1">میلی‌ثانیه</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-colors">
            <p className="text-xs text-gray-400 mb-1">میانگین Waiting</p>
            <p className="text-2xl font-bold text-purple-400">
              {averages.avgWaiting}
            </p>
            <p className="text-xs text-gray-500 mt-1">میلی‌ثانیه</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-pink-500/50 transition-colors">
            <p className="text-xs text-gray-400 mb-1">میانگین Response</p>
            <p className="text-2xl font-bold text-pink-400">
              {averages.avgResponse}
            </p>
            <p className="text-xs text-gray-500 mt-1">میلی‌ثانیه</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-green-500/50 transition-colors">
            <p className="text-xs text-gray-400 mb-1">CPU Utilization</p>
            <p className="text-2xl font-bold text-green-400">
              {averages.cpuUtilization}
            </p>
            <p className="text-xs text-gray-500 mt-1">درصد</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-colors">
            <p className="text-xs text-gray-400 mb-1">Throughput</p>
            <p className="text-2xl font-bold text-blue-400">
              {averages.throughput}
            </p>
            <p className="text-xs text-gray-500 mt-1">تسک/ثانیه</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-500 rounded"></span>
            جزئیات تسک‌ها
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-right p-3 text-gray-400 font-medium">
                    Task ID
                  </th>
                  <th className="text-center p-3 text-gray-400 font-medium">
                    Priority
                  </th>
                  <th className="text-center p-3 text-gray-400 font-medium hidden sm:table-cell">
                    Arrival
                  </th>
                  <th className="text-center p-3 text-gray-400 font-medium hidden md:table-cell">
                    First Run
                  </th>
                  <th className="text-center p-3 text-gray-400 font-medium hidden lg:table-cell">
                    Completion
                  </th>
                  <th className="text-center p-3 text-gray-400 font-medium">
                    TAT
                  </th>
                  <th className="text-center p-3 text-gray-400 font-medium">
                    WT
                  </th>
                  <th className="text-center p-3 text-gray-400 font-medium">
                    RT
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, idx) => {
                  const metrics = calculateTaskMetrics(task);
                  return (
                    <tr
                      key={task.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="p-3 text-white font-mono text-sm">
                        #{task.id}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 font-semibold text-xs">
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-3 text-center text-xs text-gray-400 font-mono hidden sm:table-cell">
                        {formatTime(task.arrivalTime) || "—"}
                      </td>
                      <td className="p-3 text-center text-xs text-gray-400 font-mono hidden md:table-cell">
                        {formatTime(task.firstRunTime) || "—"}
                      </td>
                      <td className="p-3 text-center text-xs text-gray-400 font-mono hidden lg:table-cell">
                        {formatTime(task.completionTime) || "—"}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 font-semibold text-xs">
                          {metrics ? `${metrics.turnaroundTime}` : "—"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-1 rounded bg-purple-500/20 text-purple-300 font-semibold text-xs">
                          {metrics ? `${metrics.waitingTime}` : "—"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-1 rounded bg-pink-500/20 text-pink-300 font-semibold text-xs">
                          {metrics && metrics.responseTime !== null
                            ? `${metrics.responseTime}`
                            : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 bg-gray-800/50 border-t border-gray-800 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            کلیه مقادیر زمانی بر حسب میلی‌ثانیه و ثانیه هستند
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-indigo-500/25"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
