const board = document.getElementById('game-board');
const statusDiv = document.getElementById('status');

// パズル1のレイアウト（元のパズル）
const levelLayout1 = [
    ['empty', 'empty',  'corner',     'straight_h', 'corner'],
    ['empty', 'empty',  'straight_v', 'empty',      'straight_v'],
    ['empty', 'empty',  'straight_v', 'empty',      'goal'],
    ['start', 'straight_h', 'corner', 'empty',      'empty']
];

// パズル1の正解角度
const correctRotations1 = [
  [null, null, 180, null, 270], // (0,2) = 180度, (0,4) = 270度
  [null, null, null, null, null],
  [null, null, null, null, null],
  [null, null,   0, null, null]  // (3,2) = 0度
];

// パズル2のレイアウト
const levelLayout2 = [
  ['empty', 'empty', 'empty',      'empty',       'empty'],
  ['empty', 'empty', 'corner',     'straight_h',  'corner'],
  ['corner','straight_h','corner','empty',       'goal'],
  ['start', 'empty', 'corner',     'empty',       'empty']
];

// パズル2の正解角度（修正版）
const correctRotations2 = [
  [null, null, null, null, null], // (0,2)と(0,4)は正解角度なし
  [null, null, 270, null, 180], // (1,2) = 270度, (1,4) = 180度
  [  0, null, 180, null, null], // (2,0) = 0度, (2,2) = 180度
  [null, null,  90, null, null]  // (3,2) = 90度
];

// 現在のパズル番号（1または2）
let currentPuzzle = 1;

// 現在のレイアウトと正解角度を取得する関数
function getCurrentLevelLayout() {
    return currentPuzzle === 1 ? levelLayout1 : levelLayout2;
}

function getCurrentCorrectRotations() {
    return currentPuzzle === 1 ? correctRotations1 : correctRotations2;
}

// タイルデータと対応するHTML要素を保持
let tiles = [];
let tileElements = [];
let initialRotations = []; // 初期回転角度を記録

// ゲーム初期化関数
function initGame() {
    board.innerHTML = '';
    tiles = [];
    tileElements = [];
    initialRotations = []; // 初期回転角度をリセット

    const levelLayout = getCurrentLevelLayout();
    const correctRotations = getCurrentCorrectRotations();

    levelLayout.forEach((row, y) => {
        row.forEach((tileType, x) => {
            const tileData = {
                type: tileType,
                rotation: 0,
                x: x,
                y: y
            };

            // コーナーピースは初期状態でランダム回転
            if (tileType === 'corner') {
                const correctRotation = correctRotations[y][x];

                if (correctRotation !== null) {
                    // 正解角度が定義されている場合、正解以外の角度からランダム選択
                    const wrongRotations = [0, 90, 180, 270].filter(angle => angle !== correctRotation);
                    tileData.rotation = wrongRotations[Math.floor(Math.random() * wrongRotations.length)];
                    console.log(`初期化: (${y},${x}) のコーナーピース rotation = ${tileData.rotation} (正解${correctRotation}度以外から選択)`);
                } else {
                    // 正解角度が定義されていない場合、通常のランダム選択
                    tileData.rotation = Math.floor(Math.random() * 4) * 90;
                    console.log(`初期化: (${y},${x}) のコーナーピース rotation = ${tileData.rotation} (通常ランダム)`);
                }

                // 初期回転角度を記録
                initialRotations.push({
                    y: y,
                    x: x,
                    rotation: tileData.rotation
                });
            }

            tiles.push(tileData);

            const div = document.createElement('div');
            div.classList.add('tile');
            div.classList.add(tileType);
            if (tileType !== 'corner') div.classList.add('fixed');

            // 回転角度を設定
            setTileRotation(div, tileData);

            // クリックで回転（cornerのみ）
            if (tileType === 'corner') {
                const idLabel = `(${tileData.y},${tileData.x})`;

                // デバッグ用に角にラベルを表示
                const label = document.createElement('div');
                label.style.position = 'absolute';
                label.style.bottom = '2px';
                label.style.right = '4px';
                label.style.fontSize = '12px';
                label.style.color = '#fff';
                label.textContent = idLabel;
                div.appendChild(label);

                div.addEventListener('click', () => {
                    tileData.rotation += 90;
                    setTileRotation(div, tileData);

                    const normalizedRotation = normalizeRotation(tileData.rotation);
                    console.log(`🔄 ${idLabel} clicked → rotation = ${tileData.rotation}, normalized = ${normalizedRotation}`);
                    setTimeout(() => {
                        checkRouteConnection();
                    }, 300);
                });
            }

            tileElements.push(div);
            board.appendChild(div);
        });
    });
}

// タイルの回転角度を設定する関数
function setTileRotation(element, tileData) {
    let visualRotation = tileData.rotation;

    // straight_vは基本90度回転しているので、追加の回転を適用
    if (tileData.type === 'straight_v') {
        visualRotation += 90;
    }

    element.setAttribute('data-rotation', tileData.rotation);

    // 視覚的な回転角度を計算（360度以内に収める）
    const displayRotation = visualRotation % 360;

    // トランジションを一時的に無効にして、即座に回転
    element.style.transition = 'none';
    element.style.transform = `rotate(${displayRotation}deg)`;
    element.style.setProperty('--rotation', `${displayRotation}deg`);

    // 次のフレームでトランジションを再有効化
    requestAnimationFrame(() => {
        element.style.transition = 'transform 0.3s ease';
    });
}

// コーナーピースをランダムに回転
function shuffleBoard() {
    tiles.forEach((tile, index) => {
        if (tile.type === 'corner') {
            tile.rotation = Math.floor(Math.random() * 4) * 90;
            setTileRotation(tileElements[index], tile);
        }
    });
    updateStatus('コーナーピースをシャッフルしました！');
}

// コーナーピースを初期状態に戻す
function resetBoard() {
    // 記録された初期回転角度を復元
    initialRotations.forEach(initialRotation => {
        const tileIndex = tiles.findIndex(tile =>
            tile.y === initialRotation.y &&
            tile.x === initialRotation.x &&
            tile.type === 'corner'
        );

        if (tileIndex !== -1) {
            tiles[tileIndex].rotation = initialRotation.rotation;
            setTileRotation(tileElements[tileIndex], tiles[tileIndex]);
        }
    });

    updateStatus('コーナーピースを初期状態にリセットしました！');
}

// 回転角度を正規化（負数や360超えを0〜359に）
function normalizeRotation(deg) {
  return ((deg % 360) + 360) % 360;
}

// スタートからゴールまでの正しいルートができているかを判定
function checkRouteConnection() {
  console.log("チェック関数が呼ばれました");

  let isCorrect = true;
  const correctRotations = getCurrentCorrectRotations();

  tiles.forEach((tile, index) => {
    const y = tile.y;
    const x = tile.x;
    const expected = correctRotations[y][x];

    if (tile.type === 'corner' && expected !== null) {
      const actual = normalizeRotation(tile.rotation);
      const correct = normalizeRotation(expected);
      if (actual !== correct) {
        console.log(`tile[${y},${x}] = ${actual}, 正解 = ${correct}`);
        isCorrect = false;
      }
    }
  });

  if (isCorrect) {
    updateStatus('✨ すばらしいです、お嬢様！ 完璧なルートが完成しました！ ✨', true);
    // 正解時の装飾を削除 - 何も行わない
  } else {
    updateStatus('コーナーピース（青い└）をクリックして回転させ、スタートからゴールまでの道を作ろう！');
    // 不正解時の装飾も削除 - 何も行わない
  }
}

// 正しい向きのピースをハイライト
function showHint() {
  const correctRotations = getCurrentCorrectRotations();
  tiles.forEach((tile, index) => {
    const el = tileElements[index];
    if (tile.type === 'corner') {
      const expected = correctRotations[tile.y][tile.x];
      if (expected !== null &&
          normalizeRotation(tile.rotation) === normalizeRotation(expected)) {
        el.style.outline = '3px solid #FFD700';
        el.style.animation = 'pulse 1s infinite';
      } else {
        el.style.outline = '';
        el.style.animation = '';
      }
    } else {
      el.style.outline = '';
      el.style.animation = '';
    }
  });
  updateStatus('✨ 正しい向きのピースがハイライトされています、お嬢様 ✨');
}

// ステータスメッセージを更新
function updateStatus(message, isSuccess = false) {
    statusDiv.textContent = message;
    statusDiv.className = 'status' + (isSuccess ? ' success' : '');
}

// ゲームを開始
initGame();

// パズル切り替え関数
function switchPuzzle() {
    currentPuzzle = currentPuzzle === 1 ? 2 : 1;
    updateStatus(`パズル${currentPuzzle}に切り替えました！`);
    initGame();
}
