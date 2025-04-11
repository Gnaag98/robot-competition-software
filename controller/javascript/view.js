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
        this.#addBindingListeners(servo, servo.axis, bindingAxis);
        this.#addBindingListeners(servo, servo.increaseButton, bindingincrease);
        this.#addBindingListeners(servo, servo.decreaseButton, bindingdecrease);

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
     */
    updateBindings(servo) {
        const gamepads = navigator.getGamepads();
        this.#updateBinding(servo.axis, 'axis', gamepads);
        this.#updateBinding(servo.increaseButton, 'increase', gamepads);
        this.#updateBinding(servo.decreaseButton, 'decrease', gamepads);
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
     * Add event listeners to the select elements for a specified binding.
     * 
     * @param {Servo} servo
     * @param {ServoGamepadBinding} binding 
     * @param {HTMLElement} bindingElement - container for the select elements.
     */
    #addBindingListeners(servo, binding, bindingElement) {
        const gamepadSelect = bindingElement.querySelector('.select-gamepad');
        const inputSelect = bindingElement.querySelector('.select-input');
        const toIntOrNull = string => string ? parseInt(string) : null;
        gamepadSelect.addEventListener('change', event => {
            const previousIndex = binding.gamepadIndex;
            binding.gamepadIndex = toIntOrNull(event.target.value);
            // Reset the axis/button binding when switching gamepad.
            if (binding.gamepadIndex != previousIndex) {
                binding.inputIndex = null;
            }
            // Refresh the options.
            this.updateBindings(servo);
        });
        inputSelect.addEventListener('change', event => {
            binding.inputIndex = toIntOrNull(event.target.value);
            // Refresh the options.
            this.updateBindings(servo);
        });
    }

    /**
     * @param {ServoGamepadBinding} binding 
     * @param {string} bindingName - "axis", "increase" or "decrease".
     * @param {Gamepad[]} gamepads 
     */
    #updateBinding(binding, bindingName, gamepads) {
        const bindingElement = this.#root.querySelector(
            `.binding-${bindingName}`
        );
        
        this.#updateGamepadSelect(binding, bindingElement, gamepads);
        /** @type {Gamepad | undefined} */
        const gamepad = gamepads[binding.gamepadIndex];
        // There are no inputs for a disconnected gamepad. This is okay.
        const inputs = bindingName == 'axis' ? gamepad?.axes : gamepad?.buttons;
        this.#updateInputSelect(binding, bindingElement, inputs);
    }

    /**
     * Update the dropdown list of gamepads.
     * 
     * @param {ServoGamepadBinding} binding 
     * @param {HTMLElement} bindingElement - container for the select elements.
     * @param {Gamepad[]} gamepads 
     */
    #updateGamepadSelect(binding, bindingElement, gamepads) {
        const select = bindingElement.querySelector('.select-gamepad');
        /** @type {HTMLOptionElement} */
        const defaultOption = select.querySelector('option[value=""]');
        // Reset the selected option.
        defaultOption.selected = true;

        // New options that will replace the old ones.
        let options = [defaultOption];
        for (const gamepad of gamepads) {
            if (!gamepad) {
                continue;
            }
            const i = gamepad.index;
            const option = document.createElement('option');
            option.value = i;
            option.text = `Gamepad ${i}`;
            if (i == binding.gamepadIndex) {
                option.selected = true;
            }
            options.push(option);
        }

        // Replace options.
        select.replaceChildren(...options);
    }

    /**
     * Update the dropdown list of axes or buttons.
     * 
     * @param {ServoGamepadBinding} binding 
     * @param {HTMLElement} bindingElement
     * @param {number[] | GamepadButton[]} inputs - axes or buttons.

     */
    #updateInputSelect(binding, bindingElement, inputs) {
        const select = bindingElement.querySelector('.select-input');
        /** @type {HTMLOptionElement} */
        const defaultOption = select.querySelector('option[value=""]');
        // Reset the selected option.
        defaultOption.selected = true;

        // New options that will replace the old ones.
        let options = [defaultOption];
        // If no inputs were supplied, just replace with the default option.
        if (inputs) {
            const input = inputs[0];
            const prefix = input instanceof GamepadButton ? 'Button' : 'Axis';
            for (const i in inputs) {
                const option = document.createElement('option');
                // Select the first available gamepad by default.
                option.value = i;
                option.text = `${prefix} ${i}`;
                if (i == binding.inputIndex) {
                    option.selected = true;
                }
                options.push(option);
            }
        }

        // Replace options.
        select.replaceChildren(...options);
    }
}

/** Visual representation of a motor. */
class MotorView {
    /**
     * Root container for a motor.
     *  
     * @type {HTMLElement}
     * */
    #root;
    
    /**
     * Create a visual representation of the motor and attach it to the DOM.
     * 
     * @param {Motor} motor 
     */
    constructor(motor) {
        // Create a new card from the template.
        /** @type {HTMLTemplateElement} */
        const template = document.getElementById('motor-template');
        /** @type {DocumentFragment} */
        const fragment = template.content.cloneNode(true);
        const card = fragment.firstElementChild;
        // Store the element to reference it more easily later.
        this.#root = card;

        // Initialize the card header.
        const header = card.querySelector('.card__header');
        header.placeholder = `Motor ${motor.index}`;
        header.value = motor.name;
        header.addEventListener('input', () => {
            motor.name = header.value;
        });
        
        // Initialize slider values.
        const pwmInput = this.#updateSlider('pwm', motor.pwm);
        const minInput = this.#updateSlider('min', motor.min);
        const maxInput = this.#updateSlider('max', motor.max);
        pwmInput.addEventListener('input', event => {
            motor.pwm = parseInt(event.target.value);
        });
        minInput.addEventListener('input', event => {
            motor.min = parseInt(event.target.value);
        });
        maxInput.addEventListener('input', event => {
            motor.max = parseInt(event.target.value);
        });
        
        // Initialize gamepad bindings.
        const bindingAxis = card.querySelector('.binding-axis');
        this.#addBindingListeners(motor, motor.axis, bindingAxis);

        // Add card to DOM.
        document.getElementById('motors').appendChild(card);
    }

    /** Remove the visual representation of the motor from the DOM. */
    remove() {
        this.#root.remove();
    }

    /**
     * Update the sliders to reflect changes made elsewhere.
     * 
     * @param {Motor} servo 
     */
    update(servo) {
        this.#updateSlider('pwm', servo.pwm);
        this.#updateSlider('min', servo.min);
        this.#updateSlider('max', servo.max);
    }

    /**
     * Update the bindings between gamepads and the servo.
     * 
     * @param {Motor} servo
     */
    updateBindings(servo) {
        const gamepads = navigator.getGamepads();
        this.#updateBinding(servo.axis, 'axis', gamepads);
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
     * Add event listeners to the select elements for a specified binding.
     * 
     * @param {Motor} servo
     * @param {MotorGamepadBinding} binding 
     * @param {HTMLElement} bindingElement - container for the select elements.
     */
    #addBindingListeners(servo, binding, bindingElement) {
        const gamepadSelect = bindingElement.querySelector('.select-gamepad');
        const inputSelect = bindingElement.querySelector('.select-input');
        const toIntOrNull = string => string ? parseInt(string) : null;
        gamepadSelect.addEventListener('change', event => {
            const previousIndex = binding.gamepadIndex;
            binding.gamepadIndex = toIntOrNull(event.target.value);
            // Reset the axis binding when switching gamepad.
            if (binding.gamepadIndex != previousIndex) {
                binding.inputIndex = null;
            }
            // Refresh the options.
            this.updateBindings(servo);
        });
        inputSelect.addEventListener('change', event => {
            binding.inputIndex = toIntOrNull(event.target.value);
            // Refresh the options.
            this.updateBindings(servo);
        });
    }

    /**
     * @param {MotorGamepadBinding} binding 
     * @param {string} bindingName - Only "axis" supported for motors.
     * @param {Gamepad[]} gamepads 
     */
    #updateBinding(binding, bindingName, gamepads) {
        const bindingElement = this.#root.querySelector(
            `.binding-${bindingName}`
        );
        
        this.#updateGamepadSelect(binding, bindingElement, gamepads);
        /** @type {Gamepad | undefined} */
        const gamepad = gamepads[binding.gamepadIndex];
        // There are no inputs for a disconnected gamepad. This is okay.
        const inputs = gamepad?.axes;
        this.#updateInputSelect(binding, bindingElement, inputs);
    }

    /**
     * Update the dropdown list of gamepads.
     * 
     * @param {MotorGamepadBinding} binding 
     * @param {HTMLElement} bindingElement - container for the select elements.
     * @param {Gamepad[]} gamepads 
     */
    #updateGamepadSelect(binding, bindingElement, gamepads) {
        const select = bindingElement.querySelector('.select-gamepad');
        /** @type {HTMLOptionElement} */
        const defaultOption = select.querySelector('option[value=""]');
        // Reset the selected option.
        defaultOption.selected = true;

        // New options that will replace the old ones.
        let options = [defaultOption];
        for (const gamepad of gamepads) {
            if (!gamepad) {
                continue;
            }
            const i = gamepad.index;
            const option = document.createElement('option');
            option.value = i;
            option.text = `Gamepad ${i}`;
            if (i == binding.gamepadIndex) {
                option.selected = true;
            }
            options.push(option);
        }

        // Replace options.
        select.replaceChildren(...options);
    }

    /**
     * Update the dropdown list of axes.
     * 
     * @param {MotorGamepadBinding} binding 
     * @param {HTMLElement} bindingElement
     * @param {number[]} inputs - axes.

     */
    #updateInputSelect(binding, bindingElement, inputs) {
        const select = bindingElement.querySelector('.select-input');
        /** @type {HTMLOptionElement} */
        const defaultOption = select.querySelector('option[value=""]');
        // Reset the selected option.
        defaultOption.selected = true;

        // New options that will replace the old ones.
        let options = [defaultOption];
        // If no inputs were supplied, just replace with the default option.
        if (inputs) {
            const prefix = 'Axis';
            for (const i in inputs) {
                const option = document.createElement('option');
                // Select the first available gamepad by default.
                option.value = i;
                option.text = `${prefix} ${i}`;
                if (i == binding.inputIndex) {
                    option.selected = true;
                }
                options.push(option);
            }
        }

        // Replace options.
        select.replaceChildren(...options);
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
     * @param {Gamepad[]} gamepads
     */
    update(gamepads) {
        const gamepad = gamepads[this.#gamepadViewData.index];
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
     * Remove from the DOM only if the index matches.
     * 
     * @param {number} index 
     * @returns true if the DOM element was removed.
     */
    removeIfMatching(index) {
        if (index == this.#gamepadViewData.index) {
            this.remove();
            return true;
        } else {
            return false;
        }
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
    /** @type {MotorView[]} */
    #motorViews = [];
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
     */
    addServo(servo) {
        const view = new ServoView(servo);
        view.updateBindings(servo);
        this.#servoViews.push(view);
    }

    /**
     * TODO: Add description.
     * 
     * @param {Motor} motor 
     */
    addMotor(motor) {
        const view = new MotorView(motor);
        view.updateBindings(motor);
        this.#motorViews.push(view);
    }

    /**
     * TODO: Add description.
     * 
     * @param {Servo[]} servos 
     * @param {Motor[]} motors 
     * @param {Gamepad} gamepad 
     * @param {GamepadViewData} gamepadViewData 
     */
    addGamepad(servos, motors, gamepad, gamepadViewData) {
        const gamepadView = new GamepadView(gamepad, gamepadViewData);
        for (const i in servos) {
            const servo = servos[i];
            const servoView = this.#servoViews[i];
            servoView.updateBindings(servo);
        }
        for (const i in motors) {
            const motor = motors[i];
            const motorView = this.#motorViews[i];
            motorView.updateBindings(motor);
        }
        this.#gamepadViews.push(gamepadView);
    }

    /**
     * Update all views.
     * 
     * @param {Servo[]} servos 
     * @param {Motor[]} motors 
     * @param {Gamepad[]} gamepads
     */
    update(servos, motors, gamepads) {
        // Update servo views.
        for (const i in servos) {
            const servo = servos[i];
            const servoView = this.#servoViews[i];
            servoView.update(servo);
        }
        // Update motor views.
        for (const i in motors) {
            const motor = motors[i];
            const motorView = this.#motorViews[i];
            motorView.update(motor);
        }
        // Update gamepad views.
        for (const view of this.#gamepadViews) {
            view.update(gamepads);
        }
    }

    /** Remove the visual representation of all servos from the DOM. */
    clearServos() {
        for (const view of this.#servoViews) {
            view.remove();
        }
        this.#servoViews = [];
    }

    /** Remove the visual representation of all motors from the DOM. */
    clearMotors() {
        for (const view of this.#motorViews) {
            view.remove();
        }
        this.#motorViews = [];
    }

    /**
     * Remove the view corresponding to the specified gamepad.
     * 
     * @param {Servo[]} servos 
     * @param {Motor[]} motors 
     * @param {Gamepad} gamepad 
     */
    removeGamepad(servos, motors, gamepad) {
        // Index of the view to remove.
        let index = -1;
        for (const i in this.#gamepadViews) {
            const view = this.#gamepadViews[i];
            if (view.removeIfMatching(gamepad.index)) {
                index = i;
                break;
            }
        }
        // Remove the view.
        if (index >= 0) {
            this.#gamepadViews.splice(index, 1);
        }
        // Update the servo bindings to reflect the missing gamepad.
        for (const i in servos) {
            const servo = servos[i];
            const servoView = this.#servoViews[i];
            servoView.updateBindings(servo);
        }
        // Update the motor bindings to reflect the missing gamepad.
        for (const i in motors) {
            const motor = motors[i];
            const motorView = this.#motorViews[i];
            motorView.updateBindings(motor);
        }
    }

    /** Remove the visual representation of all gamepads from the DOM. */
    clearGamepads() {
        for (const view of this.#gamepadViews) {
            view.remove();
        }
        this.#gamepadViews = [];
    }
}
