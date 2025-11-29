import React, { useState, useEffect } from 'react';


export default function VideoUploadPanel() {
  const [fileName, setFileName] = useState('');
  const [place, setPlace] = useState('');
  const [year, setYear] = useState('');
  const [fishName, setFishName] = useState('');
  const [fishEnglishName, setFishEnglishName] = useState('');
  const [fishFeature, setFishFeature] = useState('');
  const [groupName, setGroupName] = useState('');
  const [iconURL, setIconURL] = useState('');
  const [isNewFish, setIsNewFish] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [deleteFileName, setDeleteFileName] = useState('');
  const [deleteFileInput, setDeleteFileInput] = useState<File | null>(null);

  const [placeList, setPlaceList] = useState<string[]>([]);
  const [fishList, setFishList] = useState<any[]>([]);
  const [groupList, setGroupList] = useState<any[]>([]);
  const [videoList, setVideoList] = useState<any[]>([]);

  useEffect(() => {
    const loadGlobals = () => {
      if (
        Array.isArray((window as any).PLACES) &&
        Array.isArray((window as any).FISHES) &&
        Array.isArray((window as any).GROUPS) &&
        Array.isArray((window as any).VIDEOS)
      ) {
        setPlaceList((window as any).PLACES);
        setFishList((window as any).FISHES);
        setGroupList((window as any).GROUPS);
        setVideoList((window as any).VIDEOS);
      } else {
        setTimeout(loadGlobals, 100);
      }
    };
    loadGlobals();
  }, []);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name;
    setFileName(name);

    const m = name.match(/(.+?)(\d{4})(.+?)_\d+/);
    if (!m) return;
    const [, pl, yr, fn] = m;

    setPlace(pl);
    setSelectedPlace(pl);
    setYear(yr);
    setSelectedYear(yr);
    setFishName(fn);

    const rec = fishList.find((r: any) => r.Name === fn);
    if (rec) {
      const grp = groupList.find((g: any) => g.groupId === rec.GroupID);
      setGroupName(grp?.nameJp || '');
      setFishEnglishName(rec['英名'] || '');
      setFishFeature(rec['特徴'] || '');
      setIconURL(rec['IconURL'] || '');
      setIsNewFish(false);
    } else {
      setGroupName('');
      setFishEnglishName('');
      setFishFeature('');
      setIconURL('');
      setIsNewFish(true);
    }
  };

  const handleDeleteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDeleteFileInput(file);
    setDeleteFileName(file.name);
  };

  const handleRegister = () => {
  if (!fileName) {
    alert('動画ファイルが選択されていません');
    return;
  }
  if (fileName === deleteFileName) {
    alert('同一ファイルが削除対象と登録対象に指定されています');
    return;
  }

  const existingVideo = videoList.find((v: any) => v['動画ファイル名'] === fileName);
  if (existingVideo) {
    const confirmMsg = `この動画ファイルはすでに登録されています。\n\n判定結果：パターン0（既存ビデオ）\n\nvideosData.js の同一ファイルに対し、データを上書きしますか？\n\nファイル名: ${existingVideo['動画ファイル名']}\n現在のYouTubeURL: ${existingVideo['YouTubeURL']}`;
    const proceed = window.confirm(confirmMsg);
    if (!proceed) return;
    alert('videosData.js の上書き処理を行います（実装予定）');
    return;
  }

  // パターン1〜3の自動判定
  const fishRec = fishList.find((f) => f.Name === fishName);
  const groupRec = groupList.find((g) => g.nameJp === groupName);

  let pattern = '';
  const additions: string[] = [];

  let newGroupId = Math.max(...groupList.map((g) => g.groupId)) + 1;
  let newFishId = Math.max(...fishList.map((f) => f.FishID)) + 1;

  if (!fishRec && !groupRec) {
    pattern = 'パターン③（新グループ＋新魚）';
    additions.push(`・groupsData.js にグループ1件追加します。\ngroupId: ${newGroupId}, nameJp: "${groupName}"`);
    additions.push(`・fishesData.js に魚1件追加します。\nFishID: ${newFishId}, GroupID: ${newGroupId}, Name: "${fishName}", 英名: "${fishEnglishName}", 特徴: "${fishFeature}", IconURL: "", IconInactiveURL: "", 魚の仲間: "${groupName}"`);
    additions.push(`・videosData.js に動画1件追加します。\nGroupID: ${newGroupId}, FishID: ${newFishId}, 撮影年: ${year}, 撮影場所: "${place}", 動画ファイル名: "${fileName}", YouTubeURL: "", ytid: "", label: "${place}${year}"`);
  } else if (!fishRec && groupRec) {
    pattern = 'パターン②（既存グループ＋新魚）';
    additions.push(`・fishesData.js に魚1件追加します。\nFishID: ${newFishId}, GroupID: ${groupRec.groupId}, Name: "${fishName}", 英名: "${fishEnglishName}", 特徴: "${fishFeature}", IconURL: "", IconInactiveURL: "", 魚の仲間: "${groupRec.nameJp}"`);
    additions.push(`・videosData.js に動画1件追加します。\nGroupID: ${groupRec.groupId}, FishID: ${newFishId}, 撮影年: ${year}, 撮影場所: "${place}", 動画ファイル名: "${fileName}", YouTubeURL: "", ytid: "", label: "${place}${year}"`);
  } else if (fishRec && groupRec) {
    pattern = 'パターン①（既存グループ＋既存魚）';
    additions.push(`・videosData.js に動画1件追加します。\nGroupID: ${fishRec.GroupID}, FishID: ${fishRec.FishID}, 撮影年: ${year}, 撮影場所: "${place}", 動画ファイル名: "${fileName}", YouTubeURL: "", ytid: "", label: "${place}${year}"`);
  } else {
    alert('グループ名または魚名の整合性に問題があります。');
    return;
  }

  const confirmMessage = [`判定結果：${pattern}`, '', ...additions].join('\n\n');
  const ok = window.confirm(confirmMessage);
  if (!ok) return;

  alert(`${pattern} のデータ追加処理を実行します（※次ステップで実装）`);
  return;
};


  return (
    <div className="max-w-3xl mx-auto mt-8 p-4 border rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">ビデオ投稿パネル</h2>
      <div className="space-y-4">
        <div>
          <label className="block mb-1">動画ファイル</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        {fileName && (
          <div className="bg-gray-50 p-2 rounded">
            <p>ファイル名: <strong>{fileName}</strong></p>
            <p>場所: <strong>{place}</strong></p>
            <p>撮影年: <strong>{year}</strong></p>
            <p>魚名: <strong>{fishName}</strong></p>
          </div>
        )}

        <div>
          <label className="block mb-1">魚名（英名）</label>
          <input
            type="text"
            value={fishEnglishName}
            onChange={e => setFishEnglishName(e.target.value)}
            placeholder="英名を入力"
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div className="h-6"></div>

        <div>
          <label className="block mb-1">魚の特徴</label>
          <textarea
            value={fishFeature}
            onChange={e => setFishFeature(e.target.value)}
            placeholder="特徴を入力してください"
            rows={12}
            className="border rounded w-[900px] px-4 py-2 text-sm resize-none"
          />
        </div>

        {iconURL && (
          <div>
            <img src={iconURL} alt="魚アイコン" className="w-24 h-24 object-contain mx-auto" />
          </div>
        )}

        <div>
          <label className="block mb-1">撮影場所</label>
          <input
            list="placeList"
            value={selectedPlace}
            onChange={e => setSelectedPlace(e.target.value)}
            placeholder="選択または新規入力"
            className="w-full border rounded px-2 py-1"
          />
          <datalist id="placeList">
            {placeList.map((pl) => (
              <option key={pl} value={pl} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block mb-1">撮影年</label>
          <input
            type="text"
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block mb-1">所属グループ</label>
          <input
            list="groupList"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="選択または新規入力"
            className="w-full border rounded px-2 py-1"
          />
          <datalist id="groupList">
            {groupList
              .slice() // ← 破壊的ソートを避けるためコピー
              .sort((a, b) => a.nameJp.localeCompare(b.nameJp, 'ja'))
              .map((g) => (
               <option key={g.groupId} value={g.nameJp} />
              ))}
          </datalist>
        </div>

        <div>
          <label className="block mb-1">新規魚アイコン</label>
          <input
            type="file"
            accept="image/*"
            disabled={!isNewFish}
            className={`w-full border rounded px-2 py-1 ${!isNewFish ? 'bg-gray-200 cursor-not-allowed text-gray-500' : ''}`}
          />
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleRegister}
            className="bg-blue-600 text-white rounded px-4 py-2"
          >
            登録＆アップロード
          </button>

          <div className="flex flex-col">
            <label className="block mb-1 text-sm">削除対象ビデオ選択</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleDeleteFileChange}
              className="border rounded px-2 py-1"
            />
            {deleteFileName && <p className="text-xs text-gray-600 mt-1">削除対象: {deleteFileName}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
