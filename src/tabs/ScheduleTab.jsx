import { useState } from "react";
import { maskTime } from "../utils";

const DAYS=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const DAYS_FULL=["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"];
const MON=["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const LESSON_TIMES=["","08:00","08:50","09:40","10:35","11:35","12:25","13:15"];
const LESSON_TIMES_SHIFT2=["","14:00","14:50","15:40","16:35","17:25","18:15","19:05"];
const lessonTimeFor=(n,shift)=>(shift===2?LESSON_TIMES_SHIFT2:LESSON_TIMES)[n]||"";
const LNS=[-2,-1,0,1,2,3,4,5,6,7,8];
const DOT_COLORS=["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ec4899","#6366f1","#f97316","#14b8a6","#ef4444","#06b6d4","#84cc16","#f43f5e","#7c3aed","#0ea5e9","#22c55e"];
const getMonday=d=>{const x=new Date(d),dy=x.getDay();x.setDate(x.getDate()-(dy===0?6:dy-1));x.setHours(0,0,0,0);return x;};
const weekDates=mon=>Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d;});
const ds=d=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;};
const sd=s=>new Date(s+"T00:00:00");
const toDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};

export default function ScheduleTab({
  childId, isOwner, chHw, chCl, chTpl,
  subjects, weeklyTemplate, dateSchedule, clubs,
  activeCh, gSubjs, availSubjNames,
  upd, subj, sc, lessonsFor, sjGrades,
  seedSchedule, resolveOrCreateSubject,
  uid, setSelSubj, setTab, setHighlightClub, setHighlightHw,
  homework,
  Card, GBadge, CollapseBtn, Inp, Sel, Btn,
}) {
  const shift = activeCh?.shift || 1;
  const [mon, setMon] = useState(() => getMonday(new Date()));
  const [activeDate, setActiveDate] = useState(toDay);
  const [lessonForm, setLessonForm] = useState({subjectId:"",lessonNum:"1",time:lessonTimeFor(1,shift),repeat:true});
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddClub, setShowAddClub] = useState(false);
  const [clubForm, setClubForm] = useState({name:"",day:"Пн",time:"",comment:"",repeat:true});
  const [hwQuickForm, setHwQuickForm] = useState(null);
  const [hwQuickTask, setHwQuickTask] = useState("");
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [expandedSubjLesson, setExpandedSubjLesson] = useState(null);
  const [subAction, setSubAction] = useState(null);
  const [subReplaceSubj, setSubReplaceSubj] = useState('');
  const [subMoveSlot, setSubMoveSlot] = useState('');

  const todayStr = toDay();
  const wDates = weekDates(mon);
  const activeDayIdx = (sd(activeDate).getDay()+6)%7;
  const activeDay = DAYS[Math.min(activeDayIdx, 6)];
  const w0 = wDates[0], w6 = wDates[6];
  const wLabel = w0.getMonth()===w6.getMonth()
    ? `${w0.getDate()}–${w6.getDate()} ${MON[w0.getMonth()]} ${w0.getFullYear()}`
    : `${w0.getDate()} ${MON[w0.getMonth()]} – ${w6.getDate()} ${MON[w6.getMonth()]}`;
  const activeLessons = lessonsFor(activeDate);
  const isSunday = activeDayIdx === 6;

  const addHw = (subjectId) => {
    if (!hwQuickTask.trim()) return;
    upd({homework:[...(homework||[]),{id:uid(),childId,subjectId,date:activeDate,task:hwQuickTask.trim(),hwType:"hw",done:false,grade:null,comment:"",lessonId:""}]});
    setHwQuickForm(null);
    setHwQuickTask("");
  };

  const collapseSubstitution = () => {
    setExpandedLesson(null); setSubAction(null);
    setSubReplaceSubj(''); setSubMoveSlot('');
  };

  const doCancel = (l) => {
    const existing=(dateSchedule||[]).find(x=>x.cancelsSlot===l.lessonNum&&x.date===activeDate&&x.childId===childId);
    if(existing)return collapseSubstitution();
    upd({dateSchedule:[...(dateSchedule||[]),{
      id:uid(),childId,date:activeDate,
      subjectId:null,lessonNum:l.lessonNum,time:'',
      type:'cancel',cancelsSlot:l.lessonNum
    }]});
    collapseSubstitution();
  };

  const doReplace = (l) => {
    if(!subReplaceSubj)return;
    const existing=(dateSchedule||[]).find(x=>x.cancelsSlot===l.lessonNum&&x.date===activeDate&&x.childId===childId);
    if(existing)return collapseSubstitution();
    let sid=subReplaceSubj,ns=subjects;
    if(subReplaceSubj.startsWith("__new__")){
      const r=resolveOrCreateSubject(subReplaceSubj.replace("__new__",""));
      ns=r.subjects;sid=r.subjectId;
    }
    upd({subjects:ns,dateSchedule:[...(dateSchedule||[]),{
      id:uid(),childId,date:activeDate,
      subjectId:sid,lessonNum:l.lessonNum,time:lessonTimeFor(l.lessonNum,shift),
      type:'replace',cancelsSlot:l.lessonNum
    }]});
    collapseSubstitution();
  };

  const doMove = (l) => {
    if(!subMoveSlot)return;
    const existing=(dateSchedule||[]).find(x=>x.cancelsSlot===l.lessonNum&&x.date===activeDate&&x.childId===childId);
    if(existing)return collapseSubstitution();
    upd({dateSchedule:[...(dateSchedule||[]),{
      id:uid(),childId,date:activeDate,
      subjectId:l.subjectId,lessonNum:+subMoveSlot,
      time:lessonTimeFor(+subMoveSlot,shift),
      type:'move',cancelsSlot:l.lessonNum
    }]});
    collapseSubstitution();
  };

  const doUndo = (l) => {
    upd({dateSchedule:(dateSchedule||[]).filter(x=>x.id!==l.id)});
    collapseSubstitution();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={()=>{const m=new Date(mon);m.setDate(m.getDate()-7);setMon(m);const d=new Date(sd(activeDate));d.setDate(d.getDate()-7);setActiveDate(ds(d));}} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-100 text-lg">‹</button>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">{wLabel}</p>
          {ds(mon)!==ds(getMonday(new Date()))&&<button onClick={()=>{setMon(getMonday(new Date()));setActiveDate(toDay());}} className="text-xs text-blue-500 hover:underline">← сегодня</button>}
          {isOwner&&chTpl.length===0&&<button onClick={seedSchedule} className="text-xs text-emerald-500 hover:underline">✨ Заполнить пример</button>}
        </div>
        <button onClick={()=>{const m=new Date(mon);m.setDate(m.getDate()+7);setMon(m);const d=new Date(sd(activeDate));d.setDate(d.getDate()+7);setActiveDate(ds(d));}} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-100 text-lg">›</button>
      </div>
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {wDates.map((d,i)=>{
          const dstr=ds(d),isToday=dstr===todayStr,isActive=dstr===activeDate;
          const has=lessonsFor(dstr).length>0;
          const hasKR=chHw.some(h=>h.hwType==="kr"&&h.date===dstr);
          const hasClub=chCl.some(c=>c.day===DAYS[i]);
          return(
            <button key={i} onClick={()=>setActiveDate(dstr)}
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
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            {DAYS_FULL[activeDayIdx]}, {sd(activeDate).getDate()} {MON[sd(activeDate).getMonth()]}
            {(dateSchedule||[]).some(l=>l.childId===childId&&l.date===activeDate&&l.cancelsSlot!=null)&&(
              <span className="inline-block w-2 h-2 rounded-full bg-red-400 flex-shrink-0" title="Есть изменения в расписании"/>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {activeDate===todayStr&&<span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Сегодня</span>}
            {isSunday&&<span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Выходной</span>}
          </div>
        </div>
        {(()=>{
          const krToday=chHw.filter(h=>h.hwType==="kr"&&h.date===activeDate);
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
        {isSunday ? (
          <p className="text-slate-400 text-sm text-center py-4">Воскресенье — выходной</p>
        ) : (()=>{
          const dayClubs=chCl.filter(c=>c.day===activeDay);
          const sortedLessons=[...activeLessons].sort((a,b)=>(+a.lessonNum||99)-(+b.lessonNum||99));

          if(sortedLessons.length===0&&dayClubs.length===0)
            return <p className="text-slate-400 text-sm text-center py-4">Уроков нет</p>;

          return(
            <div>
              {/* Timeline lessons */}
              {sortedLessons.length>0&&(
                <div className="relative mb-2">
                  <div className="absolute left-14 top-0 bottom-0 w-0.5 bg-slate-200"/>
                  {sortedLessons.map((l,idx)=>{
                    const s=subj(l.subjectId);
                    const isCancelled=!!l._cancelled;
                    const isMovedAway=!!l._movedAway;
                    const isReplace=l.type==='replace';
                    const isMove=l.type==='move';
                    const isExtra=!!l.date&&!l.cancelsSlot&&(!l.type||l.type==='extra');
                    const isSubstitution=isReplace||isMove||isExtra;
                    const isExpanded=expandedLesson===l.id;
                    const lGr=sjGrades(l.subjectId||'').slice(0,1);
                    const pendHw=chHw.filter(h=>h.subjectId===l.subjectId&&!h.done);
                    const hasKR=pendHw.some(h=>h.hwType==="kr");
                    const dotColor=(isCancelled||isMovedAway)?'#cbd5e1':DOT_COLORS[((s?.c)||0)%DOT_COLORS.length];
                    const prevLesson=idx>0?sortedLessons[idx-1]:null;
                    const hasGap=l.lessonNum&&(idx===0?+l.lessonNum>1:prevLesson&&prevLesson.lessonNum&&(+l.lessonNum-(+prevLesson.lessonNum))>1);
                    const hwChips=(homework||[]).filter(h=>h.subjectId===l.subjectId&&h.date===activeDate);
                    const showQuickForm=hwQuickForm?.subjectId===l.subjectId&&hwQuickForm?.date===activeDate;
                    const gapSize=hasGap?(idx===0?+l.lessonNum-1:+l.lessonNum-(+prevLesson.lessonNum)-1):0;
                    const gapStartNum=idx===0?1:(prevLesson?+prevLesson.lessonNum+1:1);
                    const origLesson=(isReplace||isMove)&&l.cancelsSlot
                      ?chTpl.find(t=>t.day===activeDay&&+t.lessonNum===+l.cancelsSlot)
                      :null;
                    const origSubj=origLesson?subj(origLesson.subjectId):null;
                    const origTime=isMove?lessonTimeFor(l.cancelsSlot,shift):null;
                    const takenSlots=new Set(
                      activeLessons
                        .filter(x=>x.id!==l.id&&!x._cancelled)
                        .map(x=>+x.lessonNum)
                        .filter(n=>n>0)
                    );
                    const freeSlots=[1,2,3,4,5,6,7].filter(n=>!takenSlots.has(n));
                    return(
                      <div key={l.id}>
                        {hasGap&&(
                          <div className="relative flex items-start mb-4">
                            <div className="w-12 text-right pr-2 pt-2 text-xs text-slate-400 flex-shrink-0">
                              {lessonTimeFor(gapStartNum,shift)}
                            </div>
                            <div className="flex items-center justify-center w-5 flex-shrink-0 pt-3 z-10">
                              <div className="w-4 h-4 rounded-full border-2 border-dashed border-slate-300 bg-white flex-shrink-0"/>
                            </div>
                            <div className="flex-1 ml-3 rounded-xl p-2.5 border border-dashed border-slate-200 bg-slate-50">
                              <span className="text-xs text-slate-400">🪟 {gapSize===1?"окно":`${gapSize} окна`}</span>
                            </div>
                          </div>
                        )}
                        <div className="relative flex items-start mb-4">
                          <div className={`w-12 text-right pr-2 pt-2 text-xs flex-shrink-0 ${isCancelled?'text-slate-300':'text-slate-400'}`}>
                            {lessonTimeFor(l.lessonNum,shift)}
                          </div>
                          <div className="flex items-center justify-center w-5 flex-shrink-0 pt-3 z-10">
                            <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{background:dotColor,opacity:isCancelled?0.35:1}}/>
                          </div>
                          <div
                            className={`flex-1 ml-3 bg-white rounded-xl shadow-sm px-3 py-4 ${isOwner&&!isMovedAway?'cursor-pointer':''} ${(isCancelled||isMovedAway)?'opacity-45':''}`}
                            onClick={()=>{
                              if(!isOwner||isMovedAway)return;
                              setExpandedSubjLesson(null);
                              if(isExpanded){collapseSubstitution();}
                              else{setExpandedLesson(l.id);setSubAction(null);setSubReplaceSubj('');setSubMoveSlot('');}
                            }}>
                            {isMovedAway?(
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {l.lessonNum>0&&<span className="text-xs text-slate-300 font-bold w-4 text-center">{l.lessonNum}</span>}
                                <span className="text-sm font-medium text-slate-400 line-through flex-1">{s?.name||"?"}</span>
                                <span className="text-xs bg-blue-50 text-blue-400 border border-blue-200 rounded-full px-2 py-0.5">перенесён → {l._moveEntry?.lessonNum} ур.</span>
                              </div>
                            ):isCancelled?(
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {l.lessonNum>0&&<span className="text-xs text-slate-300 font-bold w-4 text-center">{l.lessonNum}</span>}
                                <span className="text-sm font-medium text-slate-400 line-through flex-1">{s?.name||"?"}</span>
                                <span className="text-xs bg-red-50 text-red-400 border border-red-200 rounded-full px-2 py-0.5">отменён</span>
                              </div>
                            ):isReplace?(
                              <div className="flex items-center gap-1 flex-wrap">
                                {l.lessonNum>0&&<span className="text-xs text-slate-400 font-bold w-4 text-center">{l.lessonNum}</span>}
                                <span className="text-xs text-slate-400 line-through">{origSubj?.name||"?"}</span>
                                <span className="text-slate-300 text-xs">→</span>
                                <span className="text-sm font-medium text-slate-700 flex-1">{s?.name||"?"}</span>
                                <span className="text-xs bg-green-50 text-green-600 border border-green-200 rounded-full px-2 py-0.5">замена</span>
                              </div>
                            ):isMove?(
                              <div className="flex items-center gap-1 flex-wrap">
                                {l.lessonNum>0&&<span className="text-xs text-slate-400 font-bold w-4 text-center">{l.lessonNum}</span>}
                                <span className="text-xs text-slate-400 line-through">{origTime}</span>
                                <span className="text-slate-300 text-xs">→</span>
                                <span className="text-sm font-medium text-slate-700 flex-1">{s?.name||"?"}</span>
                                <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5">перенос</span>
                              </div>
                            ):isExtra?(
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {l.lessonNum>0&&<span className="text-xs text-slate-400 font-bold w-4 text-center">{l.lessonNum}</span>}
                                <span className="text-sm font-medium text-slate-700 flex-1 cursor-pointer hover:text-blue-600"
                                  onClick={e=>{e.stopPropagation();collapseSubstitution();if(expandedSubjLesson===l.id){setExpandedSubjLesson(null);}else{setExpandedSubjLesson(l.id);}}}>
                                  {s?.name||"?"}
                                </span>
                                <span className="text-xs bg-orange-50 text-orange-500 border border-orange-200 rounded-full px-2 py-0.5">разовый</span>
                                {isOwner&&<button onClick={e=>{e.stopPropagation();upd({dateSchedule:(dateSchedule||[]).filter(x=>x.id!==l.id)});}} className="text-slate-300 hover:text-red-400 text-lg ml-1">×</button>}
                              </div>
                            ):(
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {l.lessonNum>0&&<span className="text-xs text-slate-400 font-bold w-4 text-center">{l.lessonNum}</span>}
                                <span className="text-sm font-medium text-slate-700 flex-1 cursor-pointer hover:text-blue-600 min-w-0"
                                  onClick={e=>{e.stopPropagation();collapseSubstitution();if(expandedSubjLesson===l.id){setExpandedSubjLesson(null);}else{setExpandedSubjLesson(l.id);}}}>
                                  {s?.name||"?"}
                                </span>
                                {lGr[0]&&<GBadge v={lGr[0].value} type={lGr[0].type}/>}
                                {hasKR?<span className="w-2 h-2 rounded-full bg-red-400 inline-block flex-shrink-0"/>:pendHw.length>0?<span className="w-2 h-2 rounded-full bg-orange-400 inline-block flex-shrink-0"/>:null}
                                {isOwner&&<button onClick={e=>{e.stopPropagation();upd({weeklyTemplate:weeklyTemplate.filter(x=>x.id!==l.id),dateSchedule:(dateSchedule||[]).filter(x=>!(x.childId===childId&&x.cancelsSlot===l.lessonNum&&x.day===activeDay))});collapseSubstitution();}} className="text-slate-300 hover:text-red-400 text-lg ml-auto">×</button>}
                              </div>
                            )}
                            {isOwner&&isExpanded&&!isCancelled&&!isSubstitution&&(
                              <div className="mt-2 pt-2 border-t border-slate-100">
                                {subAction===null&&(
                                  <div className="flex gap-1.5 flex-wrap">
                                    <button onClick={e=>{e.stopPropagation();doCancel(l);}}
                                      className="text-xs px-2.5 py-1 rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100">
                                      🚫 Отменить
                                    </button>
                                    <button onClick={e=>{e.stopPropagation();setSubAction('replace');}}
                                      className="text-xs px-2.5 py-1 rounded-full border border-green-200 bg-green-50 text-green-600 hover:bg-green-100">
                                      🔄 Заменить
                                    </button>
                                    <button onClick={e=>{e.stopPropagation();setSubAction('move');}}
                                      className="text-xs px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100">
                                      ⏱ Перенести
                                    </button>
                                  </div>
                                )}
                                {subAction==='replace'&&(
                                  <div className="flex gap-2 items-center" onClick={e=>e.stopPropagation()}>
                                    <select
                                      className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                      value={subReplaceSubj}
                                      onChange={e=>setSubReplaceSubj(e.target.value)}>
                                      <option value="">Выберите предмет...</option>
                                      {availSubjNames.map(name=>{const sx=subjects.find(x=>x.name===name);return <option key={name} value={sx?.id||"__new__"+name}>{name}</option>;})}
                                    </select>
                                    <button onClick={()=>doReplace(l)}
                                      className="bg-green-500 text-white rounded-lg px-3 py-1.5 text-sm">✓</button>
                                    <button onClick={e=>{e.stopPropagation();setSubAction(null);}}
                                      className="text-slate-400 text-sm px-2">×</button>
                                  </div>
                                )}
                                {subAction==='move'&&(
                                  <div className="flex gap-2 items-center" onClick={e=>e.stopPropagation()}>
                                    <select
                                      className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                      value={subMoveSlot}
                                      onChange={e=>setSubMoveSlot(e.target.value)}>
                                      <option value="">Выберите слот...</option>
                                      {freeSlots.map(n=><option key={n} value={n}>{n} — {lessonTimeFor(n,shift)}</option>)}
                                    </select>
                                    <button onClick={()=>doMove(l)}
                                      className="bg-blue-500 text-white rounded-lg px-3 py-1.5 text-sm">✓</button>
                                    <button onClick={e=>{e.stopPropagation();setSubAction(null);}}
                                      className="text-slate-400 text-sm px-2">×</button>
                                  </div>
                                )}
                              </div>
                            )}
                            {isOwner&&isExpanded&&isSubstitution&&(
                              <div className="mt-2 pt-2 border-t border-slate-100" onClick={e=>e.stopPropagation()}>
                                <button onClick={()=>doUndo(l)}
                                  className="text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100">
                                  ↩ Восстановить
                                </button>
                              </div>
                            )}
                            {isOwner&&isExpanded&&isCancelled&&(
                              <div className="mt-2 pt-2 border-t border-slate-100" onClick={e=>e.stopPropagation()}>
                                <button onClick={()=>{const ce=(dateSchedule||[]).find(x=>x.cancelsSlot===l.lessonNum&&x.date===activeDate&&x.childId===childId);if(ce)doUndo(ce);}}
                                  className="text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100">
                                  ↩ Восстановить
                                </button>
                              </div>
                            )}
                            {isMovedAway&&l._moveEntry&&isOwner&&(
                              <div className="mt-2 pt-2 border-t border-slate-100" onClick={e=>e.stopPropagation()}>
                                <button onClick={()=>doUndo(l._moveEntry)}
                                  className="text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100">
                                  ↩ Восстановить
                                </button>
                              </div>
                            )}
                            {expandedSubjLesson===l.id&&!isCancelled&&!isMovedAway&&(
                              <div className="mt-3 pt-3 border-t border-slate-100" onClick={e=>e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{s?.name}</span>
                                  <button onClick={()=>{if(s){setSelSubj(s.id);setTab(3);}}}
                                    className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-all">
                                    📊 Статистика
                                  </button>
                                </div>
                                {(()=>{
                                  const recentGr=sjGrades(l.subjectId||'').slice(0,6);
                                  if(recentGr.length===0)return <p className="text-xs text-slate-400">Оценок пока нет</p>;
                                  return <div className="flex flex-wrap gap-1">{recentGr.map(g=><GBadge key={g.id} v={g.value} type={g.type}/>)}</div>;
                                })()}
                                {pendHw.length>0&&(
                                  <button onClick={()=>{setHighlightHw(pendHw[0].id);setTab(1);}}
                                    className="text-xs text-orange-500 mt-2 hover:text-orange-600 hover:underline text-left">
                                    📝 {pendHw.length} невыполн. {pendHw.length===1?"задание":pendHw.length<5?"задания":"заданий"}
                                  </button>
                                )}
                                <button onClick={()=>{setHwQuickForm({subjectId:l.subjectId,date:activeDate});setHwQuickTask("");setExpandedSubjLesson(null);}}
                                  className="mt-2 w-full text-xs bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all text-left">
                                  ✏️ Записать задание
                                </button>
                              </div>
                            )}
                            {!isCancelled&&hwChips.length>0&&(
                              <div className="flex flex-wrap gap-1 mt-2">
                                {hwChips.map(hw=>(
                                  <div key={hw.id} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${hw.done?"bg-green-50 border-green-200 text-green-700 line-through":"bg-blue-50 border-blue-200 text-blue-700"}`}>
                                    <span className="max-w-[120px] truncate">{hw.task?.slice(0,25)}</span>
                                    {isOwner&&<button onClick={e=>{e.stopPropagation();upd({homework:(homework||[]).filter(x=>x.id!==hw.id)});}} className="text-slate-400 hover:text-red-400 ml-0.5">×</button>}
                                  </div>
                                ))}
                              </div>
                            )}
                            {!isCancelled&&showQuickForm&&(
                              <div className="mt-2 flex gap-2">
                                <input autoFocus
                                  className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                  placeholder="Что задали?"
                                  value={hwQuickTask}
                                  onChange={e=>setHwQuickTask(e.target.value)}
                                  onKeyDown={e=>{
                                    if(e.key==="Enter"&&hwQuickTask.trim()){addHw(l.subjectId);}
                                    if(e.key==="Escape"){setHwQuickForm(null);setHwQuickTask("");}
                                  }}/>
                                <button onClick={()=>addHw(l.subjectId)} className="bg-blue-500 text-white rounded-lg px-2 py-1.5 text-sm">+</button>
                                <button onClick={()=>{setHwQuickForm(null);setHwQuickTask("");}} className="text-slate-400 text-sm px-2">×</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Clubs in timeline style */}
              {dayClubs.length>0&&(
                <div className="relative">
                  <div className="absolute left-14 top-0 bottom-0 w-0.5 bg-slate-200"/>
                  {dayClubs.map(c=>(
                    <div key={c.id} className="relative flex items-start mb-4">
                      <div className="w-12 text-right pr-2 pt-2 text-xs text-slate-400 flex-shrink-0">
                        {c.time||""}
                      </div>
                      <div className="flex items-center justify-center w-5 flex-shrink-0 pt-3 z-10">
                        <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{background:"#8b5cf6"}}/>
                      </div>
                      <div className={`flex-1 ml-3 bg-violet-50 rounded-xl shadow-sm p-3 cursor-pointer active:opacity-70 ${c.done?"opacity-60":""}`}
                        onClick={()=>{setHighlightClub(c.id);setTab(4);}}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">🎯</span>
                          <span className="text-sm font-medium text-violet-800 flex-1">{c.name}</span>
                          {c.comment&&<span className="text-slate-400 text-xs" title={c.comment}>💬</span>}
                          {isOwner&&<button onClick={e=>{e.stopPropagation();upd({clubs:clubs.filter(x=>x.id!==c.id)});}} className="text-slate-300 hover:text-red-400 text-lg">×</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </Card>
      {isOwner&&!isSunday&&(
        <Card cls="mb-3">
          <CollapseBtn open={showAddLesson} onToggle={()=>setShowAddLesson(v=>!v)} label="Добавить урок"/>
          {showAddLesson&&(
            <div className="mt-3 space-y-2">
              {gSubjs&&<p className="text-xs text-blue-500 bg-blue-50 rounded-lg px-3 py-1.5">🎓 Предметы для {activeCh?.grade} класса</p>}
              <Sel cls="w-full" value={lessonForm.subjectId} onChange={e=>setLessonForm(p=>({...p,subjectId:e.target.value}))}>
                <option value="">Выберите предмет...</option>
                {availSubjNames.map(name=>{const s=subjects.find(x=>x.name===name);return <option key={name} value={s?.id||"__new__"+name}>{name}</option>;})}
              </Sel>
              <div className="flex gap-2 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">№ урока</label>
                  <Sel cls="w-32" value={lessonForm.lessonNum} onChange={e=>{const n=e.target.value;setLessonForm(p=>({...p,lessonNum:n,time:lessonTimeFor(+n,shift)}));}}>
                    {LNS.map(n=><option key={n} value={n}>{n<=0?`${n} (доп.)`:`${n} — ${lessonTimeFor(n,shift)}`}</option>)}
                  </Sel>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs text-slate-400">Время</label>
                  <Inp cls="w-full" placeholder="08:00" inputMode="numeric" maxLength={5}
                    value={lessonForm.time}
                    onChange={e=>setLessonForm(p=>({...p,time:maskTime(e.target.value)}))}/>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={lessonForm.repeat} onChange={e=>setLessonForm(p=>({...p,repeat:e.target.checked}))} className="w-4 h-4 accent-blue-500"/>
                <span className="text-sm text-slate-600">Повторять каждую неделю</span>
              </label>
              <Btn onClick={()=>{
                if(!lessonForm.subjectId)return;
                let sid=lessonForm.subjectId,ns=subjects;
                if(lessonForm.subjectId.startsWith("__new__")){const r=resolveOrCreateSubject(lessonForm.subjectId.replace("__new__",""));ns=r.subjects;sid=r.subjectId;}
                if(lessonForm.repeat)upd({subjects:ns,weeklyTemplate:[...weeklyTemplate,{id:uid(),childId,subjectId:sid,day:activeDay,lessonNum:+lessonForm.lessonNum,time:lessonForm.time}]});
                else upd({subjects:ns,dateSchedule:[...(dateSchedule||[]),{id:uid(),childId,date:activeDate,subjectId:sid,lessonNum:+lessonForm.lessonNum,time:lessonForm.time,type:'extra'}]});
                setLessonForm({subjectId:"",lessonNum:"1",time:lessonTimeFor(1,shift),repeat:true});
              }} cls="w-full bg-blue-500 text-white hover:bg-blue-600">+ Добавить</Btn>
              {!lessonForm.repeat&&<p className="text-xs text-purple-500 bg-purple-50 rounded-lg px-3 py-1.5">📌 Только на {sd(activeDate).getDate()} {MON[sd(activeDate).getMonth()]}</p>}
            </div>
          )}
        </Card>
      )}
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
                upd({clubs:[...clubs,{id:uid(),childId,...clubForm,done:false}]});
                setClubForm({name:"",day:activeDay,time:"",comment:"",repeat:true});
                setShowAddClub(false);
              }} cls="w-full bg-blue-500 text-white hover:bg-blue-600">+ Добавить</Btn>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
