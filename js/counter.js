// counter.js  --- Firestoreでアクセス数を原子的に+1する
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, increment, runTransaction
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

/** ▼ 必ず、あなたの値に置き換え */
const firebaseConfig = {
  apiKey:     "AIzaSyCTXr8Euq-IyyB75wrO9sNEpF4mTq3xYPA",
  authDomain: "fishpedias.firebaseapp.com",
  projectId:  "fishpedias"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// 再読込での“二重カウント”を抑制（同一タブ/セッション中は一度だけ）
const SESSION_FLAG_KEY = "fishpedias_counted_this_session";

async function ensureDocExists(ref) {
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { count: 0 }); // ルール上 create は count==1 のみ許可 → 初期は transaction 内で作る
  }
}

/**
 * 1. Firestore の原子的なincrement(+1)で安全に加算
 * 2. 画面の #visitCount に最新値を反映
 */
async function bumpAndRender() {
  const ref = doc(db, "counters", "pageViews");

  // runTransactionなら「存在しない→作る→+1」を安全に一括
  const newCount = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      // 初回: 1 で作成（ルールの create 条件に適合）
      tx.set(ref, { count: 1 });
      return 1;
    } else {
      const next = (snap.data().count || 0) + 1;
      tx.update(ref, { count: next });
      return next;
    }
  });

  const el = document.getElementById("visitCount");
  if (el) el.textContent = Number(newCount).toLocaleString();
}

(async () => {
  try {
    // 同一セッション中の重複インクリメントを回避
    if (sessionStorage.getItem(SESSION_FLAG_KEY) === "1") {
      // 既存の値だけ読む
      const ref  = doc(db, "counters", "pageViews");
      const snap = await getDoc(ref);
      const el   = document.getElementById("visitCount");
      if (el && snap.exists()) el.textContent = Number(snap.data().count).toLocaleString();
      return;
    }

    // まだカウントしてないセッションなら +1 実行
    await bumpAndRender();
    sessionStorage.setItem(SESSION_FLAG_KEY, "1");
  } catch (e) {
    console.error("[counter] error:", e);
    // 失敗時は値の読取だけ試みる
    try {
      const ref  = doc(db, "counters", "pageViews");
      const snap = await getDoc(ref);
      const el   = document.getElementById("visitCount");
      if (el && snap.exists()) el.textContent = Number(snap.data().count).toLocaleString();
    } catch {}
  }
})();
