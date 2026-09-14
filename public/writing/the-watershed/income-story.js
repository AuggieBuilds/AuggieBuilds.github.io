import { simulateIncome } from './income-model.js';

const root = document.querySelector('#incomeStory');
if (root) {
  const cash = value => '$' + Math.round(value).toLocaleString('en-US');
  const colors = {job:'#2d7f9e', tax:'#a94732', retirement:'#bd8728', living:'#4e7584', reserve:'#35745b', fund:'#bd8728', ink:'#17201b', muted:'#7d827c'};
  const scale = .025;
  const ribbon = (x1,y1,x2,y2,value,color,opacity=.72) => {
    const width=Math.max(2,value*scale), bend=(y1+y2)/2;
    return `<path class="sankey-ribbon" fill="${color}" opacity="${opacity}" d="M${x1-width/2},${y1} C${x1-width/2},${bend} ${x2-width/2},${bend} ${x2-width/2},${y2} L${x2+width/2},${y2} C${x2+width/2},${bend} ${x1+width/2},${bend} ${x1+width/2},${y1} Z"/>`;
  };
  const loop = (fromX,fromY,toX,toY,value,color) => {
    const width=Math.max(6,value*scale);
    return `<path class="sankey-loop" fill="none" stroke="${color}" stroke-width="${width}" d="M${fromX},${fromY} C382,${fromY-35} 382,${toY+20} ${toX},${toY}"/><path fill="${color}" d="M${toX-7},${toY+6} L${toX},${toY-7} L${toX+7},${toY+6} Z"/>`;
  };
  const label = (x,y,name,value,anchor='middle',klass='') => `<text class="flow-name ${klass}" x="${x}" y="${y}" text-anchor="${anchor}">${name}</text>${value===null?'':`<text class="amount-label ${klass}" x="${x}" y="${y+17}" text-anchor="${anchor}">${cash(value)}</text>`}`;
  const basin = (id,name,amount,max,color,note='',converted=false) => {
    const level=Math.max(0,Math.min(1,amount/max)), fillY=94-level*64;
    return `<defs><clipPath id="${id}"><path d="M116,22 L116,65 Q195,116 274,65 L274,22 Z"/></clipPath></defs><g class="flow-pool ${converted||level>.55?'is-full':''} ${level>.15?'note-light':''} ${level>.45?'amount-light':''}"><rect x="116" y="${fillY}" width="158" height="${94-fillY}" fill="${color}" opacity=".76" clip-path="url(#${id})"/><path d="M116,22 L116,65 Q195,116 274,65 L274,22" fill="none" stroke="${color}" stroke-width="2"/><line x1="116" y1="22" x2="274" y2="22" stroke="${colors.muted}" stroke-width="1" stroke-dasharray="3 4"/><text class="pool-name" x="195" y="43" text-anchor="middle">${name}</text><text class="pool-amount" x="195" y="64" text-anchor="middle">${cash(amount)}</text>${note?`<text class="pool-note" x="195" y="82" text-anchor="middle">${note}</text>`:''}</g>`;
  };

  function expenses(row,startY=418,endY=530){
    const items=[['Housing',row.expenses.housing,40],['Groceries',row.expenses.groceries,116],['Transportation',row.expenses.transportation,195],['Healthcare',row.expenses.healthcare,274],['Other',row.expenses.other,350]];
    let fromX=195-row.spending*scale/2, paths='', labels='';
    for(const [name,value,x] of items){
      const width=value*scale;
      paths+=ribbon(fromX+width/2,startY,x,endY,value,colors.living,.72);
      labels+=label(x,558,name,value,'middle','expense-label');
      fromX+=width;
    }
    return paths+labels;
  }

  function payroll(row){
    const grossWidth=row.grossPay*scale, taxWidth=row.taxes*scale, retirementWidth=row.retirement*scale;
    let markup=label(195,124,'Gross paycheck',row.grossPay);
    markup+=`<rect x="${195-grossWidth/2}" y="153" width="${grossWidth}" height="8" rx="2" fill="${colors.job}"/>`;
    markup+=ribbon(195,161,195,252,row.salary,colors.job,.72);
    markup+=ribbon(195-grossWidth/2+taxWidth/2,161,56,225,row.taxes,colors.tax,.72);
    markup+=ribbon(195+grossWidth/2-retirementWidth/2,161,334,225,row.retirement,colors.retirement,.72);
    markup+=label(48,252,'Taxes',row.taxes)+label(320,252,'Retirement',row.retirement);
    markup+=label(195,220,'Take-home pay',row.salary,'middle','on-ribbon');
    return markup;
  }

  function workingFlow(row,kind,index){
    const contribution=kind==='save'?row.saving:kind==='rental-build'?row.contribution:0;
    const contributionColor=kind==='save'?colors.reserve:colors.fund;
    let markup='';
    if(kind==='save') markup+=basin(`pool-${index}`,'Cash reserve',row.reserve,14400,colors.reserve,'after 36 months');
    if(kind==='rental-build') markup+=basin(`pool-${index}`,'Rental investment fund',row.committed,9600,colors.fund,'halfway to target');
    if(kind==='rental-income') markup+=basin(`pool-${index}`,'Rental stake',row.invested,9600,colors.reserve,'producing income',true);
    if(kind==='spend') markup+=basin(`pool-${index}`,'Cash reserve',0,14400,colors.reserve,'no cushion');
    markup+=payroll(row);
    if(kind==='rental-income'){
      const availableLeft=195-(row.salary+row.rent)*scale/2;
      markup+=ribbon(148,88,availableLeft+row.rent*scale/2,322,row.rent,colors.reserve,.85);
      markup+=label(92,112,'Rental net',row.rent);
    }
    const total=row.salary+row.rent;
    const availableLeft=195-total*scale/2;
    const salaryDestination=availableLeft+row.rent*scale+row.salary*scale/2;
    markup+=ribbon(195,252,salaryDestination,322,row.salary,colors.job,.72);
    markup+=`<rect x="${195-total*scale/2}" y="322" width="${total*scale}" height="8" rx="2" fill="${colors.ink}"/>`;
    markup+=label(195,302,'Available this month',total);
    markup+=ribbon(195,330,195,418,row.spending,colors.living,.72);
    markup+=label(195,378,'Living costs',row.spending,'middle','on-ribbon');
    if(contribution){
      const contributionStart=195+row.spending*scale/2+contribution*scale/2;
      markup+=loop(contributionStart,340,274,62,contribution,contributionColor);
      markup+=label(330,330,kind==='save'?'Save each month':'Invest each month',contribution);
    }
    if(kind==='rental-income'&&row.saving){
      const savingStart=195+row.spending*scale/2+row.saving*scale/2;
      markup+=ribbon(savingStart,330,338,420,row.saving,colors.reserve,.82);
      markup+=label(338,444,'New savings',row.saving);
    }
    markup+=expenses(row);
    return markup;
  }

  function gapFlow(row,index){
    const opening=row.opening, ending=row.reserve;
    let markup=basin(`pool-${index}`,'Cash reserve',ending,14400,colors.reserve,`${cash(opening)} → ${cash(ending)}`);
    markup+=`<text class="zero-income" x="34" y="145">Job income $0</text>`;
    markup+=ribbon(195,94,195,322,row.withdrawal,colors.reserve,.84);
    markup+=label(195,205,'Reserve withdrawal',row.withdrawal,'middle','on-ribbon');
    markup+=`<rect x="${195-row.withdrawal*scale/2}" y="322" width="${row.withdrawal*scale}" height="8" rx="2" fill="${colors.ink}"/>`;
    markup+=label(195,302,'Available this month',row.withdrawal);
    markup+=ribbon(195,330,195,418,row.spending,colors.living,.72)+label(195,378,'Living costs',row.spending,'middle','on-ribbon');
    markup+=expenses(row);
    return markup;
  }

  const states={
    spend:simulateIncome('spend',false)[0],
    save:simulateIncome('save',false)[35],
    gap:simulateIncome('save',true)[38],
    'rental-build':simulateIncome('rental',false)[11],
    'rental-income':simulateIncome('rental',false)[24]
  };
  root.querySelectorAll('.income-scenario').forEach((figure,index)=>{
    const kind=figure.dataset.incomeKind, row=states[kind], svg=figure.querySelector('svg');
    const title=kind==='gap'?`During a job gap, ${cash(row.withdrawal)} leaves the cash reserve and covers ${cash(row.spending)} of living costs.`:`Gross pay of ${cash(row.grossPay)} becomes ${cash(row.salary)} of take-home pay. ${cash(row.spending)} goes to living costs.`;
    svg.innerHTML=`<title>${title}</title>${kind==='gap'?gapFlow(row,index):workingFlow(row,kind,index)}<text class="ribbon-key" x="195" y="630" text-anchor="middle">Ribbon width represents dollars per month</text>`;
  });
}
