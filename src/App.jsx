import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useScheduler } from "./hooks/useScheduler";
import "./index.css";
import StatsPanel from "./components/StatsPanel";

const getStatusText = (status, t) => {
  if (status === "idle") return t("status.idle");
  if (status === "processing") return t("status.processing");
  return status.toUpperCase();
};

const getPriorityStyle = (p, t) => {
  const priorityStyles = {
    1: {
      label: t("priority.low"),
      ring: "ring-gray-500/40",
      text: "text-gray-300",
      bg: "bg-gray-700/60",
    },
    5: {
      label: t("priority.medium"),
      ring: "ring-amber-500/40",
      text: "text-amber-300",
      bg: "bg-amber-900/30",
    },
    10: {
      label: t("priority.high"),
      ring: "ring-rose-500/40",
      text: "text-rose-300",
      bg: "bg-rose-900/30",
    },
  };
  return priorityStyles[p] || priorityStyles[1];
};

const getAlgorithmInfo = (algorithm, t) => {
  return {
    title: t(`algorithms.${algorithm}.title`),
    subtitle: t(`algorithms.${algorithm}.subtitle`),
    badge: t(`algorithms.${algorithm}.badge`),
    badgeColor:
      algorithm === "FIFO"
        ? "bg-emerald-600/20 text-emerald-300 border-emerald-600/40"
        : algorithm === "PRIORITY"
        ? "bg-rose-600/20 text-rose-300 border-rose-600/40"
        : "bg-cyan-600/20 text-cyan-300 border-cyan-600/40",
    description: t(`algorithms.${algorithm}.description`),
    keyPoints: t(`algorithms.${algorithm}.keyPoints`, { returnObjects: true }) || [],
    note: t(`algorithms.${algorithm}.note`),
  };
};

function InfoModal({ algorithm, onClose }) {
  const { t } = useTranslation();
  const info = getAlgorithmInfo(algorithm, t);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/50 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 p-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-extrabold text-white">
                {info.title}
              </h3>
              <span
                className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${info.badgeColor}`}
              >
                {info.badge}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{info.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg w-9 h-9 flex items-center justify-center transition-colors text-xl leading-none"
            aria-label={t("infoModal.close")}
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-gray-300 leading-8 text-[15px]">
            {info.description}
          </p>

          <div>
            <h4 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-blue-500" />
              {t("infoModal.keyPoints")}
            </h4>
            <ul className="space-y-3">
              {Array.isArray(info.keyPoints) &&
                info.keyPoints.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 bg-gray-950/50 border border-gray-800 rounded-xl p-3.5"
                  >
                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-[11px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-300 leading-7">{point}</p>
                  </li>
                ))}
            </ul>
          </div>

          {info.note && (
            <div className="flex items-start gap-3 bg-amber-950/30 border border-amber-800/40 rounded-xl p-4">
              <span className="shrink-0 text-amber-400 text-lg">⚠</span>
              <p className="text-sm text-amber-200/90 leading-7">{info.note}</p>
            </div>
          )}

          <div className="text-[11px] text-gray-600 border-t border-gray-800 pt-4">
            {t("infoModal.sourceNote")}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { t, i18n } = useTranslation();
  const {
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
    clearLogs,
  } = useScheduler();

  const [taskComplexity, setTaskComplexity] = useState(1);
  const [taskPriority, setTaskPriority] = useState(1);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const [showBenchmarkForm, setShowBenchmarkForm] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [benchTaskCount, setBenchTaskCount] = useState(8);
  const [benchComplexity, setBenchComplexity] = useState(3);

  const activeCores = cores.filter((c) => c.status !== "idle").length;
  const currentInfo = getAlgorithmInfo(algorithm, t);
  const isRoundRobin = algorithm === "ROUND_ROBIN";

  const toggleLanguage = () => {
    const newLang = i18n.language === "fa" ? "en" : "fa";
    i18n.changeLanguage(newLang);
  };

  const benchmarkFinished = useMemo(() => {
    if (!benchmarkMode || benchmarkTasks.length === 0) return false;
    return benchmarkTasks.every(
      (t) => t.status === "completed" || t.completionTime
    );
  }, [benchmarkMode, benchmarkTasks]);

  useMemo(() => {
    if (benchmarkFinished) setShowStatsPanel(true);
  }, [benchmarkFinished]);

  const handleStartBenchmark = () => {
    const tasksConfig = Array.from({ length: benchTaskCount }, (_, i) => ({
      complexity: benchComplexity,
      priority: Math.floor(Math.random() * 10) + 1,
      delay: i * 300,
    }));
    startBenchmark(tasksConfig);
    setShowBenchmarkForm(false);
  };

  const handleCloseStats = () => {
    setShowStatsPanel(false);
    exitBenchmark();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      {showInfoModal && (
        <InfoModal
          algorithm={algorithm}
          onClose={() => setShowInfoModal(false)}
        />
      )}

      {showStatsPanel && (
        <StatsPanel
          tasks={benchmarkTasks}
          coreCount={maxCores}
          onClose={handleCloseStats}
        />
      )}

      {showBenchmarkForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-indigo-500" />
              {t("benchmarkModal.title")}
            </h2>

            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="text-sm text-gray-400">
                  {t("benchmarkModal.taskCount")}
                </label>
                <span className="text-sm font-mono font-bold text-indigo-400">
                  {benchTaskCount}
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                value={benchTaskCount}
                onChange={(e) => setBenchTaskCount(Number(e.target.value))}
                className="w-full h-2 rounded-full cursor-pointer accent-indigo-500 bg-gray-800"
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="text-sm text-gray-400">
                  {t("benchmarkModal.complexity")}
                </label>
                <span className="text-sm font-mono font-bold text-indigo-400">
                  {benchComplexity}x
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={benchComplexity}
                onChange={(e) => setBenchComplexity(Number(e.target.value))}
                className="w-full h-2 rounded-full cursor-pointer accent-indigo-500 bg-gray-800"
              />
            </div>

            <p className="text-xs text-gray-500 mb-5 leading-5">
              {t("benchmarkModal.description", {
                algorithm,
                maxCores,
              })}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleStartBenchmark}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all"
              >
                {t("benchmarkModal.start")}
              </button>
              <button
                onClick={() => setShowBenchmarkForm(false)}
                className="px-5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all"
              >
                {t("benchmarkModal.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-20 backdrop-blur-md bg-gray-950/70 border-b border-gray-800">
        <header className="max-w-[1600px] mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r rtl:bg-gradient-to-l from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              {t("header.title")}
            </h1>
            <p className="text-gray-500 text-xs md:text-sm mt-1">
              {t("header.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm flex-wrap">
            <button
              onClick={toggleLanguage}
              className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg px-3 py-1.5 font-medium transition-colors"
            >
              {i18n.language === "fa" ? "English" : "فارسی"}
            </button>

            <div className="flex items-center gap-2 bg-gray-800/80 border border-gray-700 rounded-lg px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-gray-300">
                {t("header.activeCores", { active: activeCores, max: maxCores })}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/80 border border-gray-700 rounded-lg px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-gray-300">
                {t("header.inQueue", { count: queue.length })}
              </span>
            </div>
            {isRoundRobin && (
              <div className="flex items-center gap-2 bg-cyan-900/30 border border-cyan-700/40 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-cyan-300">
                  {t("header.quantum", { ms: timeQuantum })}
                </span>
              </div>
            )}

            {!benchmarkMode ? (
              <button
                onClick={() => setShowBenchmarkForm(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/40 rounded-lg px-3 py-1.5 text-white font-medium transition-colors"
              >
                {t("header.benchmarkMode")}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-2 bg-indigo-900/30 border border-indigo-700/40 rounded-lg px-3 py-1.5 text-indigo-300">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  {t("header.benchmarkProgress", {
                    completed: completedTasks.length,
                    total: benchmarkTasks.length,
                  })}
                </span>
                <button
                  onClick={() => setShowStatsPanel(true)}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-300 transition-colors"
                >
                  {t("header.viewStats")}
                </button>
                <button
                  onClick={exitBenchmark}
                  className="bg-red-900/40 hover:bg-red-800/60 border border-red-700/40 rounded-lg px-3 py-1.5 text-red-300 transition-colors"
                >
                  {t("header.exit")}
                </button>
              </div>
            )}
          </div>
        </header>
      </div>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900/60 backdrop-blur p-5 rounded-2xl shadow-xl border border-gray-800 h-fit lg:sticky lg:top-24">
          <h2 className="text-lg font-bold mb-5 text-white flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-blue-500" />
            {t("controlPanel.title")}
          </h2>

          <div className="mb-5">
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-sm text-gray-400">
                {t("controlPanel.activeCores")}
              </label>
              <span className="text-sm font-mono font-bold text-blue-400">
                {maxCores}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max={hardwareCores * 2}
              value={maxCores}
              onChange={(e) => setMaxCores(Number(e.target.value))}
              className="w-full h-2 rounded-full cursor-pointer accent-blue-500 bg-gray-800"
            />
            <p className="text-xs text-gray-600 mt-1.5">
              {t("controlPanel.hardwareLimit", { cores: hardwareCores })}
            </p>
          </div>

          <div className="mb-5">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm text-gray-400">
                {t("controlPanel.algorithm")}
              </label>
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                title={t("controlPanel.algoGuide")}
                className="w-5 h-5 rounded-full bg-gray-800 hover:bg-blue-600 border border-gray-700 hover:border-blue-500 text-gray-400 hover:text-white text-[11px] font-bold flex items-center justify-center transition-colors"
              >
                ?
              </button>
            </div>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              disabled={benchmarkMode}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="FIFO">{t("controlPanel.algoOptions.fifo")}</option>
              <option value="PRIORITY">
                {t("controlPanel.algoOptions.priority")}
              </option>
              <option value="ROUND_ROBIN">
                {t("controlPanel.algoOptions.roundRobin")}
              </option>
            </select>

            <div className="flex items-center gap-2 mt-2.5">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${currentInfo.badgeColor}`}
              >
                {currentInfo.badge}
              </span>
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="text-[11px] text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
              >
                {t("controlPanel.viewFullDetails")}
              </button>
            </div>
          </div>

          {isRoundRobin && (
            <div className="mb-5 bg-cyan-950/20 border border-cyan-800/30 rounded-xl p-3.5 animate-[fadeIn_0.2s_ease-out]">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm text-cyan-300 flex items-center gap-1.5">
                  {t("controlPanel.timeQuantum")}
                  <button
                    type="button"
                    onClick={() => setShowInfoModal(true)}
                    title={t("controlPanel.timeQuantumGuide")}
                    className="w-4 h-4 rounded-full bg-cyan-900/50 hover:bg-cyan-700 border border-cyan-700/50 text-cyan-300 hover:text-white text-[9px] font-bold flex items-center justify-center transition-colors"
                  >
                    ?
                  </button>
                </label>
                <span className="text-sm font-mono font-bold text-cyan-400">
                  {timeQuantum}ms
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="8000"
                step="500"
                value={timeQuantum}
                onChange={(e) => setTimeQuantum(Number(e.target.value))}
                className="w-full h-2 rounded-full cursor-pointer accent-cyan-500 bg-gray-800"
              />
              <p className="text-[11px] text-cyan-200/60 mt-1.5 leading-5">
                {t("controlPanel.timeQuantumDesc", { ms: timeQuantum })}
              </p>
            </div>
          )}

          <div className="border-t border-gray-800 my-5" />

          <div className="mb-5">
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-sm text-gray-400">
                {t("controlPanel.taskComplexity")}
              </label>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={taskComplexity}
              onChange={(e) => setTaskComplexity(Number(e.target.value))}
              disabled={benchmarkMode}
              className="w-full h-2 rounded-full cursor-pointer accent-emerald-500 bg-gray-800 disabled:opacity-50"
            />
            <div className="text-start text-xs font-mono text-emerald-400 mt-1">
              {t("controlPanel.complexityMultiplier", {
                value: taskComplexity,
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">
              {t("controlPanel.taskPriority")}
              {isRoundRobin && (
                <span className="text-[10px] text-gray-600 mx-1.5">
                  {t("controlPanel.rrPriorityNote")}
                </span>
              )}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 1, key: "low" },
                { v: 5, key: "medium" },
                { v: 10, key: "high" },
              ].map((opt) => {
                const ps = getPriorityStyle(opt.v, t);
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setTaskPriority(opt.v)}
                    disabled={benchmarkMode}
                    className={`text-xs py-2 rounded-lg border transition-all font-medium disabled:opacity-50 ${
                      taskPriority === opt.v
                        ? `${ps.bg} ${ps.text} border-current`
                        : "bg-gray-950 border-gray-700 text-gray-500 hover:border-gray-500"
                    }`}
                  >
                    {ps.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => addTask(taskComplexity, taskPriority)}
            disabled={benchmarkMode}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("controlPanel.submitTask")}
          </button>

          <button
            onClick={() => {
              for (let i = 0; i < 10; i++)
                addTask(
                  Math.floor(Math.random() * 5) + 1,
                  Math.floor(Math.random() * 10) + 1
                );
            }}
            disabled={benchmarkMode}
            className="w-full mt-2.5 bg-purple-600/90 hover:bg-purple-500 active:scale-[0.98] transition-all text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("controlPanel.stressTest")}
          </button>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-gray-900/60 backdrop-blur p-5 rounded-2xl border border-gray-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-cyan-500" />
                {t("monitor.title")}
              </h2>
              <span className="text-[11px] text-gray-500">
                {t("monitor.activeAlgorithm")}{" "}
                <span className="text-gray-300 font-medium">
                  {currentInfo.title.split("—")[0].trim()}
                </span>
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cores.map((core) => {
                const busy = core.status !== "idle";
                return (
                  <div
                    key={core.id}
                    className={`relative overflow-hidden p-4 rounded-xl border transition-all duration-300 ${
                      busy
                        ? isRoundRobin
                          ? "border-cyan-500/60 bg-gradient-to-br from-cyan-950/50 to-gray-900 shadow-lg shadow-cyan-900/20"
                          : "border-blue-500/60 bg-gradient-to-br from-blue-950/50 to-gray-900 shadow-lg shadow-blue-900/20"
                        : "border-gray-800 bg-gray-950/50"
                    }`}
                  >
                    {busy && (
                      <span
                        className={`absolute top-0 left-0 right-0 h-0.5 ${
                          isRoundRobin ? "bg-cyan-400" : "bg-blue-400"
                        } animate-pulse`}
                      />
                    )}
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-gray-300 text-sm">
                        {t("monitor.core", { id: core.id })}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          busy
                            ? isRoundRobin
                              ? "bg-cyan-600 text-white"
                              : "bg-blue-600 text-white"
                            : "bg-gray-800 text-gray-500"
                        }`}
                      >
                        {busy && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/90 mx-1 animate-pulse" />
                        )}
                        {getStatusText(core.status, t)}
                      </span>
                    </div>

                    {busy ? (
                      <div>
                        <p
                          className={`text-[11px] mb-2 font-mono truncate ${
                            isRoundRobin
                              ? "text-cyan-300/80"
                              : "text-blue-300/80"
                          }`}
                        >
                          {t("monitor.task", { id: core.taskId })}
                        </p>
                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ease-out bg-gradient-to-r rtl:bg-gradient-to-l ${
                              isRoundRobin
                                ? "from-cyan-500 to-teal-400"
                                : "from-blue-500 to-cyan-400"
                            }`}
                            style={{ width: `${core.progress}%` }}
                          />
                        </div>
                        <p className="text-end text-[11px] mt-1.5 text-gray-400 font-mono">
                          {core.progress}%
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-12">
                        <p className="text-xs text-gray-600">
                          {t("monitor.waiting")}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900/60 backdrop-blur p-5 rounded-2xl border border-gray-800 shadow-xl flex flex-col h-80">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-yellow-500" />
                  {t("queue.title")}
                </h2>
                <span className="bg-yellow-600/90 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                  {t("queue.inQueue", { count: queue.length })}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto px-1 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                {queue.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-600 text-sm italic">
                      {t("queue.empty")}
                    </p>
                  </div>
                ) : (
                  queue.map((task, idx) => {
                    const ps = getPriorityStyle(task.priority, t);
                    const isResumed = isRoundRobin && task.resumeState;
                    return (
                      <div
                        key={task.id}
                        className={`bg-gray-950/60 border p-3 rounded-xl flex justify-between items-center transition-colors ${
                          isResumed
                            ? "border-cyan-700/50 hover:border-cyan-600"
                            : "border-gray-800 hover:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-gray-600 w-5">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-mono text-sm text-yellow-400">
                                {task.id}
                              </p>
                              {isResumed && (
                                <span
                                  title={t("queue.resumedTooltip", {
                                    count: task.resumeState.primesFound,
                                  })}
                                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-900/50 text-cyan-300 border border-cyan-700/40 font-medium"
                                >
                                  {t("queue.resumed")}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">
                              {t("queue.complexity", {
                                value: task.complexity,
                              })}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] px-2 py-1 rounded-lg font-medium ${ps.bg} ${ps.text}`}
                        >
                          {ps.label}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-gray-900/60 backdrop-blur p-5 rounded-2xl border border-gray-800 shadow-xl flex flex-col h-80">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-green-500" />
                  {t("logs.title")}
                </h2>
                <button
                  onClick={clearLogs}
                  className="text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-2.5 py-1 transition-colors"
                >
                  {t("logs.clear")}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto bg-black/40 p-3 rounded-xl font-mono text-xs text-green-400 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-600 italic">{t("logs.empty")}</p>
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <p
                      key={i}
                      className="border-b border-gray-800/60 pb-1 last:border-0"
                    >
                      {log}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}