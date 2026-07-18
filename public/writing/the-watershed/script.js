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

  // Bathtub stock-and-flow simulation
  const tubRoot=$('.bathtub-module');
  if(tubRoot){
    const HORIZON=30,MAX_CAPACITY=100,SIM_STEP=.02;
    const controls={
      inflow:$('#inflowRange'),outflow:$('#outflowRange'),start:$('#startCapacityRange'),
      inflowNumber:$('#inflowNumber'),outflowNumber:$('#outflowNumber'),startNumber:$('#startCapacityNumber'),
      advanced:$('#levelDrainageToggle'),time:$('#tubTimeRange'),timeNumber:$('#tubTimeNumber')
    };
    const presets={
      balanced:{inflow:60,outflow:60,start:50,advanced:false},
      accumulation:{inflow:60,outflow:55,start:40,advanced:false},
      leakage:{inflow:55,outflow:62,start:80,advanced:false},
      extraction:{inflow:40,outflow:70,start:90,advanced:false},
      recovery:{inflow:70,outflow:50,start:25,advanced:true}
    };
    const simulation={year:0,speed:1,playing:false,lastFrame:null,frame:null,trajectory:[]};

    const config=()=>({
      inflow:+controls.inflow.value,
      outflow:+controls.outflow.value,
      start:+controls.start.value,
      advanced:controls.advanced.checked
    });
    const effectiveOutflow=(capacity,cfg)=>cfg.advanced
      ? cfg.outflow*(.35+.65*capacity/MAX_CAPACITY)
      : cfg.outflow;
    const calculateTrajectory=cfg=>{
      const points=[{year:0,capacity:cfg.start}];
      let capacity=cfg.start;
      const steps=Math.round(HORIZON/SIM_STEP);
      for(let index=1;index<=steps;index++){
        const net=cfg.inflow-effectiveOutflow(capacity,cfg);
        capacity=clamp(capacity+net*SIM_STEP,0,MAX_CAPACITY);
        points.push({year:index*SIM_STEP,capacity});
      }
      return points;
    };
    const valueAtYear=year=>{
      const position=clamp(year/SIM_STEP,0,simulation.trajectory.length-1);
      const lower=Math.floor(position),upper=Math.min(lower+1,simulation.trajectory.length-1);
      const fraction=position-lower;
      const a=simulation.trajectory[lower],b=simulation.trajectory[upper];
      return a.capacity+(b.capacity-a.capacity)*fraction;
    };
    const chartPoint=(year,capacity)=>({x:48+(year/HORIZON)*552,y:180-(capacity/MAX_CAPACITY)*160});
    const chartPath=points=>points.map((point,index)=>{
      const plotted=chartPoint(point.year,point.capacity);
      return `${index?'L':'M'}${plotted.x.toFixed(2)} ${plotted.y.toFixed(2)}`;
    }).join(' ');
    const statusFor=net=>{
      if(net>=15)return ['Strong accumulation','A large recurring surplus rapidly builds accumulated capacity.'];
      if(net>1)return ['Slow accumulation','A modest surplus steadily builds accumulated capacity.'];
      if(net>=-1)return ['Stable','Inflow and effective outflow are nearly balanced.'];
      if(net>-15)return ['Slow decline','A modest deficit steadily draws down accumulated capacity.'];
      return ['Rapid decline','A large recurring deficit quickly erodes accumulated capacity.'];
    };
    const formatSigned=value=>`${value>0?'+':''}${value.toFixed(1)}`;
    const renderChart=(capacity)=>{
      const fullPath=chartPath(simulation.trajectory);
      const elapsedCount=Math.max(1,Math.floor(simulation.year/SIM_STEP)+1);
      const elapsed=simulation.trajectory.slice(0,elapsedCount);
      if(elapsed[elapsed.length-1]?.year<simulation.year)elapsed.push({year:simulation.year,capacity});
      $('#tubChartFuture').setAttribute('d',fullPath);
      $('#tubChartElapsed').setAttribute('d',chartPath(elapsed));
      const marker=chartPoint(simulation.year,capacity);
      $('#tubChartMarker').setAttribute('cx',marker.x.toFixed(2));
      $('#tubChartMarker').setAttribute('cy',marker.y.toFixed(2));
    };
    const renderTub=()=>{
      const cfg=config(),capacity=valueAtYear(simulation.year);
      const effective=effectiveOutflow(capacity,cfg),net=cfg.inflow-effective;
      const [status,explanation]=statusFor(net);
      const atMaximum=capacity>=MAX_CAPACITY-.001,atZero=capacity<=.001;
      const excess=atMaximum?Math.max(0,net):0;
      const visibleOutflow=atZero?Math.min(effective,cfg.inflow):effective;
      controls.inflowNumber.value=cfg.inflow.toFixed(0);
      controls.outflowNumber.value=cfg.outflow.toFixed(0);
      controls.startNumber.value=cfg.start.toFixed(0);
      $('#tubWater').style.height=`${capacity}%`;
      $('#bathtubStage').style.setProperty('--inflow-strength',(cfg.inflow/100).toFixed(2));
      $('#bathtubStage').style.setProperty('--outflow-strength',(visibleOutflow/100).toFixed(2));
      $('#tubReadInflow').textContent=cfg.inflow.toFixed(1);
      $('#tubReadBaseOutflow').textContent=cfg.outflow.toFixed(1);
      $('#tubReadEffectiveOutflow').textContent=effective.toFixed(1);
      $('#tubReadNet').textContent=formatSigned(net);
      $('#tubReadCapacity').textContent=capacity.toFixed(1);
      $('#tubReadYear').textContent=simulation.year.toFixed(1);
      $('#tubYearHero').textContent=simulation.year.toFixed(1);
      controls.timeNumber.value=simulation.year.toFixed(1);
      controls.time.value=simulation.year.toFixed(2);
      $('#tubDirection').textContent=status;
      $('#tubBalance').textContent=`${formatSigned(net)} capacity units per year`;
      $('#tubExplain').textContent=explanation;
      $('#tubConstraint').textContent=atMaximum
        ? `Capacity constraint reached. The level cannot rise further; current excess inflow is ${excess.toFixed(1)} units per year.`
        : atZero
          ? 'No accumulated capacity remains to drain. The level cannot fall below zero.'
          : '';
      $('#bathtubFormula').textContent=cfg.advanced
        ? 'Conceptual level-dependent mode: effective outflow = base outflow × (0.35 + 0.65 × current capacity / maximum capacity).'
        : 'Constant mode: capacity change per year = annual inflow − annual outflow.';
      renderChart(capacity);
    };
    const recalculate=()=>{simulation.trajectory=calculateTrajectory(config());renderTub();};
    const setPlaying=playing=>{
      simulation.playing=playing;
      simulation.lastFrame=null;
      $('#tubPlay').disabled=playing;
      $('#tubPause').disabled=!playing;
      if(!playing&&simulation.frame){cancelAnimationFrame(simulation.frame);simulation.frame=null;}
      if(playing)simulation.frame=requestAnimationFrame(tick);
    };
    const tick=timestamp=>{
      if(!simulation.playing)return;
      if(simulation.lastFrame!==null){
        const elapsedSeconds=Math.min((timestamp-simulation.lastFrame)/1000,.25);
        simulation.year=clamp(simulation.year+elapsedSeconds*simulation.speed,0,HORIZON);
        renderTub();
        if(simulation.year>=HORIZON){setPlaying(false);return;}
      }
      simulation.lastFrame=timestamp;
      simulation.frame=requestAnimationFrame(tick);
    };
    const reset=()=>{setPlaying(false);simulation.year=0;renderTub();};

    [[controls.inflow,controls.inflowNumber],[controls.outflow,controls.outflowNumber],[controls.start,controls.startNumber]].forEach(([slider,number])=>{
      const fromSlider=()=>{number.value=slider.value;recalculate();};
      const fromNumber=()=>{slider.value=clamp(+number.value||0,0,100);recalculate();};
      slider.addEventListener('input',fromSlider);slider.addEventListener('change',fromSlider);
      number.addEventListener('input',fromNumber);number.addEventListener('change',fromNumber);
    });
    controls.advanced.addEventListener('change',recalculate);
    controls.time.addEventListener('input',()=>{setPlaying(false);simulation.year=+controls.time.value;renderTub();});
    controls.time.addEventListener('change',()=>{setPlaying(false);simulation.year=+controls.time.value;renderTub();});
    const scrubToNumber=()=>{setPlaying(false);simulation.year=clamp(+controls.timeNumber.value||0,0,HORIZON);renderTub();};
    controls.timeNumber.addEventListener('input',scrubToNumber);controls.timeNumber.addEventListener('change',scrubToNumber);
    $('#tubPlay').addEventListener('click',()=>{if(simulation.year>=HORIZON)simulation.year=0;setPlaying(true);});
    $('#tubPause').addEventListener('click',()=>setPlaying(false));
    $('#tubReset').addEventListener('click',reset);
    $$('[data-tub-speed]',tubRoot).forEach(button=>button.addEventListener('click',()=>{
      simulation.speed=+button.dataset.tubSpeed;
      $$('[data-tub-speed]',tubRoot).forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    }));
    $$('[data-tub-preset]',tubRoot).forEach(button=>button.addEventListener('click',()=>{
      const preset=presets[button.dataset.tubPreset];
      controls.inflow.value=preset.inflow;controls.outflow.value=preset.outflow;controls.start.value=preset.start;controls.advanced.checked=preset.advanced;
      $$('[data-tub-preset]',tubRoot).forEach(item=>item.classList.toggle('active',item===button));
      reset();recalculate();
    }));
    simulation.trajectory=calculateTrajectory(config());
    renderTub();
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
