const canvas = document.querySelector('#erosionCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const slider = document.querySelector('#erosionTime');
  const output = document.querySelector('#erosionTimeValue');
  const play = document.querySelector('#erosionPlay');
  const stage = document.querySelector('#erosionStage');
  const caption = document.querySelector('#erosionCaption');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let time = 0, running = !reduced.matches, visible = false, last = 0, phase = 0;
  const W = 780, H = 860, duration = 28;
  const clamp = v => Math.max(0, Math.min(1, v));
  const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const center = y => .5 + .12 * Math.sin(y * 7 - .8) + .055 * Math.sin(y * 15);
  const groove = () => smooth((time - 18) / 14);
  const depth = () => groove() * (8 + 54 * smooth((time - 30) / 70));
  function height(x, y) {
    const undulation = 2.2 * Math.sin(x * 23 + y * 13) + 1.4 * Math.cos(y * 28 - x * 9);
    const distance = (x - center(y)) / (.035 + .075 * time / 100);
    return undulation - depth() * Math.exp(-distance * distance);
  }
  function project(x, y, z = height(x, y)) {
    return [68 + x * 558 + y * 90, 110 + y * 365 - x * 47 - z];
  }
  function polygon(points, fill) {
    ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  }
  function line(points, color, width = 1) {
    ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  function text(value, x, y, size = 16, color = '#3e443a', align = 'left') {
    ctx.font = '500 ' + Math.max(20,size) + 'px "Libre Franklin", Arial, sans-serif';
    ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(value,x,y);
  }
  function render() {
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#e7d8b8'; ctx.fillRect(0,0,W,H);
    text('REPEATED FLOWS',34,40,15); text('Time ' + Math.round(time),746,40,15,'#655b48','right');
    // Sand block: the exposed front edge makes erosion depth visible.
    const front = Array.from({length:101},(_,i)=>project(i/100,1));
    polygon([...front, [716,563],[158,610]],'#b8996b');
    polygon([project(0,0),project(0,1),[158,610],[68,230]],'#c7ac80');
    for(let y=0;y<70;y++) for(let x=0;x<90;x++){
      const u=x/90,v=y/70,z=height(u,v);
      const slope=height(u+.008,v)-z;
      const shade=Math.round(188+Math.max(-35,Math.min(30,slope*5))+4*Math.sin(x*79+y*37));
      polygon([project(u,v),project((x+1)/90,v),project((x+1)/90,(y+1)/70),project(u,(y+1)/70)],'rgb('+Math.min(238,shade+35)+','+Math.min(222,shade+13)+','+(shade-25)+')');
    }
    const capture = smooth((time-21)/64);
    // Each route begins at a different point; established channels capture later flows.
    for(let i=0;i<23;i++){
      const route=[];
      const start=.08+i*.038;
      for(let j=0;j<=90;j++){
        const y=j/90;
        const diffuse= start + .04*Math.sin(y*13+i*.9)*y;
        const attraction=capture * smooth(y*4+.12);
        const x=diffuse*(1-attraction)+(center(y)+(i-11)*.002)*attraction;
        route.push(project(x,y,height(x,y)+1));
      }
      line(route,'rgba(45,133,158,'+(.42+capture*.15)+')',2.5+capture*1.4);
      for(let p=0;p<4;p++){
        const pos=((phase*.15+p/4+i*.043)%1)*89;
        const n=Math.floor(pos); const a=route[n],b=route[n+1];
        line([a,b],'rgba(211,241,241,.9)',2.2);
      }
    }
    // A visible tool stroke introduces the shallow groove before erosion deepens it.
    if(time>=18 && time<32){
      const y=clamp((time-18)/14), p=project(center(y),y);
      ctx.beginPath();ctx.arc(p[0],p[1]-7,9,0,Math.PI*2);ctx.fillStyle='#846747';ctx.fill();
      text('A shallow groove is cut',34,640,18);
    } else text(time<18?'Water spreads across the surface':'Later flows gather in the existing channel',34,640,18);
    // Cut through the same terrain at one location.
    text('CHANNEL CROSS SECTION',34,690,13,'#70634d');
    const cross=Array.from({length:161},(_,i)=>[45+i/160*690,727-height(i/160,.68)*1.2]);
    polygon([...cross,[735,830],[45,830]],'#bd9c6b');line(cross,'#8c704b',2);
    ctx.setLineDash([4,5]);line([[45,727],[735,727]],'#998568',1);ctx.setLineDash([]);
    const c=center(.68),d=depth();
    if(d>1){
      const pool=cross.filter((_,i)=>Math.abs(i/160-c)<(.025+.05*time/100));
      if(pool.length>1)polygon([...pool,[pool.at(-1)[0],727+d*.65],[pool[0][0],727+d*.65]],'#438da0');
    }
    text('Original surface',45,714,12,'#70634d');
  }
  let previousStage=-1;
  function labels(){
    slider.value=String(Math.round(time));output.value=String(Math.round(time));
    const index=time<18?0:time<32?1:time<72?2:3;
    if(index!==previousStage){
      const entries=[
        ['Water spreads across the sand.','Small differences in the surface send water in several directions.'],
        ['A shallow groove gives the water a route.','The first channel redirects part of the flow toward one path.'],
        ['Repeated flows deepen the channel.','Water carries sand away. The cross section below shows the valley getting deeper.'],
        ['The next flow follows the established valley.','More water gathers in the channel, reinforcing the route that earlier flows created.']
      ];
      [stage.textContent,caption.textContent]=entries[index];previousStage=index;
    }
    play.textContent=running?'Pause':time>=100?'Replay':'Play';
    canvas.setAttribute('aria-label',stage.textContent+' '+caption.textContent);
  }
  play.addEventListener('click',()=>{if(time>=100)time=0;running=!running;labels();render();});
  slider.addEventListener('input',()=>{time=+slider.value;running=false;labels();render();});
  reduced.addEventListener('change',()=>{if(reduced.matches)running=false;labels();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:.15}).observe(canvas);
  function frame(now){
    const delta=Math.min((now-last)/1000,.05);last=now;
    if(visible && running){time=Math.min(100,time+delta*100/duration);phase+=delta;if(time>=100)running=false;labels();render();}
    requestAnimationFrame(frame);
  }
  labels();render();requestAnimationFrame(frame);
}
