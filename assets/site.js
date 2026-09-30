// ふるさと納税サイトのツール一覧（このサイト専用。退職・転職ツールとは別管理）
const TOOLS = [
  { path: "/furusato/", name: "ふるさと納税 上限額 計算", desc: "年収と家族構成から、自己負担2,000円で寄付できる上限額を計算" },
  { path: "/furusato/hayami/", name: "上限額 早見表", desc: "年収・家族構成別の上限額の目安を一覧で確認" },
  { path: "/furusato/onestop/", name: "ワンストップ特例 判定", desc: "確定申告なしで済むか、申請期限とあわせて判定" },
  { path: "/furusato/kanri/", name: "寄付の管理・残り枠チェック", desc: "寄付した記録をつけて、上限まであといくらかを確認" },
];

const yen = n => Math.round(n).toLocaleString("ja-JP") + "円";

document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("related");
  if (!el) return;
  const here = location.pathname.replace(/index\.html$/, "");
  el.innerHTML = `<h2>ほかのツール</h2><ul class="tools">${TOOLS.filter(t => t.path !== here)
    .map(t => `<li><a href="${t.path}"><b>${t.name}</b><span>${t.desc}</span></a></li>`).join("")}</ul>`;
});
