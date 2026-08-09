import React from "react";
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

const TASK_COLORS = [
  "#6366f1", "#a855f7", "#ec4899", "#3b82f6", 
  "#10b981", "#f59e0b", "#ef4444", "#14b8a6"
];

export default function GanttChart({ timeline = [], coreCount = 1 }) {
  const { t } = useTranslation();

  const yLabels = Array.from({ length: coreCount }, (_, i) => `Core ${i}`);
  const uniqueTaskIds = [...new Set(timeline.map((item) => item.taskId))];

  const datasets = uniqueTaskIds.map((taskId, index) => {
    const color = TASK_COLORS[index % TASK_COLORS.length];
    const taskSlices = timeline.filter((item) => item.taskId === taskId);

    const data = taskSlices.map((slice) => ({
      x: [slice.startTime, slice.endTime],
      y: `Core ${slice.coreId}`,
    }));

    return {
      label: `Task #${taskId}`,
      data: data,
      backgroundColor: color,
      borderRadius: 4,
      borderSkipped: false,
      barPercentage: 0.6,
    };
  });

  const chartData = {
    labels: yLabels,
    datasets: datasets,
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#e5e7eb", font: { family: "Vazirmatn, sans-serif", size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const raw = context.raw;
            if (!raw || !raw.x) return "";
            const [start, end] = raw.x;
            return `${context.dataset.label}: ${start}ms ➔ ${end}ms (${end - start}ms)`;
          },
        },
      },
      datalabels: {
        color: "#ffffff",
        font: { weight: "bold", size: 10 },
        formatter: (value, context) => {
          if (!value || !value.x) return "";
          const duration = value.x[1] - value.x[0];
          return duration > 100 ? context.dataset.label : "";
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Time (ms)",
          color: "#9ca3af",
        },
        grid: { color: "#374151" },
        ticks: { color: "#9ca3af" },
      },
      y: {
        grid: { color: "#374151" },
        ticks: { color: "#e5e7eb", font: { weight: "bold" } },
      },
    },
  };

  return (
    <div className="bg-gray-800/80 p-3 sm:p-5 rounded-xl border border-gray-700/80 w-full">
      <h3 className="text-sm sm:text-base text-white font-bold mb-3 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
        {t("stats.ganttChartTitle", "گانت چارت (زمان‌بندی اجرای هسته‌ها)")}
      </h3>
      <div className="w-full h-[260px] sm:h-[320px]">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}