// scripts/export_videos_only.mjs
// 実行例: node scripts/export_videos_only.mjs > js/videosData.js
// 要件:
// - FishID は GAS 側そのまま（振り直しなし）
// - GroupID=0, 999 も含める
// - YouTubeURL 未設定でも null で出力
// - VIDEOS_BY_FISH のキーは文字列
// - 出力は videosData.js のみ

const BASE_API_URL = "https://script.google.com/macros/s/AKfycbx9xS8N0HadBqim2MdMsW-G2HfjJ-hyMzGmSsvOuRlZx1fCJayqMJPsmbRiIcVzUSoX_g/exec";
const MIN_GROUP_ID = 0;
const MAX_GROUP_ID = 56;   // 0～56、999 も後で含める
const CONCURRENCY  = 8;

// YouTube URL → 11桁ID
function extractYtid(url = "") {
  if (!url) return null;
  const m = String(url).match(/(?:youtu\.be\/|v=)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// 動画ソート：年→場所→ファイル名
function compareVideo(a, b) {
  const ay = a["撮影年"] ?? 9999;
  const by = b["撮影年"] ?? 9999;
  if (ay !== by) return ay - by;
  const ap = a["撮影場所"] || "";
  const bp = b["撮影場所"] || "";
  if (ap !== bp) return ap.localeCompare(bp, "ja");
  const af = a["動画ファイル名"] || "";
  const bf = b["動画ファイル名"] || "";
  return af.localeCompare(bf, "ja");
}

// 1グループ取得
async function fetchGroup(gid) {
  const url = `${BASE_API_URL}?action=listVideosByGroup&groupId=${gid}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} group ${gid}`);
  const rows = await res.json(); // シートの列構造に依存

  const out = [];
  for (const r of rows) {
    const fishId = Number(r.FishID ?? r["FishID"]);
    if (!Number.isFinite(fishId)) continue;
    const place  = String(r["撮影場所"] ?? r.Place ?? "").trim();
    const ys     = String(r["撮影年"] ?? r.Year ?? "").trim();
    const year   = /^\d{4}$/.test(ys) ? Number(ys) : null;
    const fname  = String(r["動画ファイル名"] ?? r.FileName ?? "").trim();
    const urlVal = (r["アップロード済みURL"] ?? r.YouTubeURL ?? "").trim();
    const ytid   = extractYtid(urlVal);

    out.push({
      GroupID: Number(r.GroupID ?? gid),
      FishID:  fishId,
      YouTubeURL: urlVal || null,
      ytid: ytid ?? null,
      "撮影年": year,
      "撮影場所": place,
      "動画ファイル名": fname,
      label: (place + (year ?? "")).trim() || "動画"
    });
  }
  return out;
}

// すべてのグループを並列取得
async function fetchAllGroups() {
  const ids = [];
  for (let i = MIN_GROUP_ID; i <= MAX_GROUP_ID; i++) ids.push(i);
  ids.push(999); // オープニングも追加

  const queue = ids.slice();
  const results = [];
  async function worker() {
    while (queue.length) {
      const gid = queue.shift();
      try {
        const part = await fetchGroup(gid);
        results.push(...part);
      } catch (e) {
        console.warn(`[skip] group ${gid}: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return results;
}

// メイン処理
(async function main() {
  const all = await fetchAllGroups();

  // 魚ごとの配列
  const byFish = {};
  for (const v of all) {
    const key = String(v.FishID);
    (byFish[key] ||= []).push(v);
  }
  for (const k of Object.keys(byFish)) {
    byFish[k].sort(compareVideo);
  }

  // フラット配列
  const flat = all.slice().sort((a, b) => {
    if (a.GroupID !== b.GroupID) return a.GroupID - b.GroupID;
    if (a.FishID  !== b.FishID)  return a.FishID  - b.FishID;
    return compareVideo(a, b);
  });

  // 出力
  const header = `/* Generated at ${new Date().toISOString()} */\n`;
  const js = [
    header,
    "const VIDEOS = ",
    JSON.stringify(flat, null, 2),
    ";\n\n",
    "const VIDEOS_BY_FISH = ",
    JSON.stringify(byFish, null, 2),
    ";\n"
  ].join("");

  process.stdout.write(js);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
