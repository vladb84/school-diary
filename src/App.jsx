import { useState, useEffect, useCallback } from "react";
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, deleteDoc } from "firebase/firestore";
import { auth, provider, db } from "./firebase";

const DAYS=["Пн","Вт","Ср","Чт","Пт","Сб"];
const DAYS_FULL=["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
const MON=["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const GC={"5":"bg-green-100 text-green-700","4":"bg-blue-100 text-blue-700","3":"bg-yellow-100 text-yellow-700","2":"bg-red-100 text-red-700"};
const SC=["bg-blue-100 text-blue-800","bg-purple-100 text-purple-800","bg-emerald-100 text-emerald-800","bg-amber-100 text-amber-800","bg-pink-100 text-pink-800","bg-indigo-100 text-indigo-800","bg-orange-100 text-orange-800","bg-teal-100 text-teal-800","bg-red-100 text-red-800","bg-cyan-100 text-cyan-800","bg-lime-100 text-lime-800","bg-rose-100 text-rose-800","bg-violet-100 text-violet-800","bg-sky-100 text-sky-800","bg-green-100 text-green-800"];
const CBG=["bg-blue-500","bg-pink-500","bg-emerald-500","bg-violet-500","bg-orange-500","bg-teal-500"];
const GC2={"5":{bg:"#EAF3DE",tc:"#3B6D11"},"4":{bg:"#E6F1FB",tc:"#185FA5"},"3":{bg:"#FAEEDA",tc:"#854F0B"},"2":{bg:"#FCEBEB",tc:"#A32D2D"}};
const DEF_ORDER=["last","subjs","hw"];
const DEF_COLL=["last","subjs","hw"];

const uid=()=>Math.random().toString(36).slice(2,9);
const toDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
const isMobile=()=>/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const lessonTime=n=>{const m=8*60+(n-1)*60,h=Math.floor(m/60),mm=m%60;return(h<0||h>23)?"":`${String(h).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;};
const LNS=[-2,-1,0,1,2,3,4,5,6,7,8];
const getMonday=d=>{const x=new Date(d),dy=x.getDay();x.setDate(x.getDate()-(dy===0?6:dy-1));x.setHours(0,0,0,0);return x;};
const weekDates=mon=>Array.from({length:6},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d;});
const ds=d=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;};
const sd=s=>new Date(s+"T00:00:00");
const genCode=()=>Math.random().toString(36).slice(2,8).toUpperCase();
const fmtDate=s=>{if(!s)return"";const p=s.split("-");return p.length===3?`${p[2]}.${p[1]}`:s;};
const isKR=t=>t==="test";
const gradeIcon=t=>isKR(t)?"📋":t==="class"?"🙋":"✏️";
const bcAvg=a=>{const n=Math.round(a||0);if(n>=5)return"#1D9E75";if(n>=4)return"#378ADD";if(n>=3)return"#EF9F27";return"#E24B4A";};
const gcl=v=>GC2[v]||{bg:"#f1f5f9",tc:"#64748b"};

const SUBJECTS_BY_GRADE={
  1:["Русский язык","Математика","Литературное чтение","Окружающий мир","Музыка","ИЗО","Физкультура","Технология"],
  2:["Русский язык","Математика","Литературное чтение","Окружающий мир","Музыка","ИЗО","Физкультура","Технология"],
  3:["Русский язык","Математика","Литературное чтение","Окружающий мир","Английский язык","Музыка","ИЗО","Физкультура","Технология"],
  4:["Русский язык","Математика","Литературное чтение","Окружающий мир","Английский язык","Музыка","ИЗО","Физкультура","Технология"],
  5:["Русский язык","Литература","Математика","История","Природоведение","Английский язык","Музыка","ИЗО","Физкультура","Технология","ОБЖ"],
  6:["Русский язык","Литература","Математика","История","География","Биология","Английский язык","Музыка","ИЗО","Физкультура","Технология","ОБЖ"],
  7:["Русский язык","Литература","Алгебра","Геометрия","История","Обществознание","География","Биология","Физика","Английский язык","Физкультура","Технология","ОБЖ","Информатика"],
  8:["Русский язык","Литература","Алгебра","Геометрия","История","Обществознание","География","Биология","Физика","Химия","Английский язык","Физкультура","Технология","ОБЖ","Информатика"],
  9:["Русский язык","Литература","Алгебра","Геометрия","История","Обществознание","География","Биология","Физика","Химия","Английский язык","Физкультура","ОБЖ","Информатика"],
  10:["Русский язык","Литература","Алгебра и начала анализа","Геометрия","История","Обществознание","География","Биология","Физика","Химия","Английский язык","Физкультура","ОБЖ","Информатика","Астрономия"],
  11:["Русский язык","Литература","Алгебра и начала анализа","Геометрия","История","Обществознание","Биология","Физика","Химия","Английский язык","Физкультура","ОБЖ","Информатика","Астрономия"],
};
const gradeSubjects=g=>g?(SUBJECTS_BY_GRADE[Math.min(Math.max(+g,1),11)]||null):null;
const INIT_SUBJS=[
  {id:"s1",name:"Русский язык",c:0},{id:"s2",name:"Литература",c:1},{id:"s3",name:"Алгебра",c:2},
  {id:"s4",name:"Геометрия",c:3},{id:"s5",name:"История",c:4},{id:"s6",name:"Обществознание",c:5},
  {id:"s7",name:"География",c:6},{id:"s8",name:"Биология",c:7},{id:"s9",name:"Физика",c:8},
  {id:"s10",name:"Химия",c:9},{id:"s11",name:"Информатика",c:10},{id:"s12",name:"Английский язык",c:11},
  {id:"s13",name:"Физкультура",c:12},{id:"s14",name:"ОБЖ",c:13},{id:"s15",name:"Технология",c:14},
];
const INIT_DB={children:[],subjects:INIT_SUBJS,weeklyTemplate:[],dateSchedule:[],homework:[],grades:[],clubs:[]};

// ── Компоненты ────────────────────────────────────────────────────────────────
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
);
const GBadge=({v,type=""})=>(
  <span className={`px-2 py-0.5 rounded-lg text-sm font-bold inline-flex items-center gap-1 ${GC[v]||"bg-slate-100 text-slate-600"} ${isKR(type)?"ring-2 ring-current":""}`}>
    <span className="text-xs">{gradeIcon(type)}</span>{v}
  </span>
);
const GPicker=({value,onChange})=>(
  <div className="flex gap-1">
    {["5","4","3","2"].map(g=>(
      <button key={g} onClick={()=>onChange(value===g?null:g)}
        className={`w-8 h-8 rounded-lg text-sm font-bold border-2 transition-all ${value===g?(GC[g]||"")+" border-current ring-1 ring-offset-1 ring-current":"bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400"}`}>{g}</button>
    ))}
  </div>
);

// ── App ───────────────────────────────────────────────────────────────────────
export default function App(){
  const [user,setUser]=useState(undefined);
  const [userRec,setUserRec]=useState(null);
  const [dbData,setDbData]=useState(null);
  const [step,setStep]=useState("loading");
  const [cid,setCid]=useState(null);
  const [tab,setTab]=useState(0);
  const [mon,setMon]=useState(()=>getMonday(new Date()));
  const [aDate,setADate]=useState(toDay);
  const [egid,setEgid]=useState(null);
  const [codeInput,setCodeInput]=useState("");
  const [codeErr,setCodeErr]=useState("");
  const [codeLoading,setCodeLoading]=useState(false);
  const [showCode,setShowCode]=useState(false);
  const [newChild,setNewChild]=useState({name:"",birthYear:"",schoolYear:""});
  const [lF,setLF]=useState({subjectId:"",lessonNum:"1",time:lessonTime(1),repeat:true});
  const [hwF,setHwF]=useState({subjectId:"",lessonId:"",task:"",due:toDay(),hwType:"hw"});
  const [grF,setGrF]=useState({subjectId:"",value:"5",date:toDay(),type:"class"});
  const [clF,setClF]=useState({name:"",day:"Пн",time:"",comment:"",repeat:true});
  const [sjF,setSjF]=useState("");
  const [editC,setEditC]=useState({});
  const [selSubj,setSelSubj]=useState(null);
  const [statsOrder,setStatsOrder]=useState(DEF_ORDER);
  const [statsColl,setStatsColl]=useState(new Set(DEF_COLL));
  const [showAddLesson,setShowAddLesson]=useState(false);
  const [showAddClub0,setShowAddClub0]=useState(false);
  const [showAddHw,setShowAddHw]=useState(false);
  const [showAddGrade,setShowAddGrade]=useState(false);
  const [showAddClub,setShowAddClub]=useState(false);
  const [showAddSubj,setShowAddSubj]=useState(false);
  const [showAddChild,setShowAddChild]=useState(false);
  const [showDanger,setShowDanger]=useState(false);
  const [showFamilyCode,setShowFamilyCode]=useState(false);
  const [showSubjList,setShowSubjList]=useState(true);
  const [highlightClub,setHighlightClub]=useState(null);
  const [editClubId,setEditClubId]=useState(null);
  const [editClubF,setEditClubF]=useState({});
  const [phoneStep,setPhoneStep]=useState("input");
  const [phoneNum,setPhoneNum]=useState("");
  const [phoneCode,setPhoneCode]=useState("");
  const [phoneErr,setPhoneErr]=useState("");
  const [phoneLoading,setPhoneLoading]=useState(false);
  const [confirmResult,setConfirmResult]=useState(null);

  useEffect(()=>{
    getRedirectResult(auth).catch(console.error);
    const unsub=onAuthStateChanged(auth,async u=>{
      setUser(u);
      if(!u){setStep("login");setDbData(null);setUserRec(null);return;}
      setStep("loading");
      try{
        const uDoc=await getDoc(doc(db,"users",u.uid));
        if(uDoc.exists()){
          const rec=uDoc.data();
          setUserRec(rec);
          if(rec.statsPrefs){
            if(rec.statsPrefs.order)setStatsOrder(rec.statsPrefs.order);
            if(rec.statsPrefs.coll)setStatsColl(new Set(rec.statsPrefs.coll));
          }
          const fDoc=await getDoc(doc(db,"families",rec.familyId));
          if(fDoc.exists()){setDbData(fDoc.data());if(rec.childId)setCid(rec.childId);setStep("select");}
          else setStep("setup");
        }else setStep("setup");
      }catch(e){console.error(e);setStep("setup");}
    });
    return unsub;
  },[]);

  const save=async d=>{
    setDbData(d);
    try{await setDoc(doc(db,"families",userRec.familyId),d);}catch(e){console.error(e);}
  };
  const saveStatsPrefs=useCallback(async(order,coll)=>{
    try{await setDoc(doc(db,"users",user.uid),{statsPrefs:{order:[...order],coll:[...coll]}},{merge:true});}catch(e){console.error(e);}
  },[user]);
  const setOrderAndSave=order=>{setStatsOrder(order);saveStatsPrefs(order,statsColl);};
  const setCollAndSave=coll=>{setStatsColl(coll);saveStatsPrefs(statsOrder,coll);};
  const login=()=>isMobile()?signInWithRedirect(auth,provider).catch(console.error):signInWithPopup(auth,provider).catch(console.error);
  const logout=async()=>{await signOut(auth);setStep("login");setCid(null);setUserRec(null);setDbData(null);};

  const createFamily=async()=>{
    setCodeLoading(true);
    try{
      const code=genCode(),familyId=user.uid;
      const initData={...INIT_DB,ownerId:user.uid,familyCode:code,members:[]};
      await setDoc(doc(db,"families",familyId),initData);
      await setDoc(doc(db,"familyCodes",code),{familyId});
      await setDoc(doc(db,"users",user.uid),{familyId,role:"owner"});
      setUserRec({familyId,role:"owner"});setDbData(initData);setStep("select");
    }catch(e){console.error(e);}
    setCodeLoading(false);
  };

  const joinFamily=async()=>{
    const code=codeInput.trim().toUpperCase();
    if(code.length<6){setCodeErr("Введи 6-значный код");return;}
    setCodeLoading(true);setCodeErr("");
    try{
      const cDoc=await getDoc(doc(db,"familyCodes",code));
      if(!cDoc.exists()){setCodeErr("Код не найден");setCodeLoading(false);return;}
      const{familyId}=cDoc.data();
      await updateDoc(doc(db,"families",familyId),{members:arrayUnion(user.uid)});
      await setDoc(doc(db,"users",user.uid),{familyId,role:"member"});
      const fDoc=await getDoc(doc(db,"families",familyId));
      setDbData(fDoc.data());setUserRec({familyId,role:"member"});setStep("select");
    }catch(e){console.error(e);setCodeErr("Ошибка. Попробуй снова");}
    setCodeLoading(false);
  };

  const selectProfile=async ch=>{
    setCid(ch.id);setStep("app");setTab(0);setEgid(null);setSelSubj(null);
    if(userRec?.role==="member"){try{await setDoc(doc(db,"users",user.uid),{...userRec,childId:ch.id},{merge:true});}catch{}}
  };

  const deleteFamily=async()=>{
    if(!window.confirm("Удалить семью и ВСЕ данные? Нельзя отменить."))return;
    if(!window.confirm("Последнее предупреждение. Удалить?"))return;
    try{
      await deleteDoc(doc(db,"families",userRec.familyId));
      await deleteDoc(doc(db,"familyCodes",dbData.familyCode));
      await deleteDoc(doc(db,"users",user.uid));
      setDbData(null);setUserRec(null);setStep("setup");
    }catch(e){console.error(e);alert("Ошибка при удалении.");}
  };

  const sendSms=async()=>{
    const num=phoneNum.trim().replace(/ /g,"");
    if(!num.startsWith("+")){setPhoneErr("Введи номер с кодом страны, например +7...");return;}
    setPhoneLoading(true);setPhoneErr("");
    try{
      if(!window.recaptchaVerifier){
        window.recaptchaVerifier=new RecaptchaVerifier(auth,"recaptcha-container",{size:"invisible"});
      }
      const result=await signInWithPhoneNumber(auth,num,window.recaptchaVerifier);
      setConfirmResult(result);setPhoneStep("code");
    }catch(e){
      console.error(e);setPhoneErr("Ошибка отправки SMS. Проверь номер.");
      if(window.recaptchaVerifier){window.recaptchaVerifier.clear();window.recaptchaVerifier=null;}
    }
    setPhoneLoading(false);
  };

  const confirmSms=async()=>{
    if(phoneCode.length<6)return;
    setPhoneLoading(true);setPhoneErr("");
    try{await confirmResult.confirm(phoneCode);}
    catch(e){setPhoneErr("Неверный код. Попробуй снова.");}
    setPhoneLoading(false);
  };

  if(step==="loading"||user===undefined)return <Loader/>;

  // ── Экраны входа ────────────────────────────────────────────────────────────
  if(step==="login")return(
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-10 max-w-sm w-full text-center">
        <div className="text-6xl mb-4">📚</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Школьный дневник</h1>
        <p className="text-slate-400 text-sm mb-6">Планировщик для всей семьи</p>
        <button onClick={login} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl px-6 py-3 text-sm font-medium hover:bg-slate-50 transition-all shadow-sm mb-3">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Войти через Google
        </button>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-slate-200"/>
          <span className="text-xs text-slate-400">или</span>
          <div className="flex-1 h-px bg-slate-200"/>
        </div>
        {phoneStep==="input"?(
          <div className="space-y-2 text-left">
            <Inp className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="+7 999 123-45-67" value={phoneNum}
              onChange={e=>{setPhoneNum(e.target.value);setPhoneErr("");}}
              onKeyDown={e=>e.key==="Enter"&&sendSms()}/>
            {phoneErr&&<p className="text-red-500 text-xs">{phoneErr}</p>}
            <button onClick={sendSms} disabled={phoneLoading||!phoneNum}
              className="w-full bg-slate-800 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-all">
              {phoneLoading?"Отправляем SMS...":"📞 Войти по номеру телефона"}
            </button>
            <div id="recaptcha-container"/>
          </div>
        ):(
          <div className="space-y-2">
            <p className="text-xs text-slate-500 text-center">Код из SMS на номер {phoneNum}</p>
            <Inp className="w-full border-2 border-slate-200 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] focus:outline-none focus:border-blue-400 text-slate-800 w-full"
              placeholder="123456" maxLength={6} value={phoneCode} autoFocus
              onChange={e=>{setPhoneCode(e.target.value);setPhoneErr("");}}
              onKeyDown={e=>e.key==="Enter"&&confirmSms()}/>
            {phoneErr&&<p className="text-red-500 text-xs text-center">{phoneErr}</p>}
            <button onClick={confirmSms} disabled={phoneLoading||phoneCode.length<6}
              className="w-full bg-slate-800 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-all">
              {phoneLoading?"Проверяем...":"Подтвердить →"}
            </button>
            <button onClick={()=>{setPhoneStep("input");setPhoneCode("");setPhoneErr("");}} className="w-full text-slate-400 text-xs hover:text-slate-600">← Изменить номер</button>
          </div>
        )}
        <p className="text-xs text-slate-300 mt-4">Данные сохраняются в облаке</p>
      </div>
    </div>
  );

  if(step==="setup")return(
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full">
        <div className="text-center mb-6"><div className="text-5xl mb-3">👋</div><h1 className="text-xl font-bold text-slate-800">Добро пожаловать!</h1><p className="text-slate-400 text-sm mt-1">{user.email||user.phoneNumber}</p></div>
        <div className="space-y-3">
          <button onClick={createFamily} disabled={codeLoading} className="w-full bg-blue-500 text-white rounded-xl px-6 py-4 text-sm font-medium hover:bg-blue-600 disabled:opacity-60 transition-all">{codeLoading?"Создаём...":"👨‍👩‍👧‍👦 Я родитель — создать семью"}</button>
          <button onClick={()=>setStep("join")} className="w-full bg-white border-2 border-slate-200 text-slate-700 rounded-xl px-6 py-4 text-sm font-medium hover:bg-slate-50 transition-all">🎒 Я ребёнок — войти по коду</button>
        </div>
        <button onClick={logout} className="w-full text-slate-300 text-xs mt-4 hover:text-slate-400">Выйти</button>
      </div>
    </div>
  );

  if(step==="join")return(
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full">
        <button onClick={()=>setStep("setup")} className="text-slate-400 text-sm mb-4 hover:text-slate-600">← Назад</button>
        <div className="text-center mb-6"><div className="text-5xl mb-3">🔑</div><h1 className="text-xl font-bold text-slate-800">Войти в семью</h1><p className="text-slate-400 text-sm mt-1">Попроси родителя назвать код</p></div>
        <input className={`w-full border-2 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] uppercase focus:outline-none mb-2 ${codeErr?"border-red-400 text-red-500":"border-slate-200 focus:border-blue-400 text-slate-800"}`}
          placeholder="ABC123" maxLength={6} value={codeInput} autoFocus
          onChange={e=>{setCodeInput(e.target.value.toUpperCase());setCodeErr("");}}
          onKeyDown={e=>e.key==="Enter"&&joinFamily()}/>
        {codeErr&&<p className="text-red-500 text-xs text-center mb-3">{codeErr}</p>}
        <button onClick={joinFamily} disabled={codeLoading||codeInput.length<6} className="w-full bg-blue-500 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-blue-600 disabled:opacity-50 mt-2 transition-all">{codeLoading?"Проверяем...":"Войти →"}</button>
        <button onClick={logout} className="w-full text-slate-300 text-xs mt-4 hover:text-slate-400">Выйти</button>
      </div>
    </div>
  );

  if(!dbData)return <Loader text="Загрузка данных семьи..."/>;

  const{children,subjects,weeklyTemplate,dateSchedule,homework,grades,clubs}=dbData;
  const isOwner=userRec?.role==="owner";
  const cbg=idx=>CBG[(idx||0)%CBG.length];
  const subj=id=>subjects.find(s=>s.id===id);
  const sc=s=>s?SC[s.c%SC.length]:"bg-slate-100 text-slate-600";
  const upd=patch=>save({...dbData,...patch});
  const todayStr=toDay();

  if(step==="select")return(
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-700 mb-2">👋 Привет!</h1>
        <p className="text-slate-400">Выбери свой профиль</p>
        <p className="text-xs text-slate-300 mt-1">{user.email||user.phoneNumber}</p>
        {isOwner&&<span className="inline-block mt-2 bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full">👨‍👩‍👧‍👦 Родитель</span>}
      </div>
      {children.length===0
        ?<div className="bg-white rounded-2xl p-8 shadow-sm text-center max-w-xs w-full mb-6"><p className="text-slate-400 text-sm">{isOwner?"Добавьте детей в разделе «Семья».":"Попросите родителя добавить ваш профиль."}</p></div>
        :<div className="grid grid-cols-2 gap-4 max-w-sm w-full mb-6">
          {children.map(ch=>(
            <button key={ch.id} onClick={()=>selectProfile(ch)} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center gap-3 hover:shadow-md active:scale-95 transition-all">
              <div className={`w-16 h-16 rounded-full ${cbg(ch.colorIdx)} flex items-center justify-center text-white text-2xl font-bold shadow-md`}>{ch.name[0].toUpperCase()}</div>
              <span className="text-slate-700 font-semibold text-sm">{ch.name}</span>
              {ch.grade&&<span className="text-xs text-slate-400">{ch.grade} класс</span>}
            </button>
          ))}
        </div>
      }
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        {isOwner&&(<>
          <button onClick={()=>setShowCode(v=>!v)} className="w-full bg-white border border-slate-200 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-slate-50">{showCode?"Скрыть код":"🔑 Показать код для детей"}</button>
          {showCode&&(<div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 text-center"><p className="text-xs text-amber-600 mb-1">Код семьи:</p><p className="text-3xl font-bold tracking-[0.2em] text-amber-800">{dbData.familyCode}</p><p className="text-xs text-amber-500 mt-1">Вводится один раз при первом входе</p></div>)}
          <button onClick={()=>{setStep("app");setTab(6);}} className="w-full bg-amber-100 text-amber-700 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-amber-200">⚙️ Управление семьёй</button>
        </>)}
        <button onClick={logout} className="text-slate-300 text-xs hover:text-slate-400">Выйти из аккаунта</button>
      </div>
    </div>
  );

  // ── Основное приложение ──────────────────────────────────────────────────────
  const chTpl=weeklyTemplate.filter(l=>l.childId===cid);
  const chHw=homework.filter(h=>h.childId===cid);
  const chGr=grades.filter(g=>g.childId===cid);
  const chCl=clubs.filter(c=>c.childId===cid);
  const schSubjIds=[...new Set(chTpl.map(l=>l.subjectId))];
  const schSubjs=subjects.filter(s=>schSubjIds.includes(s.id));
  const activeCh=children.find(c=>c.id===cid);

  const lessonsFor=dateStr=>{
    const d=sd(dateStr),di=(d.getDay()+6)%7;
    if(di>=6)return[];
    return[...chTpl.filter(l=>l.day===DAYS[di]),...(dateSchedule||[]).filter(l=>l.childId===cid&&l.date===dateStr)]
      .sort((a,b)=>(+a.lessonNum||99)-(+b.lessonNum||99));
  };
  const sjGrades=sid=>{
    const fHw=chHw.filter(h=>h.subjectId===sid&&h.grade).map(h=>({id:"hw_"+h.id,hwId:h.id,value:h.grade,date:h.date||"",type:"hw"}));
    return[...fHw,...chGr.filter(g=>g.subjectId===sid)].sort((a,b)=>b.date.localeCompare(a.date));
  };
  const avgGrade=sid=>{
    const gs=sjGrades(sid).map(g=>+g.value).filter(Boolean);
    return gs.length?(gs.reduce((a,b)=>a+b,0)/gs.length).toFixed(1):null;
  };
  const delGrade=g=>{
    if(g.type==="hw")upd({homework:homework.map(h=>h.id===g.hwId?{...h,grade:null}:h)});
    else upd({grades:grades.filter(x=>x.id!==g.id)});
    setEgid(null);
  };
  const chgGrade=(g,v)=>{
    if(!v){delGrade(g);return;}
    if(g.type==="hw")upd({homework:homework.map(h=>h.id===g.hwId?{...h,grade:v}:h)});
    else upd({grades:grades.map(x=>x.id===g.id?{...x,value:v}:x)});
    setEgid(null);
  };

  const GChip=({g})=>{
    const isE=egid===g.id;
    return(
      <div className="relative">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${GC[g.value]||"bg-slate-100"} ${isKR(g.type)?"ring-2 ring-current":""} ${isOwner?"cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-current":"cursor-default"}`}
          onClick={e=>{e.stopPropagation();isOwner&&setEgid(isE?null:g.id);}}>
          <span className="text-xs">{gradeIcon(g.type)}</span>
          <span className="font-bold text-sm">{g.value}</span>
          {g.date&&<span className="opacity-50">{fmtDate(g.date)}</span>}
          {isOwner&&<span className="opacity-40 ml-0.5">✎</span>}
        </div>
        {isE&&isOwner&&(
          <div className="absolute z-20 top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-max">
            <p className="text-xs text-slate-400 mb-2">Изменить оценку</p>
            <GPicker value={g.value} onChange={v=>chgGrade(g,v)}/>
            <div className="mt-2">
              <p className="text-xs text-slate-400 mb-1.5">Дата</p>
              <input type="date" className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                value={g.date||""} onChange={e=>{if(g.type==="hw")return;upd({grades:grades.map(x=>x.id===g.id?{...x,date:e.target.value}:x)});}}/>
            </div>
            {g.type!=="hw"&&(
              <div className="mt-2">
                <p className="text-xs text-slate-400 mb-1.5">Тип</p>
                <div className="flex gap-1">
                  {[["class","🙋 Устно"],["test","📋 КР"],["hw","✏️ Письменно"]].map(([val,lbl])=>(
                    <button key={val} onClick={()=>upd({grades:grades.map(x=>x.id===g.id?{...x,type:val}:x)})}
                      className={"px-2 py-1 rounded-lg text-xs border transition-all "+(g.type===val?"bg-blue-500 text-white border-blue-500":"bg-white text-slate-500 border-slate-200 hover:border-blue-300")}>{lbl}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-2">
              <p className="text-xs text-slate-400 mb-1.5">Комментарий</p>
              <textarea className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none resize-none" rows={2} placeholder="Заметка к оценке..."
                value={editC["gr_"+g.id]??(g.comment||"")} onChange={e=>setEditC(p=>({...p,["gr_"+g.id]:e.target.value}))}/>
              <button onClick={()=>{upd({grades:grades.map(x=>x.id===g.id?{...x,comment:editC["gr_"+g.id]??(g.comment||"")}:x)});setEditC(p=>({...p,["gr_"+g.id]:undefined}));}}
                className="mt-1 w-full text-xs bg-blue-50 text-blue-500 py-1 border border-blue-100 rounded-lg hover:bg-blue-100">Сохранить</button>
            </div>
            <button onClick={()=>delGrade(g)} className="mt-2 w-full text-xs text-red-400 py-1 border border-red-100 rounded-lg hover:bg-red-50">Удалить</button>
          </div>
        )}
      </div>
    );
  };

  const SBadge=({sid})=>{const s=subj(sid);return <span className={`px-2 py-0.5 rounded-lg text-sm font-medium ${sc(s)}`}>{s?.name||"?"}</span>;};
  const hwPending=chHw.filter(h=>!h.done&&h.hwType!=="kr").length;
  const wDates=weekDates(mon);
  const activeDay=DAYS[Math.min((sd(aDate).getDay()+6)%7,5)];
  const w0=wDates[0],w5=wDates[5];
  const wLabel=w0.getMonth()===w5.getMonth()?`${w0.getDate()}–${w5.getDate()} ${MON[w0.getMonth()]} ${w0.getFullYear()}`:`${w0.getDate()} ${MON[w0.getMonth()]} – ${w5.getDate()} ${MON[w5.getMonth()]}`;
  const gSubjs=gradeSubjects(activeCh?.grade);
  const schedSubjNames=[...new Set(chTpl.map(l=>subj(l.subjectId)?.name).filter(Boolean))];
  const availSubjNames=gSubjs?[...new Set([...gSubjs,...schedSubjNames])]:subjects.map(s=>s.name);
  const getOrMakeSubj=name=>{const ex=subjects.find(s=>s.name===name);if(ex)return{subjects,subjectId:ex.id};const ns={id:uid(),name,c:subjects.length%SC.length};return{subjects:[...subjects,ns],subjectId:ns.id};};
  const hwDueDay=(()=>{const d=sd(hwF.due),i=(d.getDay()+6)%7;return i<6?DAYS[i]:null;})();
  const hwDueLessons=hwDueDay?lessonsFor(hwF.due):[];
  const hwSubjIds=hwDueLessons.length?[...new Set(hwDueLessons.map(l=>l.subjectId))]:schSubjIds;
  const activeLessons=lessonsFor(aDate);
  const TABS=isOwner?["📅 Расписание","📝 Задания","⭐ Оценки","📊 Статистика","🏆 Кружки","📚 Предметы","👨‍👩‍👧‍👦 Семья"]:["📅 Расписание","📝 Задания","⭐ Оценки","📊 Статистика","🏆 Кружки"];

  const addChild=()=>{
    if(!newChild.name.trim())return;
    const by=parseInt(newChild.birthYear)||null,sy=parseInt(newChild.schoolYear)||null;
    const grade=(sy&&sy<=new Date().getFullYear())?(new Date().getFullYear()-sy+1):null;
    let ns=[...subjects];
    if(grade)(gradeSubjects(grade)||[]).forEach(name=>{if(!ns.find(s=>s.name===name))ns.push({id:uid(),name,c:ns.length%SC.length});});
    upd({subjects:ns,children:[...children,{id:uid(),name:newChild.name.trim(),colorIdx:children.length%CBG.length,birthYear:by,schoolYear:sy,grade}]});
    setNewChild({name:"",birthYear:"",schoolYear:""});
  };
  const remChild=id=>{
    if(!window.confirm("Удалить профиль и все данные?"))return;
    upd({children:children.filter(c=>c.id!==id),weeklyTemplate:weeklyTemplate.filter(l=>l.childId!==id),dateSchedule:(dateSchedule||[]).filter(l=>l.childId!==id),homework:homework.filter(h=>h.childId!==id),grades:grades.filter(g=>g.childId!==id),clubs:clubs.filter(c=>c.childId!==id)});
    if(cid===id)setCid(null);
  };

  // ── Статистика ───────────────────────────────────────────────────────────────
  const SEC_TITLES={last:"Последние оценки",subjs:"Успеваемость по предметам",hw:"Домашние задания"};
  const renderStatsSec=(id,content)=>{
    if(!content)return null;
    const title=SEC_TITLES[id];
    if(!title)return <div key={id} style={{marginBottom:"12px"}}>{content}</div>;
    const collapsed=statsColl.has(id);
    const movable=statsOrder.filter(x=>SEC_TITLES[x]);
    const midx=movable.indexOf(id);
    const toggle=()=>{const n=new Set(statsColl);n.has(id)?n.delete(id):n.add(id);setCollAndSave(n);};
    const moveUp=()=>{const a=[...statsOrder],i=a.indexOf(id);if(i>0){[a[i-1],a[i]]=[a[i],a[i-1]];setOrderAndSave(a);}};
    const moveDown=()=>{const a=[...statsOrder],i=a.indexOf(id);if(i<a.length-1){[a[i],a[i+1]]=[a[i+1],a[i]];setOrderAndSave(a);}};
    return(
      <div key={id} style={{marginBottom:"12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          <button onClick={toggle} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:collapsed?"14px":"14px 14px 0 0",padding:"10px 14px",cursor:"pointer",textAlign:"left"}}>
            <span style={{fontSize:"13px",fontWeight:"500",color:"#1e293b"}}>{title}</span>
            <span style={{fontSize:"14px",color:"#94a3b8",display:"inline-block",transform:collapsed?"rotate(-90deg)":"rotate(0deg)",transition:"transform 0.15s"}}>⌄</span>
          </button>
          <div style={{display:"flex",flexDirection:"column",gap:"2px"}}>
            <button onClick={moveUp} style={{width:"24px",height:"22px",border:"0.5px solid #e2e8f0",borderRadius:"6px",background:"#fff",cursor:"pointer",fontSize:"12px",color:"#94a3b8",opacity:midx===0?"0.3":"1"}}>↑</button>
            <button onClick={moveDown} style={{width:"24px",height:"22px",border:"0.5px solid #e2e8f0",borderRadius:"6px",background:"#fff",cursor:"pointer",fontSize:"12px",color:"#94a3b8",opacity:midx===movable.length-1?"0.3":"1"}}>↓</button>
          </div>
        </div>
        {!collapsed&&<div style={{background:"#fff",border:"0.5px solid #e2e8f0",borderTop:"none",borderRadius:"0 0 14px 14px",padding:"14px"}}>{content}</div>}
      </div>
    );
  };

  return(
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans" onClick={()=>egid&&setEgid(null)}>
      <div className="max-w-2xl mx-auto p-4" onClick={e=>e.stopPropagation()}>

        <div className="flex items-center gap-2 mb-4">
          <button onClick={()=>{setStep("select");setEgid(null);setSelSubj(null);}} className="text-slate-400 hover:text-slate-600 text-xl w-8">←</button>
          {isOwner
            ?<div className="flex gap-1.5 flex-1 overflow-x-auto pb-0.5">
              {children.map(ch=>(
                <button key={ch.id} onClick={()=>setCid(ch.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${cid===ch.id?cbg(ch.colorIdx)+" text-white shadow":"bg-white text-slate-600 hover:bg-slate-100"}`}>
                  <span className="font-bold">{ch.name[0]}</span><span>{ch.name}</span>
                </button>
              ))}
            </div>
            :<div className="flex items-center gap-2 flex-1">
              {activeCh&&<div className={`w-8 h-8 rounded-full ${cbg(activeCh.colorIdx)} flex items-center justify-center text-white font-bold text-sm`}>{activeCh.name[0]}</div>}
              <span className="font-semibold text-slate-700">{activeCh?.name||"Дневник"}</span>
            </div>
          }
        </div>

        <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)}
              className={`flex-shrink-0 flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${tab===i?"bg-blue-500 text-white shadow":"text-slate-500 hover:bg-slate-100"}`}>
              {t}{i===1&&hwPending>0&&<span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1">{hwPending}</span>}
            </button>
          ))}
        </div>

        {/* TAB 0: РАСПИСАНИЕ */}
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
                const dstr=ds(d),isToday=dstr===todayStr,isActive=dstr===aDate;
                const has=lessonsFor(dstr).length>0;
                const hasKR=chHw.some(h=>h.hwType==="kr"&&h.date===dstr);
                const hasClub=chCl.some(c=>c.day===DAYS[i]);
                return(
                  <button key={i} onClick={()=>setADate(dstr)}
                    className={`flex-shrink-0 flex flex-col items-center w-12 py-2 rounded-xl text-xs font-bold transition-all ${isActive?"bg-blue-500 text-white shadow-md":isToday?"bg-blue-100 text-blue-700 border-2 border-blue-300":"bg-white text-slate-600 hover:bg-slate-100"}`}>
                    <span>{DAYS[i]}</span>
                    <span className={`text-xs font-normal mt-0.5 ${isActive?"text-blue-100":isToday?"text-blue-600":"text-slate-400"}`}>{d.getDate()}</span>
                    <div className="flex gap-0.5 mt-1 justify-center">
                      {has&&<span className={`w-1.5 h-1.5 rounded-full ${isActive?"bg-blue-200":"bg-blue-400"}`}/>}
                      {hasKR&&<span className={`w-1.5 h-1.5 rounded-full ${isActive?"bg-red-300":"bg-red-500"}`}/>}
                      {hasClub&&<span className={`w-1.5 h-1.5 rounded-full ${isActive?"bg-green-300":"bg-green-500"}`}/>}
                    </div>
                  </button>
                );
              })}
            </div>
            <Card cls="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-700">{DAYS_FULL[DAYS.indexOf(activeDay)]}, {sd(aDate).getDate()} {MON[sd(aDate).getMonth()]}</h2>
                {aDate===todayStr&&<span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Сегодня</span>}
              </div>
              {(()=>{
                const krToday=chHw.filter(h=>h.hwType==="kr"&&h.date===aDate);
                if(krToday.length>0)return(
                  <div className="mb-3 space-y-1">
                    {krToday.map(h=>{const s=subj(h.subjectId);return(
                      <div key={h.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border-2 border-red-300 ${h.done?"opacity-40":""}`}>
                        <span className="text-sm">🚨</span>
                        <span className="text-sm font-bold text-red-600">КР сегодня:</span>
                        <span className={`px-2 py-0.5 rounded-lg text-sm font-medium ${sc(s)}`}>{s?.name||"?"}</span>
                        {h.task&&h.task!=="Контрольная работа"&&<span className="text-xs text-slate-500 flex-1 truncate">{h.task}</span>}
                      </div>
                    );})}
                  </div>
                );
                return null;
              })()}
              {(()=>{
                const dayClubs=chCl.filter(c=>c.day===activeDay);
                const items=[
                  ...activeLessons.map(l=>({type:"lesson",key:l.id,sort:l.time?"A"+l.time:"B",data:l})),
                  ...dayClubs.map(c=>({type:"club",key:"c_"+c.id,sort:c.time?"A"+c.time:"C",data:c})),
                ].sort((a,b)=>a.sort.localeCompare(b.sort));
                if(items.length===0)return <p className="text-slate-400 text-sm text-center py-4">Уроков нет</p>;
                return items.map(item=>{
                  if(item.type==="lesson"){
                    const l=item.data,s=subj(l.subjectId),isOnce=!!l.date;
                    const lGr=sjGrades(l.subjectId).slice(0,1);
                    const pendHw=chHw.filter(h=>h.subjectId===l.subjectId&&!h.done);
                    const hasKR=pendHw.some(h=>h.hwType==="kr");
                    return(
                      <div key={l.id} className="mb-2 flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                        {l.lessonNum&&<span className="text-slate-400 text-xs w-5 text-center font-bold">{l.lessonNum}</span>}
                        {l.time&&<span className="text-slate-400 text-xs w-10">{l.time}</span>}
                        <span className={`px-2 py-0.5 rounded-lg text-sm font-medium flex-1 ${sc(s)} cursor-pointer`}
                          onClick={e=>{e.stopPropagation();if(s){setSelSubj(s.id);setTab(3);}}}>
                          {s?.name||"?"}
                        </span>
                        {isOnce&&<span className="text-purple-400 text-xs">📌</span>}
                        {hasKR?<span className="text-red-500 text-xs">🚨</span>:pendHw.length>0?<span className="text-orange-400 text-xs">📝</span>:null}
                        {lGr[0]&&<GBadge v={lGr[0].value} type={lGr[0].type}/>}
                        {isOwner&&<button onClick={()=>isOnce?upd({dateSchedule:(dateSchedule||[]).filter(x=>x.id!==l.id)}):upd({weeklyTemplate:weeklyTemplate.filter(x=>x.id!==l.id)})} className="text-slate-300 hover:text-red-400 text-lg">×</button>}
                      </div>
                    );
                  } else {
                    const c=item.data;
                    return(
                      <div key={item.key} className={`mb-2 flex items-center gap-2 p-2.5 rounded-xl cursor-pointer active:opacity-70 ${c.done?"bg-slate-50 opacity-60":"bg-violet-50"}`}
                        onClick={()=>{setHighlightClub(c.id);setTab(4);}}>
                        <span className="text-xs w-5 text-center">🎯</span>
                        {c.time?<span className="text-slate-400 text-xs w-10">{c.time}</span>:<span className="w-10"/>}
                        <span className="px-2 py-0.5 rounded-lg text-sm font-medium flex-1 bg-violet-100 text-violet-800">{c.name}</span>
                        {c.comment&&<span className="text-slate-400 text-xs" title={c.comment}>💬</span>}
                      </div>
                    );
                  }
                });
              })()}
            </Card>
            {isOwner&&(
              <Card cls="mb-3">
                <CollapseBtn open={showAddLesson} onToggle={()=>setShowAddLesson(v=>!v)} label="Добавить урок"/>
                {showAddLesson&&(
                  <div className="mt-3 space-y-2">
                    {gSubjs&&<p className="text-xs text-blue-500 bg-blue-50 rounded-lg px-3 py-1.5">🎓 Предметы для {activeCh?.grade} класса</p>}
                    <Sel cls="w-full" value={lF.subjectId} onChange={e=>setLF(p=>({...p,subjectId:e.target.value}))}>
                      <option value="">Выберите предмет...</option>
                      {availSubjNames.map(name=>{const s=subjects.find(x=>x.name===name);return <option key={name} value={s?.id||"__new__"+name}>{name}</option>;})}
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
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={lF.repeat} onChange={e=>setLF(p=>({...p,repeat:e.target.checked}))} className="w-4 h-4 accent-blue-500"/>
                      <span className="text-sm text-slate-600">Повторять каждую неделю</span>
                    </label>
                    <Btn onClick={()=>{
                      if(!lF.subjectId)return;
                      let sid=lF.subjectId,ns=subjects;
                      if(lF.subjectId.startsWith("__new__")){const r=getOrMakeSubj(lF.subjectId.replace("__new__",""));ns=r.subjects;sid=r.subjectId;}
                      if(lF.repeat)upd({subjects:ns,weeklyTemplate:[...weeklyTemplate,{id:uid(),childId:cid,subjectId:sid,day:activeDay,lessonNum:+lF.lessonNum,time:lF.time}]});
                      else upd({subjects:ns,dateSchedule:[...(dateSchedule||[]),{id:uid(),childId:cid,date:aDate,subjectId:sid,lessonNum:+lF.lessonNum,time:lF.time}]});
                      setLF({subjectId:"",lessonNum:"1",time:lessonTime(1),repeat:true});
                    }} cls="w-full bg-blue-500 text-white hover:bg-blue-600">+ Добавить</Btn>
                    {!lF.repeat&&<p className="text-xs text-purple-500 bg-purple-50 rounded-lg px-3 py-1.5">📌 Только на {sd(aDate).getDate()} {MON[sd(aDate).getMonth()]}</p>}
                  </div>
                )}
              </Card>
            )}
            {isOwner&&(
              <Card>
                <CollapseBtn open={showAddClub0} onToggle={()=>setShowAddClub0(v=>!v)} label="Добавить кружок"/>
                {showAddClub0&&(
                  <div className="mt-3 space-y-2">
                    <Inp cls="w-full" placeholder="Название" value={clF.name} onChange={e=>setClF(p=>({...p,name:e.target.value}))}/>
                    <textarea className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" rows={2} placeholder="Комментарий (необязательно)"
                      value={clF.comment||""} onChange={e=>setClF(p=>({...p,comment:e.target.value}))}/>
                    <div className="flex gap-2">
                      <Sel cls="flex-1" value={clF.day} onChange={e=>setClF(p=>({...p,day:e.target.value}))}>
                        {DAYS.map(d=><option key={d} value={d}>{DAYS_FULL[DAYS.indexOf(d)]}</option>)}
                      </Sel>
                      <Inp cls="w-20" placeholder="17:00" value={clF.time} onChange={e=>setClF(p=>({...p,time:e.target.value}))}/>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={clF.repeat!==false} onChange={e=>setClF(p=>({...p,repeat:e.target.checked}))} className="w-4 h-4 accent-blue-500"/>
                      <span className="text-sm text-slate-600">Повторять каждую неделю</span>
                    </label>
                    <Btn onClick={()=>{
                      if(!clF.name.trim())return;
                      upd({clubs:[...clubs,{id:uid(),childId:cid,...clF,done:false}]});
                      setClF({name:"",day:activeDay,time:"",comment:"",repeat:true});
                      setShowAddClub0(false);
                    }} cls="w-full bg-blue-500 text-white hover:bg-blue-600">+ Добавить</Btn>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* TAB 1: ЗАДАНИЯ */}
        {tab===1&&(
          <div>
            <div className="space-y-3 mb-4">
              {chHw.length===0?<Empty txt="Заданий нет 🎉"/>
                :[...chHw].sort((a,b)=>(a.date||"").localeCompare(b.date||"")).map(h=>(
                <Card key={h.id} cls={`${h.done?"opacity-70":""} ${h.hwType==="kr"?"border-2 border-red-300":""}`}>
                  <div className="flex items-start gap-3">
                    <button onClick={()=>upd({homework:homework.map(x=>x.id===h.id?{...x,done:!x.done}:x)})}
                      className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${h.done?"bg-green-500 border-green-500 text-white":"border-slate-300 hover:border-green-400"}`}>
                      {h.done&&"✓"}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {h.hwType==="kr"&&<span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">🚨 КР</span>}
                        <SBadge sid={h.subjectId}/>
                        {h.date&&<span className="text-xs text-slate-400">до {fmtDate(h.date)}</span>}
                        {h.grade&&(isOwner?<GChip g={{id:"hw_"+h.id,hwId:h.id,value:h.grade,date:h.date||"",type:"hw"}}/>:<GBadge v={h.grade} type="hw"/>)}
                      </div>
                      <p className={`text-sm text-slate-700 ${h.done?"line-through":""}`}>{h.task}</p>
                      {h.comment&&(<div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"><p className="text-xs text-amber-600 font-medium">💬 Родитель:</p><p className="text-xs text-amber-800 mt-0.5">{h.comment}</p></div>)}
                      {isOwner&&(
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <GPicker value={h.grade} onChange={g=>upd({homework:homework.map(x=>x.id===h.id?{...x,grade:g}:x)})}/>
                            <span className="text-xs text-slate-400">оценка</span>
                          </div>
                          <div className="flex gap-2 items-end">
                            <textarea className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs flex-1 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" placeholder="Комментарий для ребёнка..." rows={2}
                              value={editC[h.id]??h.comment} onChange={e=>setEditC(p=>({...p,[h.id]:e.target.value}))}/>
                            <button onClick={()=>{upd({homework:homework.map(x=>x.id===h.id?{...x,comment:editC[h.id]??h.comment}:x)});setEditC(p=>({...p,[h.id]:undefined}));}}
                              className="bg-amber-400 text-white rounded-lg px-3 py-1.5 text-xs mb-0.5">💾</button>
                          </div>
                        </div>
                      )}
                    </div>
                    {isOwner&&<button onClick={()=>upd({homework:homework.filter(x=>x.id!==h.id)})} className="text-slate-300 hover:text-red-400 text-lg">×</button>}
                  </div>
                </Card>
              ))}
            </div>
            {isOwner&&(
              <Card>
                <CollapseBtn open={showAddHw} onToggle={()=>setShowAddHw(v=>!v)} label="Добавить задание"/>
                {showAddHw&&(
                  <div className="mt-3 space-y-2">
                    <Inp type="date" cls="w-full" value={hwF.due} onChange={e=>setHwF(p=>({...p,due:e.target.value,subjectId:"",lessonId:""}))}/>
                    <div className="flex gap-2">
                      <Sel cls="flex-1" value={hwF.subjectId} onChange={e=>setHwF(p=>({...p,subjectId:e.target.value,lessonId:""}))}>
                        <option value="">Предмет...</option>
                        {schSubjs.filter(s=>hwSubjIds.includes(s.id)).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                      </Sel>
                      <div className="flex gap-1">
                        <button onClick={()=>setHwF(p=>({...p,hwType:"hw"}))}
                          className={`px-3 py-2 rounded-lg text-sm border-2 transition-all ${hwF.hwType!=="kr"?"bg-blue-500 text-white border-blue-500":"bg-white text-slate-500 border-slate-200"}`}>📝</button>
                        <button onClick={()=>setHwF(p=>({...p,hwType:"kr"}))}
                          className={`px-3 py-2 rounded-lg text-sm border-2 transition-all ${hwF.hwType==="kr"?"bg-red-500 text-white border-red-500":"bg-white text-slate-500 border-slate-200"}`}>🚨</button>
                      </div>
                    </div>
                    <Sel cls="w-full" value={hwF.lessonId} onChange={e=>setHwF(p=>({...p,lessonId:e.target.value}))}>
                      <option value="">Привязать к уроку (необязательно)</option>
                      {hwDueLessons.filter(l=>!hwF.subjectId||l.subjectId===hwF.subjectId).map(l=>{
                        const s=subj(l.subjectId),dn=DAYS_FULL[DAYS.indexOf(DAYS[Math.min((sd(hwF.due).getDay()+6)%7,5)])];
                        return <option key={l.id} value={l.id}>{[dn,l.lessonNum&&`${l.lessonNum} урок`,l.time].filter(Boolean).join(", ")} — {s?.name}</option>;
                      })}
                    </Sel>
                    <div className="flex gap-2 items-end">
                      <textarea className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                        placeholder={hwF.hwType==="kr"?"Тема КР (необязательно)":"Что задали?"} rows={2}
                        value={hwF.task} onChange={e=>setHwF(p=>({...p,task:e.target.value}))}/>
                      <Btn onClick={()=>{
                        if(!hwF.subjectId)return;
                        if(hwF.hwType!=="kr"&&!hwF.task.trim())return;
                        const taskText=hwF.task.trim()||(hwF.hwType==="kr"?"Контрольная работа":"");
                        upd({homework:[...homework,{id:uid(),childId:cid,subjectId:hwF.subjectId,date:hwF.due,lessonId:hwF.lessonId,task:taskText,hwType:hwF.hwType||"hw",done:false,grade:null,comment:""}]});
                        setHwF(p=>({...p,lessonId:"",task:"",hwType:"hw"}));
                      }} cls="bg-blue-500 text-white hover:bg-blue-600 mb-0.5">+</Btn>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* TAB 2: ОЦЕНКИ */}
        {tab===2&&(
          <div>
            {isOwner&&<p className="text-xs text-slate-400 mb-3 text-center">Нажмите на оценку для изменения · на предмет — для статистики</p>}
            <div className="space-y-3 mb-4">
              {schSubjs.some(s=>sjGrades(s.id).length>0)
                ?schSubjs.filter(s=>sjGrades(s.id).length>0).map(s=>{
                  const gs=sjGrades(s.id),av=avgGrade(s.id);
                  return(
                    <Card key={s.id} cls="border border-slate-200 cursor-pointer hover:shadow-md transition-all" onClick={()=>{setSelSubj(s.id);setTab(3);}}>
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
            {isOwner&&(
              <Card>
                <CollapseBtn open={showAddGrade} onToggle={()=>setShowAddGrade(v=>!v)} label="Добавить оценку"/>
                {showAddGrade&&(
                  schSubjs.length===0
                    ?<p className="text-xs text-slate-400 text-center py-2 mt-3">Сначала добавьте предметы в расписание</p>
                    :<div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <Sel cls="flex-1" value={grF.subjectId} onChange={e=>setGrF(p=>({...p,subjectId:e.target.value}))}>
                          <option value="">Предмет...</option>
                          {schSubjs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                        </Sel>
                        <Sel cls="w-36" value={grF.type} onChange={e=>setGrF(p=>({...p,type:e.target.value}))}>
                          <option value="class">🙋 Устно</option>
                          <option value="test">📋 КР</option>
                          <option value="hw">✏️ Письменно</option>
                        </Sel>
                      </div>
                      <div className="flex items-center gap-2">
                        <GPicker value={grF.value} onChange={v=>setGrF(p=>({...p,value:v||"5"}))}/>
                        <Inp type="date" cls="flex-1" value={grF.date} onChange={e=>setGrF(p=>({...p,date:e.target.value}))}/>
                        <Btn onClick={()=>{
                          if(!grF.subjectId||!grF.value)return;
                          upd({grades:[...grades,{id:uid(),childId:cid,...grF,comment:"",hwId:null}]});
                          setGrF(p=>({...p,value:"5",date:toDay()}));
                        }} cls="bg-blue-500 text-white hover:bg-blue-600">+</Btn>
                      </div>
                    </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* TAB 3: СТАТИСТИКА */}
        {tab===3&&(()=>{
          if(selSubj){
            const s=subj(selSubj);if(!s)return null;
            const gs=sjGrades(selSubj),av=avgGrade(selSubj);
            const hw=chHw.filter(h=>h.subjectId===selSubj);
            const wDone=hw.filter(h=>h.done).length;
            const sorted=[...gs].sort((a,b)=>(a.date||"").localeCompare(b.date||""));
            const vals=sorted.map(g=>+g.value).filter(Boolean);
            const avg2=vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):null;
            const half=Math.ceil(vals.length/2);
            const fA=vals.slice(0,half).reduce((a,b)=>a+b,0)/Math.max(half,1);
            const sA=vals.length>1?vals.slice(half).reduce((a,b)=>a+b,0)/Math.max(vals.length-half,1):fA;
            const trend=vals.length>=2?(sA>fA+0.2?"↑":sA<fA-0.2?"↓":"→"):null;
            const trendColor=trend==="↑"?"#1D9E75":trend==="↓"?"#E24B4A":"#94a3b8";
            const color=av?bcAvg(parseFloat(av)):"#64748b";
            return(
              <div>
                <button onClick={()=>setSelSubj(null)} className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1 mb-4">← Все предметы</button>
                <div style={{background:color,borderRadius:"18px",padding:"20px",marginBottom:"14px"}}>
                  <p style={{fontSize:"13px",color:"rgba(255,255,255,0.75)",margin:"0 0 4px"}}>{s.name}</p>
                  <p style={{fontSize:"42px",fontWeight:"500",color:"#fff",margin:"0",lineHeight:"1"}}>{av||"—"}</p>
                  <p style={{fontSize:"12px",color:"rgba(255,255,255,0.65)",margin:"6px 0 0"}}>средний балл</p>
                  <div style={{display:"flex",gap:"20px",marginTop:"16px",paddingTop:"14px",borderTop:"1px solid rgba(255,255,255,0.2)"}}>
                    <div><div style={{fontSize:"18px",fontWeight:"500",color:"#fff"}}>{gs.length}</div><div style={{fontSize:"11px",color:"rgba(255,255,255,0.55)"}}>оценок</div></div>
                    <div><div style={{fontSize:"18px",fontWeight:"500",color:"#fff"}}>{hw.length}</div><div style={{fontSize:"11px",color:"rgba(255,255,255,0.55)"}}>заданий</div></div>
                    <div><div style={{fontSize:"18px",fontWeight:"500",color:"#fff"}}>{hw.length>0?Math.round(wDone/hw.length*100)+"%":"—"}</div><div style={{fontSize:"11px",color:"rgba(255,255,255,0.55)"}}>выполнено</div></div>
                  </div>
                </div>
                {sorted.length>0&&(
                  <div style={{background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:"14px",padding:"14px",marginBottom:"14px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
                      <p style={{fontSize:"13px",fontWeight:"500",margin:"0"}}>Оценки</p>
                      {avg2&&<div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                        <span style={{fontSize:"11px",color:"#94a3b8"}}>среднее</span>
                        <span style={{fontSize:"13px",fontWeight:"500",color:(GC2[String(Math.round(parseFloat(avg2)))]||{tc:"#64748b"}).tc}}>{avg2}</span>
                        {trend&&<span style={{fontSize:"13px",color:trendColor}}>{trend}</span>}
                      </div>}
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
                      {sorted.map((g,i)=>{const cl=gcl(g.value);return(
                        <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"1px",padding:"4px 7px",borderRadius:"7px",background:cl.bg,border:isKR(g.type)?"2px solid "+cl.tc:"2px solid transparent"}}>
                          <span style={{fontSize:"9px",lineHeight:"1",marginBottom:"1px"}}>{gradeIcon(g.type)}</span>
                          <span style={{fontSize:"15px",fontWeight:"500",color:cl.tc,lineHeight:"1"}}>{g.value}</span>
                          {g.date&&<span style={{fontSize:"9px",color:cl.tc,opacity:0.6}}>{fmtDate(g.date)}</span>}
                        </div>
                      );})}
                    </div>
                  </div>
                )}
                {gs.length===0&&<div style={{background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:"14px",padding:"14px",marginBottom:"14px"}}><p className="text-sm text-slate-400 text-center py-2">Оценок пока нет</p></div>}
                {hw.length>0&&(
                  <div style={{background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:"14px",padding:"14px"}}>
                    <p style={{fontSize:"13px",fontWeight:"500",margin:"0 0 12px"}}>Домашние задания</p>
                    <div className="space-y-2">
                      {hw.map(h=>(
                        <div key={h.id} className={`flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 ${h.done?"opacity-60":""}`}>
                          <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${h.done?"bg-green-500 border-green-500 text-white":"border-slate-300"}`}>{h.done&&"✓"}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs text-slate-700 ${h.done?"line-through":""}`}>{h.task}</p>
                            {h.date&&<p className="text-xs text-slate-400 mt-0.5">до {fmtDate(h.date)}</p>}
                          </div>
                          {h.grade&&<span className={`${GC[h.grade]||""} px-1.5 py-0.5 rounded-lg text-xs font-bold`}>{h.grade}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          const ss=schSubjs.map(s=>{
            const gs=sjGrades(s.id),v=gs.map(g=>+g.value).filter(Boolean);
            const a=v.length?(v.reduce((x,y)=>x+y,0)/v.length):null;
            const r=v.slice(0,3),o=v.slice(3,6);
            const rA=r.length?r.reduce((x,y)=>x+y,0)/r.length:null;
            const oA=o.length?o.reduce((x,y)=>x+y,0)/o.length:null;
            return{s,a,n:v.length,t:rA&&oA?(rA>oA?"↑":rA<oA?"↓":"→"):"→"};
          }).filter(x=>x.n>0).sort((a,b)=>(b.a||0)-(a.a||0));
          if(!ss.length)return <Empty txt="Оценок пока нет — статистика появится после первых отметок"/>;

          const wS=ds(getMonday(new Date())),wE=ds(wDates[5]);
          const wH=chHw.filter(h=>h.date>=wS&&h.date<=wE);
          const wD=wH.filter(h=>h.done).length,wT=wH.length,wp=wT?Math.round(wD/wT*100):0;
          const aD=chHw.filter(h=>h.done).length,aT=chHw.length,ap=aT?Math.round(aD/aT*100):0;
          const best=ss[0],worst=ss[ss.length-1];
          const oa=(ss.reduce((a,x)=>a+(x.a||0),0)/ss.length).toFixed(1);
          const tg=ss.reduce((a,x)=>a+x.n,0);
          const lg=schSubjs.flatMap(s=>sjGrades(s.id).map(g=>({...g,sn:s.name}))).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,12);

          const SECTIONS={
            last:lg.length>0&&(
              <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                {lg.map((g,i)=>{const cl=gcl(g.value);return(
                  <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px"}}>
                    <div style={{width:"36px",height:"36px",borderRadius:"10px",background:cl.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:isKR(g.type)?"2px solid "+cl.tc:"2px solid transparent",boxSizing:"border-box"}}>
                      <span style={{fontSize:"9px",lineHeight:"1"}}>{gradeIcon(g.type)}</span>
                      <span style={{fontSize:"14px",fontWeight:"500",color:cl.tc,lineHeight:"1.1"}}>{g.value}</span>
                    </div>
                    <div style={{fontSize:"10px",color:"#94a3b8"}}>{g.sn?.split(" ")[0]?.slice(0,4)}</div>
                  </div>
                );})}
              </div>
            ),
            subjs:(
              <div>
                {ss.map(({s,a,t})=>(
                  <div key={s.id} onClick={()=>setSelSubj(s.id)} style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px",cursor:"pointer",padding:"4px",borderRadius:"8px"}}>
                    <span style={{fontSize:"12px",flex:"1",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span>
                    <span style={{fontSize:"12px",color:bcAvg(a),width:"14px",textAlign:"center"}}>{t}</span>
                    <div style={{flex:"1",maxWidth:"90px",background:"#f1f5f9",borderRadius:"99px",height:"5px"}}>
                      <div style={{height:"5px",borderRadius:"99px",background:bcAvg(a),width:((a||0)/5*100)+"%"}}/>
                    </div>
                    <span style={{fontSize:"13px",fontWeight:"500",minWidth:"30px",textAlign:"right",color:bcAvg(a)}}>{a?.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ),
            hw:(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
                  <div style={{background:"#f8fafc",borderRadius:"10px",padding:"10px",textAlign:"center"}}>
                    <div style={{fontSize:"22px",fontWeight:"500"}}>{wT>0?wp+"%":"—"}</div>
                    <div style={{fontSize:"11px",color:"#94a3b8"}}>эта неделя</div>
                    {wT>0&&<div style={{fontSize:"11px",color:"#94a3b8"}}>{wD} из {wT}</div>}
                  </div>
                  <div style={{background:"#f8fafc",borderRadius:"10px",padding:"10px",textAlign:"center"}}>
                    <div style={{fontSize:"22px",fontWeight:"500"}}>{aT>0?ap+"%":"—"}</div>
                    <div style={{fontSize:"11px",color:"#94a3b8"}}>всего</div>
                    {aT>0&&<div style={{fontSize:"11px",color:"#94a3b8"}}>{aD} из {aT}</div>}
                  </div>
                </div>
                {wT>0&&<div style={{background:"#f1f5f9",borderRadius:"99px",height:"7px"}}><div style={{height:"7px",borderRadius:"99px",background:"#1D9E75",width:wp+"%"}}/></div>}
              </div>
            ),
          };

          return(
            <div>
              <div style={{background:"#185FA5",borderRadius:"18px",padding:"20px",marginBottom:"12px"}}>
                <p style={{fontSize:"11px",color:"rgba(255,255,255,0.6)",margin:"0 0 4px",letterSpacing:"0.5px"}}>СРЕДНИЙ БАЛЛ</p>
                <p style={{fontSize:"42px",fontWeight:"500",color:"#fff",margin:"0",lineHeight:"1"}}>{oa||"—"}</p>
                <p style={{fontSize:"12px",color:"rgba(255,255,255,0.65)",margin:"6px 0 0"}}>по всем предметам</p>
                <div style={{display:"flex",gap:"20px",marginTop:"16px",paddingTop:"14px",borderTop:"1px solid rgba(255,255,255,0.15)"}}>
                  <div><div style={{fontSize:"18px",fontWeight:"500",color:"#fff"}}>{tg}</div><div style={{fontSize:"11px",color:"rgba(255,255,255,0.55)"}}>оценок</div></div>
                  <div><div style={{fontSize:"18px",fontWeight:"500",color:"#fff"}}>{ap}%</div><div style={{fontSize:"11px",color:"rgba(255,255,255,0.55)"}}>ДЗ выполнено</div></div>
                  <div><div style={{fontSize:"18px",fontWeight:"500",color:"#fff"}}>{ss.length}</div><div style={{fontSize:"11px",color:"rgba(255,255,255,0.55)"}}>предметов</div></div>
                </div>
              </div>
              {ss.length>1&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}}>
                  <div style={{background:"#fff",border:"0.5px solid #e2e8f0",borderLeft:"3px solid #1D9E75",borderRadius:"0 14px 14px 0",padding:"14px"}}>
                    <p style={{fontSize:"11px",color:"#94a3b8",margin:"0 0 5px"}}>Лучший предмет</p>
                    <p style={{fontSize:"13px",fontWeight:"500",margin:"0 0 5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{best.s.name}</p>
                    <p style={{fontSize:"26px",fontWeight:"500",color:"#1D9E75",margin:"0"}}>{best.a?.toFixed(1)}</p>
                  </div>
                  <div style={{background:"#fff",border:"0.5px solid #e2e8f0",borderLeft:"3px solid #E24B4A",borderRadius:"0 14px 14px 0",padding:"14px"}}>
                    <p style={{fontSize:"11px",color:"#94a3b8",margin:"0 0 5px"}}>Подтянуть</p>
                    <p style={{fontSize:"13px",fontWeight:"500",margin:"0 0 5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{worst.s.name}</p>
                    <p style={{fontSize:"26px",fontWeight:"500",color:"#E24B4A",margin:"0"}}>{worst.a?.toFixed(1)}</p>
                  </div>
                </div>
              )}
              {statsOrder.map(id=>renderStatsSec(id,SECTIONS[id]))}
            </div>
          );
        })()}

        {/* TAB 4: КРУЖКИ */}
        {tab===4&&(
          <div>
            <div className="space-y-3 mb-4">
              {chCl.length===0?<Empty txt="Кружки не добавлены"/>
                :chCl.map(c=>(
                <Card key={c.id} cls={`${c.done&&editClubId!==c.id?"opacity-70":""} ${highlightClub===c.id?"ring-2 ring-violet-400 ring-offset-1":""}`} onClick={()=>setHighlightClub(null)}>
                  {editClubId===c.id?(
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 font-medium mb-2">Редактировать кружок</p>
                      <Inp cls="w-full" placeholder="Название" value={editClubF.name??c.name} onChange={e=>setEditClubF(p=>({...p,name:e.target.value}))}/>
                      <div className="flex gap-2">
                        <Sel cls="flex-1" value={editClubF.day??c.day} onChange={e=>setEditClubF(p=>({...p,day:e.target.value}))}>
                          {DAYS.map(d=><option key={d} value={d}>{DAYS_FULL[DAYS.indexOf(d)]}</option>)}
                        </Sel>
                        <Inp cls="w-20" placeholder="17:00" value={editClubF.time??c.time??""} onChange={e=>setEditClubF(p=>({...p,time:e.target.value}))}/>
                      </div>
                      <textarea className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" rows={2} placeholder="Комментарий..."
                        value={editClubF.comment??c.comment??""} onChange={e=>setEditClubF(p=>({...p,comment:e.target.value}))}/>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editClubF.repeat!=null?editClubF.repeat:c.repeat!==false} onChange={e=>setEditClubF(p=>({...p,repeat:e.target.checked}))} className="w-4 h-4 accent-blue-500"/>
                        <span className="text-sm text-slate-600">Повторять каждую неделю</span>
                      </label>
                      <div className="flex gap-2">
                        <Btn onClick={()=>{
                          upd({clubs:clubs.map(x=>x.id===c.id?{...x,name:editClubF.name??c.name,day:editClubF.day??c.day,time:editClubF.time??c.time??"",comment:editClubF.comment??c.comment??"",repeat:editClubF.repeat!=null?editClubF.repeat:c.repeat!==false}:x)});
                          setEditClubId(null);setEditClubF({});
                        }} cls="flex-1 bg-blue-500 text-white hover:bg-blue-600">Сохранить</Btn>
                        <Btn onClick={()=>{setEditClubId(null);setEditClubF({});}} cls="bg-slate-100 text-slate-600 hover:bg-slate-200">Отмена</Btn>
                      </div>
                    </div>
                  ):(
                    <div className="flex items-center gap-3">
                      <button onClick={()=>upd({clubs:clubs.map(x=>x.id===c.id?{...x,done:!x.done}:x)})}
                        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${c.done?"bg-green-500 border-green-500 text-white":"border-slate-300"}`}>{c.done&&"✓"}</button>
                      <div className="flex-1">
                        <p className={`text-sm font-medium text-slate-700 ${c.done?"line-through":""}`}>{c.name}</p>
                        <p className="text-xs text-slate-400">{DAYS_FULL[DAYS.indexOf(c.day)]}{c.time?`, ${c.time}`:""}</p>
                        {c.comment&&<div className="mt-1 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1"><p className="text-xs text-amber-800">💬 {c.comment}</p></div>}
                      </div>
                      {isOwner&&<button onClick={()=>{setEditClubId(c.id);setEditClubF({});}} className="text-slate-300 hover:text-blue-400 text-sm px-1">✎</button>}
                      {isOwner&&<button onClick={()=>upd({clubs:clubs.filter(x=>x.id!==c.id)})} className="text-slate-300 hover:text-red-400 text-lg">×</button>}
                    </div>
                  )}
                </Card>
              ))}
            </div>
            {isOwner&&(
              <Card>
                <CollapseBtn open={showAddClub} onToggle={()=>setShowAddClub(v=>!v)} label="Добавить кружок"/>
                {showAddClub&&(
                  <div className="mt-3 space-y-2">
                    <Inp cls="w-full" placeholder="Название" value={clF.name} onChange={e=>setClF(p=>({...p,name:e.target.value}))}/>
                    <textarea className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" rows={2} placeholder="Комментарий (необязательно)"
                      value={clF.comment||""} onChange={e=>setClF(p=>({...p,comment:e.target.value}))}/>
                    <div className="flex gap-2">
                      <Sel cls="flex-1" value={clF.day} onChange={e=>setClF(p=>({...p,day:e.target.value}))}>
                        {DAYS.map(d=><option key={d} value={d}>{DAYS_FULL[DAYS.indexOf(d)]}</option>)}
                      </Sel>
                      <Inp cls="w-20" placeholder="17:00" value={clF.time} onChange={e=>setClF(p=>({...p,time:e.target.value}))}/>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={clF.repeat!==false} onChange={e=>setClF(p=>({...p,repeat:e.target.checked}))} className="w-4 h-4 accent-blue-500"/>
                      <span className="text-sm text-slate-600">Повторять каждую неделю</span>
                    </label>
                    <Btn onClick={()=>{
                      if(!clF.name.trim())return;
                      upd({clubs:[...clubs,{id:uid(),childId:cid,...clF,done:false,comment:clF.comment||""}]});
                      setClF({name:"",day:"Пн",time:"",comment:"",repeat:true});
                    }} cls="w-full bg-blue-500 text-white hover:bg-blue-600">+ Добавить</Btn>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* TAB 5: ПРЕДМЕТЫ */}
        {tab===5&&isOwner&&(
          <div>
            <Card cls="mb-4">
              <CollapseBtn open={showSubjList} onToggle={()=>setShowSubjList(v=>!v)} label={`Предметы ${activeCh?.name||""}${activeCh?.grade?` · ${activeCh.grade} класс`:""}`}/>
              {showSubjList&&(()=>{
                const gradeSubjNames=gradeSubjects(activeCh?.grade)||[];
                const allSubjNames=[...new Set([...gradeSubjNames,...schSubjs.map(s=>s.name),...subjects.map(s=>s.name)])];
                const allSubjs=allSubjNames.map(name=>subjects.find(s=>s.name===name)).filter(Boolean);
                if(allSubjs.length===0)return <p className="text-slate-400 text-sm text-center py-4 mt-3">Нет предметов — добавьте уроки в расписание</p>;
                return(
                  <div className="mt-3 space-y-2">
                    {allSubjs.map(s=>{
                      const av=avgGrade(s.id);
                      const inSched=schSubjIds.includes(s.id);
                      return(
                        <div key={s.id} onClick={()=>{setSelSubj(s.id);setTab(3);}} className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 cursor-pointer active:bg-slate-100">
                          <span className={`px-2 py-0.5 rounded-lg text-sm font-medium flex-1 ${sc(s)}`}>{s.name}</span>
                          {inSched?<span className="text-xs text-slate-400">{chTpl.filter(l=>l.subjectId===s.id).length} ур/нед</span>:<span className="text-xs text-slate-300">нет в расп.</span>}
                          <span className="text-xs text-slate-400">{chHw.filter(h=>h.subjectId===s.id).length} дз</span>
                          {av&&<span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${GC[Math.round(parseFloat(av))]||""}`}>Ср {av}</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </Card>
            <Card>
              <CollapseBtn open={showAddSubj} onToggle={()=>setShowAddSubj(v=>!v)} label="Добавить предмет в каталог"/>
              {showAddSubj&&(
                <div className="mt-3 flex gap-2">
                  <Inp cls="flex-1" placeholder="Название предмета" value={sjF} onChange={e=>setSjF(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&sjF.trim()){upd({subjects:[...subjects,{id:uid(),name:sjF.trim(),c:subjects.length%SC.length}]});setSjF("");}}}/>
                  <Btn onClick={()=>{if(!sjF.trim())return;upd({subjects:[...subjects,{id:uid(),name:sjF.trim(),c:subjects.length%SC.length}]});setSjF("");}} cls="bg-blue-500 text-white hover:bg-blue-600">+</Btn>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 6: СЕМЬЯ */}
        {tab===6&&isOwner&&(
          <div>
            <Card cls="mb-4 bg-amber-50 border border-amber-100">
              <CollapseBtn open={showFamilyCode} onToggle={()=>setShowFamilyCode(v=>!v)} label="🔑 Код семьи"/>
              {showFamilyCode&&(
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-3xl font-bold tracking-[0.2em] text-amber-800">{dbData.familyCode}</p>
                    <div className="text-right"><p className="text-xs text-amber-600">Дай этот код ребёнку</p><p className="text-xs text-amber-500">при первом входе</p></div>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <button onClick={()=>{
                      navigator.clipboard.writeText(dbData.familyCode)
                        .then(()=>alert("Код скопирован: "+dbData.familyCode))
                        .catch(()=>alert(dbData.familyCode));
                    }} className="flex-1 text-xs text-amber-600 border border-amber-200 rounded-lg py-2 hover:bg-amber-100 transition-all">
                      📋 Скопировать код
                    </button>
                    <button onClick={()=>{
                      const text=`Код для входа в школьный дневник: ${dbData.familyCode}`;
                      if(navigator.share)navigator.share({title:"Код семьи",text});
                      else{navigator.clipboard.writeText(dbData.familyCode);alert("Скопировано: "+dbData.familyCode);}
                    }} className="flex-1 text-xs text-amber-600 border border-amber-200 rounded-lg py-2 hover:bg-amber-100 transition-all">
                      📤 Поделиться
                    </button>
                  </div>
                  <button onClick={async()=>{
                    if(!window.confirm("Сгенерировать новый код? Старый перестанет работать для новых входов."))return;
                    const newCode=genCode();
                    const newData={...dbData,familyCode:newCode};
                    save(newData);
                    try{
                      await deleteDoc(doc(db,"familyCodes",dbData.familyCode));
                      await setDoc(doc(db,"familyCodes",newCode),{familyId:userRec.familyId});
                    }catch(e){console.error(e);}
                  }} className="w-full text-xs text-amber-600 border border-amber-200 rounded-lg py-2 hover:bg-amber-100 transition-all">
                    🔄 Сгенерировать новый код
                  </button>
                </div>
              )}
            </Card>

            <div className="mb-4 border-2 border-blue-200 rounded-2xl p-2 bg-blue-50/40">
              <p className="text-xs text-blue-400 font-medium px-2 pt-1 pb-2">Дети</p>
              <div className="space-y-2">
                {children.length===0?<Empty txt="Детей нет — добавьте первого"/>
                  :children.map(ch=>(
                  <Card key={ch.id}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full ${cbg(ch.colorIdx)} flex items-center justify-center text-white text-xl font-bold`}>{ch.name[0].toUpperCase()}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-700">{ch.name}</p>
                        <p className="text-xs text-slate-500">{ch.birthYear&&`${ch.birthYear} г.р.`}{ch.birthYear&&ch.grade?" · ":""}{ch.grade&&`${ch.grade} класс`}</p>
                        <p className="text-xs text-slate-400">{weeklyTemplate.filter(l=>l.childId===ch.id).length} ур/нед · {homework.filter(h=>h.childId===ch.id).length} заданий</p>
                      </div>
                      <button onClick={()=>remChild(ch.id)} className="text-slate-300 hover:text-red-400 text-lg">×</button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Card cls="mb-4">
              <CollapseBtn open={showAddChild} onToggle={()=>setShowAddChild(v=>!v)} label="Добавить ребёнка"/>
              {showAddChild&&(
                <div className="mt-3 space-y-2">
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
              )}
            </Card>

            <Card cls="border border-red-100">
              <CollapseBtn open={showDanger} onToggle={()=>setShowDanger(v=>!v)} label="⚠️ Опасная зона"/>
              {showDanger&&(
                <div className="mt-3">
                  <p className="text-xs text-slate-400 mb-3">Удаление семьи сотрёт все данные безвозвратно.</p>
                  <button onClick={deleteFamily} className="w-full bg-red-50 text-red-500 border border-red-200 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-red-100 transition-all">
                    🗑 Удалить семью и все данные
                  </button>
                </div>
              )}
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
