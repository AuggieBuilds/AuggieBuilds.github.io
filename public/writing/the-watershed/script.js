(() => {
  'use strict';
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => [...c.querySelectorAll(s)];
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // Header, progress, section labels
  const progressBar = $('#progressBar');
  const header = $('#siteHeader');
  const activeAct = $('#activeAct');
  const activeSection = $('#activeSection');
  let lastY = window.scrollY;
  const onScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - innerHeight;
    if (progressBar) progressBar.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    if (header && scrollY > 500) {
      header.classList.toggle('hidden', scrollY > lastY && scrollY - lastY > 4);
    } else header?.classList.remove('hidden');
    lastY = scrollY;
  };
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  const sections = $$('.essay-section');
  const acts = {1:'Act I · How the Watershed Works',2:'Act II · Industrial Succession',3:'Act III · Follow the Dollar',4:'Act IV · Modern Systems',5:'Act V · People',6:'Act VI · Closing'};
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
    if (!visible) return;
    const s = visible.target;
    activeAct.textContent = acts[s.dataset.act] || 'The Watershed';
    activeSection.textContent = `Section ${String(s.dataset.section).padStart(2,'0')}`;
  }, {rootMargin:'-20% 0px -60%',threshold:[0,.1,.3]});
  sections.forEach(s => observer.observe(s));

  // TOC
  const toc = $('#toc'), scrim = $('#scrim');
  const toggleToc = open => {
    toc?.classList.toggle('open', open); scrim?.classList.toggle('open', open);
    toc?.setAttribute('aria-hidden', String(!open)); document.body.style.overflow = open ? 'hidden' : '';
  };
  $('#tocOpen')?.addEventListener('click', () => toggleToc(true));
  $('#tocClose')?.addEventListener('click', () => toggleToc(false));
  scrim?.addEventListener('click', () => toggleToc(false));
  $$('#toc a').forEach(a => a.addEventListener('click', () => toggleToc(false)));
  addEventListener('keydown', e => { if(e.key === 'Escape') toggleToc(false); });

  // Theme
  const themeKey = 'watershed-theme';
  let savedTheme = null;
  try { savedTheme = localStorage.getItem(themeKey); } catch (_) {}
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  $('#themeToggle')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'paper' : 'dark';
    document.documentElement.dataset.theme = next; try { localStorage.setItem(themeKey,next); } catch (_) {}
  });
  $('#copyLink')?.addEventListener('click', async e => {
    try { await navigator.clipboard.writeText(location.href.split('#')[0]); e.currentTarget.textContent='Copied'; }
    catch { e.currentTarget.textContent='Copy failed'; }
    setTimeout(()=>e.currentTarget.textContent='Copy essay link',1600);
  });

  // Bathtub — City Capacity historical model (all values load from city-capacity-data.js)
  const tubRoot=$('.bathtub-module');
  if(tubRoot&&window.CITY_DATABASE){
    const DB=window.CITY_DATABASE,Y0=1970,Y1=2020,SPAN=Y1-Y0;
    const state={city:DB.order[0],year:Y1,speed:1,playing:false,lastFrame:null,frame:null,overlay:null};
    const svgNS='http://www.w3.org/2000/svg';
    const svgEl=(tag,attrs,parent)=>{const node=document.createElementNS(svgNS,tag);Object.entries(attrs||{}).forEach(([k,v])=>node.setAttribute(k,v));parent&&parent.append(node);return node;};
    const svgTitle=(node,text)=>{const t=document.createElementNS(svgNS,'title');t.textContent=text;node.append(t);};
    const interp=(pts,t,getYear,getValue)=>{
      if(t<=getYear(pts[0]))return getValue(pts[0]);
      for(let i=1;i<pts.length;i++){
        if(t<=getYear(pts[i])){
          const a=getYear(pts[i-1]),b=getYear(pts[i]);
          return getValue(pts[i-1])+(getValue(pts[i])-getValue(pts[i-1]))*((t-a)/(b-a));
        }
      }
      return getValue(pts[pts.length-1]);
    };
    const city=()=>DB.cities[state.city];
    const scaleMax=()=>Math.max(110,...city().cci.map(p=>p[2]+p[3]))*1.04;
    const chartX=year=>48+((year-Y0)/SPAN)*552;
    const chartY=value=>180-(value/scaleMax())*160;
    const cciAt=t=>interp(city().cci,t,p=>p[0],p=>p[2]);
    const uncAt=t=>interp(city().cci,t,p=>p[0],p=>p[3]);
    const confAt=t=>interp(city().cci,t,p=>p[0],p=>p[4]);
    const qualifierNote=q=>q==='≈'?' (approximate)':q==='<'?' (upper bound)':q==='≈yr'?' (approximate year)':'';
    const fmtSeries=(series,value,q)=>{
      let out;
      if(series.unit.indexOf('dollars')>=0){const dollars=value*1000;out=dollars>=1e9?`$${(dollars/1e9).toFixed(2)}B`:`$${Math.round(dollars/1e6)}M`;}
      else if(series.unit==='people')out=value>=1e6?`${(value/1e6).toFixed(2)}M`:`${Math.round(value/1000)}K`;
      else out=`${value}%`;
      return `${q&&q!=='≈yr'?q:''}${out}`;
    };
    // Build city selector and attribute rows from the database
    const cityButtons=$('#tubCityButtons');
    DB.order.forEach(id=>{
      const button=document.createElement('button');
      button.type='button';button.dataset.tubCity=id;button.textContent=DB.cities[id].name;
      button.addEventListener('click',()=>{state.city=id;state.overlay=null;state.year=Y0;renderCity();setPlaying(true);});
      cityButtons.append(button);
    });
    const attrList=$('#attrList');
    DB.attrs.forEach((attr,i)=>{
      const row=document.createElement('div');row.className='attr-row';
      row.innerHTML=`<span class="attr-label">${attr.label} <em>${Math.round(attr.w*100)}%</em><b data-attr-value="${i}"></b></span><span class="attr-track"><i data-attr-fill="${i}"></i></span>`;
      attrList.append(row);
    });
    const renderOverlay=()=>{
      const c=city(),layer=$('#tubOverlay');layer.replaceChildren();
      $$('#overlayRow button').forEach(b=>b.classList.toggle('active',(b.dataset.overlayId||null)===state.overlay));
      const series=c.series.find(x=>x.id===state.overlay);
      const note=$('#tubOverlayNote');note.hidden=!series;
      if(!series){note.textContent='';return;}
      const values=series.points.map(p=>p.v);
      const mn=Math.min(...values),mx=Math.max(...values),span=(mx-mn)||1;
      const oy=v=>168-((v-mn)/span)*130;
      svgEl('polyline',{class:'chart-overlay',points:series.points.map(p=>`${chartX(p.y).toFixed(1)},${oy(p.v).toFixed(1)}`).join(' ')},layer);
      series.points.forEach(p=>{
        const dot=svgEl('circle',{class:'chart-overlay-dot',cx:chartX(p.y).toFixed(1),cy:oy(p.v).toFixed(1),r:'3.5',tabindex:'0'},layer);
        svgTitle(dot,`${p.y} · ${fmtSeries(series,p.v,p.q)} · ${series.type}${qualifierNote(p.q)}`);
      });
      const first=series.points[0],last=series.points[series.points.length-1];
      const startLabel=svgEl('text',{class:'chart-overlay-label',x:(chartX(first.y)+6).toFixed(1),y:(oy(first.v)-8).toFixed(1)},layer);
      startLabel.textContent=`${first.y}: ${fmtSeries(series,first.v,first.q)}`;
      const endLabel=svgEl('text',{class:'chart-overlay-label','text-anchor':'end',x:(chartX(last.y)-6).toFixed(1),y:(oy(last.v)-8).toFixed(1)},layer);
      endLabel.textContent=`${last.y}: ${fmtSeries(series,last.v,last.q)}`;
      const srcObj=c.sources.find(x=>x.id===series.src);
      note.textContent=`${series.label} — ${series.type} · ${series.unit}. ${series.note} Source: ${srcObj?srcObj.publisher:series.src}.`;
    };
    const renderFrame=()=>{
      const c=city(),max=scaleMax();
      const value=cciAt(state.year),unc=uncAt(state.year),conf=confAt(state.year);
      const hi=Math.min(state.year+1,Y1),lo=Math.max(state.year-1,Y0);
      const slope=(cciAt(hi)-cciAt(lo))/Math.max(.5,hi-lo);
      const rising=slope>=.05,falling=slope<=-.05;
      const streamStrength=clamp(.25+Math.abs(slope)/6,.25,1);
      $('#tubWater').style.height=`${(value/max)*100}%`;
      $('#bathtubStage').style.setProperty('--inflow-strength',(rising?streamStrength:.1).toFixed(2));
      $('#bathtubStage').style.setProperty('--outflow-strength',(falling?streamStrength:.1).toFixed(2));
      $('#tubYearHero').textContent=Math.round(state.year);
      $('#tubReadIndex').textContent=value.toFixed(1);
      $('#tubReadUnc').textContent=`±${unc.toFixed(1)}`;
      $('#tubReadConf').textContent=conf.toFixed(2);
      const nearBenchmark=c.cci.some(p=>Math.abs(p[0]-state.year)<=.25);
      $('#tubReadType').textContent=nearBenchmark?'Constructed':'Interpolated';
      $('#tubReadNet').textContent=`${slope>0?'+':slope<0?'−':''}${Math.abs(slope).toFixed(1)}/yr`;
      $('#tubReadYear').textContent=Math.round(state.year);
      $('#tubTimeNumber').value=state.year.toFixed(1);
      $('#tubTimeRange').value=state.year.toFixed(2);
      const elapsed=c.cci.filter(p=>p[0]<=state.year).map(p=>({x:chartX(p[0]),y:chartY(p[2])}));
      elapsed.push({x:chartX(state.year),y:chartY(value)});
      $('#tubChartElapsed').setAttribute('d',elapsed.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '));
      $('#tubChartMarker').setAttribute('cx',chartX(state.year).toFixed(1));
      $('#tubChartMarker').setAttribute('cy',chartY(value).toFixed(1));
      const attrRows=Object.keys(c.attrPoints).map(k=>[+k,c.attrPoints[k]]).sort((a,b)=>a[0]-b[0]);
      const attrMax=Math.max(...attrRows.map(r=>Math.max(...r[1])))*1.05;
      DB.attrs.forEach((_,i)=>{
        const attrValue=interp(attrRows,state.year,r=>r[0],r=>r[1][i]);
        $(`[data-attr-value="${i}"]`,tubRoot).textContent=attrValue.toFixed(0);
        $(`[data-attr-fill="${i}"]`,tubRoot).style.width=`${(attrValue/attrMax)*100}%`;
      });
      let ann=c.annotations[0];
      c.annotations.forEach(a=>{if(a.y<=state.year+.001)ann=a;});
      const annSrc=c.sources.find(x=>x.id===ann.src);
      $('#tubDirection').textContent=`${ann.y} · Timeline`;
      $('#tubBalance').textContent=ann.title;
      $('#tubExplain').textContent=ann.text;
      $('#tubConstraint').innerHTML=annSrc?`Source: <a href="${annSrc.url}" rel="noopener" target="_blank">${annSrc.publisher}</a>`:'';
    };
    const renderCity=()=>{
      const c=city(),max=scaleMax();
      $$('button[data-tub-city]',tubRoot).forEach(b=>b.classList.toggle('active',b.dataset.tubCity===state.city));
      $('#tubAxisMax').textContent=Math.round(max);
      $('#tubAxisMid').textContent=Math.round(max/2);
      const upper=c.cci.map(p=>`${chartX(p[0]).toFixed(1)} ${chartY(p[2]+p[3]).toFixed(1)}`);
      const lower=c.cci.slice().reverse().map(p=>`${chartX(p[0]).toFixed(1)} ${chartY(Math.max(0,p[2]-p[3])).toFixed(1)}`);
      $('#tubChartBand').setAttribute('d',`M${upper.join(' L')} L${lower.join(' L')} Z`);
      $('#tubChartFuture').setAttribute('d',c.cci.map((p,i)=>`${i?'L':'M'}${chartX(p[0]).toFixed(1)} ${chartY(p[2]).toFixed(1)}`).join(' '));
      const bench=$('#tubBenchmarks');bench.replaceChildren();
      c.cci.forEach(p=>{
        const dot=svgEl('circle',{class:'chart-benchmark',cx:chartX(p[0]).toFixed(1),cy:chartY(p[2]).toFixed(1),r:'4.5',tabindex:'0'},bench);
        svgTitle(dot,`${p[0]} · ${p[1]} ±${p[3]} index points · constructed benchmark · confidence ${p[4].toFixed(2)} · weighted sum of seven attributes`);
      });
      const overlayRow=$('#overlayRow');
      $$('button',overlayRow).forEach(b=>b.remove());
      if(c.series.length){
        overlayRow.hidden=false;
        [{id:null,label:'None'}].concat(c.series).forEach(entry=>{
          const button=document.createElement('button');
          button.type='button';button.textContent=entry.label;
          if(entry.id)button.dataset.overlayId=entry.id;
          button.addEventListener('click',()=>{state.overlay=entry.id;renderOverlay();});
          overlayRow.append(button);
        });
      }else overlayRow.hidden=true;
      $('#tubGeography').textContent=`${c.region}. ${c.geographyNote}`;
      $('#tubSources').innerHTML='Sources: '+c.sources.map(src=>`<a href="${src.url}" rel="noopener" target="_blank">${src.title} — ${src.publisher}</a>`).join(' · ');
      $('#tubHeadline').textContent=c.headline;
      renderOverlay();
      renderFrame();
    };
    const setPlaying=playing=>{
      state.playing=playing;
      state.lastFrame=null;
      $('#tubPlay').disabled=playing;
      $('#tubPause').disabled=!playing;
      if(!playing&&state.frame){cancelAnimationFrame(state.frame);state.frame=null;}
      if(playing)state.frame=requestAnimationFrame(tick);
    };
    const tick=timestamp=>{
      if(!state.playing)return;
      if(state.lastFrame!==null){
        const elapsedSeconds=Math.min((timestamp-state.lastFrame)/1000,.25);
        state.year=clamp(state.year+elapsedSeconds*4*state.speed,Y0,Y1);
        renderFrame();
        if(state.year>=Y1){setPlaying(false);return;}
      }
      state.lastFrame=timestamp;
      state.frame=requestAnimationFrame(tick);
    };
    $('#tubPlay').addEventListener('click',()=>{if(state.year>=Y1)state.year=Y0;setPlaying(true);});
    $('#tubPause').addEventListener('click',()=>setPlaying(false));
    $('#tubReset').addEventListener('click',()=>{setPlaying(false);state.year=Y0;renderFrame();});
    const scrubTo=value=>{setPlaying(false);state.year=clamp(value,Y0,Y1);renderFrame();};
    $('#tubTimeRange').addEventListener('input',()=>scrubTo(+$('#tubTimeRange').value));
    $('#tubTimeRange').addEventListener('change',()=>scrubTo(+$('#tubTimeRange').value));
    $('#tubTimeNumber').addEventListener('input',()=>scrubTo(+$('#tubTimeNumber').value||Y0));
    $('#tubTimeNumber').addEventListener('change',()=>scrubTo(+$('#tubTimeNumber').value||Y0));
    $$('[data-tub-speed]',tubRoot).forEach(button=>button.addEventListener('click',()=>{
      state.speed=+button.dataset.tubSpeed;
      $$('[data-tub-speed]',tubRoot).forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    }));
    renderCity();
  }

  // Watershed path-dependence model
  const watershedRoot=$('.watershed-evolution');
  if(watershedRoot){
    const watershedStates={
      1:{strongShare:50,aFlow:.54,bFlow:.56,valley:.16,contours:.36,capacity:.08,message:'Initial funding is distributed across a landscape with relatively small differences in capacity.',routes:['a','b','a','b','a','b','a','b']},
      10:{strongShare:70,aFlow:.40,bFlow:.76,valley:.42,contours:.52,capacity:.56,message:'Prior awards have widened one channel, making that region better positioned to attract and absorb later funding.',routes:['b','a','b','b','a','b','b','b','a','b']},
      50:{strongShare:90,aFlow:.20,bFlow:1,valley:.78,contours:.70,capacity:1,message:'Repeated awards have built a durable ecosystem around the stronger channel, while weaker channels receive progressively less reinforcement.',routes:['b','b','b','b','a','b','b','b','b','b']}
    };
    const watershedGeometry={
      trunk:{
        1:'M 496 35 C 491 80 502 104 494 136 C 486 166 494 193 510 216 C 520 231 523 245 520 258 L 535 262 C 540 241 535 222 523 205 C 511 187 507 165 514 140 C 523 106 514 78 511 35 Z',
        10:'M 493 35 C 487 80 499 105 490 137 C 481 168 490 197 507 221 C 518 237 520 249 516 263 L 539 268 C 545 243 539 219 527 201 C 515 183 512 163 519 138 C 528 104 516 77 514 35 Z',
        50:'M 489 35 C 483 81 495 107 486 139 C 477 171 485 201 503 227 C 514 243 516 254 511 268 L 544 275 C 552 243 545 215 531 196 C 519 179 517 160 524 136 C 533 102 519 76 517 35 Z'
      },
      a:{
        1:'M 520 242 C 484 252 453 269 424 296 C 397 321 377 354 356 389 C 336 423 315 458 286 493 L 304 505 C 337 467 359 431 378 399 C 398 366 417 337 442 313 C 466 290 495 276 530 265 Z',
        10:'M 522 246 C 486 257 456 273 429 299 C 402 325 382 357 361 392 C 342 425 320 460 292 497 L 302 504 C 333 465 354 429 373 397 C 393 363 413 333 439 309 C 464 286 494 272 531 260 Z',
        50:'M 524 249 C 489 260 459 276 432 302 C 405 328 385 360 365 394 C 346 427 325 462 297 500 L 302 503 C 331 464 352 428 371 396 C 391 361 411 331 437 307 C 463 283 493 269 532 257 Z'
      },
      b:{
        1:'M 525 241 C 568 247 601 266 628 294 C 653 320 670 349 688 381 C 708 416 732 449 765 490 L 784 475 C 750 434 728 403 709 369 C 690 335 672 305 644 277 C 614 247 578 229 535 222 Z',
        10:'M 523 237 C 568 242 605 261 634 290 C 661 317 679 347 698 380 C 719 416 743 449 778 491 L 804 470 C 767 427 745 397 726 362 C 706 326 686 295 654 265 C 620 233 580 215 534 209 Z',
        50:'M 518 231 C 568 235 610 254 643 285 C 672 313 692 344 712 378 C 734 415 759 449 796 493 L 829 465 C 790 422 769 392 748 354 C 725 315 702 282 665 249 C 626 214 581 197 532 195 Z'
      }
    };
    const watershedRoutes={
      a:'M 505 38 C 500 92 501 145 515 205 C 514 239 477 262 436 299 C 397 334 365 397 298 496',
      b:'M 505 38 C 500 92 501 145 515 205 C 548 234 603 249 642 291 C 684 337 710 405 810 480'
    };
    const canvas=$('#watershedCanvas'),cycleMessage=$('#cycleMessage');
    const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
    let watershedCycle=1,watershedFrame=null;
    const pathNumberPattern=/-?\d*\.?\d+/g;
    const morphWatershed=(cycle,animate=true)=>{
      const targets=['trunk','a','b'].map(key=>({node:$(`[data-river-shape="${key}"]`,watershedRoot),d:watershedGeometry[key][cycle]})).filter(item=>item.node);
      if(!targets.length)return;
      if(watershedFrame)cancelAnimationFrame(watershedFrame);
      if(!animate||reducedMotion.matches){targets.forEach(item=>item.node.setAttribute('d',item.d));return;}
      const starts=targets.map(item=>[...(item.node.getAttribute('d')||item.d).matchAll(pathNumberPattern)].map(match=>+match[0]));
      const ends=targets.map(item=>[...item.d.matchAll(pathNumberPattern)].map(match=>+match[0]));
      const startTime=performance.now(),duration=1100;
      const frame=now=>{
        const raw=clamp((now-startTime)/duration,0,1),progress=raw*raw*(3-2*raw);
        targets.forEach((item,targetIndex)=>{let numberIndex=0;item.node.setAttribute('d',item.d.replace(pathNumberPattern,()=>String(starts[targetIndex][numberIndex]+(ends[targetIndex][numberIndex++]-starts[targetIndex][numberIndex-1])*progress)));});
        if(raw<1)watershedFrame=requestAnimationFrame(frame);
      };
      watershedFrame=requestAnimationFrame(frame);
    };
    const renderFundingMarkers=state=>{
      const layer=$('#fundingMarkers',watershedRoot);
      if(!layer)return;
      layer.replaceChildren();
      state.routes.forEach((route,index)=>{
        const marker=document.createElementNS('http://www.w3.org/2000/svg','circle');
        marker.setAttribute('class','funding-marker');marker.setAttribute('r',index%3===0?'6':'4.5');
        if(reducedMotion.matches){
          marker.setAttribute('cx',route==='b'?'810':'298');marker.setAttribute('cy',route==='b'?'480':'496');
        }else{
          const motion=document.createElementNS('http://www.w3.org/2000/svg','animateMotion');
          motion.setAttribute('path',watershedRoutes[route]);motion.setAttribute('dur','2.8s');motion.setAttribute('begin',`${(index*.17).toFixed(2)}s`);motion.setAttribute('fill','freeze');motion.setAttribute('calcMode','spline');motion.setAttribute('keyTimes','0;1');motion.setAttribute('keySplines','.25 .1 .25 1');
          marker.append(motion);
        }
        layer.append(marker);
      });
    };
    const applyWatershedCycle=(cycle,animate=true)=>{
      const state=watershedStates[cycle];if(!state)return;
      watershedCycle=cycle;canvas.dataset.cycle=String(cycle);
      canvas.style.setProperty('--a-flow',state.aFlow);canvas.style.setProperty('--b-flow',state.bFlow);canvas.style.setProperty('--valley-depth',state.valley);canvas.style.setProperty('--contour-strength',state.contours);canvas.style.setProperty('--capacity-strength',state.capacity);
      canvas.style.setProperty('--a-valley-width',`${22+34*state.aFlow}px`);canvas.style.setProperty('--b-valley-width',`${28+62*state.bFlow}px`);
      canvas.style.setProperty('--a-valley-opacity',.08+state.valley*.12);canvas.style.setProperty('--b-valley-opacity',.1+state.valley*.34);canvas.style.setProperty('--basin-b-opacity',.35+state.valley*.18);canvas.style.setProperty('--contour-width',`${1+state.valley*1.3}px`);
      canvas.style.setProperty('--a-source-width',`${1+state.aFlow*2}px`);canvas.style.setProperty('--a-middle-width',`${2+state.aFlow*4}px`);canvas.style.setProperty('--a-mouth-width',`${3+state.aFlow*7}px`);
      canvas.style.setProperty('--b-source-width',`${1+state.bFlow*3}px`);canvas.style.setProperty('--b-middle-width',`${2+state.bFlow*6}px`);canvas.style.setProperty('--b-mouth-width',`${4+state.bFlow*9}px`);
      canvas.style.setProperty('--river-a-opacity',.58+state.aFlow*.42);canvas.style.setProperty('--river-b-opacity',.62+state.bFlow*.38);canvas.style.setProperty('--a-highlight-width',`${.8+state.aFlow*1.4}px`);canvas.style.setProperty('--b-highlight-width',`${1+state.bFlow*2.2}px`);
      cycleMessage.textContent=state.message;
      $('#watershedShare',watershedRoot)?.replaceChildren(document.createTextNode(`${state.strongShare}% of new awards follow the stronger channel`));
      $$('[data-cycle]',watershedRoot).forEach(button=>{const selected=button.dataset.cycle===String(cycle);button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));});
      morphWatershed(cycle,animate);renderFundingMarkers(state);
      const capacity=$('#watershedCapacity',watershedRoot);if(capacity){capacity.classList.remove('arriving');void capacity.getBoundingClientRect();capacity.classList.add('arriving');}
    };
    $$('[data-cycle]',watershedRoot).forEach(button=>button.addEventListener('click',()=>applyWatershedCycle(+button.dataset.cycle)));
    reducedMotion.addEventListener?.('change',()=>applyWatershedCycle(watershedCycle,false));
    applyWatershedCycle(1,false);
  }

  // $100 discrete decision model
  const choiceValues={
    housing:{local:13,remote:7},groceries:{local:8,remote:5},banking:{local:4,remote:1},services:{local:10,remote:5}
  };
  const renderCoins=(node,n)=>{ if(!node)return; node.innerHTML=''; for(let i=0;i<Math.round(n/3);i++){const dot=document.createElement('i');node.append(dot);} };
  const updateHundred=()=>{
    let local=9; // Illustrative local portion of taxes/retirement and immediate administration
    $$('#choiceList .choice-row').forEach(row=>{
      const key=row.dataset.key; const active=$('button.active',row); local += choiceValues[key]?.[active?.dataset.value] ?? 0;
    });
    local=clamp(local,0,100); const leave=100-local;
    $('#localPoolValue').textContent=`$${local}`;$('#leavePoolValue').textContent=`$${leave}`;
    $('#localPoolFill').style.height=`${local}%`;$('#leavePoolFill').style.height=`${leave}%`;
    renderCoins($('#localCoins'),local);renderCoins($('#leaveCoins'),leave);
  };
  $$('#choiceList button').forEach(btn=>btn.addEventListener('click',()=>{
    const row=btn.closest('.choice-row');$$('button',row).forEach(b=>b.classList.toggle('active',b===btn));updateHundred();
  }));updateHundred();

  // Retirement civic balance sheet
  const base={independence:35,mobility:30,connection:25,care:35};
  const updateRetirement=()=>{
    const scores={...base};let selected=0;
    $$('#infraChoices button.active').forEach(btn=>{
      selected++; const impacts=(btn.dataset.impact||'').split(','); impacts.forEach(k=>{if(k in scores)scores[k]+=12});
    });
    Object.keys(scores).forEach(k=>{
      scores[k]=clamp(scores[k],0,95); const cap=k[0].toUpperCase()+k.slice(1); const bar=$(`#${k}Bar`),out=$(`#${k}Out`);
      if(bar) bar.style.width=`${scores[k]}%`; if(out)out.textContent=scores[k];
    });
    $('#civicStatus').textContent=selected===0?'Thin support network':selected<3?'Improving support network':selected<5?'Strong age-friendly network':'Integrated age-friendly system';
  };
  $$('#infraChoices button').forEach(btn=>btn.addEventListener('click',()=>{btn.classList.toggle('active');updateRetirement()}));updateRetirement();

  // Healthcare ownership routing
  const health=$('.healthcare-flow');
  $$('.ownership-toggle button').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.ownership-toggle button').forEach(b=>b.classList.toggle('active',b===btn));
    const mode=btn.dataset.owner; if(health)health.dataset.owner=mode;
    $('#marginText').textContent=mode==='anchored'?'Residual margin and strategic control are more likely to loop back into facilities, programs, and regional capacity.':'Payroll and operations can remain local, while more residual margin, debt service, or strategic control can leave the region.';
  }));

  // Sunlight model
  const sun=$('#sunRange');
  const updateSun=()=>{
    if(!sun)return; const value=+sun.value;$('#sunOut').textContent=`${value}%`;$('#forestScene').style.setProperty('--sun',value/100);
    let state,headline,text;
    if(value<35){state='Scarce opportunity';headline='Branches fight for a narrow beam.';text='When only a few projects are visible, firms protect each opportunity aggressively and weak branches lose support.'}
    else if(value<70){state='Stable opportunity';headline='The existing canopy can survive.';text='Competition remains, but enough future work is visible for reputation and repeated relationships to matter.'}
    else{state='Deep opportunity';headline='The whole canopy can grow.';text='A broader opportunity pipeline supports new branches, deeper roots, specialization, and cooperation without eliminating competition.'}
    $('#sunState').textContent=state;$('#sunHeadline').textContent=headline;$('#sunText').textContent=text;
  };
  sun?.addEventListener('input',updateSun);updateSun();

  // Succession loop
  const succession=$('#successionLoop');
  $$('.succession-toggle button').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.succession-toggle button').forEach(b=>b.classList.toggle('active',b===btn));
    const mode=btn.dataset.succession;succession.dataset.mode=mode;
    if(mode==='compound'){
      $('#loopCenter1').textContent='The region converts the flow';$('#loopCenter2').textContent='Wages, taxes, suppliers, skills, infrastructure, and independent successors reinforce one another.';$('#loopScore').textContent='Durable capacity: building';
    }else{
      $('#loopCenter1').textContent='The region hosts the flow';$('#loopCenter2').textContent='Construction occurs, but ownership, equipment, profits, and skills remain weakly anchored.';$('#loopScore').textContent='Durable capacity: limited';
    }
  }));

  // Tooltips
  const tooltip=$('#tooltip');
  $$('.info-dot').forEach(dot=>{
    const show=e=>{tooltip.textContent=dot.dataset.tip||'';tooltip.classList.add('show');const r=dot.getBoundingClientRect();tooltip.style.left=`${clamp(r.left,10,innerWidth-300)}px`;tooltip.style.top=`${clamp(r.bottom+8,10,innerHeight-100)}px`;};
    dot.addEventListener('mouseenter',show);dot.addEventListener('focus',show);dot.addEventListener('mouseleave',()=>tooltip.classList.remove('show'));dot.addEventListener('blur',()=>tooltip.classList.remove('show'));
  });
})();
