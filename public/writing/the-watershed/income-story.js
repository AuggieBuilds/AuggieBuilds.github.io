import { simulateIncome } from './income-model.js';

const root = document.querySelector('#incomeStory');
if (root) {
  const $ = selector => root.querySelector(selector);
  let mode = 'spend', month = 1, timer = null;
  const cash = value => '$' + Math.round(value).toLocaleString('en-US');
  const descriptions = {
    spend: 'The paycheck covers the month, but every take-home dollar is spoken for. The next month still depends on the next paycheck.',
    save: 'Ten percent of take-home pay moves into a cash reserve. The reserve grows by $400 each working month and can cover living costs when the paycheck stops.',
    rental: 'Ten percent of take-home pay collects in a rental investment fund. Once it reaches $9,600, that capital becomes an ownership stake and begins producing $200 a month in net rental income.',
    skills: 'Ten percent of take-home pay covers education. After $4,800 is spent on training, this scenario assumes the next paycheck is larger.'
  };
  const colors = {job:'#2d7f9e', tax:'#a94732', retirement:'#bd8728', living:'#4e7584', reserve:'#35745b', fund:'#bd8728', rental:'#35745b'};
  const ribbon = (x1,y1,x2,y2,value,color,scale=.031) => {
    const height=Math.max(1,value*scale), middle=(x1+x2)/2;
    return `<path class="sankey-ribbon" fill="${color}" d="M${x1},${y1} C${middle},${y1} ${middle},${y2} ${x2},${y2} L${x2},${y2+height} C${middle},${y2+height} ${middle},${y1+height} ${x1},${y1+height} Z"/>`;
  };
  const node=(x,y,value,color,scale=.031)=>`<rect class="sankey-node" x="${x}" y="${y}" width="8" height="${Math.max(2,value*scale)}" fill="${color}" rx="2"/>`;
  const label=(x,y,name,value,anchor='start')=>`<text class="flow-name" x="${x}" y="${y}" text-anchor="${anchor}">${name}</text><text class="amount-label" x="${x}" y="${y+19}" text-anchor="${anchor}">${cash(value)}</text>`;

  function sankey(r) {
    const scale=.031, payrollX=235, availableX=505, expenseX=700, sinkX=920;
    const grossY=145;
    let flows=ribbon(48,grossY,payrollX,grossY,r.grossPay,colors.job);
    let nodes=node(40,grossY,r.grossPay,colors.job)+node(payrollX,grossY,r.grossPay,colors.job);
    let labels=label(40,112,r.salary>4000?'Higher-paying job · gross':'Job income · gross',r.grossPay);
    let payrollCursor=grossY;
    if(r.taxes){
      flows+=ribbon(payrollX+8,payrollCursor,450,38,r.taxes,colors.tax);
      nodes+=node(450,38,r.taxes,colors.tax); labels+=label(468,49,'Taxes',r.taxes);
      payrollCursor+=r.taxes*scale;
    }
    if(r.retirement){
      flows+=ribbon(payrollX+8,payrollCursor,450,102,r.retirement,colors.retirement);
      nodes+=node(450,102,r.retirement,colors.retirement); labels+=label(468,113,'Retirement',r.retirement);
      payrollCursor+=r.retirement*scale;
    }
    const availableY=188;
    let availableCursor=availableY;
    if(r.salary){
      flows+=ribbon(payrollX+8,payrollCursor,availableX,availableCursor,r.salary,colors.job);
      availableCursor+=r.salary*scale; labels+=label(325,315,'Take-home pay',r.salary);
    }
    if(r.rent){
      const sourceY=395;
      flows+=ribbon(300,sourceY,availableX,availableCursor,r.rent,colors.rental);
      nodes+=node(292,sourceY,r.rent,colors.rental); labels+=label(292,363,'Rental net income',r.rent);
      availableCursor+=r.rent*scale;
    }
    if(r.withdrawal){
      const sourceY=r.rent?455:410;
      flows+=ribbon(300,sourceY,availableX,availableCursor,r.withdrawal,colors.reserve);
      nodes+=node(292,sourceY,r.withdrawal,colors.reserve); labels+=label(292,sourceY-32,'Reserve withdrawal',r.withdrawal);
      availableCursor+=r.withdrawal*scale;
    }
    const totalAvailable=r.salary+r.rent+r.withdrawal;
    nodes+=node(availableX,availableY,totalAvailable,'#17201b');
    labels+=label(availableX+4,158,'Available this month',totalAvailable,'middle');
    let outputCursor=availableY;
    if(r.spending){
      const expenseY=205;
      flows+=ribbon(availableX+8,outputCursor,expenseX,expenseY,r.spending,colors.living);
      nodes+=node(expenseX,expenseY,r.spending,colors.living); labels+=label(expenseX+4,177,'Living costs',r.spending,'middle');
      outputCursor+=r.spending*scale;
      const expenses=[['Housing',r.expenses.housing],['Groceries',r.expenses.groceries],['Transportation',r.expenses.transportation],['Healthcare',r.expenses.healthcare],['Other',r.expenses.other]];
      const destinations=[205,269,323,371,420];
      let fromY=expenseY;
      expenses.forEach(([name,value],index)=>{
        flows+=ribbon(expenseX+8,fromY,sinkX,destinations[index],value,colors.living);
        nodes+=node(sinkX,destinations[index],value,colors.living); labels+=label(sinkX+17,destinations[index]+8,name,value);
        fromY+=value*scale;
      });
    }
    if(r.saving){
      flows+=ribbon(availableX+8,outputCursor,sinkX,74,r.saving,colors.reserve);
      nodes+=node(sinkX,74,r.saving,colors.reserve); labels+=label(sinkX+17,82,'Into cash reserve',r.saving);
      outputCursor+=r.saving*scale;
    }
    if(r.contribution){
      const fundName=mode==='skills'?'Education fund':'Rental investment fund';
      flows+=ribbon(availableX+8,outputCursor,sinkX,128,r.contribution,colors.fund);
      nodes+=node(sinkX,128,r.contribution,colors.fund); labels+=label(sinkX+17,136,fundName,r.contribution);
    }
    if(!totalAvailable) labels+='<text class="empty-flow" x="505" y="245" text-anchor="middle">No income or reserve remains.</text>';
    return `<title>Month ${month}. Gross job pay is ${cash(r.grossPay)}. Taxes are ${cash(r.taxes)}, retirement is ${cash(r.retirement)}, and take-home pay is ${cash(r.salary)}. Living costs are ${cash(r.spending)}.</title>${flows}${nodes}${labels}`;
  }

  function renderPool(r){
    const pool=$('#incomePool');
    if(mode!=='rental'&&mode!=='skills'){pool.hidden=true;return;}
    pool.hidden=false;
    const target=mode==='rental'?9600:4800;
    const progress=Math.min(100,r.committed/target*100);
    const converted=r.invested>=target;
    pool.classList.toggle('is-converted',converted);
    $('#incomePoolName').textContent=mode==='rental'?'Rental investment fund':'Education fund';
    $('#incomePoolAmount').textContent=`${cash(r.committed)} of ${cash(target)}`;
    $('#incomePoolFill').style.setProperty('--pool-level',`${Math.max(4,progress)}%`);
    $('#incomePoolStatus').textContent=converted
      ? mode==='rental'?'Funded in month 24. The invested stake now sends $200 a month back into the flow.':'Training funded in month 12. The assumed higher paycheck begins the following month.'
      : `${cash(target-r.committed)} left to fund.`;
    $('#incomePoolBranch').hidden=!(converted&&mode==='rental');
  }

  function render(){
    const narrow=matchMedia('(max-width:760px)').matches;
    const rows=simulateIncome(mode,$('#incomeLoss').checked), r=rows[month-1];
    $('#incomeMonth').textContent=`Month ${month}`; $('#incomeTime').value=String(month); $('#incomeDescription').textContent=descriptions[mode];
    root.querySelectorAll('[data-income-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.incomeMode===mode)));
    $('#incomeSankey').setAttribute('viewBox','0 0 1080 500'); $('#incomeSankey').innerHTML=sankey(r); renderPool(r);
    $('#incomeReserve').textContent=cash(r.reserve); $('#incomeFund').textContent=cash(r.fund);
    $('#incomeAsset').textContent=mode==='rental'?`${cash(r.invested)} rental stake`:mode==='skills'?`${cash(r.invested)} spent on education`:'No separate asset';
    $('#incomeGap').textContent=r.unmet?`${cash(r.unmet)} of this month’s living costs is unfunded.`:r.withdrawal?`${cash(r.withdrawal)} from the reserve supports this month’s living costs.`:r.deployment?`${cash(r.deployment)} moves from the fund into ${mode==='rental'?'the rental stake':'training'} this month.`:`This month’s living costs are covered. ${cash(r.saving+r.contribution)} is set aside.`;
    $('#incomeGap').classList.toggle('shortfall',r.unmet>0);
    $('#incomeLedger').textContent=`Cash reserve: ${cash(r.opening)} at start + ${cash(r.saving)} saved − ${cash(r.withdrawal)} withdrawn = ${cash(r.reserve)} at month end. Unfunded living costs so far: ${cash(r.unmetTotal)}.`;
    const x=value=>35+(value-1)*(narrow?320:830)/59, y=value=>155-value/72000*130;
    const history=rows.slice(0,month), line=key=>history.map((item,index)=>`${index?'L':'M'}${x(item.month)},${y(item[key])}`).join(' ');
    $('#incomeHistory').setAttribute('viewBox',narrow?'0 0 390 190':'0 0 900 190');
    $('#incomeHistory').innerHTML=`<title>Cash reserve and capital committed through month ${month}. All scenarios share a zero to $72,000 scale.</title><line x1="35" y1="155" x2="${x(60)}" y2="155" stroke="var(--line)"/><text x="35" y="20">$72,000</text><text x="35" y="180">Month 1</text><text x="${x(60)}" y="180" text-anchor="end">Month 60</text>${$('#incomeLoss').checked?`<rect x="${x(37)}" y="25" width="${x(43)-x(37)}" height="130" fill="var(--rust)" opacity=".08"/><text x="${x(37)}" y="20">Job gap</text>`:''}<path d="${line('reserve')}" stroke="var(--green)" fill="none" stroke-width="3"/><path d="${line('committed')}" stroke="var(--gold)" fill="none" stroke-width="3"/><circle cx="${x(month)}" cy="${y(r.reserve)}" r="4" fill="var(--green)"/><line x1="${x(month)}" y1="25" x2="${x(month)}" y2="155" stroke="var(--muted)" stroke-dasharray="3 4"/>`;
  }
  function stop(){clearInterval(timer);timer=null;$('#incomePlay').textContent='Play timeline';}
  root.querySelectorAll('[data-income-mode]').forEach(button=>button.addEventListener('click',()=>{stop();mode=button.dataset.incomeMode;render();}));
  $('#incomeTime').addEventListener('input',event=>{stop();month=Number(event.target.value);render();});
  $('#incomeLoss').addEventListener('change',render);
  $('#incomePlay').addEventListener('click',()=>{if(timer){stop();return;}if(month===60)month=1;$('#incomePlay').textContent='Pause timeline';render();timer=setInterval(()=>{month++;render();if(month===60)stop();},700);});
  root.querySelectorAll('[data-income-month]').forEach(button=>button.addEventListener('click',()=>{stop();month=Number(button.dataset.incomeMonth);render();}));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  matchMedia('(max-width:760px)').addEventListener('change',render);
  render();
}
