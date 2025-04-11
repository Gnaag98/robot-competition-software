function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

class MotorGamepadBinding {
    /**
     * @param {number} gamepadIndex 
     * @param {number} axisIndex
     */
    constructor(gamepadIndex, axisIndex) {
        /** @type {number | null} */
        this.gamepadIndex = gamepadIndex ?? null;
        /** @type {number | null} */
        this.axisIndex = axisIndex ?? null;
    }

    toJSON() {
        return {
            gamepadIndex: this.gamepadIndex,
            axisIndex: this.axisIndex
        }
    }

    static fromJSON({gamepadIndex, axisIndex}) {
        return new MotorGamepadBinding(gamepadIndex, axisIndex);
    }
}

class Motor {
    static #nextIndex = 0;
    
    /** @type {number} */
    #index;
    name = '';
    /** 
     * Make sure to not store the pwm as an integer as this would prevent fine
     * changes by a gamepad. */
    #pwm = 127.0;
    #pwmMin = 0;
    #pwmMax = 255;
    /** @type {MotorGamepadBinding} */
    axis;

    /**
     * @param {number} index - unique motor index.
     */
    constructor(index) {
        if (index !== undefined) {
            this.#index = index;
            // Make sure the next index is unique.
            Motor.#nextIndex = Math.max(Motor.#nextIndex, index + 1);
        } else {
            this.#index = Motor.#nextIndex++;
        }

        this.axis = new MotorGamepadBinding();
    }

    static resetIndices() {
        Motor.#nextIndex = 0;
    }

    toJSON() {
        return {
            index: this.#index,
            name: this.name,
            pwm: Math.round(this.pwm),
            min: this.min,
            max: this.max,
            axis: this.axis.toJSON(),
        };
    }

    static fromJSON({index, name, pwm, min, max, axis}) {
        let motor = new Motor(index);
        motor.name = name;
        motor.pwm = pwm;
        motor.min = min;
        motor.max = max;
        motor.axis = MotorGamepadBinding.fromJSON(axis);
        return motor;
    }

    get index() {
        return this.#index;
    }

    /** Decimal pwm value. */
    get pwm() {
        return this.#pwm;
    }

    set pwm(pwm) {
        this.#pwm = clamp(pwm, this.#pwmMin, this.#pwmMax);
    }

    /** Integer min pwm limit. */
    get min() {
        return this.#pwmMin;
    }

    set min(min) {
        this.#pwmMin = Math.min(Math.round(min), this.#pwmMax);
        // Clamp the pwm value by triggering the setter.
        this.pwm += 0;
    }

    /** Integer max pwm limit. */
    get max() {
        return this.#pwmMax;
    }

    set max(max) {
        this.#pwmMax = Math.max(Math.round(max), this.#pwmMin);
        // Clamp the pwm value by triggering the setter.
        this.pwm += 0;
    }
}
