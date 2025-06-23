/**
 * Generative Visual Music (GVM) v2.1
 * BPM駆動の補間・変調・ランダム値生成を統合管理するユーティリティ
 */
class GVM {
    constructor(bpm = 120) {
        this.bpm = bpm;
        this.slots = {};
        this.defaultKey = "default";
        this.tapTimes = [];
        this._startTimes = {};
        this.setSlot(this.defaultKey, { mode: "float" });
    }

    /**
     * BPMの値を設定する
     * @param {number} bpm - BPM値
     */
    setBPM(bpm) {
        this.bpm = bpm;
    }

    /**
     * 現在のBPMを取得する
     * @returns {number}
     */
    getBPM() {
        return this.bpm;
    }

    /**
     * 拍カウントを取得（指定slotごとに独立）
     * @param {string} slotKey - スロットキー
     * @returns {number} 拍数（浮動小数）
     */
    count(slotKey = this.defaultKey) {
        const now = millis();
        if (!this._startTimes[slotKey]) this._startTimes[slotKey] = now;
        const elapsed = now - this._startTimes[slotKey];
        const beatDuration = 60000 / this.bpm;
        return elapsed / beatDuration;
    }

    /**
     * スロットを登録・更新する
     * @param {string} key - スロット名
     * @param {object} options - { mode: 'float'|'int'|'array', divisions?, value? }
     */
    setSlot(key, { mode = "float", divisions = 4, value = [0.25, 0.5, 0.75] }) {
        this.slots[key] = {
            mode,
            divisions,
            value,
            __cache: undefined,
        };
    }

    /**
     * 全スロットとBPMをリセット
     */
    resetAll() {
        this.slots = {};
        this.setSlot(this.defaultKey, { mode: "float" });
        this._startTimes = {};
    }

    /**
     * 指定されたスロットの補間済み値を取得する
     * @param {string} slotKey - スロットキー（省略時は"default"）
     * @param {number} cycleLength - サイクル長（例：8拍）
     * @param {number} easeDuration - 補間にかける拍数（例：2拍）
     * @param {function} easeFunc - イージング関数（例：Easing.easeInOutSine）
     * @returns {number} 補間値
     */
    getInterpolatedValue(
        slotKey = "default",
        cycleLength = 8,
        easeDuration = 2,
        easeFunc = Easing.easeInOutSine
    ) {
        if (!this.slots[slotKey]) {
            console.warn(`Slot "${slotKey}" does not exist.`);
            return 0;
        }

        const slot = this.slots[slotKey];
        const currentCount = this.count();
        const basePhase = Math.floor(currentCount / cycleLength);
        const progressInCycle = currentCount % cycleLength;

        // 値の更新タイミング（拍の先頭）で次の目標値を設定
        if (Math.floor(currentCount / cycleLength) !== slot.lastPhase) {
            slot.lastPhase = basePhase;

            // 新しいターゲット値を生成
            const currentVal = slot.nextVal ?? 0.5;

            let nextVal = 0;
            if (slot.mode === "int") {
                const div = slot.divisions ?? 1;
                nextVal = (Math.floor(random(div)) + 0.5) / div;
            } else if (slot.mode === "array") {
                const arr = slot.value ?? [0.5];
                nextVal = arr[Math.floor(random(arr.length))];
            } else {
                nextVal = random();
            }

            slot.prevVal = currentVal;
            slot.nextVal = nextVal;
        }

        // 補間処理
        const easeT = constrain(
            (progressInCycle - (cycleLength - easeDuration)) / easeDuration,
            0,
            1
        );
        const eased = easeFunc ? easeFunc(easeT) : easeT;
        const val = lerp(slot.prevVal, slot.nextVal, eased);

        return val;
    }

    /**
     * スロットに応じたランダム値を生成
     * @param {object} slot
     * @param {number} offset - オフセットシード
     * @returns {number}
     */
    _generateRandom(slot, offset = 0) {
        switch (slot.mode) {
            case "int": {
                const index = floor(random(slot.divisions));
                return index / max(slot.divisions - 1, 1);
            }
            case "array": {
                const arr = slot.value ?? [0.25, 0.5, 0.75];
                return random(arr);
            }
            case "float":
            default:
                return random();
        }
    }

    /**
     * 線形補間
     * @param {number} a
     * @param {number} b
     * @param {number} t
     * @returns {number}
     */
    _interpolate(a, b, t) {
        return lerp(a, b, t);
    }

    /**
     * 拍ごとに0→1→0を繰り返すパルス
     * @returns {number} 0または1
     */
    pulse() {
        return abs((this.count() % 2) - 1);
    }

    /**
     * Tap Tempo機能（キー操作で使用）
     */
    tapTempo() {
        const now = millis();
        this.tapTimes.push(now);
        this.tapTimes = this.tapTimes.filter((t) => now - t < 5000);
        if (this.tapTimes.length >= 2) {
            const intervals = [];
            for (let i = 1; i < this.tapTimes.length; i++) {
                intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
            }
            const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            this.bpm = 60000 / avg;
        }
    }

    /**
     * 現在の状態をデバッグ出力
     */
    debugInfo() {
        console.clear();
        console.log("BPM:", this.getBPM().toFixed(2));
        console.log("Slots:");
        for (const key in this.slots) {
            const s = this.slots[key];
            console.log(
                `- ${key}: mode=${s.mode}, value=${JSON.stringify(
                    s.value
                )}, divisions=${s.divisions}`
            );
        }
    }
}

/**
 * イージング関数を提供するユーティリティクラス
 * 各関数は0から1の範囲で動作
 */
class Easing {
    static c1_ = 1.70158;
    static c2_ = Easing.c1_ * 1.525;
    static c3_ = Easing.c1_ + 1;

    /**
     * @param {number} x - 進行度 (0-1)
     * @returns {number} イージング適用後の値
     */
    static easeInSine(x) {
        return 1 - Math.cos((x * Math.PI) / 2);
    }

    static easeOutSine(x) {
        return Math.sin((x * Math.PI) / 2);
    }

    static easeInOutSine(x) {
        return -(Math.cos(Math.PI * x) - 1) / 2;
    }

    static easeInQuad(x) {
        return x * x;
    }

    static easeOutQuad(x) {
        return 1 - (1 - x) * (1 - x);
    }

    static easeInOutQuad(x) {
        return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    }

    static easeInCubic(x) {
        return x * x * x;
    }

    static easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }

    static easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    static easeInQuart(x) {
        return x * x * x * x;
    }

    static easeOutQuart(x) {
        return 1 - Math.pow(1 - x, 4);
    }

    static easeInOutQuart(x) {
        return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
    }

    static easeInQuint(x) {
        return x * x * x * x * x;
    }

    static easeOutQuint(x) {
        return 1 - Math.pow(1 - x, 5);
    }

    static easeInOutQuint(x) {
        return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
    }

    static easeInExpo(x) {
        return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
    }

    static easeOutExpo(x) {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }

    static easeInOutExpo(x) {
        return x === 0 ? 0
            : x === 1 ? 1
                : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2
                    : (2 - Math.pow(2, -20 * x + 10)) / 2;
    }

    static easeInCirc(x) {
        return 1 - Math.sqrt(1 - Math.pow(x, 2));
    }

    static easeOutCirc(x) {
        return Math.sqrt(1 - Math.pow(x - 1, 2));
    }

    static easeInOutCirc(x) {
        return x < 0.5
            ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
            : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
    }

    static easeOutBack(x) {
        return 1 + Easing.c3_ * Math.pow(x - 1, 3) + Easing.c1_ * Math.pow(x - 1, 2);
    }

    static easeInOutBack(x) {
        return x < 0.5
            ? (Math.pow(2 * x, 2) * ((Easing.c2_ + 1) * 2 * x - Easing.c2_)) / 2
            : (Math.pow(2 * x - 2, 2) * ((Easing.c2_ + 1) * (x * 2 - 2) + Easing.c2_) + 2) / 2;
    }
}
