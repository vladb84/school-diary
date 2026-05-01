import { useState, useEffect } from "react";

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

const SUBJS = [
  {id:"s1",name:"Русский язык",c:0},{id:"s2",name:"Литература",c:1},{id:"s3",name:"Алгебра",c:2},
  {id:"s4",name:"Геометрия",c:3},{id:"s5",name:"История",c:4},{id:"s6",name:"Обществознание",c:5},
  {id:"s7",name:"География",c:6},{id:"s8",name:"Биология",c:7},{id:"s9",name:"Физика",c:8},
  {id:"s10",name:"Химия",c:9},{id:"s11",name:"Информатика",c:10},{id:"s12",name:"Английский язык",c:11},
  {id:"s13",name:"Физкультура",c:12},{id:"s14",name:"ОБЖ",c:13},{id:"s15",name:"Технология",c:14},
];

const INIT = { children:[], subjects:SUBJS, weeklyTemplate:[], dateSchedule:[], homework:[], grades:[], clubs:[] };

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

export default function App() {
  const [db, setDb] = useState(null);
  const [screen, setScreen] = useState("select");
  const [mode, setMode] = useState("child");
  const [cid, setCid] = useState(null);
  const [tab, setTab] = useState(0);
  const [mon, setMon] = useState(() => getMonday(new Date()));
  const [aDate, setADate] = useState(toDay);
  const [pin, setPin] = useState(""); const [pinErr,setPinErr]=useState(false); const [showPin,setShowPin]=useState(false);
  const [saving, setSaving] = useState(false);
  const [egid, setEgid] = useState(null);
  const [newChild, setNewChild] = useState({name:"", birthYear:"", schoolYear:""});
  const [lF, setLF] = useState({subjectId:"",lessonNum:"1",time:lessonTime(1),repeat:true});
  const [hwF, setHwF] = useState({subjectId:"",lessonId:"",task:"",due:toDay()});
  const [grF, setGrF] = useState({subjectId:"",value:"5",date:toDay(),type:"class"});
  const [clF, setClF] = useState({name:"",day:"Пн",time:""});
  const [sjF, setSjF] = useState("");
  const [editC, setEditC] = useState({});

  useEffect(()=>{
    try {
      const raw = localStorage.getItem("school-db-v4");
      if(raw){ setDb(JSON.parse(raw)); return; }
      // migrate v3
      try {
        const raw3 = localStorage.getItem("school-db-v3");
        if(raw3){
          const o=JSON.parse(raw3);
          setDb({...INIT, children:o.children||[], subjects:o.subjects||SUBJS,
            weeklyTemplate:(o.schedule||[]),
            homework:(o.homework||[]).map(h=>({...h,date:h.due||toDay(),lessonId:h.scheduleId||""})),
            grades:o.grades||[], clubs:o.clubs||[]});
          return;
        }
      } catch {}
      setDb(INIT);
    } catch { setDb(INIT); }
  },[]);

  const save = d => {
    setDb(d); setSaving(true);
    try { localStorage.setItem("school-db-v4", JSON.stringify(d)); } catch {}
    setTimeout(()=>setSaving(false),600);
  };

  if(!db) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50"><p className="text-slate-400 animate-pulse">Загрузка...</p></div>;

  const {children,subjects,weeklyTemplate,dateSchedule,homework,grades,clubs}=db;
  const cbg=idx=>CBG[(idx||0)%CBG.length];
  const subj=id=>subjects.find(s=>s.id===id);
  const sc=s=>s?SC[s.c%SC.length]:"bg-slate-100 text-slate-600";
  const upd=patch=>save({...db,...patch});
  const todayStr=toDay();

  const chTpl  = weeklyTemplate.filter(l=>l.childId===cid);
  const chDate = dateSchedule.filter(l=>l.childId===cid);
  const chHw   = homework.filter(h=>h.childId===cid);
  const chGr   = grades.filter(g=>g.childId===cid);
  const chCl   = clubs.filter(c=>c.childId===cid);

  const schSubjIds = [...new Set(chTpl.map(l=>l.subjectId))];
  const schSubjs   = subjects.filter(s=>schSubjIds.includes(s.id));

  const lessonsFor = dateStr => {
    const d=sd(dateStr), di=(d.getDay()+6)%7;
    if(di>=6) return [];
    const dayKey=DAYS[di];
    return [...chTpl.filter(l=>l.day===dayKey), ...chDate.filter(l=>l.date===dateStr)]
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

  const enterParent = () => {
    if(pin===PIN){ setMode("parent"); setShowPin(false); setPin(""); setPinErr(false); if(!cid&&children.length>0) setCid(children[0].id); if(screen==="select") setScreen("app"); }
    else setPinErr(true);
  };
  const goSelect = () => { setScreen("select"); setMode("child"); setCid(null); setTab(0); };
  const addChild = () => {
    if(!newChild.name.trim()) return;
    const by=parseInt(newChild.birthYear)||null, sy=parseInt(newChild.schoolYear)||null;
    const grade=(sy&&sy<=new Date().getFullYear())?(new Date().getFullYear()-sy+1):null;
    upd({children:[...children,{id:uid(),name:newChild.name.trim(),colorIdx:children.length%CBG.length,birthYear:by,schoolYear:sy,grade}]});
    setNewChild({name:"",birthYear:"",schoolYear:""});
  };
  const remChild = id => {
    if(!window.confirm("Удалить профиль и все данные?")) return;
    upd({children:children.filter(c=>c.id!==id),weeklyTemplate:weeklyTemplate.filter(l=>l.childId!==id),dateSchedule:dateSchedule.filter(l=>l.childId!==id),homework:homework.filter(h=>h.childId!==id),grades:grades.filter(g=>g.childId!==id),clubs:clubs.filter(c=>c.childId!==id)});
    if(cid===id) setCid(children.filter(c=>c.id!==id)[0]?.id||null);
  };

  const TABS = mode==="parent"
    ? ["📅 Расписание","📝 Задания","⭐ Оценки","🏆 Кружки","📚 Предметы","👨‍👩‍👧‍👦 Дети"]
    : ["📅 Расписание","📝 Задания","⭐ Оценки","🏆 Кружки"];

  const PinModal = () => (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-72 shadow-xl">
        <h2 className="font-bold text-lg mb-1">Вход для родителя</h2>
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

  if(screen==="select") return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-700 mb-2">👋 Привет!</h1>
        <p className="text-slate-400">Выбери свой профиль</p>
      </div>
      {children.length===0
        ? <div className="bg-white rounded-2xl p-8 shadow-sm text-center max-w-xs w-full mb-6"><p className="text-slate-400 text-sm">Профилей нет.<br/>Войдите как родитель и добавьте детей.</p></div>
        : <div className="grid grid-cols-2 gap-4 max-w-sm w-full mb-8">
            {children.map(ch=>(
              <button key={ch.id} onClick={()=>{setCid(ch.id);setMode("child");setScreen("app");setTab(0);}}
                className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center gap-3 hover:shadow-md active:scale-95 transition-all">
                <div className={`w-16 h-16 rounded-full ${cbg(ch.colorIdx)} flex items-center justify-center text-white text-2xl font-bold shadow-md`}>{ch.name[0].toUpperCase()}</div>
                <span className="text-slate-700 font-semibold text-sm">{ch.name}</span>
                {ch.grade&&<span className="text-xs text-slate-400">{ch.grade} класс</span>}
                {ch.birthYear&&!ch.grade&&<span className="text-xs text-slate-400">{ch.birthYear} г.р.</span>}
              </button>
            ))}
          </div>
      }
      <button onClick={()=>setShowPin(true)} className="bg-white border border-slate-200 text-slate-600 rounded-xl px-6 py-3 text-sm font-medium hover:bg-slate-50 shadow-sm">🔑 Я родитель</button>
      {showPin&&<PinModal/>}
    </div>
  );

  const activeLessons = lessonsFor(aDate);
  const hwDateLessons = lessonsFor(hwF.due);
  const hwSjIds = hwDateLessons.length ? [...new Set(hwDateLessons.map(l=>l.subjectId))] : schSubjIds;
  const activeCh = children.find(c=>c.id===cid);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans" onClick={()=>egid&&setEgid(null)}>
      <div className="max-w-2xl mx-auto p-4" onClick={e=>e.stopPropagation()}>

        <div className="flex items-center gap-2 mb-4">
          <button onClick={goSelect} className="text-slate-400 hover:text-slate-600 text-xl w-8">←</button>
          {mode==="parent"
            ? <div className="flex gap-1.5 flex-1 overflow-x-auto pb-0.5">
                {children.map(ch=>(
                  <button key={ch.id} onClick={()=>setCid(ch.id)}
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
          {mode==="child"
            ? <button onClick={()=>setShowPin(true)} className="bg-slate-100 text-slate-600 rounded-xl px-3 py-1.5 text-xs font-medium">🔑</button>
            : <button onClick={()=>setMode("child")} className="bg-amber-100 text-amber-700 rounded-xl px-3 py-1.5 text-xs font-medium">👨‍👩‍👧‍👦</button>
          }
        </div>

        {showPin&&<PinModal/>}

        <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)}
              className={`flex-shrink-0 flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${tab===i?"bg-blue-500 text-white shadow":"text-slate-500 hover:bg-slate-100"}`}>
              {t}{i===1&&hwPending>0&&<span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1">{hwPending}</span>}
            </button>
          ))}
        </div>

        {tab===0&&(
          <div>
            <div className="flex items-center justify-between mb-3">
              <button onClick={()=>{ const m=new Date(mon); m.setDate(m.getDate()-7); setMon(m); }} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-100 text-lg">‹</button>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">{wLabel}</p>
                {ds(mon)!==ds(getMonday(new Date()))&&<button onClick={()=>{setMon(getMonday(new Date()));setADate(toDay());}} className="text-xs text-blue-500 hover:underline">← сегодня</button>}
              </div>
              <button onClick={()=>{ const m=new Date(mon); m.setDate(m.getDate()+7); setMon(m); }} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-100 text-lg">›</button>
            </div>
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
              {wDates.map((d,i)=>{
                const dstr=ds(d), isToday=dstr===todayStr, isActive=dstr===aDate;
                const has=lessonsFor(dstr).length>0;
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
                    const s=subj(l.subjectId);
                    const lHw=chHw.filter(h=>h.subjectId===l.subjectId&&(h.date===aDate||h.lessonId===l.id));
                    const lGr=sjGrades(l.subjectId).slice(0,3);
                    const isOnce=!!l.date;
                    return (
                      <div key={l.id} className="mb-2 flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                        <span className="text-slate-400 text-xs w-5 text-center font-bold">{l.lessonNum}</span>
                        {l.time&&<span className="text-slate-400 text-xs w-10">{l.time}</span>}
                        <span className={`px-2 py-0.5 rounded-lg text-sm font-medium flex-1 ${sc(s)}`}>{s?.name||"?"}</span>
                        {isOnce&&<span className="text-purple-400 text-xs">📌</span>}
                        {lHw.some(h=>!h.done)&&<span className="text-orange-400 text-xs">📝</span>}
                        {lGr[0]&&<GBadge v={lGr[0].value}/>}
                        {mode==="parent"&&<button onClick={()=>{ isOnce?upd({dateSchedule:dateSchedule.filter(x=>x.id!==l.id)}):upd({weeklyTemplate:weeklyTemplate.filter(x=>x.id!==l.id)}); }} className="text-slate-300 hover:text-red-400 text-lg">×</button>}
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
                      else upd({dateSchedule:[...dateSchedule,{id:uid(),childId:cid,date:aDate,subjectId:lF.subjectId,lessonNum:+lF.lessonNum,time:lF.time}]});
                      setLF({subjectId:"",lessonNum:"1",time:lessonTime(1),repeat:true});
                    }} cls="bg-blue-500 text-white hover:bg-blue-600">+ Добавить</Btn>
                  </div>
                  {!lF.repeat&&<p className="text-xs text-purple-500 bg-purple-50 rounded-lg px-3 py-1.5">📌 Только на {sd(aDate).getDate()} {MON[sd(aDate).getMonth()]}</p>}
                </div>
              </Card>
            )}
          </div>
        )}

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
                      const s=subj(l.subjectId);
                      const dname=DAYS_FULL[DAYS.indexOf(DAYS[Math.min((sd(hwF.due).getDay()+6)%7,5)])];
                      return <option key={l.id} value={l.id}>{[dname,l.lessonNum&&`${l.lessonNum} урок`,l.time].filter(Boolean).join(", ")} — {s?.name}</option>;
                    })}
                  </Sel>
                  <div className="flex gap-2 items-end">
                    <textarea className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" placeholder="Что задали? Можно писать целыми предложениями..." rows={2}
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

        {tab===2&&(
          <div>
            {mode==="parent"&&<p className="text-xs text-slate-400 mb-3 text-center">Нажмите на оценку для изменения</p>}
            <div className="space-y-3 mb-4">
              {schSubjs.some(s=>sjGrades(s.id).length>0)
                ?schSubjs.filter(s=>sjGrades(s.id).length>0).map(s=>{
                    const gs=sjGrades(s.id), av=avg(s.id);
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
                :<Empty txt="Оценок ещё нет"/>
              }
            </div>
            {mode==="parent"&&(
              <Card>
                <ST>Добавить оценку</ST>
                {schSubjs.length===0
                  ?<p className="text-xs text-slate-400 text-center py-2">Сначала добавьте предметы в расписание</p>
                  :<div className="space-y-2">
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

        {tab===3&&(
          <div>
            <div className="space-y-3 mb-4">
              {chCl.length===0?<Empty txt="Кружки не добавлены"/>
                :chCl.map(c=>(
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

        {tab===4&&mode==="parent"&&(
          <div>
            <Card cls="mb-4">
              <ST>Предметы в расписании {activeCh?.name}</ST>
              {schSubjs.length===0
                ?<p className="text-slate-400 text-sm text-center py-4">Нет — добавьте уроки в расписание</p>
                :<div className="space-y-2">
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
              <ST>Добавить предмет в каталог</ST>
              <div className="flex gap-2">
                <Inp cls="flex-1" placeholder="Название предмета" value={sjF} onChange={e=>setSjF(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&sjF.trim()){upd({subjects:[...subjects,{id:uid(),name:sjF.trim(),c:subjects.length%SC.length}]});setSjF("");}}}/>
                <Btn onClick={()=>{if(!sjF.trim())return;upd({subjects:[...subjects,{id:uid(),name:sjF.trim(),c:subjects.length%SC.length}]});setSjF("");}} cls="bg-blue-500 text-white hover:bg-blue-600">+</Btn>
              </div>
              <p className="text-xs text-slate-400 mt-2">Чтобы добавить предмет в расписание — перейдите в «📅 Расписание»</p>
            </Card>
          </div>
        )}

        {tab===5&&mode==="parent"&&(
          <div>
            <div className="space-y-3 mb-4">
              {children.length===0?<Empty txt="Детей нет — добавьте первого"/>
                :children.map(ch=>(
                  <Card key={ch.id}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full ${cbg(ch.colorIdx)} flex items-center justify-center text-white text-xl font-bold`}>{ch.name[0].toUpperCase()}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-700">{ch.name}</p>
                        <p className="text-xs text-slate-500">{ch.birthYear&&`${ch.birthYear} г.р.`}{ch.birthYear&&ch.grade?" · ":""}{ch.grade&&`${ch.grade} класс`}</p>
                        <p className="text-xs text-slate-400">{weeklyTemplate.filter(l=>l.childId===ch.id).length} ур/нед · {homework.filter(h=>h.childId===ch.id).length} заданий · {clubs.filter(c=>c.childId===ch.id).length} кружков</p>
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