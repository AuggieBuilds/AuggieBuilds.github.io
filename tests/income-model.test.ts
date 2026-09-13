import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateIncome } from '../public/writing/the-watershed/income-model.js';
test('every monthly flow and both balances reconcile in every scenario',()=>{
  for(const mode of ['spend','save','rental','skills']) for(const loss of [true,false]) {
    for(const r of simulateIncome(mode,loss)) {
      assert.equal(r.grossPay,r.taxes+r.retirement+r.salary);
      assert.equal(r.salary+r.rent+r.withdrawal,r.spending+r.saving+r.contribution);
      assert.equal(Object.values(r.expenses).reduce((sum,value)=>sum+value,0),r.spending);
      assert.equal(r.reserve,r.opening+r.saving-r.withdrawal);
      assert.equal(r.fund,r.fundOpening+r.contribution-r.deployment);
      assert.equal(r.budget,r.spending+r.unmet);
      assert.ok(r.reserve>=0 && r.fund>=0);
    }
  }
});
test('10% savings provides four months of cover after three years',()=>{
  const rows=simulateIncome('save');
  assert.equal(rows[35].reserve,14400);
  assert.equal(rows[39].reserve,0);
  assert.equal(rows[39].unmet,0);
  assert.equal(rows[40].unmet,3600);
  assert.equal(rows[42].salary,4000);
});
test('investment spending precedes new income, and is not cash reserve',()=>{
  const rental=simulateIncome('rental'), skills=simulateIncome('skills');
  assert.equal(rental[23].deployment,9600);
  assert.equal(rental[23].committed,9600);
  assert.equal(rental[24].committed,9600);
  assert.equal(rental[23].rent,0);
  assert.equal(rental[24].rent,200);
  assert.equal(rental[23].reserve,0);
  assert.equal(skills[11].deployment,4800);
  assert.equal(skills[11].salary,4000);
  assert.equal(skills[12].salary,5000);
  assert.equal(simulateIncome('spend')[36].unmet,4000);
  assert.equal(simulateIncome('save',false)[59].reserve,24000);
});
test('payroll and living-cost branches use the stated illustrative budget',()=>{
  const spend=simulateIncome('spend',false)[0], save=simulateIncome('save',false)[0];
  assert.deepEqual([spend.grossPay,spend.taxes,spend.retirement,spend.salary],[6000,1500,500,4000]);
  assert.deepEqual(save.expenses,{housing:1400,groceries:500,transportation:500,healthcare:300,other:900});
  assert.equal(spend.expenses.other,1300);
});
