import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useTranslation } from "react-i18next";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const TASK_PALETTE = [
  { bg: "#6366f1", border: "#818cf8", text: "text-indigo-400", badgeBg: "bg-indigo-500/10 border-indigo-500/30" },
  { bg: "#a855f7", border: "#c084fc", text: "text-purple-400", badgeBg: "bg-purple-500/10 border-purple-500/30" },
  { bg: "#ec4899", border: "#f472b6", text: "text-pink-400", badgeBg: "bg-pink-500/10 border-pink-500/30" },
  { bg: "#06b6d4", border: "#22d3ee", text: "text-cyan-400", badgeBg: "bg-cyan-500/10 border-cyan-500/30" },
  { bg: "#10b981", border: "#34d399", text: "text-emerald-400", badgeBg: "bg-emerald-500/10 border-emerald-500/30" },
  { bg: "#f59e0b", border: "#fbbf24", text: "text-amber-400", badgeBg: "bg-amber-500/10 border-amber-500/30" },
  { bg: "#ef4444", border: "#f87171", text: "text-red-400", badgeBg: "bg-red-500/10 border-red-500/30" },
  { bg: "#3b82f6", border: "#60a5fa", text: "text-blue-400", badgeBg: "bg-blue-500/10 border-blue-500/30" },
];

export default function GanttChart({ timeline = [], coreCount = 1 }) {
  const { t } = useTranslation();
  
  const [viewMode, setViewMode] = useState("wave");
  const [selectedSlice, setSelectedSlice] = useState(null);

  const uniqueTaskIds = useMemo(
    () => [...new Set(timeline.map((item) => item.taskId))],
    [timeline]
  );

  const maxTime = useMemo(() => {
    if (!timeline.length) return 100;
    return Math.max(...timeline.map((t) => t.endTime), 1);
  }, [timeline]);

  const taskSummaries = useMemo(() => {
    return uniqueTaskIds.map((taskId) => {
      const index = uniqueTaskIds.indexOf(taskId);
      const colorObj = TASK_PALETTE[index % TASK_PALETTE.length];
      const slices = timeline.filter((item) => item.taskId === taskId);
      const totalDuration = slices.reduce(
        (sum, slice) => sum + (slice.endTime - slice.startTime),
        0
      );

      return {
        taskId,
        colorObj,
        sliceCount: slices.length,
        totalDuration,
      };
    });
  }, [uniqueTaskIds, timeline]);

  const yLabels = useMemo(
    () => Array.from({ length: coreCount }, (_, i) => `Core ${i}`),
    [coreCount]
  );

  const datasets = useMemo(() => {
    return uniqueTaskIds.map((taskId) => {
      const index = uniqueTaskIds.indexOf(taskId);
      const colorObj = TASK_PALETTE[index % TASK_PALETTE.length];
      const taskSlices = timeline.filter((item) => item.taskId === taskId);

      const data = taskSlices.map((slice) => ({
        x: [slice.startTime, slice.endTime],
        y: `Core ${slice.coreId}`,
      }));

      return {
        label: `Task #${taskId}`,
        data: data,
        backgroundColor: colorObj.bg,
        borderColor: colorObj.border,
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.65,
        categoryPercentage: 0.8,
      };
    });
  }, [uniqueTaskIds, timeline, coreCount]);

  const chartData = { labels: yLabels, datasets };
  const dynamicChartHeight = Math.max(200, coreCount * 55);

  const classicOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#f8fafc",
        bodyColor: "#cbd5e1",
        borderColor: "#334155",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (items) => (items.length ? `${items[0].dataset.label} (${items[0].raw.y})` : ""),
          label: (context) => {
            const raw = context.raw;
            if (!raw || !raw.x) return "";
            return ` ⏱️ ${raw.x[0]}ms ➔ ${raw.x[1]}ms (${raw.x[1] - raw.x[0]}ms)`;
          },
        },
      },
      datalabels: {
        color: "#ffffff",
        font: { family: "Vazirmatn, sans-serif", weight: "bold", size: 10 },
        formatter: (value, context) => {
          if (!value || !value.x) return "";
          return value.x[1] - value.x[0] > 150 ? context.dataset.label.replace("Task #", "#") : "";
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(51, 65, 85, 0.3)" },
        ticks: { color: "#94a3b8", callback: (val) => `${val}ms` },
      },
      y: {
        grid: { color: "rgba(51, 65, 85, 0.2)" },
        ticks: { color: "#f1f5f9", font: { weight: "bold" } },
      },
    },
  };

  const svgWidth = 1000;
  const svgHeight = 120;
  const baselineY = 95;

  const waveSlices = useMemo(() => {
    return timeline.map((slice, idx) => {
      const taskIdx = uniqueTaskIds.indexOf(slice.taskId);
      const colorObj = TASK_PALETTE[taskIdx % TASK_PALETTE.length];

      const x1 = (slice.startTime / maxTime) * (svgWidth - 40) + 20;
      const x2 = (slice.endTime / maxTime) * (svgWidth - 40) + 20;
      const width = Math.max(x2 - x1, 12);

      const waveHeight = Math.min(50, 25 + (slice.coreId % 3) * 10);
      const peakY = baselineY - waveHeight;
      const midX = x1 + width / 2;

      const pathD = `M ${x1} ${baselineY} Q ${midX} ${peakY} ${x2} ${baselineY} Z`;

      return {
        ...slice,
        id: `slice-${idx}`,
        x1,
        x2,
        width,
        colorObj,
        pathD,
        midX,
        peakY,
      };
    });
  }, [timeline, maxTime, uniqueTaskIds]);

  return (
    <div className="bg-gray-800/90 backdrop-blur-md p-3 sm:p-5 rounded-2xl border border-gray-700/70 shadow-xl w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-gray-700/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-4 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></span>
          <h3 className="text-sm sm:text-base text-white font-bold">
            {t("stats.ganttChartTitle", "زمان‌بندی اجرای هسته‌ها")}
          </h3>
        </div>

        <div className="flex items-center bg-gray-900/80 p-1 rounded-xl border border-gray-700/60 self-start sm:self-auto">
          <button
            onClick={() => setViewMode("wave")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === "wave"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span>🌊</span>
            <span>{t("stats.waveView", "نمای موجی (موبایل)")}</span>
          </button>
          <button
            onClick={() => setViewMode("classic")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === "classic"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span>📊</span>
            <span>{t("stats.classicGantt", "گانت کلاسیک")}</span>
          </button>
        </div>
      </div>

      {taskSummaries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3.5 max-h-24 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-700">
          {taskSummaries.map((item) => (
            <div
              key={item.taskId}
              className={`flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border text-[11px] sm:text-xs ${item.colorObj.badgeBg}`}
            >
              <span
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: item.colorObj.bg }}
              ></span>
              <span className={`font-semibold ${item.colorObj.text}`}>
                #{item.taskId}
              </span>
              <span className="text-[10px] text-gray-400 border-r rtl:border-r-0 rtl:border-l border-gray-700/60 pr-1 rtl:pr-0 rtl:pl-1 font-mono">
                {item.totalDuration}ms
              </span>
            </div>
          ))}
        </div>
      )}

      {viewMode === "wave" ? (
        <div className="w-full bg-gray-900/60 rounded-xl p-3 border border-gray-800">
          <div className="w-full overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-gray-700">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full min-w-[500px] h-32 select-none overflow-visible"
            >
              <defs>
                <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              <line
                x1="15"
                y1={baselineY}
                x2={svgWidth - 15}
                y2={baselineY}
                stroke="url(#lineGlow)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const tickX = 20 + pct * (svgWidth - 40);
                const timeVal = Math.round(pct * maxTime);
                return (
                  <g key={i}>
                    <line
                      x1={tickX}
                      y1={baselineY - 4}
                      x2={tickX}
                      y2={baselineY + 6}
                      stroke="#64748b"
                      strokeWidth="1.5"
                    />
                    <text
                      x={tickX}
                      y={baselineY + 18}
                      fill="#94a3b8"
                      fontSize="10"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {timeVal}ms
                    </text>
                  </g>
                );
              })}

              {waveSlices.map((slice) => {
                const isSelected = selectedSlice?.id === slice.id;
                return (
                  <g
                    key={slice.id}
                    onClick={() => setSelectedSlice(slice)}
                    className="cursor-pointer transition-all duration-200 group"
                  >
                    <path
                      d={slice.pathD}
                      fill={slice.colorObj.bg}
                      fillOpacity={isSelected ? "0.9" : "0.55"}
                      stroke={slice.colorObj.border}
                      strokeWidth={isSelected ? "2.5" : "1.5"}
                      className="hover:fill-opacity-80 transition-all"
                    />

                    {slice.width > 25 && (
                      <text
                        x={slice.midX}
                        y={slice.peakY - 5}
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="pointer-events-none drop-shadow-md"
                      >
                        #{slice.taskId}
                      </text>
                    )}

                    <circle
                      cx={slice.midX}
                      cy={baselineY}
                      r={isSelected ? "5" : "3.5"}
                      fill={slice.colorObj.border}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-800 flex items-center justify-between text-xs text-gray-300 min-h-[32px]">
            {selectedSlice ? (
              <div className="flex items-center gap-2 w-full justify-between animate-[fadeIn_0.15s_ease-out]">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: selectedSlice.colorObj.bg }}
                  ></span>
                  <span className="font-bold text-white">
                    تسک #{selectedSlice.taskId}
                  </span>
                  <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-[10px] border border-gray-700 font-mono">
                    Core {selectedSlice.coreId}
                  </span>
                </div>

                <div className="font-mono text-[11px] text-indigo-300 bg-indigo-950/50 px-2.5 py-1 rounded-md border border-indigo-500/30">
                  ⏱️ {selectedSlice.startTime}ms ➔ {selectedSlice.endTime}ms (
                  {selectedSlice.endTime - selectedSlice.startTime}ms)
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic text-center w-full">
                👆 روی هر یک از موج‌ها کلیک کنید تا جزئیات زمان‌بندی آن را ببینید.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl bg-gray-900/40 p-2 border border-gray-800 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-700">
          <div
            style={{ height: `${dynamicChartHeight}px` }}
            className="min-w-[500px] sm:min-w-full relative"
          >
            <Bar data={chartData} options={classicOptions} />
          </div>
        </div>
      )}
    </div>
  );
}