# ⚡ OS CPU Scheduling & Multi-Core Simulator

[![React](https://img.shields.io/badge/React-19.2.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3.x-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![i18next](https://img.shields.io/badge/i18next-Internationalization-26A69A?logo=i18next&logoColor=white)](https://www.i18next.com/)
[![Web Workers API](https://img.shields.io/badge/Web_Workers-Multithreading-FF6F00?logo=javascript&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
[![Vite](https://img.shields.io/badge/Vite-8.1.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A high-performance, interactive, multi-threaded Operating System CPU Scheduler and Benchmark Simulator built with **React**, **Tailwind CSS**, **i18next**, and **Web Workers**. 

This application simulates how modern operating system kernels manage CPU time across single or multi-core architectures. By leveraging the browser's native **Web Worker API**, compute-heavy process simulations (CPU-bound prime-number computations) run in parallel on isolated background threads without blocking the main UI thread.

**Fully responsive** and optimized for desktop, tablet, and mobile devices with **bilingual support** (English/Persian) and automatic RTL/LTR layout adaptation.

---

## 🌟 Key Features

* **⚙️ Dynamic Multi-Core Worker Pool**: Automatically detects hardware capabilities (`navigator.hardwareConcurrency`) and scales up to $2\times$ physical cores. Dynamically creates, allocates, and terminates Web Workers on demand.
* **🧠 Real OS Scheduling Algorithms**:
  * **FIFO (First-In, First-Out)**: Non-preemptive scheduling based strictly on arrival time.
  * **Preemptive Priority Scheduling**: Real-time preemption engine that preempts lower-priority tasks when higher-priority processes enter the ready queue.
  * **Round Robin (RR)**: Time-quantum based time-sharing (configurable $500\text{ms} - 8000\text{ms}$) with true process state saving and queue rotation.
* **💾 Context Switching & State Preservation**:
  * Simulates Process Control Block (PCB) context saving.
  * Paused or quantum-expired workers return their exact computation state (`resumeState`), allowing tasks to resume execution from their exact interruption point rather than restarting from zero.
* **📊 Benchmark Mode & Performance Analytics**:
  * Runs batch workload tests across custom task counts and complexities.
  * Calculates core OS metrics: **Turnaround Time (TAT)**, **Waiting Time (WT)**, **Response Time (RT)**, **CPU Utilization (%)**, and **System Throughput (tasks/sec)**.
* **🌐 Internationalization (i18n)**: Full bilingual support (English/Persian) with automatic RTL/LTR layout switching, browser language detection, and persistent language preferences using `i18next`.
* **📱 Fully Responsive Design**: Mobile-first adaptive interface with touch-optimized controls, bottom navigation tabs for ergonomic thumb reach, and seamless scaling from smartphones to ultrawide displays.
* **🎨 Modern UI/UX**: Glassmorphism design with real-time per-core progress monitors, interactive queue inspections, live system log streams, and adaptive dark theme.

---

## 🏗️ Architecture & System Design

To accurately mimic OS hardware abstraction, the project isolates the scheduling logic from heavy CPU workloads:

```
+-----------------------------------------------------------------------+
|                           MAIN UI THREAD                              |
|  [React UI] <---> [useScheduler Hook] <---> [Scheduler Dispatcher]    |
|   - Task Creation   - State Management       - FIFO / Priority / RR   |
|   - Real-Time Logs  - Benchmark Metrics      - Preemption Logic       |
+-----------------------------------+-----------------------------------+
                                    |
         postMessage()              |              onmessage()
    (Task / Cancel / Quantum)       |       (Progress / Complete / Resume)
                                    v
+-----------------------------------------------------------------------+
|                           WEB WORKER POOL                             |
|  +------------------+  +------------------+  +------------------+     |
|  | Core 1 (Worker)  |  | Core 2 (Worker)  |  | Core N (Worker)  |     |
|  | Prime Computation|  | Prime Computation|  | Prime Computation|     |
|  | Chunked Execution|  | Chunked Execution|  | Chunked Execution|     |
|  +------------------+  +------------------+  +------------------+     |
+-----------------------------------------------------------------------+
```
### 🔬 Non-Blocking Chunked Worker Engine

Each worker performs heavy mathematical calculations (finding prime numbers up to $x \times 2,000,000$). To allow real-time preemption and time-quantum expiration checks, computations are executed in non-blocking iterations using `setTimeout(runChunk, 0)` with a chunk size of $100,000$ operations:

1. **Preemption Signal (`CANCEL`)**: The worker captures the current iteration value (`currentVal`) and accumulated active execution time, returning a `resumeState` payload.
2. **Quantum Expiry (`QUANTUM_EXPIRED`)**: Monitored via `performance.now()`. When the active slice reaches `timeQuantum`, the process pauses, yields its state, and relocates to the tail of the ready queue.

---

## 📐 Implemented Scheduling Algorithms

### 1. First-In, First-Out (FIFO)

* **Type**: Non-Preemptive
* **Behavior**: Tasks are dispatched strictly according to arrival order. Once assigned to a core, a task executes to completion without interruption.
* **Tradeoff**: Vulnerable to the **Convoy Effect**, where short tasks wait behind long-running CPU-bound processes.

### 2. Preemptive Priority Scheduling

* **Type**: Preemptive
* **Priority Scale**: Priority values range from `1` (Low) to `10` (High).
* **Preemption Mechanism**: Upon task arrival, the scheduler evaluates all currently running tasks across all active cores:
  
  $$\text{Preempt if } \text{Priority}_{\text{new}} > \min\left(\text{Priority}_{\text{running}}\right)$$
  
  The running task with the lowest priority is immediately sent a `CANCEL` signal, interrupted, and re-queued.

### 3. Round Robin (RR)

* **Type**: Preemptive (Time-Sharing)
* **Quantum Range**: $500\text{ms}$ to $8000\text{ms}$ (Default: $3000\text{ms}$).
* **Behavior**: Processes are allocated CPU time slices. If a process does not complete within its quantum:
  1. Execution state (`currentVal`, `primesFound`, `accumulatedTime`) is captured.
  2. Task state transitions back to `waiting`.
  3. Task is appended to the **tail** of the ready queue to ensure fair execution rotation.

---

## 📈 Performance Metrics & Benchmark Formulas

The benchmark suite evaluates scheduler performance using standard Operating System performance formulas:

| Metric | Description | Mathematical Formula |
| :--- | :--- | :--- |
| **Turnaround Time ($TAT$)** | Total elapsed time from arrival to completion. | $$TAT = T_{\text{completion}} - T_{\text{arrival}}$$ |
| **Waiting Time ($WT$)** | Total time spent waiting in the ready queue. | $$WT = \max(0, TAT - T_{\text{burst}})$$ |
| **Response Time ($RT$)** | Duration between arrival and first core assignment. | $$RT = T_{\text{first\_run}} - T_{\text{arrival}}$$ |
| **CPU Utilization ($\%$)** | Percentage of active core execution vs total available time. | $$\text{CPU Utilization} = \left( \frac{\sum T_{\text{burst}}}{T_{\text{elapsed}} \times N_{\text{cores}}} \right) \times 100$$ |
| **Throughput** | Number of completed tasks per second. | $$\text{Throughput} = \frac{\text{Completed Tasks}}{T_{\text{elapsed}} \text{ (in seconds)}}$$ |

---

## 📁 Repository Structure

```
Web-Workers/
├── src/
│   ├── components/
│   │   └── StatsPanel.jsx       # Benchmark modal & metrics dashboard (responsive)
│   ├── hooks/
│   │   └── useScheduler.js      # Custom React Hook managing worker pool & state
│   ├── locales/
│   │   ├── en.json              # English translations
│   │   └── fa.json              # Persian (Farsi) translations
│   ├── schedulers/
│   │   ├── fifo.js              # FIFO scheduler strategy
│   │   ├── priority.js          # Preemptive priority scheduler strategy
│   │   └── roundRobin.js        # Round Robin scheduler strategy
│   ├── utils/
│   │   ├── formatTime.js        # Time unit formatting helpers (ms / s)
│   │   └── metrics.js           # OS performance calculation formulas
│   ├── worker.js                # Non-blocking Web Worker prime calculator engine
│   ├── App.jsx                  # Main React dashboard (responsive with mobile tabs)
│   ├── i18n.js                  # i18next configuration & RTL/LTR handler
│   ├── main.jsx                 # Application entry point
│   └── index.css                # Tailwind CSS styles & responsive utilities
├── index.html
├── package.json
├── vite.config.js
└── LICENSE
```
---

## 🌐 Internationalization (i18n)

This application supports **bilingual operation** with seamless language switching:

### Supported Languages

| Language | Code | Script Direction | Completion |
|----------|------|------------------|------------|
| **English** | `en` | LTR | ✅ 100% |
| **Persian (فارسی)** | `fa` | RTL | ✅ 100% |

### Implementation Stack

* **i18next**: Core internationalization framework
* **react-i18next**: React bindings and hooks (`useTranslation`)
* **i18next-browser-languagedetector**: Automatic browser language detection

### Features

* **Automatic Language Detection**: Detects user's browser language on first visit
* **Dynamic RTL/LTR Switching**: Automatically adjusts layout direction and text alignment
* **Persistent Language Preference**: Saves user's language choice in browser storage
* **Translation Coverage**: All UI text, buttons, labels, notifications, and algorithm descriptions are fully translated
* **Live Language Toggle**: Switch languages instantly without page reload via header button

### Translation Files

* **English**: `src/locales/en.json` — Complete UI translations
* **Persian**: `src/locales/fa.json` — Complete UI translations with RTL support

---

## 📱 Responsive Design

The interface adapts seamlessly across all device categories:

### Desktop (`lg` breakpoint and above)
* Traditional sidebar + main content layout
* All panels visible simultaneously
* Mouse-optimized hover states and interactions

### Tablet (`md` to `lg` breakpoints)
* Adaptive grid layouts
* Collapsible sections
* Touch-friendly controls (minimum 44×44px touch targets)

### Mobile (below `md` breakpoint)
* **Bottom Tab Navigation**: Fixed navigation bar at screen bottom for ergonomic thumb reach
* **Single-Panel View**: Monitor, Controls, or Queue visible at a time
* **Optimized Touch Targets**: All interactive elements sized for comfortable finger taps
* **Swipe-Friendly Scrolling**: Smooth vertical scrolling with webkit custom scrollbars
* **Pull-to-Dismiss Modals**: Sheet-style modals with drag handle indicators

### Key Responsive Breakpoints

```css
sm: 640px   /* Small tablets and large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large displays */
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ShayanBlaze/Web-Workers.git
   cd Web-Workers
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```
   
   This installs:
   - React 19.2.x and React DOM
   - Tailwind CSS 4.3.x
   - Vite 8.1.x (build tool)
   - i18next, react-i18next, i18next-browser-languagedetector (internationalization)
   - ESLint and related plugins

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🎮 How to Use the Simulator

### Desktop Instructions

1. **Configure Hardware Resources**: Use the **Active CPU Cores** slider in the Control Panel to scale the active worker thread count.

2. **Select Scheduling Algorithm**: Switch between **FIFO**, **Priority**, or **Round Robin**. Adjust the **Time Quantum** slider when using Round Robin.

3. **Dispatch Manual Workloads**: Adjust task complexity ($1x - 10x$) and priority level (1 Low, 5 Medium, 10 High), then click **Dispatch Task** or **Stress Test** (Add 10 Tasks).

4. **Run Benchmark Mode**: Click **🧪 Benchmark Mode** in the header, configure batch size and task complexity, and observe execution. Upon completion, the **Final Benchmark Stats** panel will display complete performance analytics.

5. **Switch Language**: Click the **EN/فارسی** button in the header to toggle between English and Persian.

### Mobile Instructions

1. **Navigate Using Bottom Tabs**: Tap **📊 Monitor**, **⚙️ Controls**, or **📋 Queue** tabs at the bottom of the screen.

2. **Control Panel (⚙️ Tab)**: Configure cores, select algorithm, set task complexity/priority, and dispatch tasks.

3. **Monitor View (📊 Tab)**: Watch real-time core execution with progress bars.

4. **Queue View (📋 Tab)**: Inspect waiting tasks and view system logs.

5. **Change Language**: Tap the language toggle button in the header (top-right on mobile).

---

## 📚 Academic Context & References

Designed as an educational project for computer science and software engineering courses in **Operating System Concepts**. Concepts demonstrated in this simulator align with standard OS literature:

* **Silberschatz, Galvin, and Gagne**: *Operating System Concepts* (Process Scheduling & Multithreading).
* **Tanenbaum & Bos**: *Modern Operating Systems* (CPU Scheduling & CPU-bound workloads).

---

## 📜 License

Distributed under the MIT License. See [LICENSE](./LICENSE) for more information.