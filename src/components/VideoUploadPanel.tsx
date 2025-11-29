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
  const [iconFile, setIconFile] = useState<File | null>(null);              // 🆕 新規魚アイコンファイル
  const [previewIconURL, setPreviewIconURL] = useState<string>('');        // 🆕 プレビュー用URL
  const [isDeleteChecked, setIsDeleteChecked] = useState(false);
  const [showDeleteSwitch, setShowDeleteSwitch] = useState(false); // パターン0時のみ有効化
  const [iconInputKey, setIconInputKey] = useState(0); // ← input初期化用のキー

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

    setIconFile(null);
    if (previewIconURL) URL.revokeObjectURL(previewIconURL);
    setPreviewIconURL('');
    setIconInputKey(prev => prev + 1);
    setGroupName('');
    setFishEnglishName('');
    setFishFeature('');
    setIconURL('');
    setIsNewFish(false);

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

      // 🎯 パターン0 判定：.mp4 を除いた動画ファイル名
    const nameWithoutExt = name.replace(/\.mp4$/i, '');
    const matchVideo = videoList.find((v: any) => v['動画ファイル名'] === nameWithoutExt);
    setShowDeleteSwitch(!!matchVideo);
    setIsDeleteChecked(false); // 新規選択時はトグルOFF

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

  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
      setIconFile(file);
    if (previewIconURL) {
      URL.revokeObjectURL(previewIconURL); // 古いURLを解放
    }
    const tempURL = URL.createObjectURL(file);
    setPreviewIconURL(tempURL);
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

  // 動画ファイル名から拡張子を除去
  const nameWithoutExt = fileName.replace(/\.mp4$/i, '');

  // 既存ビデオ（パターン0）判定
  const existingVideo = videoList.find((v: any) => v['動画ファイル名'] === nameWithoutExt);
  if (existingVideo) {
    if (isDeleteChecked) {
      // 🔴 削除トグルが ON のとき
      const confirmMsg = `この動画はすでに登録されています。\n\n判定結果：パターン0（既存ビデオ）\n❗ この動画を削除しますか？\n\nファイル名: ${existingVideo['動画ファイル名']}\nYouTubeURL: ${existingVideo['YouTubeURL']}`;
      const proceed = window.confirm(confirmMsg);
      if (!proceed) return;
      alert('videosData.js からの削除処理を行います（実装予定）');
      return;
  } else {
    // 🟢 通常の上書き確認
    const confirmMsg = `この動画はすでに登録されています。\n\n判定結果：パターン0（既存ビデオ）\nvideosData.js の同一ファイルに対し、データを上書きしますか？\n\nファイル名: ${existingVideo['動画ファイル名']}\n現在のYouTubeURL: ${existingVideo['YouTubeURL']}`;
    const proceed = window.confirm(confirmMsg);
    if (!proceed) return;
    alert('videosData.js の上書き処理を行います（実装予定）');
    return;
  }
}

  // パターン1〜3の自動判定
  const fishRec = fishList.find((f) => f.Name === fishName);
  const groupRec = groupList.find((g) => g.nameJp === groupName);

  let pattern = '';
  const additions: string[] = [];

  // 新規 FishID を 9999 を除いた最大値 + 1 で決定
  const maxFishId = Math.max(...fishList.map(f => f.FishID).filter(id => id !== 9999));
  const newFishId = maxFishId + 1;

  if (!groupName || !fishEnglishName || !fishFeature || (isNewFish && !iconFile)) {
    alert('グループ名、英名、特徴、アイコン画像が未入力です（新規魚の場合は全て必要）');
    return;
  }

  if (!fishRec && !groupRec) {
    pattern = '③（新グループ + 新魚）';
    additions.push(`・groupsData.js にグループ1件追加します。\ngroupId: ${groupList.length}, nameJp: "${groupName}"`);
    additions.push(`・fishesData.js に魚1件追加します。\nFishID: ${newFishId}, GroupID: ${groupList.length}, Name: "${fishName}"`);
    additions.push(`・videosData.js に動画1件追加します。\n動画ファイル名: ${nameWithoutExt}`);
  } else if (!fishRec && groupRec) {
    pattern = '②（既存グループ + 新魚）';
    additions.push(`・fishesData.js に魚1件追加します。\nFishID: ${newFishId}, GroupID: ${groupRec.groupId}, Name: "${fishName}"`);
    additions.push(`・videosData.js に動画1件追加します。\n動画ファイル名: ${nameWithoutExt}`);
  } else if (fishRec && groupRec) {
    pattern = '①（既存グループ + 既存魚）';
    additions.push(`・videosData.js に動画1件追加します。\n動画ファイル名: ${nameWithoutExt}`);
  }

  const confirmMsg =
    `魚名：${fishName}\n判定結果：パターン${pattern}\n` +
    additions.join('\n\n') +
    `\n\nこの内容で登録を実行しますか？`;

  const proceed = window.confirm(confirmMsg);
  if (!proceed) return;

  alert('登録処理を開始します（※まだ実装中）');
};


  return (
    <div className="max-w-3xl mx-auto mt-8 p-4 border rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">ビデオ投稿パネル</h2>
      <div className="space-y-4">
        <div>
          <label className="block mb-1">動画ファイル：　</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        {fileName && (
          <div className="bg-gray-50 p-2 rounded text-sm leading-tight space-y-1">
            <div className="flex flex-nowrap items-center gap-3 mb-1">
              <span className="whitespace-nowrap">
                ファイル名：　　<strong>{fileName}</strong>
              </span>

            <div className="ml-1">
              <span>場所：（<strong>{place}</strong>）</span>
              <span>撮影年：（<strong>{year}</strong>）</span>
              <span>魚名：（<strong>{fishName}</strong>）</span>
            </div>
            </div>
          </div>
        )}

        <div>
          <label className="block mb-1">魚名(英名)：　　</label>
          <input
            type="text"
            value={fishEnglishName}
            onChange={e => setFishEnglishName(e.target.value)}
            placeholder="　英名を入力"
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div className="w-[900px]">
          <label htmlFor="feature" className="block text-sm font-medium text-gray-700 mb-1">
          魚の特徴：
          </label>
          <div className="ml-6">
            <textarea
              id="feature"
              value={fishFeature}
              onChange={e => setFishFeature(e.target.value)}
              placeholder="特徴を入力してください"
              className="border rounded px-4 py-2 text-sm resize-none"
              style={{ width: '400px', height: '120px' }}
            />
          </div>
        </div>

        {(iconURL || previewIconURL) && (
          <div className="text-center">
{/*             <p className="text-sm text-gray-600 block text-left pl-2">
              {iconFile?.name || (iconURL && decodeURIComponent(iconURL.split('/').pop() || ''))}
            </p>
 */} 
            <img
              src={previewIconURL || iconURL}
              alt="魚アイコン"
              style={{ width: '240px', height: '240px', objectFit: 'contain' }}
              className="mx-auto"
            />
          </div>
        )}

            {showDeleteSwitch && (
              <div className="flex flex-nowrap items-center gap-1">
                {/* <span className="text-gray-700">削除:</span> */}
                   <div className="flex flex-nowrap border border-gray-300 rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIsDeleteChecked(true)}
                    style={{
                      backgroundColor: isDeleteChecked ? 'red' : 'white',
                      color: isDeleteChecked ? 'white' : 'red',
                      padding: '4px 16px',
                      borderTopLeftRadius: '6px',
                      borderBottomLeftRadius: '6px',
                      border: '1px solid gray',
                    }}
                  >
                    削除：ON
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleteChecked(false)}
                    style={{
                      backgroundColor: !isDeleteChecked ? 'blue' : 'white',
                      color: !isDeleteChecked ? 'white' : 'blue',
                      padding: '4px 16px',
                      borderTopRightRadius: '6px',
                      borderBottomRightRadius: '6px',
                      border: '1px solid gray',
                    }}
                  >
                    削除：OFF
                  </button>
                  </div>
                </div>
              )}
            
        <div>
          <label className="block mb-1">撮影場所：　　　</label>
          <input
            list="placeList"
            value={selectedPlace}
            onChange={e => setSelectedPlace(e.target.value)}
            placeholder="　選択または新規入力"
            className="w-full border rounded px-2 py-1"
          />
          <datalist id="placeList">
            {placeList.map((pl) => (
              <option key={pl} value={pl} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block mb-1">撮影年：　　　　</label>
          <input
            type="text"
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block mb-1">所属グループ：　</label>
          <input
            list="groupList"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="　選択または新規入力"
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
          <label className="block mb-1">新規魚アイコン：</label>
          <input
            key={`${isNewFish ? 'new' : 'existing'}-${iconInputKey}`}
            type="file"
            accept="image/*"
            disabled={!isNewFish || !!iconURL}
            onChange={handleIconFileChange}  // 🆕 追加！
            className={`w-full border rounded px-2 py-1 ${!isNewFish ? 'bg-gray-200 cursor-not-allowed text-gray-500' : ''}`}
          />
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleRegister}
            className="bg-blue-600 text-white rounded px-4 py-2"
          >
            　　登録　＆　アップロード
          </button>
        </div>
      </div>
    </div>
  );
}
