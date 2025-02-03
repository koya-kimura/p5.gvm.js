/**
 * Generative Visual Music (GVM) クラス
 * BPMベースの時間管理とイージングを組み合わせた視覚的な音楽生成を支援
 */
class GVM {
    // クラス定数
    static DEFAULT_BPM = 100;
    static DEFAULT_CYCLE_LENGTH = 8;
    static DEFAULT_EASE_DURATION = 2;
    static MIN_BPM = 0;
    static MAX_BPM = 1000;

    /**
     * @param {number} bpm - 1分あたりの拍数（Beats Per Minute）
     * @throws {Error} BPMが範囲外の場合
     */
    constructor(bpm = GVM.DEFAULT_BPM) {
        this.validateBpm(bpm);
        this.bpm_ = bpm;
        this.lastCount_ = null;
        this.lastCountTime_ = null;
    }

    /**
     * BPMの値を検証
     * @param {number} bpm - 検証するBPM値
     * @throws {Error} 無効なBPM値の場合
     */
    validateBpm(bpm) {
        if (!Number.isFinite(bpm) || bpm < GVM.MIN_BPM || bpm > GVM.MAX_BPM) {
            throw new Error(`BPM must be between ${GVM.MIN_BPM} and ${GVM.MAX_BPM}`);
        }
    }

    /**
     * 現在の拍カウントを取得（キャッシュ機能付き）
     * @returns {number} 現在の拍カウント
     */
    count() {
        const currentTime = millis();

        if (this.lastCount_ !== null && this.lastCountTime_ === currentTime) {
            return this.lastCount_;
        }

        const beatIntervalMs = (60 / this.bpm_) * 1000;
        this.lastCount_ = currentTime / beatIntervalMs;
        this.lastCountTime_ = currentTime;

        return this.lastCount_;
    }

    /**
     * イージング適用済みのフェーズを取得
     * @param {number} cycleLength - サイクルの長さ
     * @param {number} easeDuration - イージングの持続時間
     * @param {Function} easeFunction - イージング関数
     * @returns {number} イージング適用済みのフェーズ値
     */
    getPhase(
        cycleLength = GVM.DEFAULT_CYCLE_LENGTH,
        easeDuration = GVM.DEFAULT_EASE_DURATION,
        easeFunction = Easing.easeInOutSine
    ) {
        if (cycleLength <= 0) throw new Error('Cycle length must be positive');
        if (easeDuration <= 0 || easeDuration > cycleLength) {
            throw new Error('Ease duration must be positive and not greater than cycle length');
        }

        const easeStartOffset = cycleLength - easeDuration;
        const basePhase = Math.floor(this.count() / cycleLength);
        const cyclePosition = this.count() % cycleLength;
        const easeProgress = (Math.max(easeStartOffset, cyclePosition) - easeStartOffset) / easeDuration;
        const easeValue = easeFunction(fract(easeProgress));

        return basePhase + easeValue;
    }

    /**
     * ノイズ値をイージングで補間
     * @param {number} cycleLength - サイクルの長さ
     * @param {number} easeDuration - イージングの持続時間
     * @param {Array<number>} seed - ノイズのシード値 [x, y]
     * @param {Function} easeFunction - イージング関数
     * @returns {number} 補間されたノイズ値
     */
    leapNoise(
        cycleLength = GVM.DEFAULT_CYCLE_LENGTH,
        easeDuration = GVM.DEFAULT_EASE_DURATION,
        seed = [0, 0],
        easeFunction = Easing.easeInOutSine
    ) {
        if (!Array.isArray(seed) || seed.length !== 2) {
            throw new Error('Seed must be an array of two numbers');
        }

        const currentPhase = Math.floor(this.count() / cycleLength);
        const nextPhase = currentPhase + 1;

        const currentNoise = noise(currentPhase, seed[0], seed[1]);
        const nextNoise = noise(nextPhase, seed[0], seed[1]);

        const easeProgress = fract(this.getPhase(cycleLength, easeDuration, easeFunction));

        return lerp(currentNoise, nextNoise, easeProgress);
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
