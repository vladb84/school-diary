import { useState } from "react";

const DAYS=["Пн","Вт","Ср","Чт","Пт","Сб"];
const DAYS_FULL=["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
const sd=s=>new Date(s+"T00:00:00");
const toDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
const fmtDate=s=>{if(!s)return"";const p=s.split("-");return p.length===3?`${p[2]}.${p[1]}`:s;};


export default function HomeworkTab({
  childId, isOwner, homework, schSubjs, schSubjIds,
  chHw, lessonsFor, upd, subj, uid,
  editC, setEditC,
  Card, Empty, CollapseBtn, Inp, Sel, Btn,
  GChip, GBadge, GPicker, SBadge,
  grades, expandedGradeId, setExpandedGradeId, chgGrade, delGrade, sc,
}) {
  const [showAddHw, setShowAddHw] = useState(false);
  const [homeworkForm, setHomeworkForm] = useState({subjectId:"",lessonId:"",task:"",due:toDay(),hwType:"hw"});
  const [showDoneHw, setShowDoneHw] = useState(false);

  const hwDueDay=(()=>{const d=sd(homeworkForm.due),i=(d.getDay()+6)%7;return i<6?DAYS[i]:null;})();
  const hwDueLessons=hwDueDay?lessonsFor(homeworkForm.due):[];
  const hwSubjIds=hwDueLessons.length?[...new Set(hwDueLessons.map(l=>l.subjectId))]:schSubjIds;

  const today = toDay();
  const activeHw = [...chHw].filter(h => !h.done && (h.date||"") >= today).sort((a,b)=>(a.date||"").localeCompare(b.date||""));
  const doneHw = [...chHw].filter(h => h.done || (h.date||"") < today).sort((a,b)=>(b.date||"").localeCompare(a.date||""));

  const HwCard = ({h, cls=""}) => (
    <Card key={h.id} cls={`${h.done?"opacity-70":""} ${h.hwType==="kr"?"border-2 border-red-300":""} ${cls}`}>
      <div className="flex items-start gap-3">
        <button onClick={()=>upd({homework:homework.map(x=>x.id===h.id?{...x,done:!x.done}:x)})}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${h.done?"bg-green-500 border-green-500 text-white":"border-slate-300 hover:border-green-400"}`}>
          {h.done&&"✓"}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {h.hwType==="kr"&&<span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">🚨 КР</span>}
            <SBadge sid={h.subjectId} subj={subj} sc={sc}/>
            {h.date&&<span className="text-xs text-slate-400">до {fmtDate(h.date)}</span>}
            {h.grade&&(isOwner?<GChip g={{id:"hw_"+h.id,hwId:h.id,value:h.grade,date:h.date||"",type:"hw"}} isOwner={isOwner} expandedGradeId={expandedGradeId} setExpandedGradeId={setExpandedGradeId} chgGrade={chgGrade} delGrade={delGrade} editC={editC} setEditC={setEditC} upd={upd} grades={grades}/>:<GBadge v={h.grade} type="hw"/>)}
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
  );

  return (
    <div>
      <div className="space-y-3 mb-4">
        {chHw.length===0
          ? <Empty txt="Заданий нет 🎉"/>
          : <>
            {activeHw.map(h=><HwCard key={h.id} h={h}/>)}
            {doneHw.length > 0 && (
              <div className="mt-2">
                <button onClick={()=>setShowDoneHw(v=>!v)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium hover:bg-slate-200">
                  <span>✓ Выполнено и просроченное ({doneHw.length})</span>
                  <span style={{transform:showDoneHw?"rotate(0)":"rotate(-90deg)",transition:"transform 0.15s",display:"inline-block"}}>⌄</span>
                </button>
                {showDoneHw && (
                  <div className="mt-2 space-y-2">
                    {doneHw.map(h=><HwCard key={h.id} h={h} cls="opacity-70"/>)}
                  </div>
                )}
              </div>
            )}
          </>
        }
      </div>
      {isOwner&&(
        <Card>
          <CollapseBtn open={showAddHw} onToggle={()=>setShowAddHw(v=>!v)} label="Добавить задание"/>
          {showAddHw&&(
            <div className="mt-3 space-y-2">
              <Inp type="date" cls="w-full" value={homeworkForm.due} onChange={e=>setHomeworkForm(p=>({...p,due:e.target.value,subjectId:"",lessonId:""}))}/>
              <div className="flex gap-2">
                <Sel cls="flex-1" value={homeworkForm.subjectId} onChange={e=>setHomeworkForm(p=>({...p,subjectId:e.target.value,lessonId:""}))}>
                  <option value="">Предмет...</option>
                  {schSubjs.filter(s=>hwSubjIds.includes(s.id)).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </Sel>
                <div className="flex gap-1">
                  <button onClick={()=>setHomeworkForm(p=>({...p,hwType:"hw"}))}
                    className={`px-3 py-2 rounded-lg text-sm border-2 transition-all ${homeworkForm.hwType!=="kr"?"bg-blue-500 text-white border-blue-500":"bg-white text-slate-500 border-slate-200"}`}>📝</button>
                  <button onClick={()=>setHomeworkForm(p=>({...p,hwType:"kr"}))}
                    className={`px-3 py-2 rounded-lg text-sm border-2 transition-all ${homeworkForm.hwType==="kr"?"bg-red-500 text-white border-red-500":"bg-white text-slate-500 border-slate-200"}`}>🚨</button>
                </div>
              </div>
              <Sel cls="w-full" value={homeworkForm.lessonId} onChange={e=>{
                const lesson=hwDueLessons.find(l=>l.id===e.target.value);
                setHomeworkForm(p=>({...p,lessonId:e.target.value,subjectId:lesson?.subjectId||p.subjectId}));
              }}>
                <option value="">Привязать к уроку (необязательно)</option>
                {hwDueLessons.filter(l=>!homeworkForm.subjectId||l.subjectId===homeworkForm.subjectId).map(l=>{
                  const s=subj(l.subjectId),dn=DAYS_FULL[DAYS.indexOf(DAYS[Math.min((sd(homeworkForm.due).getDay()+6)%7,5)])];
                  return <option key={l.id} value={l.id}>{[dn,l.lessonNum&&`${l.lessonNum} урок`,l.time].filter(Boolean).join(", ")} — {s?.name}</option>;
                })}
              </Sel>
              <div className="flex gap-2 items-end">
                <textarea className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                  placeholder={homeworkForm.hwType==="kr"?"Тема КР (необязательно)":"Что задали?"} rows={2}
                  value={homeworkForm.task} onChange={e=>setHomeworkForm(p=>({...p,task:e.target.value}))}/>
                <Btn onClick={()=>{
                  if(!homeworkForm.subjectId)return;
                  if(homeworkForm.hwType!=="kr"&&!homeworkForm.task.trim())return;
                  const taskText=homeworkForm.task.trim()||(homeworkForm.hwType==="kr"?"Контрольная работа":"");
                  upd({homework:[...homework,{id:uid(),childId,subjectId:homeworkForm.subjectId,date:homeworkForm.due,lessonId:homeworkForm.lessonId,task:taskText,hwType:homeworkForm.hwType||"hw",done:false,grade:null,comment:""}]});
                  setHomeworkForm(p=>({...p,lessonId:"",task:"",hwType:"hw"}));
                }} cls="bg-blue-500 text-white hover:bg-blue-600 mb-0.5">+</Btn>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
