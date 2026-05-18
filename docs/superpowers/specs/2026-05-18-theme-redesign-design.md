# Редизайн темы приложения «Школьный дневник»

## Цель

Полный визуальный редизайн приложения: переход от светлого EdTech-стиля к тёмному glassmorphism с индиговыми акцентами и поддержкой светлой темы через переключатель в настройках.

## Стек

- React 18 + Vite + Tailwind CSS (уже в проекте)
- CSS-переменные для всех цветовых токенов (новое)
- DM Sans через Google Fonts (новое)
- localStorage для сохранения выбора темы (новое)

---

## 1. Типографика

### Подключение шрифта

В `index.html` добавить в `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&subset=cyrillic,latin&display=swap" rel="stylesheet">
```

В `src/index.css` заменить `font-family` у `body`:

```css
body {
  font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
}
```

### Шкала размеров (не меняется)

Используем существующие Tailwind-классы `text-xs` / `text-sm` / `text-base`. Отдельно только:
- Крупный номер урока / оценка: `text-xl font-extrabold`
- Заголовок экрана: `text-lg font-extrabold tracking-tight`

---

## 2. CSS-переменные

### Где определяются

В `src/index.css` добавить блок `:root` + `.dark` / `.light`.

### Тёмная тема (по умолчанию)

```css
:root, .dark {
  /* Фоны */
  --bg-page:        #0a0f1e;
  --bg-card:        rgba(255,255,255,0.07);
  --bg-card-active: linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.15));
  --bg-card-done:   rgba(255,255,255,0.03);
  --bg-nav:         rgba(15,23,42,0.9);
  --bg-input:       rgba(255,255,255,0.06);
  --bg-btn:         rgba(99,102,241,0.15);

  /* Границы */
  --border:         rgba(255,255,255,0.10);
  --border-active:  rgba(139,92,246,0.40);
  --border-done:    rgba(255,255,255,0.06);
  --border-input:   rgba(255,255,255,0.12);

  /* Текст */
  --text-primary:   #ffffff;
  --text-secondary: #94a3b8;
  --text-muted:     #475569;
  --text-ghost:     #1e3a5f;

  /* Акценты */
  --accent:         #6366f1;
  --accent-2:       #8b5cf6;
  --accent-text:    #818cf8;

  /* Оценки */
  --grade-5-bg:     linear-gradient(135deg, #22c55e, #16a34a);
  --grade-4-bg:     linear-gradient(135deg, #6366f1, #8b5cf6);
  --grade-3-bg:     linear-gradient(135deg, #f59e0b, #d97706);
  --grade-2-bg:     linear-gradient(135deg, #ef4444, #dc2626);
  --grade-hw-bg:    rgba(99,102,241,0.20);
  --grade-hw-text:  #818cf8;
  --grade-hw-border:rgba(99,102,241,0.35);

  /* Семафорные цвета */
  --success:        #22c55e;
  --success-text:   #4ade80;
  --danger:         #ef4444;
  --danger-text:    #f87171;
  --warning:        #f59e0b;
  --comment-bg:     rgba(251,191,36,0.10);
  --comment-border: rgba(251,191,36,0.20);
  --comment-title:  #fbbf24;
  --comment-text:   #fde68a;

  /* Баннер ошибки сохранения */
  --error-bg:       rgba(239,68,68,0.12);
  --error-border:   rgba(239,68,68,0.30);
  --error-text:     #f87171;
}
```

### Светлая тема

```css
.light {
  --bg-page:        #f8fafc;
  --bg-card:        #ffffff;
  --bg-card-active: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05));
  --bg-card-done:   #f1f5f9;
  --bg-nav:         rgba(255,255,255,0.95);
  --bg-input:       #ffffff;
  --bg-btn:         rgba(99,102,241,0.10);

  --border:         #e2e8f0;
  --border-active:  rgba(99,102,241,0.35);
  --border-done:    #e2e8f0;
  --border-input:   #e2e8f0;

  --text-primary:   #0f172a;
  --text-secondary: #475569;
  --text-muted:     #94a3b8;
  --text-ghost:     #cbd5e1;

  --accent:         #6366f1;
  --accent-2:       #8b5cf6;
  --accent-text:    #6366f1;

  --grade-5-bg:     linear-gradient(135deg, #22c55e, #16a34a);
  --grade-4-bg:     linear-gradient(135deg, #6366f1, #8b5cf6);
  --grade-3-bg:     linear-gradient(135deg, #f59e0b, #d97706);
  --grade-2-bg:     linear-gradient(135deg, #ef4444, #dc2626);
  --grade-hw-bg:    rgba(99,102,241,0.10);
  --grade-hw-text:  #6366f1;
  --grade-hw-border:rgba(99,102,241,0.25);

  --success:        #22c55e;
  --success-text:   #16a34a;
  --danger:         #ef4444;
  --danger-text:    #dc2626;
  --warning:        #f59e0b;
  --comment-bg:     #fffbeb;
  --comment-border: #fde68a;
  --comment-title:  #d97706;
  --comment-text:   #92400e;

  --error-bg:       #fef2f2;
  --error-border:   #fecaca;
  --error-text:     #dc2626;
}
```

---

## 3. Переключение темы

### Логика (App.jsx)

```js
const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

useEffect(() => {
  const el = document.documentElement;
  el.classList.remove('dark', 'light');
  el.classList.add(theme);
  localStorage.setItem('theme', theme);
}, [theme]);
```

Класс ставится на `<html>` через `classList` (безопасно — не стирает другие классы).

### Переключатель в настройках

```jsx
<button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
  {theme === 'dark' ? '☀️ Светлая тема' : '🌙 Тёмная тема'}
</button>
```

---

## 4. Фон страницы

В `src/index.css`:

```css
body {
  background: var(--bg-page);
  min-height: 100dvh;
}
```

Дополнительно для тёмной — декоративный градиент:

```css
:root body, .dark body {
  background: linear-gradient(160deg, #0a0f1e 0%, #0f172a 100%);
}
```

---

## 5. Компоненты

### Карточка (Card)

Текущие классы: `bg-white border border-slate-200 rounded-2xl shadow-sm`

Замена через CSS-переменные:

```jsx
// Утилитный класс в index.css:
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 1rem;
}
// Активная карточка:
.card-active {
  background: var(--bg-card-active);
  border-color: var(--border-active);
}
```

### Инпут (Inp)

`bg-white border-slate-200 text-slate-700 placeholder-slate-400` →

```css
.inp {
  background: var(--bg-input);
  border: 1px solid var(--border-input);
  color: var(--text-primary);
}
.inp::placeholder { color: var(--text-muted); }
```

### Кнопка (Btn)

`bg-blue-500 text-white hover:bg-blue-600` → `bg-[var(--accent)] text-white hover:bg-[var(--accent-2)]`

### Навигация

```css
.nav-bar {
  background: var(--bg-nav);
  border-top: 1px solid var(--border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

Активная вкладка: `bg-[var(--accent-text)]/15 text-[var(--accent-text)]`
Неактивная: `text-[var(--text-muted)]`

### Текст

| Старый класс | Новый |
|---|---|
| `text-slate-900` / `text-slate-800` | `text-[var(--text-primary)]` |
| `text-slate-600` / `text-slate-500` | `text-[var(--text-secondary)]` |
| `text-slate-400` | `text-[var(--text-muted)]` |

### Оценки (GChip / GPicker)

```css
.grade-chip-5 { background: var(--grade-5-bg); color: white; }
.grade-chip-4 { background: var(--grade-4-bg); color: white; }
.grade-chip-3 { background: var(--grade-3-bg); color: white; }
.grade-chip-2 { background: var(--grade-2-bg); color: white; }
.grade-chip-hw {
  background: var(--grade-hw-bg);
  color: var(--grade-hw-text);
  border: 1px solid var(--grade-hw-border);
}
```

### Бейдж предмета (SBadge)

Функция `sc(subject)` возвращает Tailwind-классы светлой темы. Нужна замена на CSS-переменные.

В коде `SC` — массив из 15 Tailwind-классов, индекс выбирается через `s.c % SC.length`.
Заменить на 15 CSS-классов `sbadge-0` … `sbadge-14`, адаптированных для обеих тем:

```css
/* Тёмная тема (базовая) */
:root .sbadge-0,  .dark .sbadge-0  { background:rgba(99,102,241,.18); color:#818cf8; border-color:rgba(99,102,241,.3); }  /* blue    */
:root .sbadge-1,  .dark .sbadge-1  { background:rgba(168,85,247,.18); color:#c084fc; border-color:rgba(168,85,247,.3); }  /* purple  */
:root .sbadge-2,  .dark .sbadge-2  { background:rgba(16,185,129,.18); color:#34d399; border-color:rgba(16,185,129,.3); }  /* emerald */
:root .sbadge-3,  .dark .sbadge-3  { background:rgba(245,158,11,.18); color:#fcd34d; border-color:rgba(245,158,11,.3); }  /* amber   */
:root .sbadge-4,  .dark .sbadge-4  { background:rgba(236,72,153,.18); color:#f472b6; border-color:rgba(236,72,153,.3); }  /* pink    */
:root .sbadge-5,  .dark .sbadge-5  { background:rgba(99,102,241,.22); color:#a5b4fc; border-color:rgba(99,102,241,.35);}  /* indigo  */
:root .sbadge-6,  .dark .sbadge-6  { background:rgba(249,115,22,.18); color:#fb923c; border-color:rgba(249,115,22,.3); }  /* orange  */
:root .sbadge-7,  .dark .sbadge-7  { background:rgba(20,184,166,.18); color:#2dd4bf; border-color:rgba(20,184,166,.3); }  /* teal    */
:root .sbadge-8,  .dark .sbadge-8  { background:rgba(239,68,68,.18);  color:#f87171; border-color:rgba(239,68,68,.3);  }  /* red     */
:root .sbadge-9,  .dark .sbadge-9  { background:rgba(6,182,212,.18);  color:#22d3ee; border-color:rgba(6,182,212,.3);  }  /* cyan    */
:root .sbadge-10, .dark .sbadge-10 { background:rgba(132,204,22,.18); color:#a3e635; border-color:rgba(132,204,22,.3); }  /* lime    */
:root .sbadge-11, .dark .sbadge-11 { background:rgba(244,63,94,.18);  color:#fb7185; border-color:rgba(244,63,94,.3);  }  /* rose    */
:root .sbadge-12, .dark .sbadge-12 { background:rgba(139,92,246,.22); color:#a78bfa; border-color:rgba(139,92,246,.35);}  /* violet  */
:root .sbadge-13, .dark .sbadge-13 { background:rgba(14,165,233,.18); color:#38bdf8; border-color:rgba(14,165,233,.3); }  /* sky     */
:root .sbadge-14, .dark .sbadge-14 { background:rgba(34,197,94,.18);  color:#4ade80; border-color:rgba(34,197,94,.3);  }  /* green   */

/* Светлая тема */
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
```

Функция `sc(s)` заменяется на: `s => s ? \`sbadge-${s.c % 15}\` : 'sbadge-0'`

### Цвета оценок в статистике (GC / GC2)

`GC` и `GC2` — константы для цветов в таблице оценок. Заменить аналогично через CSS-классы:

```css
/* Тёмная */
:root .gc-5, .dark .gc-5 { background:rgba(34,197,94,.18);  color:#4ade80; }
:root .gc-4, .dark .gc-4 { background:rgba(99,102,241,.18); color:#818cf8; }
:root .gc-3, .dark .gc-3 { background:rgba(245,158,11,.18); color:#fcd34d; }
:root .gc-2, .dark .gc-2 { background:rgba(239,68,68,.18);  color:#f87171; }
/* Светлая */
.light .gc-5 { background:#f0fdf4; color:#16a34a; }
.light .gc-4 { background:#eef2ff; color:#4f46e5; }
.light .gc-3 { background:#fffbeb; color:#d97706; }
.light .gc-2 { background:#fef2f2; color:#dc2626; }
```

`GC` заменить на объект: `{"5":"gc-5","4":"gc-4","3":"gc-3","2":"gc-2"}`
`GC2` убрать — заменить инлайн-стили на классы `gc-5` … `gc-2`.

### Комментарий родителя

```css
.comment-block {
  background: var(--comment-bg);
  border: 1px solid var(--comment-border);
}
.comment-title { color: var(--comment-title); }
.comment-text { color: var(--comment-text); }
```

### Баннер ошибки сохранения

```css
.save-error-banner {
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  color: var(--error-text);
}
```

### КР-карточка

```css
.card-kr {
  background: linear-gradient(135deg, rgba(239,68,68,.18), rgba(220,38,38,.10));
  border: 1px solid rgba(239,68,68,.30);
}
.light .card-kr {
  background: #fef2f2;
  border-color: #fecaca;
}
```

---

## 6. Экраны — что меняется

### Все экраны (глобально)
- Фон через `body` с `var(--bg-page)`
- Все `bg-white` → CSS-переменная через `.card`
- Все `border-slate-*` → `var(--border)`
- Все цвета текста через переменные (см. таблицу выше)

### index.html
- Добавить DM Sans `<link>`
- `theme-color` meta: `#6366f1` (индиго вместо синего)

### src/index.css
- Добавить `@import` Google Fonts (или `<link>` в HTML — предпочтительнее)
- Определить `:root`, `.dark`, `.light` с переменными
- Добавить утилитные классы `.card`, `.card-active`, `.inp`, `.save-error-banner`, `.comment-block`, `.sbadge-1`…`.sbadge-8`
- `body { font-family: 'DM Sans', ...; background: var(--bg-page); }`

### App.jsx
- Добавить `[theme, setTheme]` state с `localStorage`
- `useEffect` → `document.documentElement.className = theme`
- Функция `sc(s)` возвращает `'sbadge-N'` (индекс 1–8 по `s.color`)
- Переключатель темы в блоке настроек (вкладка «Профиль»)
- Баннер `saveError` использует классы `.save-error-banner`

### ScheduleTab.jsx
- Карточки уроков: `bg-white` → `.card`, активный урок → `.card-active`
- Дни-таблетки: фон и цвет через переменные
- Нижняя навигация: `.nav-bar` + активная/неактивная вкладка через переменные

### HomeworkTab.jsx
- Карточки заданий: `.card` / `.card-kr`
- Комментарий: `.comment-block` / `.comment-title` / `.comment-text`
- Чекбокс: `border-[var(--accent)]` / заполненный `bg-gradient-to-br from-[var(--success)]`

### GradesTab.jsx
- GChip использует `.grade-chip-5` … `.grade-chip-hw`
- SBadge использует `.sbadge-N`

---

## 7. Что НЕ меняется

- Структура компонентов, пропсы, логика
- Tailwind для отступов, размеров, flex/grid (`p-3`, `gap-2`, `rounded-2xl` и т.д.)
- Firebase, роутинг, бизнес-логика

---

## 8. Порядок реализации (фазы)

Разбить на 4 независимые задачи для агента:

1. **Фаза 1 — Токены и шрифт**: `index.css` (переменные) + `index.html` (DM Sans, theme-color) + `App.jsx` (theme state, sc())
2. **Фаза 2 — Расписание**: `ScheduleTab.jsx` полностью
3. **Фаза 3 — Задания и оценки**: `HomeworkTab.jsx` + `GradesTab.jsx`
4. **Фаза 4 — App.jsx остаток**: экраны логина/создания семьи, настройки, переключатель темы, saveError-баннер, навигация

Каждая фаза деплоится и проверяется отдельно.
