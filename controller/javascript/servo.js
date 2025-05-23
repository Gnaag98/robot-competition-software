function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

class ServoGamepadBinding {
    /**
     * @param {number} gamepadIndex 
     * @param {number} inputIndex Index of either a button or an axis.
     */
    constructor(gamepadIndex, inputIndex) {
        /** @type {number | null} */
        this.gamepadIndex = gamepadIndex ?? null;
        /** @type {number | null} */
        this.inputIndex = inputIndex ?? null;
    }

    toJSON() {
        return {
            gamepadIndex: this.gamepadIndex,
            inputIndex: this.inputIndex
        }
    }

    static fromJSON({gamepadIndex, inputIndex}) {
        return new ServoGamepadBinding(gamepadIndex, inputIndex);
    }
}

class Servo {
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
    axisSpeed = 0.1;
    /** @type {ServoGamepadBinding} */
    axis;
    buttonSpeed = 0.1;
    /** @type {ServoGamepadBinding} */
    increaseButton;
    /** @type {ServoGamepadBinding} */
    decreaseButton;

    /**
     * @param {number} index - unique servo index.
     */
    constructor(index) {
        if (index !== undefined) {
            this.#index = index;
            // Make sure the next index is unique.
            Servo.#nextIndex = Math.max(Servo.#nextIndex, index + 1);
        } else {
            this.#index = Servo.#nextIndex++;
        }

        this.axis = new ServoGamepadBinding();
        this.increaseButton = new ServoGamepadBinding();
        this.decreaseButton = new ServoGamepadBinding();
    }

    static resetIndices() {
        Servo.#nextIndex = 0;
    }

    toJSON() {
        return {
            index: this.#index,
            name: this.name,
            pwm: Math.round(this.pwm),
            min: this.min,
            max: this.max,
            axisSpeed: this.axisSpeed,
            axis: this.axis.toJSON(),
            buttonSpeed: this.buttonSpeed,
            buttonAdd: this.increaseButton.toJSON(),
            buttonRemove: this.decreaseButton.toJSON()
        };
    }

    static fromJSON({
            index, name, pwm, min, max, axisSpeed, axis, buttonSpeed, buttonAdd,
            buttonRemove
        }) {
        let servo = new Servo(index);
        servo.name = name;
        servo.pwm = pwm;
        servo.min = min;
        servo.max = max;
        servo.axisSpeed = axisSpeed;
        servo.axis = ServoGamepadBinding.fromJSON(axis);
        servo.buttonSpeed = buttonSpeed;
        servo.increaseButton = ServoGamepadBinding.fromJSON(buttonAdd);
        servo.decreaseButton = ServoGamepadBinding.fromJSON(buttonRemove);
        return servo;
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
