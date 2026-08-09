import React from "react";
import { useTranslation } from "react-i18next";
import {
  calculateTaskMetrics,
  calculateAverageMetrics,
} from "../utils/metrics";
import { formatTime } from "../utils/formatTime";

export default function StatsPanel({ tasks, coreCount, onClose }) {
  const { t } = useTranslation();
  const averages = calculateAverageMetrics(tasks, coreCount);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col border border-gray-800">
        {/* Header */}
        <div className="bg-gradient-to-r rtl:bg-gradient-to-l from-indigo-600 to-purple-600 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl">📊</span>
                {t("stats.title")}
              </h2>
              <p className="text-xs sm:text-sm mt-1 text-indigo-100">
                {t("stats.completedTasks", {
                  completed: averages.completedCount,
                  total: tasks.length,
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white shrink-0"
              aria-label={t("stats.close")}
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
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

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 p-3 sm:p-6 bg-gray-800/50">
          <div className="bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-700 hover:border-indigo-500/50 transition-colors">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-1 truncate">
              {t("stats.avgTurnaround")}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-indigo-400">
              {averages.avgTurnaround}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t("stats.ms")}</p>
          </div>

          <div className="bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-colors">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-1 truncate">
              {t("stats.avgWaiting")}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-purple-400">
              {averages.avgWaiting}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t("stats.ms")}</p>
          </div>

          <div className="bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-700 hover:border-pink-500/50 transition-colors">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-1 truncate">
              {t("stats.avgResponse")}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-pink-400">
              {averages.avgResponse}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t("stats.ms")}</p>
          </div>

          <div className="bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-700 hover:border-green-500/50 transition-colors">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-1 truncate">
              {t("stats.cpuUtilization")}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-green-400">
              {averages.cpuUtilization}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t("stats.percent")}</p>
          </div>

          <div className="bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-colors col-span-2 sm:col-span-1 lg:col-span-1">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-1 truncate">
              {t("stats.throughput")}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-blue-400">
              {averages.throughput}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
              {t("stats.tasksPerSec")}
            </p>
          </div>
        </div>

        {/* Task Details Table */}
        <div className="flex-1 overflow-auto p-3 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <span className="w-1 h-4 sm:h-5 bg-indigo-500 rounded"></span>
            {t("stats.taskDetails")}
          </h3>

          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-3 sm:px-0">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-700 whitespace-nowrap">
                    <th className="text-start p-2 sm:p-3 text-gray-400 font-medium">
                      {t("stats.table.taskId")}
                    </th>
                    <th className="text-center p-2 sm:p-3 text-gray-400 font-medium">
                      {t("stats.table.priority")}
                    </th>
                    <th className="text-center p-2 sm:p-3 text-gray-400 font-medium hidden sm:table-cell">
                      {t("stats.table.arrival")}
                    </th>
                    <th className="text-center p-2 sm:p-3 text-gray-400 font-medium hidden md:table-cell">
                      {t("stats.table.firstRun")}
                    </th>
                    <th className="text-center p-2 sm:p-3 text-gray-400 font-medium hidden lg:table-cell">
                      {t("stats.table.completion")}
                    </th>
                    <th className="text-center p-2 sm:p-3 text-gray-400 font-medium">
                      {t("stats.table.tat")}
                    </th>
                    <th className="text-center p-2 sm:p-3 text-gray-400 font-medium">
                      {t("stats.table.wt")}
                    </th>
                    <th className="text-center p-2 sm:p-3 text-gray-400 font-medium">
                      {t("stats.table.rt")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const metrics = calculateTaskMetrics(task);
                    return (
                      <tr
                        key={task.id}
                        className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors whitespace-nowrap"
                      >
                        <td className="p-2 sm:p-3 text-white font-mono text-xs sm:text-sm">
                          #{task.id}
                        </td>
                        <td className="p-2 sm:p-3 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-600/20 text-indigo-400 font-semibold text-[10px] sm:text-xs">
                            {task.priority}
                          </span>
                        </td>
                        <td className="p-2 sm:p-3 text-center text-[10px] sm:text-xs text-gray-400 font-mono hidden sm:table-cell">
                          {formatTime(task.arrivalTime) || "—"}
                        </td>
                        <td className="p-2 sm:p-3 text-center text-[10px] sm:text-xs text-gray-400 font-mono hidden md:table-cell">
                          {formatTime(task.firstRunTime) || "—"}
                        </td>
                        <td className="p-2 sm:p-3 text-center text-[10px] sm:text-xs text-gray-400 font-mono hidden lg:table-cell">
                          {formatTime(task.completionTime) || "—"}
                        </td>
                        <td className="p-2 sm:p-3 text-center">
                          <span className="inline-block px-1.5 py-0.5 sm:px-2 sm:py-1 rounded bg-indigo-500/20 text-indigo-300 font-semibold text-[10px] sm:text-xs">
                            {metrics ? `${metrics.turnaroundTime}` : "—"}
                          </span>
                        </td>
                        <td className="p-2 sm:p-3 text-center">
                          <span className="inline-block px-1.5 py-0.5 sm:px-2 sm:py-1 rounded bg-purple-500/20 text-purple-300 font-semibold text-[10px] sm:text-xs">
                            {metrics ? `${metrics.waitingTime}` : "—"}
                          </span>
                        </td>
                        <td className="p-2 sm:p-3 text-center">
                          <span className="inline-block px-1.5 py-0.5 sm:px-2 sm:py-1 rounded bg-pink-500/20 text-pink-300 font-semibold text-[10px] sm:text-xs">
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
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-gray-800/50 border-t border-gray-800 flex flex-col-reverse sm:flex-row gap-3 sm:gap-0 sm:justify-between items-center">
          <p className="text-[10px] sm:text-xs text-gray-500 text-center sm:text-start">
            {t("stats.note")}
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r rtl:bg-gradient-to-l from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all text-xs sm:text-sm font-medium shadow-lg shadow-indigo-500/25"
          >
            {t("stats.close")}
          </button>
        </div>
      </div>
    </div>
  );
}