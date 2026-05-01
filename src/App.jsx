import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { auth, provider, db } from "./firebase";

// ── Константы ────────────────────────────────────────────────
const DAYS = ["Пн","Вт","Ср","Чт","Пт","Сб"];
const DAYS_FULL = ["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
const MON = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const GC = {"5":"bg-green-100 text-green-700","4":"bg-blue-100 text-blue-700","3":"bg-yellow-100 text-yellow-700","2":"bg-red-100 text-red-700"};
const SC = ["bg-blue-100 text-blue-800","bg-purple-100 text-purple-800","bg-emerald-100 text-emerald-800","bg-amber-100 text-amber-800","bg-pink-100 text-pink-800","bg-indigo-100 text-indigo-800","bg-orange-100 text-orange-800","bg-teal-100 text-teal-800","bg-red-100 text-red-800","bg-cyan-100 text-cyan-800","bg-lime-100 text-lime-800","bg-rose-100 text-rose-800","bg-violet-100 text-violet-800","bg-sky-100 text-sky-800","bg-green-100 text-green-800"];
const CBG = ["bg-blue-500","bg-pink-500","bg-emerald-500","bg-violet-500","bg-orange-500","bg-teal-500"];
const PIN = "1234";
const uid = () => Math.random().toString(36).slice(2,9);
const toDay = () => new Date().toISOString().slice(0,10);
const lessonTime = n => { const m=8*60+(n-1)*60,h=Math.floor(m/60),mm=m%60; return (h<0||h>23)?"":`${String(h).padStart(2,"0")}:${String(mm).padStart(2,"0")}`; };
const LNS = [-2,-1,0,1,2,3,4,5,6,7,8];
const getMonday = d => { const x=new Date(d); const dy=x.getDay(); x.setDate(x.getDate()-(dy===0?6:dy-1)); x.setHours(0,0,0,0); return x; };
const weekDates = mon => Array.from({length:6},(_,i)=>{ const d=new Date(mon); d.setDate(mon.getDate()+i); return d; });
const ds = d => d.toISOString().slice(0,10);
const sd = s => new Date(s+"T00:00:00");
const genCode = () => Math.random().toString(36).slice(2,8).toUpperCase();

const SUBJS = [
  {id:"s1",name:"Русский язык",c:0},{id:"s2",name:"Литература",c:1},{id:"s3",name:"Алгебра",c:2},
  {id:"s4",name:"Геометрия",c:3},{id:"s5",name:"История",c:4},{id:"s6",name:"Обществознание",c:5},
  {id:"s7",name:"География",c:6},{id:"s8",name:"Биология",c:7},{id:"s9",name:"Физика",c:8},
  {id:"s10",name:"Химия",c:9},{id:"s11",name:"Информатика",c:10},{id:"s12",name:"Английский язык",c:11},
  {id:"s13",name:"Физкультура",c:12},{id:"s14",name:"ОБЖ",c:13},{id:"s15",name:"Технология",c:14},
];
const INIT = { children:[], subjects:SUBJS, weeklyTemplate:[], dateSchedule:[], homework:[], grades:[], clubs:[] };

// ── Компоненты ───────────────────────────────────────────────
const Card = ({cls="",children}) => <div className={`bg-white rounded-2xl shadow-sm p-4 ${cls}`}>{children}</div>;
const Empty = ({txt}) => <Card cls="py-10 text-center text-slate-400 text-sm">{txt}</Card>;
const ST = ({children}) => <p className="text-sm font-medium text-slate-600 mb-3">{children}</p>;
const Btn = ({cls="",...p}) => <button className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${cls}`} {...p}/>;
const Inp = ({cls="",...p}) => <input className={`border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${cls}`} {...p}/>;
const Sel = ({cls="",...p}) => <select className={`border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${cls}`} {...p}/>;
const GBadge = ({v}) => <span className={`px-2 py-0.5 rounded-lg text-sm font-bold ${GC[v]||"bg-slate-100"}`}>{v}</span>;
const GPicker = ({value,onChange}) => (
  <div className="flex gap-1">
    {["5","4","3","2"].map(g=>(
      <button key={g} onClick={()=>onChange(value===g?null:g)}
        className={`w-8 h-8 rounded-lg text-sm font-bold border-2 transition-all ${value===g?(GC[g]||"")+" border-current ring-1 ring-offset-1 ring-current":"bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400"}`}>{g}</button>
    ))}
  </div>
);

// Экран загрузки
const LoadingScreen = ({text="Загрузка..."}) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
    <p className="text-slate-400 animate-pulse text-lg">{text}</p>
  </div>
);

// ── App ──────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(undefined);
  const [userRec, setUserRec] = useState(null);   // {familyId, role, childId?}
  const [dbData, setDbData] = useState(null);
  const [setupStep, setSetupStep] = useState("loading"); // loading|login|setup|join|select|app
  const [mode, setMode] = useState("child");
  const [cid, setCid] = useState(null);
  const [tab, setTab] = useState(0);
  const [mon, setMon] = useState(() => getMonday(new Date()));
  const [aDate, setADate] = useState(toDay);
  const [pin, setPin] = useState(""); const [pinErr,setPinErr]=useState(false); const [showPin,setShowPin]=useState(false);
  const [saving, setSaving] = useState(false);
  const [egid, setEgid] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [newChild, setNewChild] = useState({name:"",birthYear:"",schoolYear:""});
  const [lF, setLF] = useState({subjectId:"",lessonNum:"1",time:lessonTime(1),repeat:true});
  const [hwF, setHwF] = useState({subjectId:"",lessonId:"",task:"",due:toDay()});
  const [grF, setGrF] = useState({subjectId:"",value:"5",date:toDay(),type:"class"});
  const [clF, setClF] = useState({name:"",day:"Пн",time:""});
  const [sjF, setSjF] = useState("");
  const [editC, setEditC] = useState({});
  const [showCode, setShowCode] = useState(false);

  // Auth listener
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if(!u){ setSetupStep("login"); setDbData(null); setUserRec(null); return; }
      setSetupStep("loading");
      try {
        const uDoc = await getDoc(doc(db,"users",u.uid));
        if(uDoc.exists()){
          const rec = uDoc.data();
          setUserRec(rec);
          const fDoc = await getDoc(doc(db,"families",rec.familyId));
          if(fDoc.exists()){
            setDbData(fDoc.data());
            // Восстановить childId если был выбран ранее
            if(rec.childId) setCid(rec.childId);
            setMode(rec.role==="owner"?"parent":"child");
            setSetupStep(rec.role==="owner"?"select":"select");
          } else {
            setSetupStep("setup");
          }
        } else {
          setSetupStep("setup");
        }
      } catch(e){ console.error(e); setSetupStep("setup"); }
    });
    return unsub;
  },[]);

  const save = async d => {
    setDbData(d); setSaving(true);
    try { await setDoc(doc(db,"families",userRec.familyId), d); } catch(e){ console.error(e); }
    setTimeout(()=>setSaving(false), 600);
  };

  const logout = async () => {
    await signOut(auth);
    setSetupStep("login"); setMode("child"); setCid(null); setUserRec(null); setDbData(null);
  };

  // Создать семью (родитель)
  const createFamily = async () => {
    setCodeLoading(true);
    try {
      const code = genCode();
      const familyId = user.uid;
      // Мигрируем данные из localStorage если есть
      const local = localStorage.getItem("school-db-v4");
      const initData = { ...(local ? JSON.parse(local) : INIT), ownerId:user.uid, familyCode:code, members:[] };
      await setDoc(doc(db,"families",familyId), initData);
      await setDoc(doc(db,"familyCodes",code), { familyId });
      await setDoc(doc(db,"users",user.uid), { familyId, role:"owner" });
      setUserRec({ familyId, role:"owner" });
      setDbData(initData);
      setMode("parent");
      setSetupStep("select");
    } catch(e){ console.error(e); }
    setCodeLoading(false);
  };

  // Войти в семью по коду
  const joinFamily = async () => {
    const code = codeInput.trim().toUpperCase();
    if(code.length < 6){ setCodeError("Введи 6-значный код"); return; }
    setCodeLoading(true); setCodeError("");
    try {
      const cDoc = await getDoc(doc(db,"familyCodes",code));
      if(!cDoc.exists()){ setCodeError("Код не найден. Проверь и попробуй снова"); setCodeLoading(false); return; }
      const { familyId } = cDoc.data();
      await updateDoc(doc(db,"families",familyId), { members: arrayUnion(user.uid) });
      await setDoc(doc(db,"users",user.uid), { familyId, role:"member" });
      const fDoc = await getDoc(doc(db,"families",familyId));
      setDbData(fDoc.data());
      setUserRec({ familyId, role:"member" });
      setMode("child");
      setSetupStep("select");
    } catch(e){ console.error(e); setCodeError("Ошибка. Попробуй снова"); }
    setCodeLoading(false);
  };

  const enterParent = () => {
    if(pin===PIN){ setMode("parent"); setShowPin(false); setPin(""); setPinErr(false); if(!cid&&dbData?.children?.length>0) setCid(dbData.children[0].id); }
    else setPinErr(true);
  };

  const selectProfile = async ch => {
    setCid(ch.id);
    setMode("child");
    setSetupStep("app");
    setTab(0);
    // Запомнить выбор для членов семьи
    if(userRec?.role==="member"){
      try { await setDoc(doc(db,"users",user.uid), {...userRec, childId:ch.id}, {merge:true}); } catch{}
    }
  };

  const goSelect = () => { setSetupStep("select"); setMode(userRec?.role==="owner"?"parent":"child"); setCid(null); setTab(0); };

  const addChild = () => {
    if(!newChild.name.trim()) return;
    const by=parseInt(newChild.birthYear)||null, sy=parseInt(newChild.schoolYear)||null;
    const grade=(sy&&sy<=new Date().getFullYear())?(new Date().getFullYear()-sy+1):null;
    upd({children:[...children,{id:uid(),name:newChild.name.trim(),colorIdx:children.length%CBG.length,birthYear:by,schoolYear:sy,grade}]});
    setNewChild({name:"",birthYear:"",schoolYear:""});
  };

  const remChild = id => {
    if(!window.confirm("Удалить профиль и все данные?")) return;
    upd({children:children.filter(c=>c.id!==id),weeklyTemplate:weeklyTemplate.filter(l=>l.childId!==id),dateSchedule:(dateSchedule||[]).filter(l=>l.childId!==id),homework:homework.filter(h=>h.childId!==id),grades:grades.filter(g=>g.childId!==id),clubs:clubs.filter(c=>c.childId!==id)});
    if(cid===id) setCid(children.filter(c=>c.id!==id)[0]?.id||null);
  };

  // ── Экран загрузки ───────────────────────────────────────
  if(setupStep==="loading" || user===undefined) return <LoadingScreen/>;

  // ── Экран входа ──────────────────────────────────────────
  if(setupStep==="login") return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-10 max-w-sm w-full text-center">
        <div className="text-6xl mb-4">📚</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Школьный дневник</h1>
        <p className="text-slate-400 text-sm mb-8">Планировщик для всей семьи</p>
        <button onClick={()=>signInWithPopup(auth,provider).catch(console.error)}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl px-6 py-3 text-sm font-medium hover:bg-slate-50 transition-all shadow-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Войти через Google
        </button>
        <p className="text-xs text-slate-300 mt-4">Данные сохраняются в облаке</p>
      </div>
    </div>
  );

  // ── Экран первичной настройки (новый пользователь) ───────
  if(setupStep==="setup") return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">👋</div>
          <h1 className="text-xl font-bold text-slate-800">Добро пожаловать!</h1>
          <p className="text-slate-400 text-sm mt-1">{user.email}</p>
        </div>
        <p className="text-sm text-slate-600 text-center mb-6">Вы впервые здесь. Что хотите сделать?</p>
        <div className="space-y-3">
          <button onClick={createFamily} disabled={codeLoading}
            className="w-full bg-blue-500 text-white rounded-xl px-6 py-4 text-sm font-medium hover:bg-blue-600 transition-all disabled:opacity-60">
            {codeLoading?"Создаём...":"👨‍👩‍👧‍👦 Я родитель — создать семью"}
          </button>
          <button onClick={()=>setSetupStep("join")}
            className="w-full bg-white border-2 border-slate-200 text-slate-700 rounded-xl px-6 py-4 text-sm font-medium hover:bg-slate-50 transition-all">
            🎒 Я ребёнок — войти в семью по коду
          </button>
        </div>
        <button onClick={logout} className="w-full text-slate-300 text-xs mt-4 hover:text-slate-400">Выйти</button>
      </div>
    </div>
  );

  // ── Экран ввода семейного кода ───────────────────────────
  if(setupStep==="join") return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full">
        <button onClick={()=>setSetupStep("setup")} className="text-slate-400 text-sm mb-4 hover:text-slate-600">← Назад</button>
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-xl font-bold text-slate-800">Войти в семью</h1>
          <p className="text-slate-400 text-sm mt-1">Попроси родителя назвать код семьи</p>
        </div>
        <input
          className={`w-full border-2 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] uppercase focus:outline-none mb-2 ${codeError?"border-red-400 text-red-500":"border-slate-200 focus:border-blue-400 text-slate-800"}`}
          placeholder="ABC123"
          maxLength={6}
          value={codeInput}
          onChange={e=>{setCodeInput(e.target.value.toUpperCase());setCodeError("");}}
          onKeyDown={e=>e.key==="Enter"&&joinFamily()}
          autoFocus
        />
        {codeError && <p className="text-red-500 text-xs text-center mb-3">{codeError}</p>}
        <button onClick={joinFamily} disabled={codeLoading||codeInput.length<6}
          className="w-full bg-blue-500 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-blue-600 disabled:opacity-50 mt-2">
          {codeLoading?"Проверяем...":"Войти →"}
        </button>
        <button onClick={logout} className="w-full text-slate-300 text-xs mt-4 hover:text-slate-400">Выйти</button>
      </div>
    </div>
  );

  // Данные не загружены — ждём
  if(!dbData) return <LoadingScreen text="Загрузка данных семьи..."/>;

  const {children,subjects,weeklyTemplate,dateSchedule,homework,grades,clubs} = dbData;
  const cbg = idx => CBG[(idx||0)%CBG.length];
  const subj = id => subjects.find(s=>s.id===id);
  const sc = s => s ? SC[s.c%SC.length] : "bg-slate-100 text-slate-600";
  const upd = patch => save({...dbData,...patch});
  const todayStr = toDay();
  const isOwner = userRec?.role==="owner";

  // ── Экран выбора профиля ─────────────────────────────────
  if(setupStep==="select") return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-700 mb-2">👋 Привет!</h1>
        <p className="text-slate-400">Выбери свой профиль</p>
        <p className="text-xs text-slate-300 mt-1">{user.email}</p>
      </div>

      {children.length===0
        ? <div className="bg-white rounded-2xl p-8 shadow-sm text-center max-w-xs w-full mb-6">
            <p className="text-slate-400 text-sm">Профилей нет.<br/>{isOwner?"Войдите как родитель и добавьте детей.":"Попросите родителя добавить ваш профиль."}</p>
          </div>
        : <div className="grid grid-cols-2 gap-4 max-w-sm w-full mb-6">
            {children.map(ch=>(
              <button key={ch.id} onClick={()=>selectProfile(ch)}
                className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center gap-3 hover:shadow-md active:scale-95 transition-all">
                <div className={`w-16 h-16 rounded-full ${cbg(ch.colorIdx)} flex items-center justify-center text-white text-2xl font-bold shadow-md`}>{ch.name[0].toUpperCase()}</div>
                <span className="text-slate-700 font-semibold text-sm">{ch.name}</span>
                {ch.grade&&<span className="text-xs text-slate-400">{ch.grade} класс</span>}
              </button>
            ))}
          </div>
      }

      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        {/* Код семьи — только для родителя */}
        {isOwner&&(
          <div className="w-full">
            <button onClick={()=>setShowCode(v=>!v)}
              className="w-full bg-white border border-slate-200 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-slate-50">
              {showCode?"Скрыть код семьи":"🔑 Показать код для детей"}
            </button>
            {showCode&&(
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-xs text-amber-600 mb-1">Код семьи — дай детям для входа:</p>
                <p className="text-3xl font-bold tracking-[0.2em] text-amber-800">{dbData.familyCode}</p>
                <p className="text-xs text-amber-500 mt-1">Вводится один раз при первом входе</p>
              </div>
            )}
          </div>
        )}

        {/* Родительский режим — только для владельца */}
        {isOwner&&(
          <button onClick={()=>{setMode("parent");setSetupStep("app");setTab(5);}}
            className="w-full bg-amber-100 text-amber-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-amber-200">
            ⚙️ Управление (режим родителя)
          </button>
        )}

        <button onClick={logout} className="text-slate-300 text-xs hover:text-slate-400">Выйти из аккаунта</button>
      </div>
    </div>
  );

  // ── Основной экран приложения ────────────────────────────
  const chTpl  = weeklyTemplate.filter(l=>l.childId===cid);
  const chHw   = homework.filter(h=>h.childId===cid);
  const chGr   = grades.filter(g=>g.childId===cid);
  const chCl   = clubs.filter(c=>c.childId===cid);
  const schSubjIds = [...new Set(chTpl.map(l=>l.subjectId))];
  const schSubjs = subjects.filter(s=>schSubjIds.includes(s.id));

  const lessonsFor = dateStr => {
    const d=sd(dateStr),di=(d.getDay()+6)%7;
    if(di>=6) return [];
    return [...chTpl.filter(l=>l.day===DAYS[di]),...(dateSchedule||[]).filter(l=>l.childId===cid&&l.date===dateStr)]
      .sort((a,b)=>(+a.lessonNum||99)-(+b.lessonNum||99));
  };

  const hwPending = chHw.filter(h=>!h.done).length;
  const wDates = weekDates(mon);
  const activeDay = DAYS[Math.min((sd(aDate).getDay()+6)%7,5)];
  const w0=wDates[0], w5=wDates[5];
  const wLabel = w0.getMonth()===w5.getMonth()
    ? `${w0.getDate()}–${w5.getDate()} ${MON[w0.getMonth()]} ${w0.getFullYear()}`
    : `${w0.getDate()} ${MON[w0.getMonth()]} – ${w5.getDate()} ${MON[w5.getMonth()]}`;

  const sjGrades = sid => {
    const fHw=chHw.filter(h=>h.subjectId===sid&&h.grade).map(h=>({id:"hw_"+h.id,hwId:h.id,value:h.grade,date:h.date||"",type:"hw"}));
    return [...fHw,...chGr.filter(g=>g.subjectId===sid)].sort((a,b)=>b.date.localeCompare(a.date));
  };
  const avg = sid => { const gs=sjGrades(sid).map(g=>+g.value).filter(Boolean); return gs.length?(gs.reduce((a,b)=>a+b,0)/gs.length).toFixed(1):null; };
  const delGrade = g => { if(g.type==="hw") upd({homework:homework.map(h=>h.id===g.hwId?{...h,grade:null}:h)}); else upd({grades:grades.filter(x=>x.id!==g.id)}); setEgid(null); };
  const chgGrade = (g,v) => { if(!v){delGrade(g);return;} if(g.type==="hw") upd({homework:homework.map(h=>h.id===g.hwId?{...h,grade:v}:h)}); else upd({grades:grades.map(x=>x.id===g.id?{...x,value:v}:x)}); setEgid(null); };

  const GChip = ({g}) => {
    const isE=egid===g.id;
    return (
      <div className="relative">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs cursor-pointer ${GC[g.value]||"bg-slate-100"} ${mode==="parent"?"hover:ring-2 hover:ring-offset-1 hover:ring-current":""}`}
          onClick={e=>{e.stopPropagation();mode==="parent"&&setEgid(isE?null:g.id);}}>
          <span className="font-bold text-sm">{g.value}</span>
          <span className="opacity-60">{g.type==="hw"?"дз":g.type==="test"?"к/р":"уст"}</span>
          {g.date&&<span className="opacity-50">{g.date.slice(5)}</span>}
          {mode==="parent"&&<span className="opacity-40 ml-0.5">✎</span>}
        </div>
        {isE&&(
          <div className="absolute z-20 top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-max">
            <p className="text-xs text-slate-400 mb-2">Изменить оценку</p>
            <GPicker value={g.value} onChange={v=>chgGrade(g,v)}/>
            <button onClick={()=>delGrade(g)} className="mt-2 w-full text-xs text-red-400 py-1 border border-red-100 rounded-lg hover:bg-red-50">Удалить</button>
          </div>
        )}
      </div>
    );
  };
  const SBadge = ({sid}) => { const s=subj(sid); return <span className={`px-2 py-0.5 rounded-lg text-sm font-medium ${sc(s)}`}>{s?.name||"?"}</span>; };

  const PinModal = () => (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-72 shadow-xl">
        <h2 className="font-bold text-lg mb-1">Режим родителя</h2>
        <p className="text-slate-400 text-sm mb-3">Введите PIN-код</p>
        <input type="password" maxLength={4}
          className={`border-2 rounded-xl px-4 py-3 text-center text-xl w-full tracking-widest focus:outline-none ${pinErr?"border-red-400":"border-slate-200 focus:border-blue-400"}`}
          placeholder="••••" value={pin} onChange={e=>{setPin(e.target.value);setPinErr(false);}} onKeyDown={e=>e.key==="Enter"&&enterParent()} autoFocus/>
        {pinErr&&<p className="text-red-500 text-xs text-center mt-2">Неверный PIN</p>}
        <p className="text-slate-300 text-xs text-center mt-1">PIN: 1234</p>
        <div className="flex gap-2 mt-4">
          <Btn onClick={()=>{setShowPin(false);setPin("");setPinErr(false);}} cls="flex-1 bg-slate-100 text-slate-600">Отмена</Btn>
          <Btn onClick={enterParent} cls="flex-1 bg-blue-500 text-white hover:bg-blue-600">Войти</Btn>
        </div>
      </div>
    </div>
  );

  const activeCh = children.find(c=>c.id===cid);
  const TABS = mode==="parent"
    ? ["📅 Расписание","📝 Задания","⭐ Оценки","🏆 Кружки","📚 Предметы","👨‍👩‍👧‍👦 Дети"]
    : ["📅 Расписание","📝 Задания","⭐ Оценки","🏆 Кружки"];

  const activeLessons = lessonsFor(aDate);
  const hwDateLessons = lessonsFor(hwF.due);
  const hwSjIds = hwDateLessons.length ? [...new Set(hwDateLessons.map(l=>l.subjectId))] : schSubjIds;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans" onClick={()=>egid&&setEgid(null)}>
      <div className="max-w-2xl mx-auto p-4" onClick={e=>e.stopPropagation()}>

        {/* Шапка */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={goSelect} className="text-slate-400 hover:text-slate-600 text-xl w-8">←</button>
          {mode==="parent"
            ? <div className="flex gap-1.5 flex-1 overflow-x-auto pb-0.5">
                {children.map(ch=>(
                  <button key={ch.id} onClick={()=>{setCid(ch.id);setTab(0);}}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${cid===ch.id?cbg(ch.colorIdx)+" text-white shadow":"bg-white text-slate-600 hover:bg-slate-100"}`}>
                    <span className="font-bold">{ch.name[0]}</span><span>{ch.name}</span>
                  </button>
                ))}
              </div>
            : <div className="flex items-center gap-2 flex-1">
                {activeCh&&<div className={`w-8 h-8 rounded-full ${cbg(activeCh.colorIdx)} flex items-center justify-center text-white font-bold text-sm`}>{activeCh.name[0]}</div>}
                <span className="font-semibold text-slate-700">{activeCh?.name||"Дневник"}</span>
              </div>
          }
          <span className="text-xs text-slate-300">{saving?"💾":"✅"}</span>
          {mode==="child"&&isOwner&&<button onClick={()=>setShowPin(true)} className="bg-slate-100 text-slate-600 rounded-xl px-3 py-1.5 text-xs font-medium">🔑</button>}
          {mode==="parent"&&<button onClick={()=>setMode("child")} className="bg-amber-100 text-amber-700 rounded-xl px-3 py-1.5 text-xs font-medium">👨‍👩‍👧‍👦</button>}
        </div>

        {showPin&&<PinModal/>}

        {/* Табы */}
        <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)}
              className={`flex-shrink-0 flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${tab===i?"bg-blue-500 text-white shadow":"text-slate-500 hover:bg-slate-100"}`}>
              {t}{i===1&&hwPending>0&&<span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1">{hwPending}</span>}
            </button>
          ))}
        </div>

        {/* ══ РАСПИСАНИЕ ══ */}
        {tab===0&&(
          <div>
            <div className="flex items-center justify-between mb-3">
              <button onClick={()=>{const m=new Date(mon);m.setDate(m.getDate()-7);setMon(m);}} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-100 text-lg">‹</button>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">{wLabel}</p>
                {ds(mon)!==ds(getMonday(new Date()))&&<button onClick={()=>{setMon(getMonday(new Date()));setADate(toDay());}} className="text-xs text-blue-500 hover:underline">← сегодня</button>}
              </div>
              <button onClick={()=>{const m=new Date(mon);m.setDate(m.getDate()+7);setMon(m);}} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-100 text-lg">›</button>
            </div>
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
              {wDates.map((d,i)=>{
                const dstr=ds(d),isToday=dstr===todayStr,isActive=dstr===aDate,has=lessonsFor(dstr).length>0;
                return (
                  <button key={i} onClick={()=>setADate(dstr)}
                    className={`flex-shrink-0 flex flex-col items-center w-12 py-2 rounded-xl text-xs font-bold transition-all ${isActive?"bg-blue-500 text-white shadow-md":isToday?"bg-blue-100 text-blue-700 border-2 border-blue-300":"bg-white text-slate-600 hover:bg-slate-100"}`}>
                    <span>{DAYS[i]}</span>
                    <span className={`text-xs font-normal mt-0.5 ${isActive?"text-blue-100":isToday?"text-blue-600":"text-slate-400"}`}>{d.getDate()}</span>
                    {has&&<span className={`w-1.5 h-1.5 rounded-full mt-1 ${isActive?"bg-blue-200":"bg-blue-400"}`}/>}
                  </button>
                );
              })}
            </div>
            <Card cls="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-700">{DAYS_FULL[DAYS.indexOf(activeDay)]}, {sd(aDate).getDate()} {MON[sd(aDate).getMonth()]}</h2>
                {aDate===todayStr&&<span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Сегодня</span>}
              </div>
              {activeLessons.length===0
                ? <p className="text-slate-400 text-sm text-center py-4">Уроков нет</p>
                : activeLessons.map(l=>{
                    const s=subj(l.subjectId),isOnce=!!l.date;
                    const lHw=chHw.filter(h=>h.subjectId===l.subjectId&&(h.date===aDate||h.lessonId===l.id));
                    const lGr=sjGrades(l.subjectId).slice(0,3);
                    return (
                      <div key={l.id} className="mb-2 flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                        <span className="text-slate-400 text-xs w-5 text-center font-bold">{l.lessonNum}</span>
                        {l.time&&<span className="text-slate-400 text-xs w-10">{l.time}</span>}
                        <span className={`px-2 py-0.5 rounded-lg text-sm font-medium flex-1 ${sc(s)}`}>{s?.name||"?"}</span>
                        {isOnce&&<span className="text-purple-400 text-xs">📌</span>}
                        {lHw.some(h=>!h.done)&&<span className="text-orange-400 text-xs">📝</span>}
                        {lGr[0]&&<GBadge v={lGr[0].value}/>}
                        {mode==="parent"&&<button onClick={()=>isOnce?upd({dateSchedule:(dateSchedule||[]).filter(x=>x.id!==l.id)}):upd({weeklyTemplate:weeklyTemplate.filter(x=>x.id!==l.id)})} className="text-slate-300 hover:text-red-400 text-lg">×</button>}
                      </div>
                    );
                  })
              }
            </Card>
            {mode==="parent"&&(
              <Card>
                <ST>Добавить урок</ST>
                <div className="space-y-2">
                  <Sel cls="w-full" value={lF.subjectId} onChange={e=>setLF(p=>({...p,subjectId:e.target.value}))}>
                    <option value="">Выберите предмет...</option>
                    {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </Sel>
                  <div className="flex gap-2 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">№ урока</label>
                      <Sel cls="w-32" value={lF.lessonNum} onChange={e=>{const n=e.target.value;setLF(p=>({...p,lessonNum:n,time:lessonTime(+n)}));}}>
                        {LNS.map(n=><option key={n} value={n}>{n<=0?`${n} (доп.)`:`${n} — ${lessonTime(n)}`}</option>)}
                      </Sel>
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs text-slate-400">Время</label>
                      <Inp cls="w-full" placeholder="08:00" value={lF.time} onChange={e=>setLF(p=>({...p,time:e.target.value}))}/>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input type="checkbox" checked={lF.repeat} onChange={e=>setLF(p=>({...p,repeat:e.target.checked}))} className="w-4 h-4 accent-blue-500"/>
                      <span className="text-sm text-slate-600">Повторять каждую неделю</span>
                    </label>
                    <Btn onClick={()=>{
                      if(!lF.subjectId) return;
                      if(lF.repeat) upd({weeklyTemplate:[...weeklyTemplate,{id:uid(),childId:cid,subjectId:lF.subjectId,day:activeDay,lessonNum:+lF.lessonNum,time:lF.time}]});
                      else upd({dateSchedule:[...(dateSchedule||[]),{id:uid(),childId:cid,date:aDate,subjectId:lF.subjectId,lessonNum:+lF.lessonNum,time:lF.time}]});
                      setLF({subjectId:"",lessonNum:"1",time:lessonTime(1),repeat:true});
                    }} cls="bg-blue-500 text-white hover:bg-blue-600">+ Добавить</Btn>
                  </div>
                  {!lF.repeat&&<p className="text-xs text-purple-500 bg-purple-50 rounded-lg px-3 py-1.5">📌 Только на {sd(aDate).getDate()} {MON[sd(aDate).getMonth()]}</p>}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ══ ЗАДАНИЯ ══ */}
        {tab===1&&(
          <div>
            <div className="space-y-3 mb-4">
              {chHw.length===0?<Empty txt="Заданий нет 🎉"/>
                :[...chHw].sort((a,b)=>(a.date||"").localeCompare(b.date||"")).map(h=>(
                  <Card key={h.id} cls={h.done?"opacity-70":""}>
                    <div className="flex items-start gap-3">
                      <button onClick={()=>upd({homework:homework.map(x=>x.id===h.id?{...x,done:!x.done}:x)})}
                        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${h.done?"bg-green-500 border-green-500 text-white":"border-slate-300 hover:border-green-400"}`}>
                        {h.done&&"✓"}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <SBadge sid={h.subjectId}/>
                          {h.date&&<span className="text-xs text-slate-400">до {h.date}</span>}
                          {h.grade&&(mode==="parent"?<GChip g={{id:"hw_"+h.id,hwId:h.id,value:h.grade,date:h.date||"",type:"hw"}}/>:<GBadge v={h.grade}/>)}
                        </div>
                        <p className={`text-sm text-slate-700 ${h.done?"line-through":""}`}>{h.task}</p>
                        {h.comment&&<div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"><p className="text-xs text-amber-600 font-medium">💬 Родитель:</p><p className="text-xs text-amber-800 mt-0.5">{h.comment}</p></div>}
                        {mode==="parent"&&(
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2"><GPicker value={h.grade} onChange={g=>upd({homework:homework.map(x=>x.id===h.id?{...x,grade:g}:x)})}/><span className="text-xs text-slate-400">оценка</span></div>
                            <div className="flex gap-2 items-end">
                              <textarea className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs flex-1 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" placeholder="Комментарий для ребёнка..." rows={2}
                                value={editC[h.id]??h.comment} onChange={e=>setEditC(p=>({...p,[h.id]:e.target.value}))}/>
                              <button onClick={()=>{upd({homework:homework.map(x=>x.id===h.id?{...x,comment:editC[h.id]??h.comment}:x)});setEditC(p=>({...p,[h.id]:undefined}));}} className="bg-amber-400 text-white rounded-lg px-3 py-1.5 text-xs mb-0.5">💾</button>
                            </div>
                          </div>
                        )}
                      </div>
                      {mode==="parent"&&<button onClick={()=>upd({homework:homework.filter(x=>x.id!==h.id)})} className="text-slate-300 hover:text-red-400 text-lg">×</button>}
                    </div>
                  </Card>
                ))
              }
            </div>
            {mode==="parent"&&(
              <Card>
                <ST>Добавить задание</ST>
                <div className="space-y-2">
                  <Inp type="date" cls="w-full" value={hwF.due} onChange={e=>setHwF(p=>({...p,due:e.target.value,subjectId:"",lessonId:""}))}/>
                  <Sel cls="w-full" value={hwF.subjectId} onChange={e=>setHwF(p=>({...p,subjectId:e.target.value,lessonId:""}))}>
                    <option value="">Предмет...</option>
                    {schSubjs.filter(s=>hwSjIds.includes(s.id)).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </Sel>
                  <Sel cls="w-full" value={hwF.lessonId} onChange={e=>setHwF(p=>({...p,lessonId:e.target.value}))}>
                    <option value="">Привязать к уроку (необязательно)</option>
                    {hwDateLessons.filter(l=>!hwF.subjectId||l.subjectId===hwF.subjectId).map(l=>{
                      const s=subj(l.subjectId),dn=DAYS_FULL[DAYS.indexOf(DAYS[Math.min((sd(hwF.due).getDay()+6)%7,5)])];
                      return <option key={l.id} value={l.id}>{[dn,l.lessonNum&&`${l.lessonNum} урок`,l.time].filter(Boolean).join(", ")} — {s?.name}</option>;
                    })}
                  </Sel>
                  <div className="flex gap-2 items-end">
                    <textarea className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" placeholder="Что задали?" rows={2}
                      value={hwF.task} onChange={e=>setHwF(p=>({...p,task:e.target.value}))}/>
                    <Btn onClick={()=>{
                      if(!hwF.subjectId||!hwF.task.trim()) return;
                      upd({homework:[...homework,{id:uid(),childId:cid,subjectId:hwF.subjectId,date:hwF.due,lessonId:hwF.lessonId,task:hwF.task,done:false,grade:null,comment:""}]});
                      setHwF(p=>({...p,subjectId:"",lessonId:"",task:""}));
                    }} cls="bg-blue-500 text-white hover:bg-blue-600 mb-0.5">+</Btn>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ══ ОЦЕНКИ ══ */}
        {tab===2&&(
          <div>
            {mode==="parent"&&<p className="text-xs text-slate-400 mb-3 text-center">Нажмите на оценку для изменения</p>}
            <div className="space-y-3 mb-4">
              {schSubjs.some(s=>sjGrades(s.id).length>0)
                ? schSubjs.filter(s=>sjGrades(s.id).length>0).map(s=>{
                    const gs=sjGrades(s.id),av=avg(s.id);
                    return (
                      <Card key={s.id}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-0.5 rounded-lg text-sm font-medium flex-1 ${sc(s)}`}>{s.name}</span>
                          {av&&<span className={`px-2 py-1 rounded-lg text-sm font-bold ${GC[Math.round(parseFloat(av))]||""}`}>Ср: {av}</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">{gs.map((g,i)=><GChip key={i} g={g}/>)}</div>
                      </Card>
                    );
                  })
                : <Empty txt="Оценок ещё нет"/>
              }
            </div>
            {mode==="parent"&&(
              <Card>
                <ST>Добавить оценку</ST>
                {schSubjs.length===0
                  ? <p className="text-xs text-slate-400 text-center py-2">Сначала добавьте предметы в расписание</p>
                  : <div className="space-y-2">
                      <div className="flex gap-2">
                        <Sel cls="flex-1" value={grF.subjectId} onChange={e=>setGrF(p=>({...p,subjectId:e.target.value}))}>
                          <option value="">Предмет...</option>
                          {schSubjs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                        </Sel>
                        <Sel cls="w-28" value={grF.type} onChange={e=>setGrF(p=>({...p,type:e.target.value}))}>
                          <option value="class">Устный</option><option value="test">Контр.</option>
                        </Sel>
                      </div>
                      <div className="flex items-center gap-2">
                        <GPicker value={grF.value} onChange={v=>setGrF(p=>({...p,value:v||"5"}))}/>
                        <Inp type="date" cls="flex-1" value={grF.date} onChange={e=>setGrF(p=>({...p,date:e.target.value}))}/>
                        <Btn onClick={()=>{if(!grF.subjectId||!grF.value)return;upd({grades:[...grades,{id:uid(),childId:cid,...grF,hwId:null}]});setGrF(p=>({...p,subjectId:"",value:"5",date:toDay()}));}} cls="bg-blue-500 text-white hover:bg-blue-600">+</Btn>
                      </div>
                    </div>
                }
              </Card>
            )}
          </div>
        )}

        {/* ══ КРУЖКИ ══ */}
        {tab===3&&(
          <div>
            <div className="space-y-3 mb-4">
              {chCl.length===0?<Empty txt="Кружки не добавлены"/>
                : chCl.map(c=>(
                  <Card key={c.id} cls={c.done?"opacity-70":""}>
                    <div className="flex items-center gap-3">
                      <button onClick={()=>upd({clubs:clubs.map(x=>x.id===c.id?{...x,done:!x.done}:x)})}
                        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${c.done?"bg-green-500 border-green-500 text-white":"border-slate-300"}`}>{c.done&&"✓"}</button>
                      <div className="flex-1">
                        <p className={`text-sm font-medium text-slate-700 ${c.done?"line-through":""}`}>{c.name}</p>
                        <p className="text-xs text-slate-400">{DAYS_FULL[DAYS.indexOf(c.day)]}{c.time?`, ${c.time}`:""}</p>
                        {c.comment&&<div className="mt-1 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1"><p className="text-xs text-amber-800">💬 {c.comment}</p></div>}
                        {mode==="parent"&&(
                          <div className="flex gap-2 mt-2 items-end">
                            <textarea className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs flex-1 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" placeholder="Комментарий..." rows={2}
                              value={editC["c_"+c.id]??c.comment} onChange={e=>setEditC(p=>({...p,["c_"+c.id]:e.target.value}))}/>
                            <button onClick={()=>{upd({clubs:clubs.map(x=>x.id===c.id?{...x,comment:editC["c_"+c.id]??c.comment}:x)});setEditC(p=>({...p,["c_"+c.id]:undefined}));}} className="bg-amber-400 text-white rounded-lg px-3 py-1.5 text-xs mb-0.5">💾</button>
                          </div>
                        )}
                      </div>
                      {mode==="parent"&&<button onClick={()=>upd({clubs:clubs.filter(x=>x.id!==c.id)})} className="text-slate-300 hover:text-red-400 text-lg">×</button>}
                    </div>
                  </Card>
                ))
              }
            </div>
            {mode==="parent"&&(
              <Card>
                <ST>Добавить кружок</ST>
                <div className="space-y-2">
                  <Inp cls="w-full" placeholder="Название" value={clF.name} onChange={e=>setClF(p=>({...p,name:e.target.value}))}/>
                  <div className="flex gap-2">
                    <Sel cls="flex-1" value={clF.day} onChange={e=>setClF(p=>({...p,day:e.target.value}))}>
                      {DAYS.map(d=><option key={d} value={d}>{DAYS_FULL[DAYS.indexOf(d)]}</option>)}
                    </Sel>
                    <Inp cls="w-20" placeholder="17:00" value={clF.time} onChange={e=>setClF(p=>({...p,time:e.target.value}))}/>
                    <Btn onClick={()=>{if(!clF.name.trim())return;upd({clubs:[...clubs,{id:uid(),childId:cid,...clF,done:false,comment:""}]});setClF({name:"",day:"Пн",time:""});}} cls="bg-blue-500 text-white hover:bg-blue-600">+</Btn>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ══ ПРЕДМЕТЫ ══ */}
        {tab===4&&mode==="parent"&&(
          <div>
            <Card cls="mb-4">
              <ST>Предметы в расписании {activeCh?.name}</ST>
              {schSubjs.length===0
                ? <p className="text-slate-400 text-sm text-center py-4">Нет — добавьте уроки в расписание</p>
                : <div className="space-y-2">
                    {schSubjs.map(s=>{
                      const av=avg(s.id);
                      return (
                        <div key={s.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50">
                          <span className={`px-2 py-0.5 rounded-lg text-sm font-medium flex-1 ${sc(s)}`}>{s.name}</span>
                          <span className="text-xs text-slate-400">{chTpl.filter(l=>l.subjectId===s.id).length} ур/нед</span>
                          <span className="text-xs text-slate-400">{chHw.filter(h=>h.subjectId===s.id).length} дз</span>
                          {av&&<span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${GC[Math.round(parseFloat(av))]||""}`}>Ср {av}</span>}
                        </div>
                      );
                    })}
                  </div>
              }
            </Card>
            <Card>
              <ST>Добавить предмет</ST>
              <div className="flex gap-2">
                <Inp cls="flex-1" placeholder="Название предмета" value={sjF} onChange={e=>setSjF(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&sjF.trim()){upd({subjects:[...subjects,{id:uid(),name:sjF.trim(),c:subjects.length%SC.length}]});setSjF("");}}}/>
                <Btn onClick={()=>{if(!sjF.trim())return;upd({subjects:[...subjects,{id:uid(),name:sjF.trim(),c:subjects.length%SC.length}]});setSjF("");}} cls="bg-blue-500 text-white hover:bg-blue-600">+</Btn>
              </div>
            </Card>
          </div>
        )}

        {/* ══ ДЕТИ ══ */}
        {tab===5&&mode==="parent"&&(
          <div>
            {/* Код семьи */}
            <Card cls="mb-4 bg-amber-50 border border-amber-100">
              <ST>🔑 Код семьи</ST>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold tracking-[0.2em] text-amber-800">{dbData.familyCode}</p>
                <div className="text-right">
                  <p className="text-xs text-amber-600">Дай этот код ребёнку</p>
                  <p className="text-xs text-amber-500">при первом входе через Google</p>
                </div>
              </div>
            </Card>

            <div className="space-y-3 mb-4">
              {children.length===0?<Empty txt="Детей нет — добавьте первого"/>
                : children.map(ch=>(
                  <Card key={ch.id}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full ${cbg(ch.colorIdx)} flex items-center justify-center text-white text-xl font-bold`}>{ch.name[0].toUpperCase()}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-700">{ch.name}</p>
                        <p className="text-xs text-slate-500">{ch.birthYear&&`${ch.birthYear} г.р.`}{ch.birthYear&&ch.grade?" · ":""}{ch.grade&&`${ch.grade} класс`}</p>
                        <p className="text-xs text-slate-400">
                          {weeklyTemplate.filter(l=>l.childId===ch.id).length} ур/нед · {homework.filter(h=>h.childId===ch.id).length} заданий
                        </p>
                      </div>
                      <button onClick={()=>remChild(ch.id)} className="text-slate-300 hover:text-red-400 text-lg">×</button>
                    </div>
                  </Card>
                ))
              }
            </div>
            <Card>
              <ST>Добавить ребёнка</ST>
              <div className="space-y-2">
                <Inp cls="w-full" placeholder="Имя (Артём, Соня...)" value={newChild.name} onChange={e=>setNewChild(p=>({...p,name:e.target.value}))}/>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 mb-1 block">Год рождения</label>
                    <Inp cls="w-full" placeholder="2010" type="number" value={newChild.birthYear} onChange={e=>setNewChild(p=>({...p,birthYear:e.target.value}))}/>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 mb-1 block">Год поступления в школу</label>
                    <Inp cls="w-full" placeholder="2017" type="number" value={newChild.schoolYear} onChange={e=>setNewChild(p=>({...p,schoolYear:e.target.value}))}/>
                  </div>
                </div>
                {newChild.schoolYear&&parseInt(newChild.schoolYear)<=new Date().getFullYear()&&(
                  <p className="text-xs text-blue-500 bg-blue-50 rounded-lg px-3 py-1.5">🎒 Текущий класс: <b>{new Date().getFullYear()-parseInt(newChild.schoolYear)+1}</b></p>
                )}
                <Btn onClick={addChild} cls="w-full bg-blue-500 text-white hover:bg-blue-600">+ Добавить</Btn>
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
