function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

class Servo {
    static #nextServoIndex = 0;
    
    /** @type {number} */
    #index;
    /** @type {string} */
    #name;
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
     * @param {string} name - default/user defined servo name.
     */
    constructor(index, name) {
        if (index === undefined) {
            this.#index = Servo.#nextServoIndex++;
        } else {
            this.#index = index;
            // Make sure the next index is unique.
            Servo.#nextServoIndex = Math.max(Servo.#nextServoIndex, index + 1);
        }

        if (name === undefined) {
            this.#name = `Servo ${this.#index}`;
        } else {
            this.#name = name;
        }
    }

    static resetIndices() {
        Servo.#nextServoIndex = 0;
    }

    toJSON() {
        return {
            index: this.index,
            name: this.name,
            pwm: Math.round(this.pwm),
            min: this.min,
            max: this.max,
            axisSpeed: this.axisSpeed,
            axis: this.axis,
            buttonSpeed: this.buttonSpeed,
            buttonAdd: this.buttonAdd,
            buttonRemove: this.buttonRemove
        }
    }

    static fromJSON({index, name, pwm, min, max, axisSpeed, axis, buttonSpeed, buttonAdd, buttonRemove}) {
        let servo = new Servo(index, name);
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
        return `servo-${this.index}`;
    }

    get name() {
        return this.#name;
    }

    set name(newName) {
        if (newName.length == 0){
            this.#name = `Servo ${this.#index}`;
        } else {
            this.#name = newName;
        }
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
