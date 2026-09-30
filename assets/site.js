// ふるさと納税サイトのツール一覧（このサイト専用。退職・転職ツールとは別管理）
const TOOLS = [
  { path: "/furusato/", name: "ふるさと納税 上限額 計算", desc: "年収と家族構成から、自己負担2,000円で寄付できる上限額を計算" },
  { path: "/furusato/fukugyo/", name: "上限額 計算（副業・個人事業主・年金）", desc: "給与以外の収入がある人の上限額を、収入の種類ごとに計算" },
  { path: "/furusato/hayami/", name: "上限額 早見表", desc: "年収・家族構成別の上限額の目安を一覧で確認" },
  { path: "/furusato/koujo/", name: "控除額 計算（所得税・住民税）", desc: "所得税がいくら戻り、住民税がいくら安くなるかを内訳つきで計算" },
  { path: "/furusato/onestop/", name: "ワンストップ特例 判定", desc: "確定申告なしで済むか、申請期限とあわせて判定" },
  { path: "/furusato/kanri/", name: "寄付の管理・残り枠チェック", desc: "寄付した記録をつけて、上限まであといくらかを確認" },
  { path: "/furusato/kangen/", name: "還元率・コスパ比較", desc: "返礼品の還元率と、1kgあたりの寄付額を比べる" },
  { path: "/furusato/kumiawase/", name: "上限ぴったり 組み合わせ", desc: "残り枠を超えずに使い切れる返礼品の組み合わせを自動で探す" },
];

const yen = n => Math.round(n).toLocaleString("ja-JP") + "円";

document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("related");
  if (!el) return;
  const here = location.pathname.replace(/index\.html$/, "");
  el.innerHTML = `<h2>ほかのツール</h2><ul class="tools">${TOOLS.filter(t => t.path !== here)
    .map(t => `<li><a href="${t.path}"><b>${t.name}</b><span>${t.desc}</span></a></li>`).join("")}</ul>`;
});
