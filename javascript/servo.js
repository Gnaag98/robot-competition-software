function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}


class Servo {
    static #nextServoIndex = 0;
    
    #index;
    #name;
    #pwm = 127;
    #pwmMin = 0;
    #pwmMax = 255;
    axisSpeed = 0.1;
    axis = null;
    buttonSpeed = 0.1;
    buttonAdd = null;
    buttonRemove = null;

    constructor(index, name) {
        if (index === undefined) {
            this.#index = Servo.#nextServoIndex++;
        } else {
            this.#index = index;
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
            pwm: this.pwm,
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

    /** Return the id user on the corresponding HTML element. */
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

    get pwm() {
        return this.#pwm;
    }

    set pwm(pwm) {
        this.#pwm = clamp(Math.round(pwm), this.#pwmMin, this.#pwmMax);
    }

    get min() {
        return this.#pwmMin;
    }

    set min(min) {
        this.#pwmMin = Math.min(Math.round(min), this.#pwmMax);
        // Clamp the pwm value by triggering the setter.
        this.pwm += 0;
    }

    get max() {
        return this.#pwmMax;
    }

    set max(max) {
        this.#pwmMax = Math.max(Math.round(max), this.#pwmMin);
        // Clamp the pwm value by triggering the setter.
        this.pwm += 0;
    }
}
