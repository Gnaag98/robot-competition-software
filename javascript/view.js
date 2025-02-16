/** Visual representation of a servo. */
class ServoView {
    /**
     * Root container for a servo.
     *  
     * @type {HTMLElement}
     * */
    #root;
    
    /**
     * Create a visual representation of the servo and attach it to the DOM.
     * 
     * @param {Servo} servo 
     */
    constructor(servo) {
        // Create a new card from the template.
        /** @type {HTMLTemplateElement} */
        const template = document.getElementById('servo-template');
        /** @type {DocumentFragment} */
        const fragment = template.content.cloneNode(true);
        const card = fragment.firstElementChild;
        // Store the element to reference it more easily later.
        this.#root = card;

        // Initialize the card header.
        const header = card.querySelector('.card__header');
        header.placeholder = `Servo ${servo.index}`;
        header.value = servo.name;
        header.addEventListener('input', () => {
            servo.name = header.value;
        });
        
        // Initialize slider values.
        const pwmInput = this.#updateSlider('pwm', servo.pwm);
        const minInput = this.#updateSlider('min', servo.min);
        const maxInput = this.#updateSlider('max', servo.max);
        pwmInput.addEventListener('input', event => {
            servo.pwm = parseInt(event.target.value);
        });
        minInput.addEventListener('input', event => {
            servo.min = parseInt(event.target.value);
        });
        maxInput.addEventListener('input', event => {
            servo.max = parseInt(event.target.value);
        });

        // Initialize speed inputs.
        /** @type {HTMLInputElement} */
        const axisSpeedInput = card.querySelector('.axis-speed');
        /** @type {HTMLInputElement} */
        const buttonSpeedInput = card.querySelector('.button-speed');
        axisSpeedInput.value = servo.axisSpeed;
        buttonSpeedInput.value = servo.buttonSpeed;
        axisSpeedInput.addEventListener('input', event => {
            servo.axisSpeed = event.target.value
        });
        buttonSpeedInput.addEventListener('input', event => {
            servo.buttonSpeed = event.target.value
        });
        
        // Initialize gamepad bindings.
        const bindingAxis = card.querySelector('.binding-axis');
        const bindingincrease = card.querySelector('.binding-increase');
        const bindingdecrease = card.querySelector('.binding-decrease');
        const toIntOrNull = string => string ? parseInt(string) : null;
        bindingAxis.addEventListener('change', event => {
            servo.axis.inputIndex = toIntOrNull(event.target.value);
        });
        bindingincrease.addEventListener('change', event => {
            servo.buttonIncrease.inputIndex = toIntOrNull(event.target.value);
        });
        bindingdecrease.addEventListener('change', event => {
            servo.buttonDecrease.inputIndex = toIntOrNull(event.target.value);
        });

        // Add card to DOM.
        document.getElementById('servos').appendChild(card);
    }

    /** Remove the visual representation of the servo from the DOM. */
    remove() {
        this.#root.remove();
    }

    /**
     * Update the sliders to reflect changes made elsewhere.
     * 
     * @param {Servo} servo 
     */
    update(servo) {
        this.#updateSlider('pwm', servo.pwm);
        this.#updateSlider('min', servo.min);
        this.#updateSlider('max', servo.max);
    }

    /**
     * Update the bindings between gamepads and the servo.
     * 
     * @param {Servo} servo
     * @param {Gamepad} gamepad 
     */
    updateBindings(servo, gamepad) {
        this.#updateBinding(servo.axis, 'axis', gamepad.axes);
        this.#updateBinding(servo.buttonIncrease, 'increase', gamepad.buttons);
        this.#updateBinding(servo.buttonDecrease, 'decrease', gamepad.buttons);
    }

    /**
     * Updates the slider position and displayed integer representation.
     * 
     * @param {string} name - "pwm", "min" or "max"
     * @param {number} value - number in range 0-255.
     * 
     * @returns {HTMLElement} input element of row.
     */
    #updateSlider(name, value) {
        const row = this.#root.querySelector(`.row-${name}`);
        const valueElement = row.querySelector('.slider-value');
        const inputElement = row.querySelector('.slider-input');
        valueElement.textContent = Math.round(value);
        inputElement.value = value;
        return inputElement;
    }

    /**
     * 
     * @param {ServoGamepadBinding} binding 
     * @param {string} bindingName - "axis", "increase" or "decrease".
     * @param {number[] | GamepadButton[]} gamepadArray - axes or buttons.
     */
    #updateBinding(binding, bindingName, gamepadArray) {
        /** @type {HTMLSelectElement} */
        const selectElement = this.#root.querySelector(
            `.binding-${bindingName}`
        );
        /** @type {HTMLOptionElement} */

        const defaultOption = selectElement.querySelector('option[value=""]');
        // Reset the selected option.
        defaultOption.selected = true;

        // New options that will replace the old ones.
        let options = [defaultOption];
        for (const i in gamepadArray) {
            const option = document.createElement('option');
            const prefix = bindingName == 'axis' ? 'Axis' : 'Button';
            option.value = i;
            option.text = `${prefix} ${i}`;
            // Select this option if it matches the servo binding.
            if (i == binding.inputIndex) {
                option.selected = true;
            }
            options.push(option);
        }

        // Replace options.
        selectElement.replaceChildren(...options);
    }
}

/** Visual representation of a gamepad. */
class GamepadView {
    /**
     * User specified settings.
     * 
     * @type {GamepadViewData}
     */
    #gamepadViewData;
    /**
     * Root container for a servo.
     *  
     * @type {HTMLElement}
     * */
    #root;
    
    /**
     * Create a visual representation of the servo and attach it to the DOM.
     * 
     * @param {Gamepad} gamepad 
     * @param {GamepadViewData} gamepadViewData 
     */
    constructor(gamepad, gamepadViewData) {
        this.#gamepadViewData = gamepadViewData;
        this.#root = this.#createCard(gamepad);
        document.getElementById('gamepads').appendChild(this.#root);
    }

    /**
     * 
     * @param {Gamepad} gamepad 
     */
    update(gamepad) {
        // Update buttons.
        const buttonElements = this.#root.querySelectorAll('.gamepad__button');
        for (const buttonIndex in gamepad.buttons) {
            const button = gamepad.buttons[buttonIndex];
            const buttonElement = buttonElements[buttonIndex];
            if (button.pressed) {
                buttonElement.classList.add('pressed');
            } else {
                buttonElement.classList.remove('pressed');
            }
        }
        // Update axes.
        const sliderElements = this.#root.querySelectorAll('input[type=range]');
        for (const axisIndex in gamepad.axes) {
            const axis = gamepad.axes[axisIndex];
            const sliderElement = sliderElements[axisIndex];
            sliderElement.value = axis;
        }
    }

    /** Remove the visual representation of the gamepad from the DOM. */
    remove() {
        this.#root.remove();
    }

    /**
     * TODO: Add description.
     * 
     * @param {Gamepad} gamepad 
     */
    #createCard(gamepad) {
        // Create a new gamepad card from the template.
        /** @type {HTMLTemplateElement} */
        const gamepadTemplate = document.getElementById('gamepad-template');
        /** @type {DocumentFragment} */
        const gamepadFragment = gamepadTemplate.content.cloneNode(true);
        /** @type {HTMLInputElement} */
        const header = gamepadFragment.querySelector('.gamepad__name');
        header.placeholder = `Gamepad ${gamepad.index}`;
        header.value = this.#gamepadViewData.name;
        header.addEventListener('input', () => {
            this.#gamepadViewData.name = header.value;
        });

        // Add button indicators.
        for (const i in gamepad.buttons) {
            const buttonElement = document.createElement('input');
            buttonElement.placeholder = i;
            buttonElement.value = this.#gamepadViewData.buttons[i];
            buttonElement.maxLength = 2;
            buttonElement.className = 'gamepad__button';
            buttonElement.addEventListener('input', () => {
                this.#gamepadViewData.buttons[i] = buttonElement.value;
            });
            gamepadFragment.querySelector('.gamepad__buttons').appendChild(buttonElement);
        }
        // Add axis indicators.
        /** @type {HTMLTemplateElement} */
        const axisTemplate = document.getElementById('gamepad-axis-template');
        for (const i in gamepad.axes) {
            /** @type {DocumentFragment} */
            const axisFragment = axisTemplate.content.cloneNode(true);
            const name = axisFragment.querySelector('input[type=text]');
            const slider = axisFragment.querySelector('input[type=range]');
            name.placeholder = i;
            name.value = this.#gamepadViewData.axes[i];
            name.addEventListener('input', () => {
                this.#gamepadViewData.axes[i] = name.value;
            });
            slider.value = '0';
            gamepadFragment.querySelector('.gamepad__axes').appendChild(axisFragment);
        }
        // Remove the placeholder if it still exits.
        document.getElementById('gamepad-placeholder')?.remove();

        return gamepadFragment.firstElementChild;
    }
}

class View {
    /** @type {ServoView[]} */
    #servoViews = [];
    /** @type {GamepadView[]} */
    #gamepadViews = [];

    static log(message) {
        const logger = document.getElementById('logger');
        const log = document.createElement('p');
        log.textContent = message;
        logger.appendChild(log);
        logger.scrollTo(0, logger.scrollHeight);
    }

    /**
     * TODO: Add description.
     * 
     * @param {Servo} servo 
     * @param {Gamepad} gamepad 
     */
    addServo(servo, gamepad) {
        const view = new ServoView(servo);
        view.updateBindings(servo, gamepad);
        this.#servoViews.push(view);
    }

    /**
     * TODO: Add description.
     * 
     * @param {Servo[]} servos 
     * @param {Gamepad} gamepad 
     * @param {GamepadViewData} gamepadViewData 
     */
    addGamepad(servos, gamepad, gamepadViewData) {
        const gamepadView = new GamepadView(gamepad, gamepadViewData);
        for (const i in servos) {
            const servo = servos[i];
            const servoView = this.#servoViews[i];
            servoView.updateBindings(servo, gamepad);
        }
        this.#gamepadViews.push(gamepadView);
    }

    /**
     * TODO: Add description.
     * 
     * @param {Servo[]} servos 
     * @param {Gamepad} gamepad 
     */
    update(servos, gamepad) {
        // Update servo views.
        for (const i in servos) {
            const servo = servos[i];
            const servoView = this.#servoViews[i];
            servoView.update(servo);
        }
        // Update gamepad views.
        for (const view of this.#gamepadViews) {
            view.update(gamepad);
        }
    }

    /** Remove the visual representation of all servos from the DOM. */
    clearServos() {
        for (const view of this.#servoViews) {
            view.remove();
        }
        this.#servoViews = [];
    }

    /** Remove the visual representation of all gamepads from the DOM. */
    clearGamepads() {
        for (const view of this.#gamepadViews) {
            view.remove();
        }
        this.#gamepadViews = [];
    }
}
