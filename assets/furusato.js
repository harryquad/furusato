// ふるさと納税の控除上限額の計算（2026年＝令和8年中の寄付、所得税は令和8年分・住民税は令和9年度分）
// 上限額 = 住民税所得割額 × 20% ÷ (90% − 所得税率 × 1.021) + 2,000円

const BRACKETS = [
  [1949000, 0.05], [3299000, 0.10], [6949000, 0.20], [8999000, 0.23],
  [17999000, 0.33], [39999000, 0.40], [Infinity, 0.45],
];
const floor1000 = n => Math.max(0, Math.floor(n / 1000) * 1000);

// 給与所得控除（令和8年分の所得税・令和9年度分の住民税とも最低74万円）
function salaryDeduction(a, min) {
  let d;
  if (a <= 3600000) d = a * 0.3 + 80000;
  else if (a <= 6600000) d = a * 0.2 + 440000;
  else if (a <= 8500000) d = a * 0.1 + 1100000;
  else d = 1950000;
  return Math.min(a, Math.max(min, d));
}

// 所得税の基礎控除（令和8年分）
function basicDeductionIT(income) {
  if (income <= 4890000) return 1040000;
  if (income <= 6550000) return 670000;
  if (income <= 23500000) return 620000;
  if (income <= 24000000) return 480000;
  if (income <= 24500000) return 320000;
  if (income <= 25000000) return 160000;
  return 0;
}
// 住民税の基礎控除
function basicDeductionRT(income) {
  if (income <= 24000000) return 430000;
  if (income <= 24500000) return 290000;
  if (income <= 25000000) return 150000;
  return 0;
}

// 配偶者控除（配偶者の収入がない場合）。本人の合計所得金額で段階的に減る
function spouseDeduction(income) {
  if (income <= 9000000) return { it: 380000, rt: 330000, diff: 50000 };
  if (income <= 9500000) return { it: 260000, rt: 220000, diff: 40000 };
  if (income <= 10000000) return { it: 130000, rt: 110000, diff: 20000 };
  return { it: 0, rt: 0, diff: 0 };
}

// 社会保険料の目安（健康保険5.0%、介護保険0.8%、厚生年金9.15%〈上限あり〉、雇用保険0.55%）
function estimateSocial(annual, over40) {
  return Math.min(annual / 12, 650000) * 0.0915 * 12 + annual * (0.05 + (over40 ? 0.008 : 0)) + annual * 0.0055;
}

// 公的年金等控除後の所得（公的年金等以外の所得が1,000万円以下の場合の表）
function pensionIncome(a, over65) {
  if (over65 ? a <= 1100000 : a <= 600000) return 0;
  if (over65 && a < 3300000) return a - 1100000;
  if (!over65 && a < 1300000) return a - 600000;
  if (a < 4100000) return a * 0.75 - 275000;
  if (a < 7700000) return a * 0.85 - 685000;
  if (a < 10000000) return a * 0.95 - 1455000;
  return a - 1955000;
}

/**
 * 収入の内訳から上限額を求める
 * p = { salary, business, pension, over65, other, over40, spouse, general, tokutei, social, ideco }
 *  salary: 給与収入 / business: 事業所得（経費・青色申告特別控除を引いたあと）
 *  pension: 公的年金等の収入 / other: その他の所得（副業の雑所得など、経費を引いたあと）
 *  social: 社会保険料（0なら給与から目安を計算）
 */
function furusatoLimitDetail(p) {
  const salary = p.salary || 0;
  const pen = pensionIncome(p.pension || 0, p.over65);
  const extra = (p.business || 0) + (p.other || 0);
  // 給与と年金の両方がある場合の所得金額調整控除
  const adjustFor = salaryIncome => (salaryIncome > 0 && pen > 0) ? Math.max(0, Math.min(salaryIncome, 100000) + Math.min(pen, 100000) - 100000) : 0;
  const salIT = salary - salaryDeduction(salary, 740000);
  const salRT = salary - salaryDeduction(salary, 740000);
  const incomeIT = Math.max(0, salIT - adjustFor(salIT) + pen + extra);
  const incomeRT = Math.max(0, salRT - adjustFor(salRT) + pen + extra);
  const social = p.social > 0 ? p.social : (salary ? estimateSocial(salary, p.over40) : 0);
  return limitFromIncome({ ...p, incomeIT, incomeRT, social });
}

/**
 * 会社員（給与収入のみ）の上限額
 * p = { annual, over40, spouse, general, tokutei, social, ideco }
 *  spouse: 配偶者控除の対象になる配偶者がいるか
 *  general: 一般の扶養親族（16〜18歳、23〜69歳）の人数
 *  tokutei: 特定扶養親族（19〜22歳）の人数
 *  social: 社会保険料（未入力なら目安で計算）
 *  ideco: iDeCoなどの掛金（年額）
 */
function furusatoLimit(p) {
  const social = p.social > 0 ? p.social : estimateSocial(p.annual, p.over40);
  return limitFromIncome({
    ...p, social,
    incomeIT: p.annual - salaryDeduction(p.annual, 740000),
    incomeRT: p.annual - salaryDeduction(p.annual, 740000),
  });
}

// 合計所得金額（所得税・住民税）と各控除から上限額を求める共通処理
function limitFromIncome(p) {
  const { incomeIT, incomeRT, social } = p;
  const ideco = p.ideco || 0, general = p.general || 0, tokutei = p.tokutei || 0;

  // 所得税
  const sp = p.spouse ? spouseDeduction(incomeIT) : { it: 0, rt: 0, diff: 0 };
  const taxableIT = floor1000(incomeIT - social - ideco - basicDeductionIT(incomeIT) - sp.it - 380000 * general - 630000 * tokutei);
  const rate = taxableIT > 0 ? BRACKETS.find(b => taxableIT <= b[0])[1] : 0;

  // 住民税の所得割
  const taxableRT = floor1000(incomeRT - social - ideco - basicDeductionRT(incomeRT) - sp.rt - 330000 * general - 450000 * tokutei);
  const jinteki = (incomeRT <= 25000000 ? 50000 : 0) + sp.diff + 50000 * general + 180000 * tokutei;
  let adjust = 0;
  if (taxableRT > 0 && incomeRT <= 25000000) {
    adjust = taxableRT <= 2000000
      ? Math.min(jinteki, taxableRT) * 0.05
      : Math.max((jinteki - (taxableRT - 2000000)) * 0.05, 2500);
  }
  const shotokuwari = Math.max(0, taxableRT * 0.1 - adjust);

  const limit = shotokuwari > 0 ? Math.floor(shotokuwari * 0.2 / (0.9 - rate * 1.021) + 2000) : 0;
  return { limit, social, rate, taxableIT, taxableRT, shotokuwari, incomeIT, incomeRT };
}

// 寄付額から、所得税・住民税でそれぞれいくら控除されるかを求める
function deductionBreakdown(donation, r) {
  const base = Math.max(0, donation - 2000);
  const incomeTax = Math.floor(base * r.rate * 1.021);
  const residentBasic = Math.floor(base * 0.1);
  // 特例分は住民税所得割の20%が上限。上限内なら「寄付額 − 2,000円」の残り全部になる
  const special = base * (0.9 - r.rate * 1.021);
  const residentSpecial = special <= r.shotokuwari * 0.2
    ? base - incomeTax - residentBasic
    : Math.floor(r.shotokuwari * 0.2);
  const total = incomeTax + residentBasic + residentSpecial;
  return { incomeTax, residentBasic, residentSpecial, total, burden: donation - total };
}
