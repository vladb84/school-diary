import { useState, useEffect, useCallback, useMemo } from "react";
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, deleteDoc, writeBatch } from "firebase/firestore";
import { auth, provider, db } from "./firebase";
import ScheduleTab from "./tabs/ScheduleTab";
import HomeworkTab from "./tabs/HomeworkTab";
import GradesTab from "./tabs/GradesTab";
import { maskTime } from "./utils";
import { SCHEDULE_BY_GRADE } from "./scheduleData";

const DAYS=["Пн","Вт","Ср","Чт","Пт","Сб"];
const DAYS_FULL=["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
const MON=["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const GC={"5":"bg-green-100 text-green-700","4":"bg-blue-100 text-blue-700","3":"bg-yellow-100 text-yellow-700","2":"bg-red-100 text-red-700"};
const SC=["bg-blue-100 text-blue-800","bg-purple-100 text-purple-800","bg-emerald-100 text-emerald-800","bg-amber-100 text-amber-800","bg-pink-100 text-pink-800","bg-indigo-100 text-indigo-800","bg-orange-100 text-orange-800","bg-teal-100 text-teal-800","bg-red-100 text-red-800","bg-cyan-100 text-cyan-800","bg-lime-100 text-lime-800","bg-rose-100 text-rose-800","bg-violet-100 text-violet-800","bg-sky-100 text-sky-800","bg-green-100 text-green-800"];
const CBG=["bg-blue-500","bg-pink-500","bg-emerald-500","bg-violet-500","bg-orange-500","bg-teal-500"];
const GC2={"5":{bg:"#EAF3DE",tc:"#3B6D11"},"4":{bg:"#E6F1FB",tc:"#185FA5"},"3":{bg:"#FAEEDA",tc:"#854F0B"},"2":{bg:"#FCEBEB",tc:"#A32D2D"}};
const DEF_ORDER=["last","subjs","hw"];
const DEF_COLL=["last","subjs","hw"];

const uid=()=>crypto.randomUUID();
const toDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
const isMobile=()=>/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const LESSON_TIMES=["","08:00","08:50","09:40","10:35","11:35","12:25","13:15"];
const lessonTime=n=>LESSON_TIMES[n]||"";
const LNS=[-2,-1,0,1,2,3,4,5,6,7,8];
const getMonday=d=>{const x=new Date(d),dy=x.getDay();x.setDate(x.getDate()-(dy===0?6:dy-1));x.setHours(0,0,0,0);return x;};
const weekDates=mon=>Array.from({length:6},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d;});
const ds=d=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;};
const sd=s=>new Date(s+"T00:00:00");
const genCode=()=>Math.random().toString(36).slice(2,8).toUpperCase();
// Учебный год начинается в сентябре (месяц 8 в 0-индексации)
const curSchoolYear=()=>{const n=new Date();return n.getMonth()>=8?n.getFullYear():n.getFullYear()-1;};
const gradeFromSchoolYear=sy=>{const s=parseInt(sy);if(!s||isNaN(s))return null;const g=curSchoolYear()-s+2;return(g>=1&&g<=11)?g:null;};
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

const GChip=({g,isOwner,expandedGradeId,setExpandedGradeId,chgGrade,delGrade,editC,setEditC,upd,grades})=>{
  const isE=expandedGradeId===g.id;
  return(
    <div className="relative">
      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${GC[g.value]||"bg-slate-100"} ${isKR(g.type)?"ring-2 ring-current":""} ${isOwner?"cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-current":"cursor-default"}`}
        onClick={e=>{e.stopPropagation();isOwner&&setExpandedGradeId(isE?null:g.id);}}>
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
          <button onClick={e=>{e.stopPropagation();delGrade(g);}} className="mt-2 w-full text-xs text-red-400 py-1 border border-red-100 rounded-lg hover:bg-red-50">Удалить</button>
        </div>
      )}
    </div>
  );
};

const SBadge=({sid,subj,sc})=>{const s=subj(sid);return <span className={`px-2 py-0.5 rounded-lg text-sm font-medium ${sc(s)}`}>{s?.name||"?"}</span>;};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App(){
  const [user,setUser]=useState(undefined);
  const [userRec,setUserRec]=useState(null);
  const [dbData,setDbData]=useState(null);
  const [step,setStep]=useState("loading");
  const [childId,setChildId]=useState(null);
  const [tab,setTab]=useState(0);
  const [expandedGradeId,setExpandedGradeId]=useState(null);
  const [codeInput,setCodeInput]=useState("");
  const [codeErr,setCodeErr]=useState("");
  const [codeLoading,setCodeLoading]=useState(false);
  const [showCode,setShowCode]=useState(false);
  const [newChild,setNewChild]=useState({name:"",birthYear:"",schoolYear:""});
  const [clubForm,setClubForm]=useState({name:"",day:"Пн",time:"",comment:"",repeat:true});
  const [newSubjectName,setNewSubjectName]=useState("");
  const [editC,setEditC]=useState({});
  const [selSubj,setSelSubj]=useState(null);
  const [statsOrder,setStatsOrder]=useState(DEF_ORDER);
  const [statsColl,setStatsColl]=useState(new Set(DEF_COLL));
  const [showAddClub,setShowAddClub]=useState(false);
  const [showAddSubj,setShowAddSubj]=useState(false);
  const [showAddChild,setShowAddChild]=useState(false);
  const [editChildId,setEditChildId]=useState(null);
  const [editChildF,setEditChildF]=useState({});
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
  const [showDeleteFamilyConfirm,setShowDeleteFamilyConfirm]=useState(false);
  const [showRemoveChild,setShowRemoveChild]=useState(false);
  const [pendingRemoveId,setPendingRemoveId]=useState(null);
  const [previewChild,setPreviewChild]=useState(false);
  const [saveError,setSaveError]=useState(false);

  useEffect(()=>{
    getRedirectResult(auth).then(result=>{
      if(result?.user)console.info("redirect sign-in:",result.user.uid);
    }).catch(console.error);
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
          if(fDoc.exists()){setDbData(fDoc.data());if(rec.childId)setChildId(rec.childId);setStep("select");}
          else setStep("setup");
        }else setStep("setup");
      }catch(e){console.error(e);setStep("setup");}
    });
    return ()=>{
      unsub();
      if(window.recaptchaVerifier){
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier=null;
      }
    };
  },[]);

  const save=useCallback(async patch=>{
    setDbData(prev=>({...prev,...patch}));
    try{await updateDoc(doc(db,"families",userRec.familyId),patch);setSaveError(false);}
    catch(e){console.error(e);setSaveError(true);}
  },[userRec]);

  const saveStatsPrefs=useCallback(async(order,coll)=>{
    try{await setDoc(doc(db,"users",user.uid),{statsPrefs:{order:[...order],coll:[...coll]}},{merge:true});}catch(e){console.error(e);}
  },[user]);
  const setOrderAndSave=order=>{setStatsOrder(order);saveStatsPrefs(order,statsColl);};
  const setCollAndSave=coll=>{setStatsColl(coll);saveStatsPrefs(statsOrder,coll);};

  const login=useCallback(()=>signInWithPopup(auth,provider).catch(console.error),[]);

  const logout=useCallback(async()=>{
    await signOut(auth);
    setStep("login");
    setChildId(null);
    setUserRec(null);
    setDbData(null);
  },[]);

  // ── Данные ребёнка (вычисляются до ранних return, чтобы useMemo был без условий) ──
  const chTpl=((dbData||{}).weeklyTemplate||[]).filter(l=>l.childId===childId);
  const chHw=((dbData||{}).homework||[]).filter(h=>h.childId===childId);
  const chGr=((dbData||{}).grades||[]).filter(g=>g.childId===childId);

  const lessonsFor=useMemo(()=>{
    const cache={};
    return dateStr=>{
      if(cache[dateStr])return cache[dateStr];
      const d=sd(dateStr),di=(d.getDay()+6)%7;
      if(di>=6){cache[dateStr]=[];return[];}
      const dateEntries=((dbData?.dateSchedule)||[])
        .filter(l=>l.childId===childId&&l.date===dateStr);
      const cancelledSlots=new Set(
        dateEntries.filter(l=>l.cancelsSlot!=null).map(l=>l.cancelsSlot)
      );
      const tplLessons=chTpl
        .filter(l=>l.day===DAYS[di])
        .map(l=>{
          if(cancelledSlots.has(l.lessonNum)){
            const entry=dateEntries.find(e=>e.cancelsSlot===l.lessonNum);
            // 'cancel' → struck-through; 'move' → show source slot as "moved away"; 'replace' → drop (substitution row handles it)
            if(entry?.type==='cancel')return{...l,_cancelled:true};
            if(entry?.type==='move')return{...l,_movedAway:true,_moveEntry:entry};
            return null;
          }
          return l;
        })
        .filter(Boolean);
      const addedEntries=dateEntries.filter(l=>l.subjectId&&l.type!=='cancel');
      const result=[...tplLessons,...addedEntries]
        .sort((a,b)=>(+a.lessonNum||99)-(+b.lessonNum||99));
      cache[dateStr]=result;
      return result;
    };
  },[dbData?.weeklyTemplate,dbData?.dateSchedule,childId]);

  const sjGrades=useMemo(()=>{
    const cache={};
    return sid=>{
      if(cache[sid])return cache[sid];
      const fHw=chHw.filter(h=>h.subjectId===sid&&h.grade)
        .map(h=>({id:"hw_"+h.id,hwId:h.id,value:h.grade,date:h.date||"",type:"hw"}));
      cache[sid]=[...fHw,...chGr.filter(g=>g.subjectId===sid)]
        .sort((a,b)=>b.date.localeCompare(a.date));
      return cache[sid];
    };
  },[chHw,chGr]);

  const createFamily=async()=>{
    setCodeLoading(true);
    try{
      const code=genCode(),familyId=user.uid;
      const initData={...INIT_DB,ownerId:user.uid,familyCode:code,members:[]};
      const batch=writeBatch(db);
      batch.set(doc(db,"families",familyId),initData);
      batch.set(doc(db,"familyCodes",code),{familyId});
      batch.set(doc(db,"users",user.uid),{familyId,role:"owner"});
      await batch.commit();
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
      if(familyId===userRec?.familyId){setCodeErr("Это ваша собственная семья");setCodeLoading(false);return;}
      await updateDoc(doc(db,"families",familyId),{members:arrayUnion(user.uid)});
      await setDoc(doc(db,"users",user.uid),{familyId,role:"member"});
      const fDoc=await getDoc(doc(db,"families",familyId));
      setDbData(fDoc.data());setUserRec({familyId,role:"member"});setStep("select");
    }catch(e){console.error(e);setCodeErr("Ошибка. Попробуй снова");}
    setCodeLoading(false);
  };

  const selectProfile=async ch=>{
    setChildId(ch.id);setStep("app");setTab(0);setExpandedGradeId(null);setSelSubj(null);
    if(userRec?.role==="member"){try{await setDoc(doc(db,"users",user.uid),{...userRec,childId:ch.id},{merge:true});}catch{}}
  };

  const deleteFamily=async()=>{
    try{
      const batch=writeBatch(db);
      batch.delete(doc(db,"families",userRec.familyId));
      batch.delete(doc(db,"familyCodes",dbData.familyCode));
      batch.delete(doc(db,"users",user.uid));
      for(const memberId of (dbData.members||[])){
        batch.delete(doc(db,"users",memberId));
      }
      await batch.commit();
      setDbData(null);setUserRec(null);setStep("setup");
      setShowDeleteFamilyConfirm(false);
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
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier=null;
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
  const realOwner=userRec?.role==="owner";
  const isOwner=realOwner&&!previewChild;
  const cbg=idx=>CBG[(idx||0)%CBG.length];
  const subj=id=>subjects.find(s=>s.id===id);
  const sc=s=>s?SC[s.c%SC.length]:"bg-slate-100 text-slate-600";
  const upd=patch=>save(patch);
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
              <div className={`w-16 h-16 rounded-full ${cbg(ch.colorIdx)} flex items-center justify-center text-white text-2xl font-bold shadow-md`}>{(ch.name?.[0]??"?").toUpperCase()}</div>
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
  const chCl=clubs.filter(c=>c.childId===childId);
  const schSubjIds=[...new Set(chTpl.map(l=>l.subjectId))];
  const schSubjs=subjects.filter(s=>schSubjIds.includes(s.id));
  const activeCh=children.find(c=>c.id===childId);

  const avgGrade=sid=>{
    const gs=sjGrades(sid).map(g=>+g.value).filter(Boolean);
    return gs.length?(gs.reduce((a,b)=>a+b,0)/gs.length).toFixed(1):null;
  };
  const delGrade=g=>{
    if(g.type==="hw")upd({homework:homework.map(h=>h.id===g.hwId?{...h,grade:null}:h)});
    else upd({grades:grades.filter(x=>x.id!==g.id)});
    setExpandedGradeId(null);
  };
  const chgGrade=(g,v)=>{
    if(!v){delGrade(g);return;}
    if(g.type==="hw")upd({homework:homework.map(h=>h.id===g.hwId?{...h,grade:v}:h)});
    else upd({grades:grades.map(x=>x.id===g.id?{...x,value:v}:x)});
    setExpandedGradeId(null);
  };

  const hwPending=chHw.filter(h=>!h.done&&h.hwType!=="kr").length;
  const gSubjs=gradeSubjects(activeCh?.grade);
  const schedSubjNames=[...new Set(chTpl.map(l=>subj(l.subjectId)?.name).filter(Boolean))];
  const availSubjNames=gSubjs?[...new Set([...gSubjs,...schedSubjNames])]:subjects.map(s=>s.name);
  const resolveOrCreateSubject=name=>{const ex=subjects.find(s=>s.name===name);if(ex)return{subjects,subjectId:ex.id};const ns={id:uid(),name,c:subjects.length%SC.length};return{subjects:[...subjects,ns],subjectId:ns.id};};
  const TABS=isOwner?["📅 Расписание","📝 Задания","⭐ Оценки","📊 Статистика","🏆 Кружки","📚 Предметы","👨‍👩‍👧‍👦 Семья"]:["📅 Расписание","📝 Задания","⭐ Оценки","📊 Статистика","🏆 Кружки"];

  const addChild=()=>{
    if(!newChild.name.trim())return;
    const by=parseInt(newChild.birthYear)||null,sy=parseInt(newChild.schoolYear)||null;
    const grade=gradeFromSchoolYear(sy);
    let ns=[...subjects];
    if(grade)(gradeSubjects(grade)||[]).forEach(name=>{if(!ns.find(s=>s.name===name))ns.push({id:uid(),name,c:ns.length%SC.length});});
    upd({subjects:ns,children:[...children,{id:uid(),name:newChild.name.trim(),colorIdx:children.length%CBG.length,birthYear:by,schoolYear:sy,grade}]});
    setNewChild({name:"",birthYear:"",schoolYear:""});
  };
  const remChild=id=>{
    upd({children:children.filter(c=>c.id!==id),weeklyTemplate:weeklyTemplate.filter(l=>l.childId!==id),dateSchedule:(dateSchedule||[]).filter(l=>l.childId!==id),homework:homework.filter(h=>h.childId!==id),grades:grades.filter(g=>g.childId!==id),clubs:clubs.filter(c=>c.childId!==id)});
    if(childId===id)setChildId(null);
    setShowRemoveChild(false);
    setPendingRemoveId(null);
  };

  const calcGrade=ch=>{if(!ch)return null;const g=Number(ch.grade);if(g>0)return g;return gradeFromSchoolYear(ch.schoolYear);};
  const seedSchedule=(targetCh)=>{
    const ch=targetCh||activeCh||(children.length===1?children[0]:null);
    const grade=calcGrade(ch);
    if(!grade||!ch){setTab(6);if(ch){setEditChildId(ch.id);setEditChildF({});}return;}
    const g=Math.min(Math.max(grade,1),11);
    const plan=SCHEDULE_BY_GRADE[g]||SCHEDULE_BY_GRADE[8];
    let newSubjects=[...subjects];
    let newTemplate=[...weeklyTemplate];
    plan.forEach(({day,subjects:sNames})=>{
      sNames.forEach((name,i)=>{
        let s=newSubjects.find(x=>x.name===name);
        if(!s){s={id:uid(),name,c:newSubjects.length%SC.length};newSubjects.push(s);}
        newTemplate.push({id:uid(),childId:ch.id,subjectId:s.id,day,lessonNum:i+1,time:lessonTime(i+1)});
      });
    });
    const usedIds=new Set([...newTemplate.map(l=>l.subjectId),...homework.map(h=>h.subjectId),...grades.map(g=>g.subjectId)].filter(Boolean));
    const cleanedSubjects=newSubjects.filter(s=>usedIds.has(s.id));
    if(childId!==ch.id)setChildId(ch.id);
    upd({subjects:cleanedSubjects,weeklyTemplate:newTemplate});
  };

  return(
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans" onClick={()=>expandedGradeId&&setExpandedGradeId(null)}>
      <div className="max-w-2xl mx-auto p-4" onClick={e=>e.stopPropagation()}>

        <div className="flex items-center gap-2 mb-4">
          <button onClick={()=>{setStep("select");setExpandedGradeId(null);setSelSubj(null);setPreviewChild(false);}} className="text-slate-400 hover:text-slate-600 text-xl w-8">←</button>
          {isOwner
            ?<div className="flex gap-1.5 flex-1 overflow-x-auto pb-0.5">
              {children.map(ch=>(
                <button key={ch.id} onClick={()=>setChildId(ch.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${childId===ch.id?cbg(ch.colorIdx)+" text-white shadow":"bg-white text-slate-600 hover:bg-slate-100"}`}>
                  <span className="font-bold">{(ch.name?.[0]??"?")}</span>
                  <span>{ch.name}</span>
                  {ch.grade&&<span className={`text-xs ${childId===ch.id?"opacity-70":"text-slate-400"}`}>{ch.grade}кл</span>}
                </button>
              ))}
            </div>
            :<div className="flex items-center gap-2 flex-1">
              {activeCh&&<div className={`w-8 h-8 rounded-full ${cbg(activeCh.colorIdx)} flex items-center justify-center text-white font-bold text-sm`}>{(activeCh.name?.[0]??"?")}</div>}
              <span className="font-semibold text-slate-700">{activeCh?.name||"Дневник"}</span>
              {previewChild&&<span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">вид ребёнка</span>}
            </div>
          }
          {realOwner&&<button onClick={()=>{setPreviewChild(v=>!v);setTab(0);}} title={previewChild?"Вернуться в режим родителя":"Посмотреть глазами ребёнка"} className={`flex-shrink-0 text-lg w-9 h-9 flex items-center justify-center rounded-xl transition-all ${previewChild?"bg-purple-500 text-white shadow":"bg-white text-slate-400 hover:text-purple-500 hover:bg-purple-50"}`}>👁</button>}
        </div>

        {saveError&&(
          <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-600 flex items-center gap-2">
            <span>⚠️ Не удалось сохранить. Проверь соединение.</span>
            <button onClick={()=>setSaveError(false)} className="ml-auto text-red-400 text-lg leading-none">×</button>
          </div>
        )}
        <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)}
              className={`flex-shrink-0 flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${tab===i?"bg-blue-500 text-white shadow":"text-slate-500 hover:bg-slate-100"}`}>
              {t}{i===1&&hwPending>0&&<span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1">{hwPending}</span>}
            </button>
          ))}
        </div>

        {/* TAB 0: РАСПИСАНИЕ */}
        {tab===0&&<ScheduleTab
          childId={childId} isOwner={isOwner} chHw={chHw} chCl={chCl} chTpl={chTpl}
          subjects={subjects} weeklyTemplate={weeklyTemplate} dateSchedule={dateSchedule} clubs={clubs}
          activeCh={activeCh} gSubjs={gSubjs} availSubjNames={availSubjNames}
          upd={upd} subj={subj} sc={sc} lessonsFor={lessonsFor} sjGrades={sjGrades}
          seedSchedule={seedSchedule} resolveOrCreateSubject={resolveOrCreateSubject}
          uid={uid} setSelSubj={setSelSubj} setTab={setTab} setHighlightClub={setHighlightClub}
          homework={homework}
          Card={Card} GBadge={GBadge} CollapseBtn={CollapseBtn} Inp={Inp} Sel={Sel} Btn={Btn}
        />}

        {/* TAB 1: ЗАДАНИЯ */}
        {tab===1&&<HomeworkTab
          childId={childId} isOwner={isOwner} homework={homework} schSubjs={schSubjs}
          schSubjIds={schSubjIds} chHw={chHw} lessonsFor={lessonsFor} upd={upd}
          subj={subj} uid={uid} editC={editC} setEditC={setEditC}
          Card={Card} Empty={Empty} CollapseBtn={CollapseBtn} Inp={Inp} Sel={Sel} Btn={Btn}
          GChip={GChip} GBadge={GBadge} GPicker={GPicker} SBadge={SBadge}
          grades={grades} expandedGradeId={expandedGradeId} setExpandedGradeId={setExpandedGradeId}
          chgGrade={chgGrade} delGrade={delGrade} sc={sc}
        />}

        {/* TAB 2 & 3: ОЦЕНКИ / СТАТИСТИКА */}
        {(tab===2||tab===3)&&<GradesTab
          tab={tab} isOwner={isOwner} schSubjs={schSubjs} schSubjIds={schSubjIds}
          sjGrades={sjGrades} avgGrade={avgGrade}
          sc={sc} GChip={GChip} upd={upd} grades={grades} uid={uid} childId={childId}
          chHw={chHw} selSubj={selSubj} setSelSubj={setSelSubj} setTab={setTab}
          lessonsFor={lessonsFor}
          statsOrder={statsOrder} statsColl={statsColl}
          setCollAndSave={setCollAndSave} setOrderAndSave={setOrderAndSave}
          Card={Card} Empty={Empty} CollapseBtn={CollapseBtn} Inp={Inp} Sel={Sel} Btn={Btn}
          GPicker={GPicker}
          expandedGradeId={expandedGradeId} setExpandedGradeId={setExpandedGradeId}
          chgGrade={chgGrade} delGrade={delGrade} editC={editC} setEditC={setEditC}
        />}

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
                        <Inp cls="w-20" placeholder="17:00" inputMode="numeric" maxLength={5}
                          value={editClubF.time??c.time??""}
                          onChange={e=>setEditClubF(p=>({...p,time:maskTime(e.target.value)}))}/>
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
                    <Inp cls="w-full" placeholder="Название" value={clubForm.name} onChange={e=>setClubForm(p=>({...p,name:e.target.value}))}/>
                    <textarea className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" rows={2} placeholder="Комментарий (необязательно)"
                      value={clubForm.comment||""} onChange={e=>setClubForm(p=>({...p,comment:e.target.value}))}/>
                    <div className="flex gap-2">
                      <Sel cls="flex-1" value={clubForm.day} onChange={e=>setClubForm(p=>({...p,day:e.target.value}))}>
                        {DAYS.map(d=><option key={d} value={d}>{DAYS_FULL[DAYS.indexOf(d)]}</option>)}
                      </Sel>
                      <Inp cls="w-20" placeholder="17:00" inputMode="numeric" maxLength={5}
                        value={clubForm.time}
                        onChange={e=>setClubForm(p=>({...p,time:maskTime(e.target.value)}))}/>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={clubForm.repeat!==false} onChange={e=>setClubForm(p=>({...p,repeat:e.target.checked}))} className="w-4 h-4 accent-blue-500"/>
                      <span className="text-sm text-slate-600">Повторять каждую неделю</span>
                    </label>
                    <Btn onClick={()=>{
                      if(!clubForm.name.trim())return;
                      upd({clubs:[...clubs,{id:uid(),childId,...clubForm,done:false,comment:clubForm.comment||""}]});
                      setClubForm({name:"",day:"Пн",time:"",comment:"",repeat:true});
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
              <CollapseBtn open={showSubjList} onToggle={()=>setShowSubjList(v=>!v)} label={`Предметы ${activeCh?.name||""}${activeCh?.grade?` · ${activeCh.grade} класс`:""}${chTpl.length>0?` · ${chTpl.length} ур/нед`:""}`}/>
              {showSubjList&&(()=>{
                const gradeSubjNames=gradeSubjects(activeCh?.grade)||[];
                const allSubjNames=[...new Set([...gradeSubjNames,...schSubjs.map(s=>s.name)])];
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
                  <Inp cls="flex-1" placeholder="Название предмета" value={newSubjectName} onChange={e=>setNewSubjectName(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&newSubjectName.trim()){upd({subjects:[...subjects,{id:uid(),name:newSubjectName.trim(),c:subjects.length%SC.length}]});setNewSubjectName("");}}}/>
                  <Btn onClick={()=>{if(!newSubjectName.trim())return;upd({subjects:[...subjects,{id:uid(),name:newSubjectName.trim(),c:subjects.length%SC.length}]});setNewSubjectName("");}} cls="bg-blue-500 text-white hover:bg-blue-600">+</Btn>
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
                    try{
                      const batch=writeBatch(db);
                      batch.delete(doc(db,"familyCodes",dbData.familyCode));
                      batch.set(doc(db,"familyCodes",newCode),{familyId:userRec.familyId});
                      batch.update(doc(db,"families",userRec.familyId),{familyCode:newCode});
                      await batch.commit();
                      setDbData(prev=>({...prev,familyCode:newCode}));
                    }catch(e){console.error(e);alert("Ошибка смены кода.");}
                  }} className="w-full text-xs text-amber-600 border border-amber-200 rounded-lg py-2 hover:bg-amber-100 transition-all">
                    🔄 Сгенерировать новый код
                  </button>
                </div>
              )}
            </Card>

            <div className="mb-4 border-2 border-blue-200 rounded-2xl p-2 bg-blue-50/40">
              <p className="text-xs text-blue-400 font-medium px-2 pt-1 pb-2">Дети</p>
              <div className="space-y-2">
                {children.length===0?(
                  <div className="space-y-2 px-1 py-2">
                    <p className="text-sm text-slate-400 text-center mb-2">Добавьте первого ребёнка</p>
                    <div className="flex gap-2">
                      <Inp cls="flex-1" placeholder="Имя"
                        value={newChild.name}
                        onChange={e=>setNewChild(p=>({...p,name:e.target.value}))}
                        onKeyDown={e=>e.key==='Enter'&&addChild()}/>
                      <Inp cls="w-24" placeholder="с 2017" type="number"
                        value={newChild.schoolYear}
                        onChange={e=>setNewChild(p=>({...p,schoolYear:e.target.value}))}/>
                      {(()=>{const g=gradeFromSchoolYear(newChild.schoolYear);return g?(<div className="flex items-center px-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-semibold text-blue-600 whitespace-nowrap">{g} кл.</div>):null;})()}
                    </div>
                    <Btn onClick={addChild} cls="w-full bg-blue-500 text-white hover:bg-blue-600">+ Добавить</Btn>
                  </div>
                )
                  :children.map(ch=>(
                  <Card key={ch.id}>
                    {editChildId===ch.id?(
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 cursor-pointer mb-2" onClick={()=>{setEditChildId(null);setEditChildF({});}}>
                          <div className={`w-10 h-10 rounded-full ${cbg(ch.colorIdx)} flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}>{(ch.name?.[0]??"?").toUpperCase()}</div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-700">{ch.name}</p>
                            <p className="text-xs text-slate-400">{!calcGrade(ch)?"⚠️ Укажи год поступления и нажми Сохранить":"Нажми, чтобы свернуть"}</p>
                          </div>
                          <span className="text-slate-300 text-lg">∧</span>
                        </div>
                        <Inp cls="w-full" placeholder="Имя (Артём, Соня...)"
                          value={editChildF.name??ch.name}
                          onChange={e=>setEditChildF(p=>({...p,name:e.target.value}))}/>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-slate-400 mb-1 block">Год рождения</label>
                            <Inp cls="w-full" placeholder="2010" type="number"
                              value={editChildF.birthYear??ch.birthYear??''}
                              onChange={e=>setEditChildF(p=>({...p,birthYear:e.target.value}))}/>
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-slate-400 mb-1 block">Год поступления в школу</label>
                            <Inp cls="w-full" placeholder="2017" type="number"
                              value={editChildF.schoolYear??ch.schoolYear??''}
                              onChange={e=>setEditChildF(p=>({...p,schoolYear:e.target.value}))}/>
                          </div>
                        </div>
                        {(()=>{const raw=editChildF.schoolYear??ch.schoolYear;const g=gradeFromSchoolYear(raw);return g&&<p className="text-xs text-blue-500 bg-blue-50 rounded-lg px-3 py-1.5">🎒 Текущий класс: <b>{g}</b></p>;})()}
                        <div className="flex gap-2">
                          <Btn onClick={()=>{
                            const name=(editChildF.name??ch.name).trim();
                            if(!name)return;
                            const by=parseInt(editChildF.birthYear??ch.birthYear)||null;
                            const sy=parseInt(editChildF.schoolYear??ch.schoolYear)||null;
                            const grade=gradeFromSchoolYear(sy);
                            let ns=[...subjects];
                            if(grade&&!ch.grade)(gradeSubjects(grade)||[]).forEach(n=>{if(!ns.find(s=>s.name===n))ns.push({id:uid(),name:n,c:ns.length%SC.length});});
                            upd({subjects:ns,children:children.map(x=>x.id===ch.id?{...x,name,birthYear:by,schoolYear:sy,grade}:x)});
                            setEditChildId(null);setEditChildF({});
                          }} cls="flex-1 bg-blue-500 text-white hover:bg-blue-600">Сохранить</Btn>
                          <Btn onClick={()=>{setEditChildId(null);setEditChildF({});}} cls="bg-slate-100 text-slate-600 hover:bg-slate-200">Отмена</Btn>
                        </div>
                      </div>
                    ):(
                    <div className="flex items-center gap-3 cursor-pointer" onClick={()=>{setEditChildId(ch.id);setEditChildF({});}}>
                      <div className={`w-12 h-12 rounded-full ${cbg(ch.colorIdx)} flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}>{(ch.name?.[0]??"?").toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-700">{ch.name}</p>
                        {ch.grade?<p className="text-xs text-slate-500">{ch.birthYear&&`${ch.birthYear} г.р. · `}{ch.grade} класс</p>
                          :<p className="text-xs text-amber-500">⚠️ Укажи год поступления</p>}
                        <p className="text-xs text-slate-400">{weeklyTemplate.filter(l=>l.childId===ch.id).length} ур/нед · {homework.filter(h=>h.childId===ch.id).length} заданий</p>
                        <div className="flex gap-1 mt-1.5" onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>upd({children:children.map(x=>x.id===ch.id?{...x,shift:1}:x)})}
                            className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${(ch.shift||1)===1?"bg-blue-500 text-white":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                            I смена
                          </button>
                          <button onClick={()=>upd({children:children.map(x=>x.id===ch.id?{...x,shift:2}:x)})}
                            className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${(ch.shift||1)===2?"bg-orange-500 text-white":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                            II смена
                          </button>
                        </div>
                      {weeklyTemplate.filter(l=>l.childId===ch.id).length===0&&(
                        <button onClick={e=>{e.stopPropagation();seedSchedule(ch);}} className="mt-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 hover:bg-emerald-100 transition-all">
                          ✨ Заполнить расписание
                        </button>
                      )}
                    </div>
                      <button onClick={e=>{e.stopPropagation();setPendingRemoveId(ch.id);setShowRemoveChild(true);}} className="text-slate-300 hover:text-red-400 text-lg flex-shrink-0">×</button>
                    </div>
                    )}
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
                  <button onClick={()=>setShowDeleteFamilyConfirm(true)} className="w-full bg-red-50 text-red-500 border border-red-200 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-red-100 transition-all">
                    🗑 Удалить семью и все данные
                  </button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Модал удаления семьи */}
        {showDeleteFamilyConfirm&&(
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={()=>setShowDeleteFamilyConfirm(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e=>e.stopPropagation()}>
              <p className="text-lg font-bold text-slate-800 mb-2">Удалить семью?</p>
              <p className="text-sm text-slate-500 mb-5">Все данные — расписание, задания, оценки — будут удалены безвозвратно.</p>
              <div className="flex gap-3">
                <button onClick={()=>setShowDeleteFamilyConfirm(false)} className="flex-1 bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-slate-200">Отмена</button>
                <button onClick={deleteFamily} className="flex-1 bg-red-500 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-red-600">Удалить</button>
              </div>
            </div>
          </div>
        )}

        {/* Модал удаления ребёнка */}
        {showRemoveChild&&pendingRemoveId&&(()=>{
          const ch=children.find(c=>c.id===pendingRemoveId);
          return(
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={()=>{setShowRemoveChild(false);setPendingRemoveId(null);}}>
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e=>e.stopPropagation()}>
                <p className="text-lg font-bold text-slate-800 mb-2">Удалить профиль {ch?.name}?</p>
                <p className="text-sm text-slate-500 mb-5">Все задания, оценки и расписание этого ребёнка будут удалены.</p>
                <div className="flex gap-3">
                  <button onClick={()=>{setShowRemoveChild(false);setPendingRemoveId(null);}} className="flex-1 bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-slate-200">Отмена</button>
                  <button onClick={()=>remChild(pendingRemoveId)} className="flex-1 bg-red-500 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-red-600">Удалить</button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
