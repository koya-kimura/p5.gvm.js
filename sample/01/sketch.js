let gvm;

function setup() {
    createCanvas(600, 300);
    textFont("monospace");

    gvm = new GVM(120);

    // スロットを追加
    gvm.setSlot("intSlot", { mode: "int", divisions: 5 });
    gvm.setSlot("arraySlot", { mode: "array", value: [0.1, 0.5, 0.9, 0.3] });
}

function draw() {
    background(20);

    // 各値の取得
    const valDefault = gvm.getInterpolatedValue(); // float slot（デフォルト）
    const valInt = gvm.getInterpolatedValue("intSlot", 8, 2); // int slot：6拍保持 → 2拍補間
    const valArray = gvm.getInterpolatedValue("arraySlot", 8, 4); // array slot：4拍保持 → 4拍補間
    const pulseVal = gvm.pulse(); // 0→1→0を繰り返す

    // 可視化バー表示
    drawBar("float (default)", 40, valDefault, color(100, 200, 255));
    drawBar("intSlot", 90, valInt, color(255, 150, 100));
    drawBar("arraySlot", 140, valArray, color(180, 255, 180));
    drawBar("pulse", 190, pulseVal, color(255, 255, 100));

    // 情報表示
    fill(255);
    textSize(16);
    textAlign(LEFT, CENTER);
    text(`BPM: ${gvm.getBPM().toFixed(2)}`, 20, height - 40);
    text(`BeatCount: ${gvm.count().toFixed(2)}`, 20, height - 20);
}

function drawBar(label, y, value, c) {
    fill(c);
    noStroke();
    rect(150, y, value * 300, 20);
    fill(255);
    textAlign(LEFT, CENTER);
    text(`${label}: ${value.toFixed(2)}`, 20, y + 10);
}

// スペースキーでTap Tempo
function keyPressed() {
    if (key === " ") {
        gvm.tapTempo();
    }
}

// Dキーでスロット情報出力
function keyTyped() {
    if (key === "d") {
        gvm.debugInfo();
    }
}