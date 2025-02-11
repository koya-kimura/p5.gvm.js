// GVMインスタンスをグローバルに宣言
// GVMはリズムやテンポに基づいた動きを作るためのライブラリ
// 初期BPM（1分間のビート数）を120に設定
let gvm = new GVM(120);

function setup() {
    // ウィンドウ全体をキャンバスとして使用
    createCanvas(windowWidth, windowHeight);

    // 描画時に図形の縁線を非表示にする設定
    noStroke();
}

function draw() {
    // 背景色を黒（透明度100）で設定
    // 半透明の背景を使うことで、前フレームの描画が少し残り、残像効果が生まれる
    background(0, 100);

    // 描画モードを「加算合成」に変更
    // 色が重なる部分が明るくなるエフェクトを作る
    blendMode(ADD);

    // 100個の円を描画するループ
    for (let i = 0; i < 100; i++) {
        // 円のX座標を計算
        // leapNoise関数でリズムに基づいたノイズ値（0〜1）を取得し、
        // map関数でキャンバス外側も含む範囲（-width*0.5〜width*1.5）に変換
        const x = map(gvm.leapNoise(11, 3, [i, 0]), 0, 1, -width * 0.5, width * 1.5);

        // 円のY座標を計算（X座標と同様）
        const y = map(gvm.leapNoise(7, 2, [i, 1]), 0, 1, -height * 0.5, height * 1.5);

        // 円のサイズを計算
        // ノイズ値を2乗して変化を強調し、map関数でサイズ範囲（最小: キャンバスの5%、最大: キャンバスの30%）に変換
        const s = map(pow(gvm.leapNoise(13, 5, [i, 2]), 2), 0, 1, 0.05, 0.3) * max(width, height);

        // 円の色（赤・緑・青成分）を計算
        // 各成分は異なるノイズ値から取得し、それぞれ異なる範囲でマッピング
        const r = map(gvm.leapNoise(17, 2, [i, 3]), 0, 1, 100, 255); // 赤成分（100〜255）
        const g = map(gvm.leapNoise(22, 1, [i, 4]), 0, 1, 0, 50);   // 緑成分（0〜50）
        const b = map(gvm.leapNoise(29, 1, [i, 5]), 0, 1, 0, 255);   // 青成分（0〜255）

        // 計算した色と透明度（アルファ値100）で塗りつぶし設定
        fill(r, g, b, 100);

        // 計算した位置（x,y）とサイズ（s）で円を描画
        circle(x, y, s);
    }

    // 描画モードを通常モード（BLEND）に戻す
    blendMode(BLEND);

    // カウントを表示
    fill(255);
    text(`BPM : ${floor(gvm.bpm_)} / COUNT :  ${floor(gvm.count())}`, width*0.02, height*0.05);
}

// キーが押された際に呼び出される関数
function keyPressed() {
    // スペースキーが押されたときに、GVMのBPMをランダムな値に設定
    if (keyCode === 32) {
        gvm.tapTempo();
    }

    // Sキーが押されたときに、キャンバスをPNG形式で保存
    if(keyCode === 83){
        gvm.resetCount();
    }
}

// ウィンドウサイズが変更された際に呼び出される関数
// キャンバスサイズを新しいウィンドウサイズに合わせてリサイズする処理
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
