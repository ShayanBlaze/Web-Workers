import { useState, useMemo } from "react";
import { useScheduler } from "./hooks/useScheduler";
import "./index.css";
import StatsPanel from "./components/StatsPanel";

const getStatusText = (status) => {
  if (status === "idle") return "بیکار";
  if (status === "processing") return "در حال پردازش";
  return status.toUpperCase();
};

const priorityStyles = {
  1: {
    label: "پایین",
    ring: "ring-gray-500/40",
    text: "text-gray-300",
    bg: "bg-gray-700/60",
  },
  5: {
    label: "متوسط",
    ring: "ring-amber-500/40",
    text: "text-amber-300",
    bg: "bg-amber-900/30",
  },
  10: {
    label: "بالا",
    ring: "ring-rose-500/40",
    text: "text-rose-300",
    bg: "bg-rose-900/30",
  },
};

const getPriorityStyle = (p) => priorityStyles[p] || priorityStyles[1];

const algorithmInfo = {
  FIFO: {
    title: "FIFO — First In, First Out",
    subtitle: "زمان‌بندی به ترتیب ورود",
    badge: "Non-preemptive",
    badgeColor: "bg-emerald-600/20 text-emerald-300 border-emerald-600/40",
    description:
      "در الگوریتم FIFO، تسک‌ها دقیقاً به همان ترتیبی که وارد صف آماده می‌شوند، روی هسته‌های آزاد اجرا می‌گردند. این یکی از ساده‌ترین الگوریتم‌های زمان‌بندی است که در اکثر کتاب‌های مرجع سیستم‌عامل (مانند Silberschatz و Tanenbaum) به‌عنوان نقطه شروع آموزش مطرح می‌شود.",
    keyPoints: [
      "این الگوریتم Non-preemptive است؛ یعنی هیچ تسکی نمی‌تواند تسک دیگری را که در حال اجراست متوقف کند.",
      "منصفانه‌ترین الگوریتم از نظر ترتیب ورود است، اما ممکن است باعث «Convoy Effect» شود؛ یعنی تسک‌های کوتاه پشت تسک‌های طولانی معطل بمانند.",
      "در این شبیه‌ساز، وقتی هسته‌ای آزاد شود، اولین تسک صف بدون در نظر گرفتن اولویت به آن اختصاص می‌یابد.",
    ],
    note: null,
  },
  PRIORITY: {
    title: "Priority Scheduling — زمان‌بندی اولویت‌محور",
    subtitle: "زمان‌بندی بر اساس درجه اهمیت تسک",
    badge: "Preemptive",
    badgeColor: "bg-rose-600/20 text-rose-300 border-rose-600/40",
    description:
      "در این الگوریتم، هر تسک دارای یک مقدار اولویت است. زمان‌بند همواره تسکی با بالاترین اولویت را برای اجرا انتخاب می‌کند. اگر تسکی با اولویت بالاتر وارد سیستم شود در حالی که تمام هسته‌ها مشغول‌اند، پایین‌اولویت‌ترین تسک در حال اجرا Preempt (متوقف) می‌شود.",
    keyPoints: [
      "این نسخه از الگوریتم Preemptive است؛ یعنی تسک در حال اجرا می‌تواند توسط تسک تازه‌واردِ پراولویت‌تر متوقف شود.",
      "در این شبیه‌ساز به‌صورت عمدی مکانیزم Context Switching (ذخیره و بازیابی وضعیت پردازش) پیاده‌سازی نشده است. به همین دلیل تسک Preempt‌شده هنگام بازگشت به صف، پیشرفت قبلی خود را از دست می‌دهد و از ابتدا دوباره اجرا می‌شود.",
      "این رفتار معادل نبود PCB (Process Control Block) برای ذخیره Context در یک سیستم واقعی است و هدف آموزشی آن، نمایش تفاوت مفهومی الگوریتم Preemptive نسبت به Non-preemptive است.",
      "ممکن است دچار مشکل Starvation شود: تسک‌های با اولویت پایین در صورت ورود پیوسته تسک‌های پراولویت، ممکن است هرگز فرصت اجرای کامل پیدا نکنند.",
    ],
    note: "توجه: در سیستم‌های چندهسته‌ای، اگر هنگام ورود تسک پراولویت، هسته آزادی موجود باشد، دیسپچر معطل Preemption نمی‌ماند و بلافاصله تسک جدید را به آن هسته آزاد اختصاص می‌دهد. به همین دلیل ممکن است تسک تازه‌وارد و تسک Preempt‌شده (که به صف بازگشته) به‌طور هم‌زمان روی هسته‌های مختلف اجرا شوند؛ این رفتار باگ نیست بلکه استفاده بهینه از منابع آزاد است.",
  },
  ROUND_ROBIN: {
    title: "Round Robin — نوبت‌دهی چرخشی",
    subtitle: "زمان‌بندی عادلانه بر پایه کوانتوم زمانی",
    badge: "Preemptive (Time-based)",
    badgeColor: "bg-cyan-600/20 text-cyan-300 border-cyan-600/40",
    description:
      "در الگوریتم Round Robin، به هر تسک یک بازه زمانی ثابت به نام Time Quantum اختصاص داده می‌شود. اگر تسک ظرف این مدت به پایان نرسد، به‌صورت اجباری از هسته خارج شده، وضعیتش ذخیره می‌شود و به انتهای صف آماده منتقل می‌گردد تا سایر تسک‌ها هم فرصت اجرا پیدا کنند. این الگوریتم پایه بسیاری از سیستم‌عامل‌های Time-sharing واقعی است.",
    keyPoints: [
      "برخلاف Priority، وقفه (Preemption) در اینجا نه به‌خاطر اولویت، بلکه صرفاً به‌خاطر اتمام زمان (Time Quantum) رخ می‌دهد.",
      "برخلاف Priority، در این شبیه‌ساز Context Saving پیاده‌سازی شده است؛ یعنی تسک متوقف‌شده هنگام بازگشت به نوبت، دقیقاً از همان نقطه‌ای که متوقف شده بود ادامه پیدا می‌کند، نه از صفر.",
      "تسک متوقف‌شده به دلیل اتمام کوانتوم، برخلاف حالت Preemption در Priority، به ابتدای صف بازنمی‌گردد؛ بلکه به انتهای صف اضافه می‌شود تا نوبت‌دهی چرخشی (Round Robin) حفظ شود.",
      "انتخاب اندازه Time Quantum بسیار مهم است: کوانتوم خیلی کوچک باعث افزایش overhead سوییچ‌های زمینه (Context Switch) می‌شود و کوانتوم خیلی بزرگ عملاً الگوریتم را به FIFO تبدیل می‌کند.",
    ],
    note: "توجه: در این شبیه‌ساز، Context Switch به‌صورت نرم‌افزاری و بدون هزینه زمانی شبیه‌سازی شده است. در یک سیستم‌عامل واقعی، هر سوییچ زمینه خود هزینه‌ی زمانی (Overhead) دارد که در این نسخه آموزشی برای سادگی نادیده گرفته شده است.",
  },
};

function InfoModal({ algorithm, onClose }) {
  const info = algorithmInfo[algorithm];

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
            aria-label="بستن"
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
              نکات کلیدی
            </h4>
            <ul className="space-y-3">
              {info.keyPoints.map((point, i) => (
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
            منبع مفهومی: مباحث زمان‌بندی CPU در کتاب‌های مرجع سیستم‌عامل
            (Operating System Concepts — Silberschatz, Galvin, Gagne)
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
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
  const currentInfo = algorithmInfo[algorithm];
  const isRoundRobin = algorithm === "ROUND_ROBIN";

  const benchmarkFinished = useMemo(() => {
    if (!benchmarkMode || benchmarkTasks.length === 0) return false;
    return benchmarkTasks.every(
      (t) => t.status === "completed" || t.completionTime,
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
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-100"
    >
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
              تنظیمات حالت Benchmark
            </h2>

            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="text-sm text-gray-400">تعداد تسک‌ها</label>
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
                <label className="text-sm text-gray-400">پیچیدگی هر تسک</label>
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
              با الگوریتم فعلی (
              <span className="text-gray-300">{algorithm}</span>) و {maxCores}{" "}
              هسته اجرا خواهد شد. تسک‌ها با فاصله‌ی زمانی کوتاه وارد صف می‌شوند.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleStartBenchmark}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all"
              >
                شروع Benchmark
              </button>
              <button
                onClick={() => setShowBenchmarkForm(false)}
                className="px-5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-20 backdrop-blur-md bg-gray-950/70 border-b border-gray-800">
        <header className="max-w-[1600px] mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-l from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              شبیه‌ساز زمان‌بند سیستم‌عامل مجازی
            </h1>
            <p className="text-gray-500 text-xs md:text-sm mt-1">
              شبیه‌سازی CPU چند رشته‌ای با Web Workers و React Hooks
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-gray-800/80 border border-gray-700 rounded-lg px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-gray-300">
                {activeCores}/{maxCores} هسته فعال
              </span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/80 border border-gray-700 rounded-lg px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-gray-300">{queue.length} در صف</span>
            </div>
            {isRoundRobin && (
              <div className="flex items-center gap-2 bg-cyan-900/30 border border-cyan-700/40 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-cyan-300">کوانتوم: {timeQuantum}ms</span>
              </div>
            )}

            {!benchmarkMode ? (
              <button
                onClick={() => setShowBenchmarkForm(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/40 rounded-lg px-3 py-1.5 text-white font-medium transition-colors"
              >
                🧪 حالت Benchmark
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-2 bg-indigo-900/30 border border-indigo-700/40 rounded-lg px-3 py-1.5 text-indigo-300">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  Benchmark: {completedTasks.length}/{benchmarkTasks.length}
                </span>
                <button
                  onClick={() => setShowStatsPanel(true)}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-300 transition-colors"
                >
                  مشاهده آمار
                </button>
                <button
                  onClick={exitBenchmark}
                  className="bg-red-900/40 hover:bg-red-800/60 border border-red-700/40 rounded-lg px-3 py-1.5 text-red-300 transition-colors"
                >
                  خروج
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
            پنل کنترل
          </h2>

          <div className="mb-5">
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-sm text-gray-400">هسته‌های فعال CPU</label>
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
              محدودیت سخت‌افزاری: {hardwareCores} هسته
            </p>
          </div>

          <div className="mb-5">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm text-gray-400">
                الگوریتم زمان‌بندی
              </label>
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                title="راهنمای مفهومی الگوریتم"
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
              <option value="FIFO">FIFO (ورودی اول، خروجی اول)</option>
              <option value="PRIORITY">زمان‌بندی اولویت‌محور (Priority)</option>
              <option value="ROUND_ROBIN">Round Robin (نوبت‌دهی چرخشی)</option>
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
                مشاهده توضیحات کامل
              </button>
            </div>
          </div>

          {isRoundRobin && (
            <div className="mb-5 bg-cyan-950/20 border border-cyan-800/30 rounded-xl p-3.5 animate-[fadeIn_0.2s_ease-out]">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm text-cyan-300 flex items-center gap-1.5">
                  Time Quantum (کوانتوم زمانی)
                  <button
                    type="button"
                    onClick={() => setShowInfoModal(true)}
                    title="توضیح کوانتوم زمانی"
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
                هر تسک حداکثر به مدت {timeQuantum}ms روی هسته باقی می‌ماند؛ سپس
                (در صورت ناتمام بودن) به انتهای صف منتقل می‌شود.
              </p>
            </div>
          )}

          <div className="border-t border-gray-800 my-5" />

          <div className="mb-5">
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-sm text-gray-400">
                پیچیدگی تسک (محاسبه $x \times 2M$ عدد اول)
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
            <div className="text-left text-xs font-mono text-emerald-400 mt-1">
              ضریب: {taskComplexity}x
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">
              اولویت تسک
              {isRoundRobin && (
                <span className="text-[10px] text-gray-600 mr-1.5">
                  (در RR تاثیری در ترتیب اجرا ندارد)
                </span>
              )}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 1, l: "پایین" },
                { v: 5, l: "متوسط" },
                { v: 10, l: "بالا" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setTaskPriority(opt.v)}
                  disabled={benchmarkMode}
                  className={`text-xs py-2 rounded-lg border transition-all font-medium disabled:opacity-50 ${
                    taskPriority === opt.v
                      ? `${getPriorityStyle(opt.v).bg} ${getPriorityStyle(opt.v).text} border-current`
                      : "bg-gray-950 border-gray-700 text-gray-500 hover:border-gray-500"
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => addTask(taskComplexity, taskPriority)}
            disabled={benchmarkMode}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ارسال تسک
          </button>

          <button
            onClick={() => {
              for (let i = 0; i < 10; i++)
                addTask(
                  Math.floor(Math.random() * 5) + 1,
                  Math.floor(Math.random() * 10) + 1,
                );
            }}
            disabled={benchmarkMode}
            className="w-full mt-2.5 bg-purple-600/90 hover:bg-purple-500 active:scale-[0.98] transition-all text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            تست استرس (افزودن ۱۰ تسک)
          </button>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-gray-900/60 backdrop-blur p-5 rounded-2xl border border-gray-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-cyan-500" />
                مانیتور هسته‌های CPU
              </h2>
              <span className="text-[11px] text-gray-500">
                الگوریتم فعال:{" "}
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
                        هسته {core.id}
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
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/90 ml-1 animate-pulse" />
                        )}
                        {getStatusText(core.status)}
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
                          تسک: {core.taskId}
                        </p>
                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ease-out bg-gradient-to-l ${
                              isRoundRobin
                                ? "from-cyan-500 to-teal-400"
                                : "from-blue-500 to-cyan-400"
                            }`}
                            style={{ width: `${core.progress}%` }}
                          />
                        </div>
                        <p className="text-left text-[11px] mt-1.5 text-gray-400 font-mono">
                          {core.progress}%
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-12">
                        <p className="text-xs text-gray-600">
                          در انتظار دستور...
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
                  صف آماده
                </h2>
                <span className="bg-yellow-600/90 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                  {queue.length} در انتظار
                </span>
              </div>
              <div className="flex-1 overflow-y-auto pl-1 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                {queue.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-600 text-sm italic">صف خالی است.</p>
                  </div>
                ) : (
                  queue.map((task, idx) => {
                    const ps = getPriorityStyle(task.priority);
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
                                  title={`ادامه از ${task.resumeState.primesFound} عدد اول یافت‌شده`}
                                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-900/50 text-cyan-300 border border-cyan-700/40 font-medium"
                                >
                                  ادامه‌دار
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">
                              پیچیدگی: {task.complexity}x
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
                  لاگ‌های سیستم
                </h2>
                <button
                  onClick={clearLogs}
                  className="text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-2.5 py-1 transition-colors"
                >
                  پاک کردن
                </button>
              </div>
              <div className="flex-1 overflow-y-auto bg-black/40 p-3 rounded-xl font-mono text-xs text-green-400 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-600 italic">
                      هنوز لاگی ثبت نشده است.
                    </p>
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
