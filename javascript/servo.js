function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
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
    /** @type {number | null} */
    axis = null;
    buttonSpeed = 0.1;
    /** @type {number | null} */
    buttonAdd = null;
    /** @type {number | null} */
    buttonRemove = null;

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
            axis: this.axis,
            buttonSpeed: this.buttonSpeed,
            buttonAdd: this.buttonAdd,
            buttonRemove: this.buttonRemove
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
        servo.axis = axis;
        servo.buttonSpeed = buttonSpeed;
        servo.buttonAdd = buttonAdd;
        servo.buttonRemove = buttonRemove;
        return servo;
    }

    move(value) {
        this.pwm += value;
    }

    get index() {
        return this.#index;
    }

    /** Return the id used for the corresponding HTML element. */
    get id() {
        return `servo-${this.#index}`;
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
