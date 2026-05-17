import { useState, useRef } from "react";

const DAYS=["Пн","Вт","Ср","Чт","Пт","Сб"];
const sd=s=>new Date(s+"T00:00:00");
const toDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
const fmtDate=s=>{if(!s)return"";const p=s.split("-");return p.length===3?`${p[2]}.${p[1]}`:s;};
const isKR=t=>t==="test";
const gradeIcon=t=>isKR(t)?"📋":t==="class"?"🙋":"✏️";
const bcAvg=a=>{const n=Math.round(a||0);if(n>=5)return"#1D9E75";if(n>=4)return"#378ADD";if(n>=3)return"#EF9F27";return"#E24B4A";};
const GC={"5":"bg-green-100 text-green-700","4":"bg-blue-100 text-blue-700","3":"bg-yellow-100 text-yellow-700","2":"bg-red-100 text-red-700"};
const GC2={"5":{bg:"#EAF3DE",tc:"#3B6D11"},"4":{bg:"#E6F1FB",tc:"#185FA5"},"3":{bg:"#FAEEDA",tc:"#854F0B"},"2":{bg:"#FCEBEB",tc:"#A32D2D"}};
const gcl=v=>GC2[v]||{bg:"#f1f5f9",tc:"#64748b"};
const SEC_TITLES={last:"Последние оценки",subjs:"Успеваемость по предметам",hw:"Домашние задания"};

export default function GradesTab({
  tab, isOwner, schSubjs, schSubjIds,
  sjGrades, avgGrade, sc, GChip,
  upd, grades, uid, childId, chHw,
  selSubj, setSelSubj, setTab,
  lessonsFor,
  statsOrder, statsColl,
  setCollAndSave, setOrderAndSave,
  Card, Empty, CollapseBtn, Inp, Sel, Btn, GPicker,
  expandedGradeId, setExpandedGradeId, chgGrade, delGrade, editC, setEditC,
}) {
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [gradeForm, setGradeForm] = useState({subjectId:"",value:"5",date:toDay(),type:"class"});
  const [showHw, setShowHw] = useState(false);
  const datepickerRef = useRef(null);

  const grDayIdx = (sd(gradeForm.date).getDay()+6)%7;
  const grDayLessons = grDayIdx < 6 && lessonsFor ? lessonsFor(gradeForm.date) : [];
  const grSubjIds = grDayLessons.length
    ? [...new Set(grDayLessons.map(l => l.subjectId))]
    : (schSubjIds || schSubjs.map(s => s.id));
  const grSubjs = schSubjs.filter(s => grSubjIds.includes(s.id));

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

  // TAB 2: ОЦЕНКИ
  if (tab === 2) {
    return (
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
                  <div className="flex flex-wrap gap-2">{gs.map((g,i)=><GChip key={i} g={g} isOwner={isOwner} expandedGradeId={expandedGradeId} setExpandedGradeId={setExpandedGradeId} chgGrade={chgGrade} delGrade={delGrade} editC={editC} setEditC={setEditC} upd={upd} grades={grades}/>)}</div>
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
                    <Sel cls="flex-1" value={gradeForm.subjectId} onChange={e=>setGradeForm(p=>({...p,subjectId:e.target.value}))}>
                      <option value="">Предмет...</option>
                      {grSubjs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                    </Sel>
                    <Sel cls="w-36" value={gradeForm.type} onChange={e=>setGradeForm(p=>({...p,type:e.target.value}))}>
                      <option value="class">🙋 Устно</option>
                      <option value="test">📋 КР</option>
                      <option value="hw">✏️ Письменно</option>
                    </Sel>
                  </div>
                  <div className="flex items-center gap-2">
                    <GPicker value={gradeForm.value} onChange={v=>setGradeForm(p=>({...p,value:v||"5"}))}/>
                    <input ref={datepickerRef} type="date"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 flex-1"
                      value={gradeForm.date}
                      onChange={e=>setGradeForm(p=>({...p,date:e.target.value,subjectId:""}))}/>
                    <Btn onClick={()=>{
                      if(!gradeForm.subjectId||!gradeForm.value)return;
                      upd({grades:[...grades,{id:uid(),childId,...gradeForm,comment:"",hwId:null}]});
                      setGradeForm(p=>({...p,value:"5"}));
                      setTimeout(()=>datepickerRef.current?.focus(),0);
                    }} cls="bg-blue-500 text-white hover:bg-blue-600">+</Btn>
                  </div>
                </div>
            )}
          </Card>
        )}
      </div>
    );
  }

  // TAB 3: СТАТИСТИКА
  if (selSubj) {
    const s=schSubjs.find(x=>x.id===selSubj)||{id:selSubj,name:"?"};
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
          <div style={{background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:"14px",overflow:"hidden"}}>
            <button onClick={()=>setShowHw(v=>!v)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px",cursor:"pointer",background:"none",border:"none",textAlign:"left"}}>
              <span style={{fontSize:"13px",fontWeight:"500"}}>Домашние задания ({hw.length})</span>
              <span style={{fontSize:"11px",color:"#94a3b8",transform:showHw?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.15s",display:"inline-block"}}>⌄</span>
            </button>
            {showHw&&(
              <div className="space-y-2" style={{padding:"0 14px 14px"}}>
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
            )}
          </div>
        )}
      </div>
    );
  }

  // TAB 3: Общая статистика
  const getMonday=d=>{const x=new Date(d),dy=x.getDay();x.setDate(x.getDate()-(dy===0?6:dy-1));x.setHours(0,0,0,0);return x;};
  const weekDates=mon=>Array.from({length:6},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d;});
  const ds=d=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;};

  const ss=schSubjs.map(s=>{
    const gs=sjGrades(s.id),v=gs.map(g=>+g.value).filter(Boolean);
    const a=v.length?(v.reduce((x,y)=>x+y,0)/v.length):null;
    const r=v.slice(0,3),o=v.slice(3,6);
    const rA=r.length?r.reduce((x,y)=>x+y,0)/r.length:null;
    const oA=o.length?o.reduce((x,y)=>x+y,0)/o.length:null;
    return{s,a,n:v.length,t:rA&&oA?(rA>oA?"↑":rA<oA?"↓":"→"):"→"};
  }).filter(x=>x.n>0).sort((a,b)=>(b.a||0)-(a.a||0));
  if(!ss.length)return <Empty txt="Оценок пока нет — статистика появится после первых отметок"/>;

  const wDates=weekDates(getMonday(new Date()));
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
}
