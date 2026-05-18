# Редизайн темы — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Полный визуальный редизайн: тёмный glassmorphism (индиго/фиолет) как умолчание + светлая тема через переключатель в настройках.

**Architecture:** CSS-переменные (`--bg-card`, `--border`, `--text-primary` и т.д.) определяются в `index.css` для классов `:root/.dark` и `.light`. Класс темы ставится на `<html>` через `classList` и сохраняется в `localStorage`. Tailwind остаётся для отступов/размеров; все цвета переходят на переменные.

**Tech Stack:** React 18, Vite, Tailwind CSS, DM Sans (Google Fonts), CSS custom properties

---

## Структура файлов

| Файл | Что меняется |
|---|---|
| `index.html` | DM Sans `<link>`, `theme-color` meta |
| `src/index.css` | CSS-переменные, `body`, утилитные классы |
| `src/App.jsx` | `GC`/`SC`/`CBG`/`GC2` константы, `sc()`, общие компоненты, theme state, nav, header, saveError, Loader, настройки |
| `src/tabs/ScheduleTab.jsx` | Все Tailwind-цвета → переменные |
| `src/tabs/HomeworkTab.jsx` | Все Tailwind-цвета → переменные |
| `src/tabs/GradesTab.jsx` | Inline-стили → CSS-классы, локальные `GC`/`GC2` → удалить |

---

## Task 1: CSS-токены и шрифт

**Files:**
- Modify: `index.html`
- Modify: `src/index.css`

- [ ] **Шаг 1: Добавить DM Sans и обновить theme-color в `index.html`**

Заменить блок `<head>` на:

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="theme-color" content="#6366f1"/>
    <meta name="apple-mobile-web-app-capable" content="yes"/>
    <meta name="apple-mobile-web-app-title" content="Дневник"/>
    <link rel="manifest" href="/manifest.json"/>
    <link rel="apple-touch-icon" href="/icon-192.png"/>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet">
    <title>Школьный дневник</title>
  </head>
```

- [ ] **Шаг 2: Заменить содержимое `src/index.css` полностью**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }

/* ── Тёмная тема (по умолчанию) ──────────────────────────────────────── */
:root, .dark {
  --bg-page:        #0a0f1e;
  --bg-gradient:    linear-gradient(160deg, #0a0f1e 0%, #0f172a 100%);
  --bg-card:        rgba(255,255,255,0.07);
  --bg-card-active: linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.15));
  --bg-card-done:   rgba(255,255,255,0.03);
  --bg-nav:         rgba(15,23,42,0.9);
  --bg-input:       rgba(255,255,255,0.06);
  --bg-tag:         rgba(99,102,241,0.15);

  --border:         rgba(255,255,255,0.10);
  --border-active:  rgba(139,92,246,0.40);
  --border-done:    rgba(255,255,255,0.06);
  --border-input:   rgba(255,255,255,0.12);

  --text-primary:   #ffffff;
  --text-secondary: #94a3b8;
  --text-muted:     #475569;
  --text-ghost:     #1e3a5f;

  --accent:         #6366f1;
  --accent2:        #8b5cf6;
  --accent-text:    #818cf8;

  --grade-5-bg:     linear-gradient(135deg, #22c55e, #16a34a);
  --grade-4-bg:     linear-gradient(135deg, #6366f1, #8b5cf6);
  --grade-3-bg:     linear-gradient(135deg, #f59e0b, #d97706);
  --grade-2-bg:     linear-gradient(135deg, #ef4444, #dc2626);
  --grade-hw-bg:    rgba(99,102,241,0.20);
  --grade-hw-text:  #818cf8;
  --grade-hw-bd:    rgba(99,102,241,0.35);

  --success:        #22c55e;
  --success-text:   #4ade80;
  --danger:         #ef4444;
  --danger-text:    #f87171;
  --warning:        #f59e0b;

  --comment-bg:     rgba(251,191,36,0.10);
  --comment-bd:     rgba(251,191,36,0.20);
  --comment-title:  #fbbf24;
  --comment-text:   #fde68a;

  --error-bg:       rgba(239,68,68,0.12);
  --error-bd:       rgba(239,68,68,0.30);
  --error-text:     #f87171;

  --shadow-card:    none;
}

/* ── Светлая тема ──────────────────────────────────────────────────────── */
.light {
  --bg-page:        #f8fafc;
  --bg-gradient:    #f8fafc;
  --bg-card:        #ffffff;
  --bg-card-active: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05));
  --bg-card-done:   #f1f5f9;
  --bg-nav:         rgba(255,255,255,0.95);
  --bg-input:       #ffffff;
  --bg-tag:         rgba(99,102,241,0.10);

  --border:         #e2e8f0;
  --border-active:  rgba(99,102,241,0.35);
  --border-done:    #e2e8f0;
  --border-input:   #e2e8f0;

  --text-primary:   #0f172a;
  --text-secondary: #475569;
  --text-muted:     #94a3b8;
  --text-ghost:     #cbd5e1;

  --accent:         #6366f1;
  --accent2:        #8b5cf6;
  --accent-text:    #6366f1;

  --grade-5-bg:     linear-gradient(135deg, #22c55e, #16a34a);
  --grade-4-bg:     linear-gradient(135deg, #6366f1, #8b5cf6);
  --grade-3-bg:     linear-gradient(135deg, #f59e0b, #d97706);
  --grade-2-bg:     linear-gradient(135deg, #ef4444, #dc2626);
  --grade-hw-bg:    rgba(99,102,241,0.10);
  --grade-hw-text:  #6366f1;
  --grade-hw-bd:    rgba(99,102,241,0.25);

  --success:        #22c55e;
  --success-text:   #16a34a;
  --danger:         #ef4444;
  --danger-text:    #dc2626;
  --warning:        #f59e0b;

  --comment-bg:     #fffbeb;
  --comment-bd:     #fde68a;
  --comment-title:  #d97706;
  --comment-text:   #92400e;

  --error-bg:       #fef2f2;
  --error-bd:       #fecaca;
  --error-text:     #dc2626;

  --shadow-card:    0 1px 3px rgba(0,0,0,0.08);
}

/* ── Базовые стили ──────────────────────────────────────────────────────── */
body {
  margin: 0;
  font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  background: var(--bg-gradient);
  min-height: 100dvh;
  color: var(--text-primary);
}

/* ── Утилитные классы ───────────────────────────────────────────────────── */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 1rem;
  box-shadow: var(--shadow-card);
}
.card-active {
  background: var(--bg-card-active);
  border-color: var(--border-active);
}
.card-done {
  background: var(--bg-card-done);
  border-color: var(--border-done);
}
.card-kr {
  background: linear-gradient(135deg, rgba(239,68,68,.18), rgba(220,38,38,.10));
  border: 1px solid rgba(239,68,68,.30);
}
.light .card-kr {
  background: #fef2f2;
  border-color: #fecaca;
}

.inp {
  background: var(--bg-input);
  border: 1px solid var(--border-input);
  color: var(--text-primary);
}
.inp::placeholder { color: var(--text-muted); }

/* ── Оценки ─────────────────────────────────────────────────────────────── */
.grade-chip { border-radius: 0.5rem; padding: 2px 8px; font-weight: 700; font-size: 0.875rem; display: inline-flex; align-items: center; gap: 4px; }
.grade-chip-5 { background: var(--grade-5-bg); color: white; }
.grade-chip-4 { background: var(--grade-4-bg); color: white; }
.grade-chip-3 { background: var(--grade-3-bg); color: white; }
.grade-chip-2 { background: var(--grade-2-bg); color: white; }
.grade-chip-hw { background: var(--grade-hw-bg); color: var(--grade-hw-text); border: 1px solid var(--grade-hw-bd); }
.grade-chip-none { background: var(--bg-card-done); color: var(--text-muted); }

/* ── Ячейки оценок (статистика) ─────────────────────────────────────────── */
.gc-5 { background: rgba(34,197,94,.18);  color: #4ade80; }
.gc-4 { background: rgba(99,102,241,.18); color: #818cf8; }
.gc-3 { background: rgba(245,158,11,.18); color: #fcd34d; }
.gc-2 { background: rgba(239,68,68,.18);  color: #f87171; }
.gc-x { background: var(--bg-card-done);  color: var(--text-muted); }
.light .gc-5 { background: #f0fdf4; color: #16a34a; }
.light .gc-4 { background: #eef2ff; color: #4f46e5; }
.light .gc-3 { background: #fffbeb; color: #d97706; }
.light .gc-2 { background: #fef2f2; color: #dc2626; }
.light .gc-x { background: #f1f5f9; color: #94a3b8; }

/* ── Бейджи предметов ───────────────────────────────────────────────────── */
.sbadge { display: inline-block; font-size: 0.875rem; font-weight: 600; padding: 2px 10px; border-radius: 0.5rem; border: 1px solid transparent; }
:root .sbadge-0,  .dark .sbadge-0  { background:rgba(99,102,241,.18); color:#818cf8; border-color:rgba(99,102,241,.3); }
:root .sbadge-1,  .dark .sbadge-1  { background:rgba(168,85,247,.18); color:#c084fc; border-color:rgba(168,85,247,.3); }
:root .sbadge-2,  .dark .sbadge-2  { background:rgba(16,185,129,.18); color:#34d399; border-color:rgba(16,185,129,.3); }
:root .sbadge-3,  .dark .sbadge-3  { background:rgba(245,158,11,.18); color:#fcd34d; border-color:rgba(245,158,11,.3); }
:root .sbadge-4,  .dark .sbadge-4  { background:rgba(236,72,153,.18); color:#f472b6; border-color:rgba(236,72,153,.3); }
:root .sbadge-5,  .dark .sbadge-5  { background:rgba(99,102,241,.22); color:#a5b4fc; border-color:rgba(99,102,241,.35); }
:root .sbadge-6,  .dark .sbadge-6  { background:rgba(249,115,22,.18); color:#fb923c; border-color:rgba(249,115,22,.3); }
:root .sbadge-7,  .dark .sbadge-7  { background:rgba(20,184,166,.18); color:#2dd4bf; border-color:rgba(20,184,166,.3); }
:root .sbadge-8,  .dark .sbadge-8  { background:rgba(239,68,68,.18);  color:#f87171; border-color:rgba(239,68,68,.3);  }
:root .sbadge-9,  .dark .sbadge-9  { background:rgba(6,182,212,.18);  color:#22d3ee; border-color:rgba(6,182,212,.3);  }
:root .sbadge-10, .dark .sbadge-10 { background:rgba(132,204,22,.18); color:#a3e635; border-color:rgba(132,204,22,.3); }
:root .sbadge-11, .dark .sbadge-11 { background:rgba(244,63,94,.18);  color:#fb7185; border-color:rgba(244,63,94,.3);  }
:root .sbadge-12, .dark .sbadge-12 { background:rgba(139,92,246,.22); color:#a78bfa; border-color:rgba(139,92,246,.35); }
:root .sbadge-13, .dark .sbadge-13 { background:rgba(14,165,233,.18); color:#38bdf8; border-color:rgba(14,165,233,.3); }
:root .sbadge-14, .dark .sbadge-14 { background:rgba(34,197,94,.18);  color:#4ade80; border-color:rgba(34,197,94,.3);  }
.light .sbadge-0  { background:#eef2ff; color:#4f46e5; border-color:#c7d2fe; }
.light .sbadge-1  { background:#faf5ff; color:#9333ea; border-color:#e9d5ff; }
.light .sbadge-2  { background:#ecfdf5; color:#059669; border-color:#a7f3d0; }
.light .sbadge-3  { background:#fffbeb; color:#d97706; border-color:#fde68a; }
.light .sbadge-4  { background:#fdf2f8; color:#db2777; border-color:#fbcfe8; }
.light .sbadge-5  { background:#eef2ff; color:#6366f1; border-color:#c7d2fe; }
.light .sbadge-6  { background:#fff7ed; color:#ea580c; border-color:#fed7aa; }
.light .sbadge-7  { background:#f0fdfa; color:#0d9488; border-color:#99f6e4; }
.light .sbadge-8  { background:#fef2f2; color:#dc2626; border-color:#fecaca; }
.light .sbadge-9  { background:#ecfeff; color:#0891b2; border-color:#a5f3fc; }
.light .sbadge-10 { background:#f7fee7; color:#65a30d; border-color:#d9f99d; }
.light .sbadge-11 { background:#fff1f2; color:#e11d48; border-color:#fecdd3; }
.light .sbadge-12 { background:#f5f3ff; color:#7c3aed; border-color:#ddd6fe; }
.light .sbadge-13 { background:#f0f9ff; color:#0284c7; border-color:#bae6fd; }
.light .sbadge-14 { background:#f0fdf4; color:#16a34a; border-color:#bbf7d0; }

/* ── Комментарий родителя ─────────────────────────────────────────────── */
.comment-block { background: var(--comment-bg); border: 1px solid var(--comment-bd); border-radius: 0.5rem; padding: 8px 12px; }
.comment-title { color: var(--comment-title); font-size: 0.75rem; font-weight: 600; }
.comment-text  { color: var(--comment-text);  font-size: 0.75rem; }

/* ── Баннер ошибки сохранения ─────────────────────────────────────────── */
.save-error-banner {
  background: var(--error-bg);
  border: 1px solid var(--error-bd);
  color: var(--error-text);
}

/* ── Аватары детей ────────────────────────────────────────────────────── */
.cbg-0 { background: #6366f1; }
.cbg-1 { background: #ec4899; }
.cbg-2 { background: #10b981; }
.cbg-3 { background: #8b5cf6; }
.cbg-4 { background: #f97316; }
.cbg-5 { background: #14b8a6; }
```

- [ ] **Шаг 3: Проверить сборку**

```bash
cd C:\Users\Windows\Desktop\school-diary && npm run build
```

Ожидается: сборка без ошибок (CSS ещё не применён — компоненты используют старые классы).

- [ ] **Шаг 4: Коммит**

```bash
git add index.html src/index.css
git commit -m "feat: add CSS design tokens, DM Sans font, dark/light theme variables"
```

---

## Task 2: Общие компоненты и тема в App.jsx

**Files:**
- Modify: `src/App.jsx`

Этот таск меняет: константы `GC`/`SC`/`CBG`/`GC2`, функцию `sc()`, компоненты `Card`/`Empty`/`Inp`/`Sel`/`Btn`/`Loader`/`CollapseBtn`/`GBadge`/`GPicker`/`GChip`/`SBadge`, добавляет `theme` state.

- [ ] **Шаг 1: Заменить константы GC, SC, CBG, GC2 (строки 14–17 App.jsx)**

Найти и заменить:
```js
const GC={"5":"bg-green-100 text-green-700","4":"bg-blue-100 text-blue-700","3":"bg-yellow-100 text-yellow-700","2":"bg-red-100 text-red-700"};
const SC=["bg-blue-100 text-blue-800","bg-purple-100 text-purple-800","bg-emerald-100 text-emerald-800","bg-amber-100 text-amber-800","bg-pink-100 text-pink-800","bg-indigo-100 text-indigo-800","bg-orange-100 text-orange-800","bg-teal-100 text-teal-800","bg-red-100 text-red-800","bg-cyan-100 text-cyan-800","bg-lime-100 text-lime-800","bg-rose-100 text-rose-800","bg-violet-100 text-violet-800","bg-sky-100 text-sky-800","bg-green-100 text-green-800"];
const CBG=["bg-blue-500","bg-pink-500","bg-emerald-500","bg-violet-500","bg-orange-500","bg-teal-500"];
const GC2={"5":{bg:"#EAF3DE",tc:"#3B6D11"},"4":{bg:"#E6F1FB",tc:"#185FA5"},"3":{bg:"#FAEEDA",tc:"#854F0B"},"2":{bg:"#FCEBEB",tc:"#A32D2D"}};
```

На:
```js
// GC: grade value → CSS class (используется в GChip, GBadge, GPicker)
const GC={"5":"grade-chip-5","4":"grade-chip-4","3":"grade-chip-3","2":"grade-chip-2"};
// SC: subject color index → CSS class (15 цветов, индекс s.c % 15)
const SC_LEN=15;
// CBG: child avatar color index → CSS class
const CBG=["cbg-0","cbg-1","cbg-2","cbg-3","cbg-4","cbg-5"];
// GC2: grade value → CSS class для ячеек статистики
const GC2={"5":"gc-5","4":"gc-4","3":"gc-3","2":"gc-2"};
```

- [ ] **Шаг 2: Заменить функцию gcl() (строка ~39)**

Найти:
```js
const gcl=v=>GC2[v]||{bg:"#f1f5f9",tc:"#64748b"};
```

Заменить на:
```js
const gcl=v=>GC2[v]||"gc-x";
```

- [ ] **Шаг 3: Заменить функцию sc() (строка ~455)**

Найти:
```js
const sc=s=>s?SC[s.c%SC.length]:"bg-slate-100 text-slate-600";
```

Заменить на:
```js
const sc=s=>s?`sbadge sbadge-${s.c%SC_LEN}`:"sbadge gc-x";
```

- [ ] **Шаг 4: Добавить theme state в App() — сразу после открытия функции (после `const [user,setUser]=useState(undefined);`)**

Найти:
```js
const [user,setUser]=useState(undefined);
```

Заменить на:
```js
const [user,setUser]=useState(undefined);
const [theme,setTheme]=useState(()=>localStorage.getItem('theme')||'dark');
```

Затем найти первый `useEffect` в App (строка ~184, после useState блока) и добавить перед ним новый эффект:

```js
useEffect(()=>{
  const el=document.documentElement;
  el.classList.remove('dark','light');
  el.classList.add(theme);
  localStorage.setItem('theme',theme);
},[theme]);
```

- [ ] **Шаг 5: Заменить компоненты Card, Empty, ST, Btn, Inp, Sel, Loader, CollapseBtn (строки 65–81)**

Найти весь блок:
```js
const Card=({cls="",onClick,children})=><div className={`bg-white rounded-2xl shadow-sm p-4 ${cls}`} onClick={onClick}>{children}</div>;
const Empty=({txt})=><Card cls="py-10 text-center text-slate-400 text-sm">{txt}</Card>;
const ST=({children})=><p className="text-sm font-medium text-slate-600 mb-3">{children}</p>;
const Btn=({cls="",...p})=><button className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${cls}`} {...p}/>;
const Inp=({cls="",...p})=><input className={`border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${cls}`} {...p}/>;
const Sel=({cls="",...p})=><select className={`border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${cls}`} {...p}/>;
const Loader=({text="Загрузка..."})=>(
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
    <p className="text-slate-400 animate-pulse text-lg">{text}</p>
  </div>
);
const CollapseBtn=({open,onToggle,label})=>(
  <button onClick={onToggle} className="w-full flex items-center justify-between text-sm font-medium text-slate-600 text-left">
    <span>{label}</span>
    <span className="text-slate-400 text-lg flex-shrink-0" style={{transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.15s",display:"inline-block"}}>⌄</span>
  </button>
```

Заменить на:
```js
const Card=({cls="",onClick,children})=><div className={`card p-4 ${cls}`} onClick={onClick}>{children}</div>;
const Empty=({txt})=><Card cls="py-10 text-center text-sm" style={{color:"var(--text-muted)"}}>{txt}</Card>;
const ST=({children})=><p className="text-sm font-medium mb-3" style={{color:"var(--text-secondary)"}}>{children}</p>;
const Btn=({cls="",...p})=><button className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${cls}`} {...p}/>;
const Inp=({cls="",...p})=><input className={`inp rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${cls}`} {...p}/>;
const Sel=({cls="",...p})=><select className={`inp rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${cls}`} {...p}/>;
const Loader=({text="Загрузка..."})=>(
  <div className="min-h-screen flex items-center justify-center" style={{background:"var(--bg-gradient)"}}>
    <p className="animate-pulse text-lg" style={{color:"var(--text-muted)"}}>{text}</p>
  </div>
);
const CollapseBtn=({open,onToggle,label})=>(
  <button onClick={onToggle} className="w-full flex items-center justify-between text-sm font-medium text-left" style={{color:"var(--text-secondary)"}}>
    <span>{label}</span>
    <span className="text-lg flex-shrink-0" style={{color:"var(--text-muted)",transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.15s",display:"inline-block"}}>⌄</span>
  </button>
```

- [ ] **Шаг 6: Заменить GBadge (строка ~82)**

Найти:
```js
const GBadge=({v,type=""})=>(
  <span className={`px-2 py-0.5 rounded-lg text-sm font-bold inline-flex items-center gap-1 ${GC[v]||"bg-slate-100 text-slate-600"} ${isKR(type)?"ring-2 ring-current":""}`}>
    <span className="text-xs">{gradeIcon(type)}</span>{v}
  </span>
);
```

Заменить на:
```js
const GBadge=({v,type=""})=>(
  <span className={`grade-chip ${GC[v]||"grade-chip-none"} ${isKR(type)?"ring-2 ring-current":""}`}>
    <span className="text-xs">{gradeIcon(type)}</span>{v}
  </span>
);
```

- [ ] **Шаг 7: Заменить GPicker (строки ~87–94)**

Найти:
```js
const GPicker=({value,onChange})=>(
  <div className="flex gap-1">
    {["5","4","3","2"].map(g=>(
      <button key={g} onClick={()=>onChange(value===g?null:g)}
        className={`w-8 h-8 rounded-lg text-sm font-bold border-2 transition-all ${value===g?(GC[g]||"")+" border-current ring-1 ring-offset-1 ring-current":"bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400"}`}>{g}</button>
    ))}
  </div>
);
```

Заменить на:
```js
const GPicker=({value,onChange})=>(
  <div className="flex gap-1">
    {["5","4","3","2"].map(g=>(
      <button key={g} onClick={()=>onChange(value===g?null:g)}
        className={`w-8 h-8 rounded-lg text-sm font-bold border-2 transition-all ${value===g?(GC[g]||"grade-chip-none")+" border-current ring-1 ring-offset-1 ring-current":"border-[var(--border)] hover:border-[var(--accent)]"}`}
        style={value!==g?{background:"var(--bg-card)",color:"var(--text-secondary)"}:{}}>{g}</button>
    ))}
  </div>
);
```

- [ ] **Шаг 8: Заменить GChip (строки ~96–139)**

Найти:
```js
const GChip=({g,isOwner,expandedGradeId,setExpandedGradeId,chgGrade,delGrade,editC,setEditC,upd,grades})=>{
  const isE=expandedGradeId===g.id;
  return(
    <div className="relative">
      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${GC[g.value]||"bg-slate-100"} ${isKR(g.type)?"ring-2 ring-current":""} ${isOwner?"cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-current":"cursor-default"}`}
```

Заменить открывающий `<div>` чипа на:
```js
const GChip=({g,isOwner,expandedGradeId,setExpandedGradeId,chgGrade,delGrade,editC,setEditC,upd,grades})=>{
  const isE=expandedGradeId===g.id;
  return(
    <div className="relative">
      <div className={`grade-chip text-xs ${GC[g.value]||"grade-chip-none"} ${isKR(g.type)?"ring-2 ring-current":""} ${isOwner?"cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-current":"cursor-default"}`}
```

Затем найти popup GChip (строка ~108):
```js
        <div className="absolute z-20 top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-max">
          <p className="text-xs text-slate-400 mb-2">Изменить оценку</p>
```

Заменить на:
```js
        <div className="absolute z-20 top-full mt-1 left-0 card rounded-xl shadow-lg p-3 min-w-max" style={{background:"var(--bg-card)",backdropFilter:"blur(12px)"}}>
          <p className="text-xs mb-2" style={{color:"var(--text-muted)"}}>Изменить оценку</p>
```

Найти внутри GChip popup:
```js
            <p className="text-xs text-slate-400 mb-1.5">Дата</p>
            <input type="date" className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
```

Заменить на:
```js
            <p className="text-xs mb-1.5" style={{color:"var(--text-muted)"}}>Дата</p>
            <input type="date" className="inp w-full rounded-lg px-2 py-1.5 text-xs focus:outline-none"
```

Найти внутри GChip popup тип оценки:
```js
              <p className="text-xs text-slate-400 mb-1.5">Тип</p>
```
Заменить на:
```js
              <p className="text-xs mb-1.5" style={{color:"var(--text-muted)"}}>Тип</p>
```

Найти кнопки типа оценки внутри GChip:
```js
                    className={"px-2 py-1 rounded-lg text-xs border transition-all "+(g.type===val?"bg-blue-500 text-white border-blue-500":"bg-white text-slate-500 border-slate-200 hover:border-blue-300")}>{lbl}</button>
```

Заменить на:
```js
                    className={"px-2 py-1 rounded-lg text-xs border transition-all "+(g.type===val?"bg-indigo-500 text-white border-indigo-500":"border-[var(--border)] hover:border-indigo-400")}
                    style={g.type!==val?{background:"var(--bg-card)",color:"var(--text-secondary)"}:{}}>{lbl}</button>
```

Найти комментарий внутри GChip:
```js
              <p className="text-xs text-slate-400 mb-1.5">Комментарий</p>
              <textarea className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none resize-none" rows={2} placeholder="Заметка к оценке..."
```

Заменить на:
```js
              <p className="text-xs mb-1.5" style={{color:"var(--text-muted)"}}>Комментарий</p>
              <textarea className="inp w-full rounded-lg px-2 py-1.5 text-xs focus:outline-none resize-none" rows={2} placeholder="Заметка к оценке..."
```

Найти кнопку «Сохранить» в GChip:
```js
              className="mt-1 w-full text-xs bg-blue-50 text-blue-500 py-1 border border-blue-100 rounded-lg hover:bg-blue-100">Сохранить</button>
```

Заменить на:
```js
              className="mt-1 w-full text-xs py-1 border rounded-lg transition-all" style={{background:"var(--bg-tag)",color:"var(--accent-text)",borderColor:"var(--border-active)"}}>Сохранить</button>
```

Найти кнопку «Удалить» в GChip:
```js
          <button onClick={e=>{e.stopPropagation();delGrade(g);}} className="mt-2 w-full text-xs text-red-400 py-1 border border-red-100 rounded-lg hover:bg-red-50">Удалить</button>
```

Заменить на:
```js
          <button onClick={e=>{e.stopPropagation();delGrade(g);}} className="mt-2 w-full text-xs py-1 border rounded-lg transition-all" style={{color:"var(--danger-text)",borderColor:"var(--danger-text)",opacity:"0.7"}}>Удалить</button>
```

- [ ] **Шаг 9: Заменить SBadge (строка ~141)**

Найти:
```js
const SBadge=({sid,subj,sc})=>{const s=subj(sid);return <span className={`px-2 py-0.5 rounded-lg text-sm font-medium ${sc(s)}`}>{s?.name||"?"}</span>;};
```

Заменить на:
```js
const SBadge=({sid,subj,sc})=>{const s=subj(sid);return <span className={`sbadge ${sc(s)}`}>{s?.name||"?"}</span>;};
```

- [ ] **Шаг 10: Проверить сборку**

```bash
cd C:\Users\Windows\Desktop\school-diary && npm run build
```

Ожидается: сборка без ошибок TypeScript/ESBuild.

- [ ] **Шаг 11: Коммит**

```bash
git add src/App.jsx
git commit -m "feat: update shared components and constants for theme system"
```

---

## Task 3: App.jsx — layout, навигация, шапка, настройки

**Files:**
- Modify: `src/App.jsx`

- [ ] **Шаг 1: Заменить корневой wrapper div (строка ~557)**

Найти:
```js
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans" onClick={()=>expandedGradeId&&setExpandedGradeId(null)}>
```

Заменить на:
```js
    <div className="min-h-screen font-sans" onClick={()=>expandedGradeId&&setExpandedGradeId(null)}>
```

- [ ] **Шаг 2: Заменить saveError баннер (строка ~583)**

Найти:
```js
        {saveError&&(
          <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-600 flex items-center gap-2">
            <span>⚠️ Не удалось сохранить. Проверь соединение.</span>
            <button onClick={()=>setSaveError(false)} className="ml-auto text-red-400 text-lg leading-none">×</button>
          </div>
        )}
```

Заменить на:
```js
        {saveError&&(
          <div className="save-error-banner mb-3 rounded-xl px-4 py-2 text-sm flex items-center gap-2">
            <span>⚠️ Не удалось сохранить. Проверь соединение.</span>
            <button onClick={()=>setSaveError(false)} className="ml-auto text-lg leading-none" style={{color:"var(--danger-text)"}}>×</button>
          </div>
        )}
```

- [ ] **Шаг 3: Заменить навигационные таблетки (строка ~589)**

Найти:
```js
        <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)}
              className={`flex-shrink-0 flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${tab===i?"bg-blue-500 text-white shadow":"text-slate-500 hover:bg-slate-100"}`}>
              {t}{i===1&&hwPending>0&&<span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1">{hwPending}</span>}
            </button>
          ))}
        </div>
```

Заменить на:
```js
        <div className="flex gap-1 mb-4 card p-1 overflow-x-auto">
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)}
              className={`flex-shrink-0 flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all`}
              style={tab===i?{background:"var(--accent)",color:"white"}:{color:"var(--text-muted)"}}>
              {t}{i===1&&hwPending>0&&<span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1">{hwPending}</span>}
            </button>
          ))}
        </div>
```

- [ ] **Шаг 4: Заменить шапку — кнопка назад и переключатель детей (строка ~561)**

Найти:
```js
        <div className="flex items-center gap-2 mb-4">
          <button onClick={()=>{setStep("select");setExpandedGradeId(null);setSelSubj(null);setPreviewChild(false);}} className="text-slate-400 hover:text-slate-600 text-xl w-8">←</button>
```

Заменить на:
```js
        <div className="flex items-center gap-2 mb-4">
          <button onClick={()=>{setStep("select");setExpandedGradeId(null);setSelSubj(null);setPreviewChild(false);}} className="text-xl w-8" style={{color:"var(--text-muted)"}}>←</button>
```

Найти кнопки переключения ребёнка (строка ~566):
```js
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${childId===ch.id?cbg(ch.colorIdx)+" text-white shadow":"bg-white text-slate-600 hover:bg-slate-100"}`}>
```

Заменить на:
```js
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${childId===ch.id?cbg(ch.colorIdx)+" text-white shadow":""}`}
                  style={childId!==ch.id?{background:"var(--bg-card)",color:"var(--text-secondary)"}:{}}>
```

Найти имя ребёнка в шапке (строка ~576):
```js
              <span className="font-semibold text-slate-700">{activeCh?.name||"Дневник"}</span>
              {previewChild&&<span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">вид ребёнка</span>}
```

Заменить на:
```js
              <span className="font-semibold" style={{color:"var(--text-primary)"}}>{activeCh?.name||"Дневник"}</span>
              {previewChild&&<span className="text-xs px-2 py-0.5 rounded-full" style={{background:"var(--bg-tag)",color:"var(--accent-text)"}}>вид ребёнка</span>}
```

Найти кнопку preview (строка ~580):
```js
          {realOwner&&<button onClick={()=>{setPreviewChild(v=>!v);setTab(0);}} title={previewChild?"Вернуться в режим родителя":"Посмотреть глазами ребёнка"} className={`flex-shrink-0 text-lg w-9 h-9 flex items-center justify-center rounded-xl transition-all ${previewChild?"bg-purple-500 text-white shadow":"bg-white text-slate-400 hover:text-purple-500 hover:bg-purple-50"}`}>👁</button>}
```

Заменить на:
```js
          {realOwner&&<button onClick={()=>{setPreviewChild(v=>!v);setTab(0);}} title={previewChild?"Вернуться в режим родителя":"Посмотреть глазами ребёнка"} className="flex-shrink-0 text-lg w-9 h-9 flex items-center justify-center rounded-xl transition-all card" style={previewChild?{background:"var(--accent)",color:"white"}:{color:"var(--text-muted)"}}>👁</button>}
```

- [ ] **Шаг 5: Заменить экран выбора профиля (step="select", строка ~469)**

Найти:
```js
            <button key={ch.id} onClick={()=>selectProfile(ch)} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center gap-3 hover:shadow-md active:scale-95 transition-all">
              <div className={`w-16 h-16 rounded-full ${cbg(ch.colorIdx)} flex items-center justify-center text-white text-2xl font-bold shadow-md`}>{(ch.name?.[0]??"?").toUpperCase()}</div>
              <span className="text-slate-700 font-semibold text-sm">{ch.name}</span>
              {ch.grade&&<span className="text-xs text-slate-400">{ch.grade} класс</span>}
```

Заменить на:
```js
            <button key={ch.id} onClick={()=>selectProfile(ch)} className="card p-6 flex flex-col items-center gap-3 active:scale-95 transition-all">
              <div className={`w-16 h-16 rounded-full ${cbg(ch.colorIdx)} flex items-center justify-center text-white text-2xl font-bold shadow-md`}>{(ch.name?.[0]??"?").toUpperCase()}</div>
              <span className="font-semibold text-sm" style={{color:"var(--text-primary)"}}>{ch.name}</span>
              {ch.grade&&<span className="text-xs" style={{color:"var(--text-muted)"}}>{ch.grade} класс</span>}
```

- [ ] **Шаг 6: Добавить переключатель темы в блок настроек (TAB 5)**

Найти вкладку настроек в App.jsx. Найти блок с семейным кодом (`showFamilyCode`) или заголовок «Настройки» (строка ~750 область). Добавить карточку переключателя темы.

Найти первую `<Card>` в tab===5 (настройки), добавить ПЕРЕД ней:

```jsx
<Card cls="mb-3">
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium" style={{color:"var(--text-primary)"}}>
      {theme==='dark'?'🌙 Тёмная тема':'☀️ Светлая тема'}
    </span>
    <button
      onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}
      className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
      style={{background:"var(--bg-tag)",color:"var(--accent-text)",border:"1px solid var(--border-active)"}}>
      Переключить
    </button>
  </div>
</Card>
```

- [ ] **Шаг 7: Заменить экраны авторизации (step="auth" / step="phone")**

Найти wrapper экрана входа (строка ~200 область):
```js
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
```

Заменить на:
```js
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{background:"var(--bg-gradient)"}}>
```

Найти заголовок «Школьный дневник» на экране входа:
```js
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Школьный дневник</h1>
          <p className="text-slate-500 text-sm mb-8">
```

Заменить на:
```js
          <h1 className="text-3xl font-bold mb-2" style={{color:"var(--text-primary)"}}>Школьный дневник</h1>
          <p className="text-sm mb-8" style={{color:"var(--text-muted)"}}>
```

Найти кнопку входа через Google (строка ~220 область):
```js
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-2xl py-3.5 px-6 text-slate-700 font-medium shadow-sm hover:shadow-md active:scale-98 transition-all">
```

Заменить на:
```js
            className="w-full flex items-center justify-center gap-3 card rounded-2xl py-3.5 px-6 font-medium transition-all" style={{color:"var(--text-primary)"}}>
```

- [ ] **Шаг 8: Заменить экран setup/join (создание/вступление в семью)**

Найти все `bg-white` и `border-slate-*` в блоке `step==="setup"` и `step==="join"`, заменить по тем же правилам (см. таблицу в спеке): `bg-white` → `card`, `text-slate-700/800/900` → `var(--text-primary)`, `text-slate-500/400` → `var(--text-secondary)` / `var(--text-muted)`.

Найти обёртку экрана setup:
```js
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
```
Заменить (все вхождения такого wrapper) на:
```js
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{background:"var(--bg-gradient)"}}>
```

- [ ] **Шаг 9: Заменить блок Дети (TAB 4, область ~820)**

Найти в блоке «Дети» все `bg-white`, `text-slate-700`, `border-slate-200`, `text-slate-400`, `text-slate-600`:

- `className="... bg-white ..."` → добавить `card` или `style={{background:"var(--bg-card)"}}`
- `text-slate-700` → `style={{color:"var(--text-primary)"}}`
- `text-slate-500/600` → `style={{color:"var(--text-secondary)"}}`
- `text-slate-400` → `style={{color:"var(--text-muted)"}}`
- `border-slate-200` → `style={{borderColor:"var(--border)"}}`

Найти аватар ребёнка (строка ~828):
```js
                          <div className={`w-10 h-10 rounded-full ${cbg(ch.colorIdx)} flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}>
```

Заменить `cbg(ch.colorIdx)` везде — функция уже возвращает `cbg-N`, CSS-классы определены в `index.css`. Ничего не меняется.

Найти `textarea` в редактировании кружков (строка ~656):
```js
                      <textarea className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
```

Заменить на:
```js
                      <textarea className="inp rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
```

Найти комментарий кружка (строка ~677):
```js
                        {c.comment&&<div className="mt-1 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1"><p className="text-xs text-amber-800">💬 {c.comment}</p></div>}
```

Заменить на:
```js
                        {c.comment&&<div className="comment-block mt-1"><p className="comment-text">💬 {c.comment}</p></div>}
```

- [ ] **Шаг 10: Проверить сборку и визуально**

```bash
cd C:\Users\Windows\Desktop\school-diary && npm run build
```

```bash
npm run dev
```

Открыть в браузере, войти в приложение, проверить: тёмный фон, DM Sans, индиговые кнопки, переключатель темы в настройках работает.

- [ ] **Шаг 11: Коммит**

```bash
git add src/App.jsx
git commit -m "feat: apply dark theme to App.jsx layout, nav, auth screens, settings"
```

---

## Task 4: ScheduleTab.jsx

**Files:**
- Modify: `src/tabs/ScheduleTab.jsx`

Файл большой (~600 строк). Применяем системные замены по всему файлу.

- [ ] **Шаг 1: Массовая замена Tailwind-цветов на CSS-переменные**

Применить следующие замены по всему файлу (`replace all`):

| Найти (точно) | Заменить на |
|---|---|
| `bg-white` | `card` (или убрать + добавить `style={{background:"var(--bg-card)"}}` если нет класса `card`) |
| `border-slate-200` | `border-[var(--border)]` |
| `text-slate-700` | (удалить, добавить) `style={{color:"var(--text-primary)"}}` |
| `text-slate-600` | `style={{color:"var(--text-secondary)"}}` |
| `text-slate-500` | `style={{color:"var(--text-secondary)"}}` |
| `text-slate-400` | `style={{color:"var(--text-muted)"}}` |
| `text-slate-300` | `style={{color:"var(--text-ghost)"}}` |
| `hover:bg-slate-100` | `hover:bg-white/5` |
| `hover:bg-slate-50` | `hover:bg-white/5` |
| `bg-slate-100` | (inline) `style={{background:"var(--bg-card-done)"}}` |
| `bg-blue-500` | `bg-indigo-500` |
| `hover:bg-blue-600` | `hover:bg-indigo-600` |
| `focus:ring-blue-300` | `focus:ring-indigo-400` |
| `text-blue-500` | `text-indigo-400` |
| `text-blue-600` | `text-indigo-400` |
| `border-blue-500` | `border-indigo-500` |
| `bg-blue-50` | (inline) `style={{background:"var(--bg-tag)"}}` |
| `bg-amber-50 border border-amber-100` | `comment-block` |
| `text-amber-800` | `comment-text` |
| `text-amber-600` | `comment-title` |

- [ ] **Шаг 2: Специфические замены — карточка урока**

В ScheduleTab карточки уроков — ключевой элемент. Найти основной `<div>` каждого урока (там где `bg-white rounded-2xl`):

Найти (примерный паттерн):
```jsx
className={`bg-white rounded-2xl ... ${...}`}
```

Заменить на использование класса `card`:
```jsx
className={`card rounded-2xl ... ${...}`}
```

Активный урок (выбранный/расширенный) должен использовать `card card-active`:
```jsx
className={`card card-active rounded-2xl ...`}
```

- [ ] **Шаг 3: Специфические замены — форма добавления урока**

Найти все `<textarea className="border border-slate-200 ...` в ScheduleTab:
```jsx
<textarea className="border border-slate-200 rounded-lg px-3 py-2 text-sm ... focus:ring-blue-300 ...
```

Заменить на:
```jsx
<textarea className="inp rounded-lg px-3 py-2 text-sm ... focus:ring-indigo-400 ...
```

- [ ] **Шаг 4: Специфические замены — «окно» (свободный слот)**

Найти placeholder пустого урока (там где `text-slate-300` или похожее):
Убедиться что используется `style={{color:"var(--text-ghost)"}}` — этот цвет слабее чем muted, делает «окно» почти невидимым.

- [ ] **Шаг 5: Проверить сборку**

```bash
cd C:\Users\Windows\Desktop\school-diary && npm run build
```

- [ ] **Шаг 6: Визуальная проверка**

```bash
npm run dev
```

Открыть вкладку «Расписание». Проверить:
- Тёмный фон карточек уроков
- Активный урок — индиговый градиент
- «Окно» — почти невидим
- Форма добавления урока — тёмные инпуты

- [ ] **Шаг 7: Коммит**

```bash
git add src/tabs/ScheduleTab.jsx
git commit -m "feat: apply dark theme to ScheduleTab"
```

---

## Task 5: HomeworkTab.jsx

**Files:**
- Modify: `src/tabs/HomeworkTab.jsx`

- [ ] **Шаг 1: Массовая замена Tailwind-цветов (те же правила что в Task 4)**

Применить те же замены что в Task 4, Шаг 1.

- [ ] **Шаг 2: Заменить комментарий родителя**

Найти:
```jsx
{h.comment&&(<div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"><p className="text-xs text-amber-600 font-medium">💬 Родитель:</p><p className="text-xs text-amber-800 mt-0.5">{h.comment}</p></div>)}
```

Заменить на:
```jsx
{h.comment&&(<div className="comment-block mt-2"><p className="comment-title font-medium">💬 Родитель:</p><p className="comment-text mt-0.5">{h.comment}</p></div>)}
```

- [ ] **Шаг 3: Заменить КР-карточку**

Найти:
```jsx
<Card key={h.id} cls={`${h.done?"opacity-70":""} ${h.hwType==="kr"?"border-2 border-red-300":""} ${isHighlighted?"ring-2 ring-orange-400 ring-offset-1":""} ${cls}`}>
```

Заменить на:
```jsx
<Card key={h.id} cls={`${h.done?"opacity-70":""} ${h.hwType==="kr"?"card-kr":""} ${isHighlighted?"ring-2 ring-orange-400 ring-offset-1":""} ${cls}`}>
```

- [ ] **Шаг 4: Заменить чекбокс выполнения**

Найти:
```jsx
className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${h.done?"bg-green-500 border-green-500 text-white":"border-slate-300 hover:border-green-400"}`}>
```

Заменить на:
```jsx
className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${h.done?"bg-green-500 border-green-500 text-white":"hover:border-green-400"}`}
style={!h.done?{borderColor:"var(--border-active)"}:{}}>
```

- [ ] **Шаг 5: Заменить секцию «Выполнено и просроченное»**

Найти:
```jsx
                <button onClick={()=>setShowDoneHw(v=>!v)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium hover:bg-slate-200">
```

Заменить на:
```jsx
                <button onClick={()=>setShowDoneHw(v=>!v)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium"
                  style={{background:"var(--bg-card-done)",color:"var(--text-muted)"}}>
```

- [ ] **Шаг 6: Проверить сборку и визуально**

```bash
cd C:\Users\Windows\Desktop\school-diary && npm run build && npm run dev
```

Открыть вкладку «Задания». Проверить карточки, КР-карточку (красный акцент), комментарий родителя (янтарный).

- [ ] **Шаг 7: Коммит**

```bash
git add src/tabs/HomeworkTab.jsx
git commit -m "feat: apply dark theme to HomeworkTab"
```

---

## Task 6: GradesTab.jsx

**Files:**
- Modify: `src/tabs/GradesTab.jsx`

GradesTab самый сложный — много inline-стилей с хардкод-цветами.

- [ ] **Шаг 1: Заменить локальные константы GC, GC2, gcl (строки 10–12)**

Найти:
```js
const GC={"5":"bg-green-100 text-green-700","4":"bg-blue-100 text-blue-700","3":"bg-yellow-100 text-yellow-700","2":"bg-red-100 text-red-700"};
const GC2={"5":{bg:"#EAF3DE",tc:"#3B6D11"},"4":{bg:"#E6F1FB",tc:"#185FA5"},"3":{bg:"#FAEEDA",tc:"#854F0B"},"2":{bg:"#FCEBEB",tc:"#A32D2D"}};
const gcl=v=>GC2[v]||{bg:"#f1f5f9",tc:"#64748b"};
```

Заменить на:
```js
// GC: для ячеек оценок внутри GradesTab (таблица, список ДЗ)
const GC={"5":"gc-5","4":"gc-4","3":"gc-3","2":"gc-2"};
// gcl: возвращает CSS-класс для ячейки оценки в детальной статистике
const gcl=v=>GC[v]||"gc-x";
```

Затем найти и исправить использование `GC` внутри ДЗ-списка (строка ~191) в GradesTab:
```jsx
                    {h.grade&&<span className={`${GC[h.grade]||""} px-1.5 py-0.5 rounded-lg text-xs font-bold`}>{h.grade}</span>}
```

Заменить на:
```jsx
                    {h.grade&&<span className={`grade-chip ${GC[h.grade]||"grade-chip-none"}`}>{h.grade}</span>}
```

- [ ] **Шаг 2: Заменить renderStatsSec — контейнеры секций**

Найти в `renderStatsSec` (строка ~51):
```js
            background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:collapsed?"14px":"14px 14px 0 0",padding:"10px 14px",cursor:"pointer",textAlign:"left"
```

Заменить на:
```js
            background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:collapsed?"14px":"14px 14px 0 0",padding:"10px 14px",cursor:"pointer",textAlign:"left"
```

Найти кнопки ↑↓:
```js
            <button onClick={moveUp} style={{width:"24px",height:"22px",border:"0.5px solid #e2e8f0",borderRadius:"6px",background:"#fff",cursor:"pointer",fontSize:"12px",color:"#94a3b8",opacity:midx===0?"0.3":"1"}}>↑</button>
            <button onClick={moveDown} style={{width:"24px",height:"22px",border:"0.5px solid #e2e8f0",borderRadius:"6px",background:"#fff",cursor:"pointer",fontSize:"12px",color:"#94a3b8",opacity:midx===movable.length-1?"0.3":"1"}}>↓</button>
```

Заменить на:
```js
            <button onClick={moveUp} style={{width:"24px",height:"22px",border:"1px solid var(--border)",borderRadius:"6px",background:"var(--bg-card)",cursor:"pointer",fontSize:"12px",color:"var(--text-muted)",opacity:midx===0?"0.3":"1"}}>↑</button>
            <button onClick={moveDown} style={{width:"24px",height:"22px",border:"1px solid var(--border)",borderRadius:"6px",background:"var(--bg-card)",cursor:"pointer",fontSize:"12px",color:"var(--text-muted)",opacity:midx===movable.length-1?"0.3":"1"}}>↓</button>
```

Найти развёрнутый контент секции (строка ~60):
```js
        {!collapsed&&<div style={{background:"#fff",border:"0.5px solid #e2e8f0",borderTop:"none",borderRadius:"0 0 14px 14px",padding:"14px"}}>{content}</div>}
```

Заменить на:
```js
        {!collapsed&&<div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderTop:"none",borderRadius:"0 0 14px 14px",padding:"14px"}}>{content}</div>}
```

Найти заголовок секции:
```js
            <span style={{fontSize:"13px",fontWeight:"500",color:"#1e293b"}}>{title}</span>
```

Заменить на:
```js
            <span style={{fontSize:"13px",fontWeight:"500",color:"var(--text-primary)"}}>{title}</span>
```

- [ ] **Шаг 3: Заменить карточки оценок в списке предметов (TAB 2)**

Найти:
```jsx
                <Card key={s.id} cls="border border-slate-200 cursor-pointer hover:shadow-md transition-all" onClick={...}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-lg text-sm font-medium flex-1 ${sc(s)}`}>{s.name}</span>
                    {av&&<span className={`px-2 py-1 rounded-lg text-sm font-bold ${GC[Math.round(parseFloat(av))]||""}`}>Ср: {av}</span>}
```

Заменить на:
```jsx
                <Card key={s.id} cls="cursor-pointer transition-all" onClick={...}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`sbadge ${sc(s)} flex-1`}>{s.name}</span>
                    {av&&<span className={`grade-chip ${{"5":"grade-chip-5","4":"grade-chip-4","3":"grade-chip-3","2":"grade-chip-2"}[String(Math.round(parseFloat(av)))]||"grade-chip-none"}`}>Ср: {av}</span>}
```

- [ ] **Шаг 4: Заменить форму добавления оценки**

Найти `className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 flex-1"` (date input в форме оценки):

Заменить на:
```jsx
className="inp rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 flex-1"
```

Найти кнопку `bg-blue-500` в форме:
```jsx
            }} cls="bg-blue-500 text-white hover:bg-blue-600">+</Btn>
```

Заменить на:
```jsx
            }} cls="bg-indigo-500 text-white hover:bg-indigo-600">+</Btn>
```

- [ ] **Шаг 5: Заменить ячейки оценок в детальной статистике предмета**

Найти рендер ячеек оценок (строка ~165):
```jsx
              {sorted.map((g,i)=>{const cl=gcl(g.value);return(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1px",padding:"4px 7px",borderRadius:"7px",background:cl.bg,border:isKR(g.type)?"2px solid "+cl.tc:"2px solid transparent"}}>
                  <span style={{fontSize:"9px",lineHeight:"1",marginBottom:"1px"}}>{gradeIcon(g.type)}</span>
                  <span style={{fontSize:"15px",fontWeight:"500",color:cl.tc,lineHeight:"1"}}>{g.value}</span>
                  {g.date&&<span style={{fontSize:"9px",color:cl.tc,opacity:0.6}}>{fmtDate(g.date)}</span>}
                </div>
```

Заменить на:
```jsx
              {sorted.map((g,i)=>{const cl=gcl(g.value);return(
                <div key={i} className={cl} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1px",padding:"4px 7px",borderRadius:"7px",border:isKR(g.type)?"2px solid currentColor":"2px solid transparent"}}>
                  <span style={{fontSize:"9px",lineHeight:"1",marginBottom:"1px"}}>{gradeIcon(g.type)}</span>
                  <span style={{fontSize:"15px",fontWeight:"500",lineHeight:"1"}}>{g.value}</span>
                  {g.date&&<span style={{fontSize:"9px",opacity:0.6}}>{fmtDate(g.date)}</span>}
                </div>
```

- [ ] **Шаг 6: Заменить контейнеры с bg="#fff" в детальной статистике**

Найти (строка ~155):
```js
          <div style={{background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:"14px",padding:"14px",marginBottom:"14px"}}>
```

Заменить все вхождения такого паттерна в GradesTab на:
```js
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:"14px",padding:"14px",marginBottom:"14px"}}>
```

- [ ] **Шаг 7: Заменить общую статистику (TAB 3 — верхняя плашка)**

Найти hero card (строка ~276):
```js
      <div style={{background:"#185FA5",borderRadius:"18px",padding:"20px",marginBottom:"12px"}}>
```

Заменить на:
```js
      <div style={{background:"var(--accent)",borderRadius:"18px",padding:"20px",marginBottom:"12px"}}>
```

Найти «Лучший предмет» / «Подтянуть» карточки (строка ~288):
```js
          <div style={{background:"#fff",border:"0.5px solid #e2e8f0",borderLeft:"3px solid #1D9E75",borderRadius:"0 14px 14px 0",padding:"14px"}}>
            <p style={{fontSize:"11px",color:"#94a3b8",margin:"0 0 5px"}}>Лучший предмет</p>
            <p style={{fontSize:"13px",fontWeight:"500",margin:"0 0 5px",...}}>{best.s.name}</p>
            <p style={{fontSize:"26px",fontWeight:"500",color:"#1D9E75",margin:"0"}}>{best.a?.toFixed(1)}</p>
          </div>
          <div style={{background:"#fff",border:"0.5px solid #e2e8f0",borderLeft:"3px solid #E24B4A",borderRadius:"0 14px 14px 0",padding:"14px"}}>
            <p style={{fontSize:"11px",color:"#94a3b8",margin:"0 0 5px"}}>Подтянуть</p>
```

Заменить на:
```js
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderLeft:"3px solid var(--success)",borderRadius:"0 14px 14px 0",padding:"14px"}}>
            <p style={{fontSize:"11px",color:"var(--text-muted)",margin:"0 0 5px"}}>Лучший предмет</p>
            <p style={{fontSize:"13px",fontWeight:"500",margin:"0 0 5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"var(--text-primary)"}}>{best.s.name}</p>
            <p style={{fontSize:"26px",fontWeight:"500",color:"var(--success-text)",margin:"0"}}>{best.a?.toFixed(1)}</p>
          </div>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderLeft:"3px solid var(--danger)",borderRadius:"0 14px 14px 0",padding:"14px"}}>
            <p style={{fontSize:"11px",color:"var(--text-muted)",margin:"0 0 5px"}}>Подтянуть</p>
```

Найти значение «Подтянуть»:
```js
            <p style={{fontSize:"26px",fontWeight:"500",color:"#E24B4A",margin:"0"}}>{worst.a?.toFixed(1)}</p>
```

Заменить на:
```js
            <p style={{fontSize:"26px",fontWeight:"500",color:"var(--danger-text)",margin:"0"}}>{worst.a?.toFixed(1)}</p>
```

- [ ] **Шаг 8: Заменить блоки ДЗ-статистики в `SECTIONS.hw`**

Найти (строка ~257):
```js
          <div style={{background:"#f8fafc",borderRadius:"10px",padding:"10px",textAlign:"center"}}>
```

Оба вхождения заменить на:
```js
          <div style={{background:"var(--bg-card-done)",borderRadius:"10px",padding:"10px",textAlign:"center"}}>
```

Найти прогресс-бар трек:
```js
        {wT>0&&<div style={{background:"#f1f5f9",borderRadius:"99px",height:"7px"}}><div style={{height:"7px",borderRadius:"99px",background:"#1D9E75",width:wp+"%"}}/></div>}
```

Заменить на:
```js
        {wT>0&&<div style={{background:"var(--border)",borderRadius:"99px",height:"7px"}}><div style={{height:"7px",borderRadius:"99px",background:"var(--success)",width:wp+"%"}}/></div>}
```

Найти прогресс-бар по предметам (строка ~247):
```js
            <div style={{flex:"1",maxWidth:"90px",background:"#f1f5f9",borderRadius:"99px",height:"5px"}}>
```

Заменить на:
```js
            <div style={{flex:"1",maxWidth:"90px",background:"var(--border)",borderRadius:"99px",height:"5px"}}>
```

- [ ] **Шаг 9: Заменить оставшиеся текстовые цвета в GradesTab**

Найти все `color:"#94a3b8"` → `color:"var(--text-muted)"`
Найти все `color:"#1e293b"` или `color:"#0f172a"` → `color:"var(--text-primary)"`
Найти `background:"#f8fafc"` → `background:"var(--bg-card-done)"`

Использовать глобальную замену по файлу.

- [ ] **Шаг 10: Проверить сборку и визуально**

```bash
cd C:\Users\Windows\Desktop\school-diary && npm run build
```

```bash
npm run dev
```

Открыть вкладки «Оценки» и «Статистика». Проверить:
- Плашка «Средний балл» — индиговый фон вместо синего
- «Лучший предмет» — зелёная левая граница
- «Подтянуть» — красная левая граница
- Ячейки оценок — цветные через CSS-классы, оба вида (темный/светлый)
- Переключатель темы работает — все экраны меняются

- [ ] **Шаг 11: Финальный коммит**

```bash
git add src/tabs/GradesTab.jsx
git commit -m "feat: apply dark theme to GradesTab, complete theme redesign"
```

---

## Итоговая проверка после всех задач

- [ ] `npm run build` — без ошибок
- [ ] Открыть в браузере тёмную тему: расписание, задания, оценки, статистика, настройки, экран входа
- [ ] Переключить на светлую тему — все экраны адаптированы
- [ ] Переключить обратно — тема сохранилась в localStorage (обновить страницу)
- [ ] Проверить на мобильном или в DevTools (320px) — ничего не сломалось
