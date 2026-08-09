import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  calculateTaskMetrics,
  calculateAverageMetrics,
} from "../utils/metrics";
import { formatTime } from "../utils/formatTime";
import GanttChart from "./GanttChart";

export default function StatsPanel({ tasks, coreCount, onClose }) {
  const { t } = useTranslation();
  const averages = calculateAverageMetrics(tasks, coreCount);

  const timelineData = useMemo(() => {
    const slices = [];
    tasks.forEach((task) => {
      if (task.executions && task.executions.length > 0) {
        task.executions.forEach((exec) => {
          slices.push({
            taskId: task.id,
            coreId: exec.coreId,
            startTime: exec.startTime,
            endTime: exec.endTime,
          });
        });
      } else if (task.firstRunTime !== null && task.completionTime !== null) {
        slices.push({
          taskId: task.id,
          coreId: 0,
          startTime: task.firstRunTime,
          endTime: task.completionTime,
        });
      }
    });
    return slices;
  }, [tasks]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col border border-gray-800">
        <div className="bg-gradient-to-r rtl:bg-gradient-to-l from-indigo-600 via-purple-600 to-pink-600 p-4 sm:p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl">📊</span>
                {t("stats.title", "تحلیل و آمار عملکرد بنچمارک")}
              </h2>
              <p className="text-xs sm:text-sm mt-1 text-indigo-100/90 font-medium">
                {t("stats.completedTasks", {
                  completed: averages.completedCount,
                  total: tasks.length,
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white shrink-0 hover:rotate-90 duration-200"
              aria-label={t("stats.close", "بستن")}
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 p-3 sm:p-6 bg-gray-800/40 border-b border-gray-800">
          <div className="bg-gray-800/80 p-3 sm:p-4 rounded-xl border border-gray-700/80 hover:border-indigo-500/50 transition-colors shadow-sm">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-1 truncate">
              {t("stats.avgTurnaround", "میانگین زمان دور گردش")}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-indigo-400 font-mono">
              {averages.avgTurnaround}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t("stats.ms", "میلی‌ثانیه")}</p>
          </div>

          <div className="bg-gray-800/80 p-3 sm:p-4 rounded-xl border border-gray-700/80 hover:border-purple-500/50 transition-colors shadow-sm">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-1 truncate">
              {t("stats.avgWaiting", "میانگین زمان انتظار")}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-purple-400 font-mono">
              {averages.avgWaiting}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t("stats.ms", "میلی‌ثانیه")}</p>
          </div>

          <div className="bg-gray-800/80 p-3 sm:p-4 rounded-xl border border-gray-700/80 hover:border-pink-500/50 transition-colors shadow-sm">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-1 truncate">
              {t("stats.avgResponse", "میانگین زمان پاسخگویی")}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-pink-400 font-mono">
              {averages.avgResponse}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t("stats.ms", "میلی‌ثانیه")}</p>
          </div>

          <div className="bg-gray-800/80 p-3 sm:p-4 rounded-xl border border-gray-700/80 hover:border-green-500/50 transition-colors shadow-sm">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-1 truncate">
              {t("stats.cpuUtilization", "بهره‌وری پردازنده")}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-green-400 font-mono">
              {averages.cpuUtilization}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t("stats.percent", "درصد")}</p>
          </div>

          <div className="bg-gray-800/80 p-3 sm:p-4 rounded-xl border border-gray-700/80 hover:border-blue-500/50 transition-colors shadow-sm col-span-2 sm:col-span-1 lg:col-span-1">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-1 truncate">
              {t("stats.throughput", "توان پردازشی")}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-blue-400 font-mono">
              {averages.throughput}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
              {t("stats.tasksPerSec", "تسک / ثانیه")}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          <GanttChart timeline={timelineData} coreCount={coreCount} />

          <div className="bg-gray-800/50 p-4 sm:p-5 rounded-2xl border border-gray-700/70">
            <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 sm:h-5 bg-indigo-500 rounded-full"></span>
              {t("stats.taskDetails", "جزئیات زمان‌بندی تسک‌ها")}
            </h3>

            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-2 sm:px-0">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-700/80 whitespace-nowrap text-gray-400">
                      <th className="text-start p-2.5 sm:p-3 font-semibold">
                        {t("stats.table.taskId", "شناسه")}
                      </th>
                      <th className="text-center p-2.5 sm:p-3 font-semibold">
                        {t("stats.table.priority", "اولویت")}
                      </th>
                      <th className="text-center p-2.5 sm:p-3 font-semibold hidden sm:table-cell">
                        {t("stats.table.arrival", "ورود")}
                      </th>
                      <th className="text-center p-2.5 sm:p-3 font-semibold hidden md:table-cell">
                        {t("stats.table.firstRun", "شروع")}
                      </th>
                      <th className="text-center p-2.5 sm:p-3 font-semibold hidden lg:table-cell">
                        {t("stats.table.completion", "پایان")}
                      </th>
                      <th className="text-center p-2.5 sm:p-3 font-semibold">
                        {t("stats.table.tat", "TAT")}
                      </th>
                      <th className="text-center p-2.5 sm:p-3 font-semibold">
                        {t("stats.table.wt", "WT")}
                      </th>
                      <th className="text-center p-2.5 sm:p-3 font-semibold">
                        {t("stats.table.rt", "RT")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {tasks.map((task) => {
                      const metrics = calculateTaskMetrics(task);
                      return (
                        <tr
                          key={task.id}
                          className="hover:bg-gray-800/60 transition-colors whitespace-nowrap"
                        >
                          <td className="p-2.5 sm:p-3 text-white font-mono font-semibold text-xs sm:text-sm">
                            #{task.id}
                          </td>
                          <td className="p-2.5 sm:p-3 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-indigo-600/20 text-indigo-400 font-semibold text-[10px] sm:text-xs border border-indigo-500/30">
                              {task.priority}
                            </span>
                          </td>
                          <td className="p-2.5 sm:p-3 text-center text-[10px] sm:text-xs text-gray-400 font-mono hidden sm:table-cell">
                            {formatTime(task.arrivalTime) || "—"}
                          </td>
                          <td className="p-2.5 sm:p-3 text-center text-[10px] sm:text-xs text-gray-400 font-mono hidden md:table-cell">
                            {formatTime(task.firstRunTime) || "—"}
                          </td>
                          <td className="p-2.5 sm:p-3 text-center text-[10px] sm:text-xs text-gray-400 font-mono hidden lg:table-cell">
                            {formatTime(task.completionTime) || "—"}
                          </td>
                          <td className="p-2.5 sm:p-3 text-center">
                            <span className="inline-block px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-300 font-semibold font-mono text-[10px] sm:text-xs border border-indigo-500/20">
                              {metrics ? `${metrics.turnaroundTime}ms` : "—"}
                            </span>
                          </td>
                          <td className="p-2.5 sm:p-3 text-center">
                            <span className="inline-block px-2 py-1 rounded-md bg-purple-500/10 text-purple-300 font-semibold font-mono text-[10px] sm:text-xs border border-purple-500/20">
                              {metrics ? `${metrics.waitingTime}ms` : "—"}
                            </span>
                          </td>
                          <td className="p-2.5 sm:p-3 text-center">
                            <span className="inline-block px-2 py-1 rounded-md bg-pink-500/10 text-pink-300 font-semibold font-mono text-[10px] sm:text-xs border border-pink-500/20">
                              {metrics && metrics.responseTime !== null
                                ? `${metrics.responseTime}ms`
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
        </div>

        <div className="p-4 sm:p-6 bg-gray-800/60 border-t border-gray-800 flex flex-col-reverse sm:flex-row gap-3 sm:gap-0 sm:justify-between items-center">
          <p className="text-[10px] sm:text-xs text-gray-400 text-center sm:text-start">
            {t("stats.note", "نکته: پارامترهای زمان‌بندی بر اساس واحدهای میلی‌ثانیه‌ای ثبت شده‌اند.")}
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r rtl:bg-gradient-to-l from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            {t("stats.close", "بستن پنجره")}
          </button>
        </div>
      </div>
    </div>
  );
}