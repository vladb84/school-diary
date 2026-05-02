  const TABS = isOwner
    ? ["📅 Расписание","📝 Задания","⭐ Оценки","📊 Статистика","🏆 Кружки","📚 Предметы","👪 Семья"]
    : ["📅 Расписание","📝 Задания","⭐ Оценки","📊 Статистика","🏆 Кружки"];



  const activeLessons = lessonsFor(aDate);
  const hwDateLessons = lessonsFor(hwF.due);
  const hwSjIds = hwDateLessons.length ? [...new Set(hwDateLessons.map(l=>l.subjectId))] : schSubjIds;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans" onClick={()=>egid&&setEgid(null)}>
      <div className="max-w-2xl mx-auto p-4" onClick={e=>e.stopPropagation()}>

        {/* Шапка */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={goSelect} className="text-slate-400 hover:text-slate-600 text-xl w-8">←</button>
          {isOwner
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
          {isOwner&&<span className="bg-amber-100 text-amber-700 rounded-xl px-2 py-1 text-xs font-medium">👨‍👩‍👧‍👦</span>}
        </div>

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
                        {isOwner&&<button onClick={()=>isOnce?upd({dateSchedule:(dateSchedule||[]).filter(x=>x.id!==l.id)}):upd({weeklyTemplate:weeklyTemplate.filter(x=>x.id!==l.id)})} className="text-slate-300 hover:text-red-400 text-lg">×</button>}
                      </div>
                    );
                  })
              }
            </Card>
            {isOwner&&(
              <Card>
                <ST>Добавить урок</ST>
                <div className="space-y-2">
                  {gradeSubjects&&<p className="text-xs text-blue-500 bg-blue-50 rounded-lg px-3 py-1.5 mb-1">🎓 Предметы для {activeCh?.grade} класса</p>}
                  <Sel cls="w-full" value={lF.subjectId} onChange={e=>setLF(p=>({...p,subjectId:e.target.value}))}>
                    <option value="">Выберите предмет...</option>
                    {gradeSubjects
                      ? availableSubjectNames.map(name=>{
                          const s=subjects.find(x=>x.name===name);
                          return <option key={name} value={s?.id||"__new__"+name}>{name}</option>;
                        })
                      : subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)
                    }
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
                      let subjId = lF.subjectId;
                      let newSubjects = subjects;
                      if(lF.subjectId.startsWith("__new__")) {
                        const name = lF.subjectId.replace("__new__","");
                        const r = getOrCreateSubject(name);
                        newSubjects = r.subjects;
                        subjId = r.subjectId;
                      }
                      if(lF.repeat) upd({subjects:newSubjects, weeklyTemplate:[...weeklyTemplate,{id:uid(),childId:cid,subjectId:subjId,day:activeDay,lessonNum:+lF.lessonNum,time:lF.time}]});
                      else upd({subjects:newSubjects, dateSchedule:[...(dateSchedule||[]),{id:uid(),childId:cid,date:aDate,subjectId:subjId,lessonNum:+lF.lessonNum,time:lF.time}]});
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
                          {h.grade&&(isOwner?<GChip g={{id:"hw_"+h.id,hwId:h.id,value:h.grade,date:h.date||"",type:"hw"}}/>:<GBadge v={h.grade}/>)}
                        </div>
                        <p className={`text-sm text-slate-700 ${h.done?"line-through":""}`}>{h.task}</p>
                        {h.comment&&<div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"><p className="text-xs text-amber-600 font-medium">💬 Родитель:</p><p className="text-xs text-amber-800 mt-0.5">{h.comment}</p></div>}
                        {isOwner&&(
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
                      {isOwner&&<button onClick={()=>upd({homework:homework.filter(x=>x.id!==h.id)})} className="text-slate-300 hover:text-red-400 text-lg">×</button>}
                    </div>
                  </Card>
                ))
              }
            </div>
            {isOwner&&(
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
            {isOwner&&<p className="text-xs text-slate-400 mb-3 text-center">Нажмите на оценку для изменения</p>}
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
            {isOwner&&(
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

        {/* ══ СТАТИСТИКА ══ */}
        {tab===4&&(()=>{
          const subjectStats = schSubjs.map(s=>{
            const gs=sjGrades(s.id);
            const vals=gs.map(g=>+g.value).filter(Boolean);
            const average=vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length):null;
            const recent=vals.slice(0,3),older=vals.slice(3,6);
            const rA=recent.length?recent.reduce((a,b)=>a+b,0)/recent.length:null;
            const oA=older.length?older.reduce((a,b)=>a+b,0)/older.length:null;
            const trend=rA&&oA?(rA>oA?"↑":rA<oA?"↓":"→"):"→";
            return {s,average,count:vals.length,trend};
          }).filter(x=>x.count>0).sort((a,b)=>(b.average||0)-(a.average||0));

          const weekStart=ds(getMonday(new Date()));
          const weekEnd=ds(wDates[5]);
          const weekHw=chHw.filter(h=>h.date>=weekStart&&h.date<=weekEnd);
          const weekDone=weekHw.filter(h=>h.done).length;
          const weekTotal=weekHw.length;
          const hwPct=weekTotal?Math.round(weekDone/weekTotal*100):0;
          const allDone=chHw.filter(h=>h.done).length;
          const allTotal=chHw.length;
          const allPct=allTotal?Math.round(allDone/allTotal*100):0;

          const best=subjectStats[0];
          const worst=subjectStats[subjectStats.length-1];

          const overallAvg=subjectStats.length
            ?(subjectStats.reduce((a,x)=>a+(x.average||0),0)/subjectStats.length).toFixed(1)
            :null;

          const totalGrades=subjectStats.reduce((a,x)=>a+x.count,0);

          const lastGrades=schSubjs
            .flatMap(s=>sjGrades(s.id).map(g=>({...g,sname:s.name})))
            .sort((a,b)=>b.date.localeCompare(a.date))
            .slice(0,10);

          const gradeColor=v=>{
            const n=+v;
            if(n>=5) return {bg:"#EAF3DE",tc:"#3B6D11"};
            if(n>=4) return {bg:"#E6F1FB",tc:"#185FA5"};
            if(n>=3) return {bg:"#FAEEDA",tc:"#854F0B"};
            return {bg:"#FCEBEB",tc:"#A32D2D"};
          };
          const barColor=avg=>{
            const n=Math.round(avg||0);
            if(n>=5) return "#1D9E75";
            if(n>=4) return "#378ADD";
            if(n>=3) return "#EF9F27";
            return "#E24B4A";
          };

          if(subjectStats.length===0) return <Empty txt="Оценок пока нет — статистика появится после первых отметок"/>;

          return (
            <div>
              {/* Герой */}
              <div style={{background:"#185FA5",borderRadius:"18px",padding:"20px",marginBottom:"14px"}}>
                <p style={{fontSize:"11px",color:"rgba(255,255,255,0.6)",margin:"0 0 4px",letterSpacing:"0.5px"}}>СРЕДНИЙ БАЛЛ</p>
                <p style={{fontSize:"42px",fontWeight:"500",color:"#fff",margin:"0",lineHeight:"1"}}>{overallAvg||"—"}</p>
                <p style={{fontSize:"12px",color:"rgba(255,255,255,0.65)",margin:"6px 0 0"}}>по всем предметам</p>
                <div style={{display:"flex",gap:"20px",marginTop:"18px",paddingTop:"16px",borderTop:"1px solid rgba(255,255,255,0.15)"}}>
                  <div><div style={{fontSize:"18px",fontWeight:"500",color:"#fff"}}>{totalGrades}</div><div style={{fontSize:"11px",color:"rgba(255,255,255,0.55)"}}>оценок</div></div>
                  <div><div style={{fontSize:"18px",fontWeight:"500",color:"#fff"}}>{allPct}%</div><div style={{fontSize:"11px",color:"rgba(255,255,255,0.55)"}}>ДЗ выполнено</div></div>
                  <div><div style={{fontSize:"18px",fontWeight:"500",color:"#fff"}}>{subjectStats.length}</div><div style={{fontSize:"11px",color:"rgba(255,255,255,0.55)"}}>предметов</div></div>
                </div>
              </div>

              {/* Лучший / подтянуть */}
              {subjectStats.length>1&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
                  <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderLeft:"3px solid #1D9E75",borderRadius:"14px",padding:"14px"}}>
                    <p style={{fontSize:"11px",color:"var(--color-text-tertiary)",margin:"0 0 5px"}}>Лучший предмет</p>
                    <p style={{fontSize:"13px",fontWeight:"500",color:"var(--color-text-primary)",margin:"0 0 5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{best.s.name}</p>
                    <p style={{fontSize:"26px",fontWeight:"500",color:"#1D9E75",margin:"0"}}>{best.average?.toFixed(1)}</p>
                  </div>
                  <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderLeft:"3px solid #E24B4A",borderRadius:"14px",padding:"14px"}}>
                    <p style={{fontSize:"11px",color:"var(--color-text-tertiary)",margin:"0 0 5px"}}>Подтянуть</p>
                    <p style={{fontSize:"13px",fontWeight:"500",color:"var(--color-text-primary)",margin:"0 0 5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{worst.s.name}</p>
                    <p style={{fontSize:"26px",fontWeight:"500",color:"#E24B4A",margin:"0"}}>{worst.average?.toFixed(1)}</p>
                  </div>
                </div>
              )}

              {/* Предметы */}
              <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"14px",padding:"14px",marginBottom:"14px"}}>
                <p style={{fontSize:"13px",fontWeight:"500",color:"var(--color-text-primary)",margin:"0 0 12px"}}>Успеваемость по предметам</p>
                {subjectStats.map(({s,average,count,trend})=>(
                  <div key={s.id} style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
                    <span style={{fontSize:"12px",color:"var(--color-text-secondary)",flex:"1",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span>
                    <span style={{fontSize:"12px",color:barColor(average),width:"14px",textAlign:"center"}}>{trend}</span>
                    <div style={{flex:"1",maxWidth:"90px",background:"var(--color-background-secondary)",borderRadius:"99px",height:"5px"}}>
                      <div style={{height:"5px",borderRadius:"99px",background:barColor(average),width:`${((average||0)/5)*100}%`}}/>
                    </div>
                    <span style={{fontSize:"13px",fontWeight:"500",minWidth:"30px",textAlign:"right",color:barColor(average)}}>{average?.toFixed(1)}</span>
                  </div>
                ))}
              </div>

              {/* ДЗ */}
              <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"14px",padding:"14px",marginBottom:"14px"}}>
                <p style={{fontSize:"13px",fontWeight:"500",color:"var(--color-text-primary)",margin:"0 0 12px"}}>Домашние задания</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
                  <div style={{background:"var(--color-background-secondary)",borderRadius:"10px",padding:"10px",textAlign:"center"}}>
                    <div style={{fontSize:"22px",fontWeight:"500",color:"var(--color-text-primary)"}}>{weekTotal>0?`${hwPct}%`:"—"}</div>
                    <div style={{fontSize:"11px",color:"var(--color-text-tertiary)"}}>эта неделя</div>
                    {weekTotal>0&&<div style={{fontSize:"11px",color:"var(--color-text-tertiary)"}}>{weekDone} из {weekTotal}</div>}
                  </div>
                  <div style={{background:"var(--color-background-secondary)",borderRadius:"10px",padding:"10px",textAlign:"center"}}>
                    <div style={{fontSize:"22px",fontWeight:"500",color:"var(--color-text-primary)"}}>{allTotal>0?`${allPct}%`:"—"}</div>
                    <div style={{fontSize:"11px",color:"var(--color-text-tertiary)"}}>всего</div>
                    {allTotal>0&&<div style={{fontSize:"11px",color:"var(--color-text-tertiary)"}}>{allDone} из {allTotal}</div>}
                  </div>
                </div>
                {weekTotal>0&&(
                  <div style={{background:"var(--color-background-secondary)",borderRadius:"99px",height:"7px"}}>
                    <div style={{height:"7px",borderRadius:"99px",background:"#1D9E75",width:`${hwPct}%`}}/>
                  </div>
                )}
              </div>

              {/* Последние оценки */}
              {lastGrades.length>0&&(
                <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"14px",padding:"14px"}}>
                  <p style={{fontSize:"13px",fontWeight:"500",color:"var(--color-text-primary)",margin:"0 0 12px"}}>Последние оценки</p>
                  <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
                    {lastGrades.map((g,i)=>{
                      const {bg,tc}=gradeColor(g.value);
                      return (
                        <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px"}}>
                          <div style={{width:"34px",height:"34px",borderRadius:"9px",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"15px",fontWeight:"500",color:tc}}>{g.value}</div>
                          <div style={{fontSize:"10px",color:"var(--color-text-tertiary)"}}>{g.sname?.split(" ")[0]?.slice(0,4)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ══ КРУЖКИ ══ */}
        {tab===4&&(
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
                        {isOwner&&(
                          <div className="flex gap-2 mt-2 items-end">
                            <textarea className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs flex-1 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" placeholder="Комментарий..." rows={2}
                              value={editC["c_"+c.id]??c.comment} onChange={e=>setEditC(p=>({...p,["c_"+c.id]:e.target.value}))}/>
                            <button onClick={()=>{upd({clubs:clubs.map(x=>x.id===c.id?{...x,comment:editC["c_"+c.id]??c.comment}:x)});setEditC(p=>({...p,["c_"+c.id]:undefined}));}} className="bg-amber-400 text-white rounded-lg px-3 py-1.5 text-xs mb-0.5">💾</button>
                          </div>
                        )}
                      </div>
                      {isOwner&&<button onClick={()=>upd({clubs:clubs.filter(x=>x.id!==c.id)})} className="text-slate-300 hover:text-red-400 text-lg">×</button>}
                    </div>
                  </Card>
                ))
              }
            </div>
            {isOwner&&(
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
        {tab===6&&isOwner&&(
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

        {/* ══ СЕМЬЯ ══ */}
        {tab===6&&isOwner&&(
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

            {/* Профили детей */}
            <div className="space-y-3 mb-4">
              {children.length===0?<Empty txt="Детей нет — добавьте первого"/>
                : children.map(ch=>(
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
                ))
              }
            </div>

            {/* Добавить ребёнка */}
            <Card cls="mb-4">
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

            {/* Опасная зона */}
            <Card cls="border border-red-100">
              <ST>⚠️ Опасная зона</ST>
              <p className="text-xs text-slate-400 mb-3">Удаление семьи сотрёт все данные безвозвратно.</p>
              <button onClick={deleteFamily}
                className="w-full bg-red-50 text-red-500 border border-red-200 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-red-100 transition-all">
                🗑 Удалить семью и все данные
              </button>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
