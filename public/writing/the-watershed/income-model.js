// Illustrative monthly cash ledger, not a financial forecast.
export function simulateIncome(mode, loss = true) {
  let reserve = 0, fund = 0, built = false, invested = 0, unmetTotal = 0;
  const rows = [];
  for (let month = 1; month <= 60; month++) {
    const opening = reserve, fundOpening = fund;
    const interrupted = loss && month >= 37 && month <= 42;
    const salary = interrupted ? 0 : mode === 'skills' && built ? 5000 : 4000;
    const grossPay = salary * 1.5;
    const taxes = grossPay * .25;
    const retirement = grossPay - taxes - salary;
    const rent = mode === 'rental' && built ? 200 : 0;
    const budget = mode === 'spend' ? 4000 : 3600;
    const income = salary + rent;
    const withdrawal = Math.min(reserve, Math.max(0, budget - income));
    reserve -= withdrawal;
    const spending = Math.min(budget, income + withdrawal);
    const surplus = Math.max(0, income - spending);
    const building = !built && (mode === 'rental' || mode === 'skills');
    const contribution = building ? surplus : 0;
    const saving = building ? 0 : surplus;
    reserve += saving; fund += contribution;
    let deployment = 0;
    const target = mode === 'rental' ? 9600 : 4800;
    if (building && fund >= target) {
      deployment = target; fund -= target; invested += target; built = true;
    }
    const unmet = budget - spending;
    const expensePlan = mode === 'spend'
      ? {housing: 1400, groceries: 500, transportation: 500, healthcare: 300, other: 1300}
      : {housing: 1400, groceries: 500, transportation: 500, healthcare: 300, other: 900};
    const fundedShare = budget ? spending / budget : 0;
    const expenses = {
      housing: expensePlan.housing * fundedShare,
      groceries: expensePlan.groceries * fundedShare,
      transportation: expensePlan.transportation * fundedShare,
      healthcare: expensePlan.healthcare * fundedShare,
      other: 0
    };
    expenses.other = spending - expenses.housing - expenses.groceries - expenses.transportation - expenses.healthcare;
    const committed = fund + invested;
    unmetTotal += unmet;
    rows.push({month, grossPay, taxes, retirement, salary, rent, opening, reserve, fundOpening, fund, committed, contribution, saving, withdrawal, spending, expenses, budget, unmet, unmetTotal, deployment, invested, built});
  }
  return rows;
}
