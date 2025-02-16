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
        this.#root = this.#createCardWithoutGamepadSettings(servo);
        document.getElementById('servos').appendChild(this.#root);
    }

    /** Remove the visual representation of the servo from the DOM. */
    remove() {
        this.#root.remove();
    }

    update(servo) {
        // Update the sliders to reflect changes made elsewhere.
        this.#updateSlider('row-pwm', servo.pwm);
        this.#updateSlider('row-min', servo.min);
        this.#updateSlider('row-max', servo.max);
    }

    tryAddGamepadSettings(servo, gamepad) {
        if (!gamepad) {
            return;
        }
        this.#root.appendChild(this.#createGamepadSettings(servo, gamepad));
    }

    #createCardWithoutGamepadSettings(servo) {
        // Create servo card.
        const servoElement = document.createElement('div');
        servoElement.id = servo.id;
        servoElement.className = 'servo card';
        // Create editable header.
        const header = document.createElement('input');
        header.placeholder = `Servo ${servo.index}`;
        header.value = servo.name;
        header.maxLength = 16;
        header.addEventListener('input', () => {
            servo.name = header.value;
        });
        header.className = 'card__header input-header';
        // Create sliders.
        const pwmRow = this.#createSliderRow('PWM', servo.pwm, 'pwm');
        const minRow = this.#createSliderRow('Min', servo.min, 'min');
        const maxRow = this.#createSliderRow('Max', servo.max, 'max');
        // Assemble the row.
        servoElement.appendChild(header);
        servoElement.appendChild(pwmRow);
        servoElement.appendChild(minRow);
        servoElement.appendChild(maxRow);
        // Adjust the servo when the sliders move.
        pwmRow.querySelector('.slider-input').addEventListener('input', event => {
            servo.pwm = parseInt(event.target.value);
        });
        minRow.querySelector('.slider-input').addEventListener('input', event => {
            servo.min = parseInt(event.target.value);
        });
        maxRow.querySelector('.slider-input').addEventListener('input', event => {
            servo.max = parseInt(event.target.value);
        });
        // Add the servo card to the DOM.
        document.getElementById('servos').appendChild(servoElement);
        return servoElement;
    }

    // TODO: Refactor this function. The settings should all be there at
    // creation, and when a gamepad is connected then the options are populated.
    #createGamepadSettings(servo, gamepad) {
        // Create a parent fragment instead of a div so that the rows end up as
        // siblings to the other rows.
        const settingsFragment = document.createDocumentFragment();
        // Create number inputs.
        const axisSpeedRow = this.#createInputRow('Axis speed', servo.axisSpeed);
        const buttonSpeedRow = this.#createInputRow('Button speed', servo.buttonSpeed);
        // Create dropdown inputs.
        const axisRow = this.#createDropdownRow('Axis', 'Axis', gamepad.axes, servo.axis);
        const buttonIncreaseRow = this.#createDropdownRow('Button +', 'Button', gamepad.buttons, servo.buttonAdd);
        const buttonDecreaseRow = this.#createDropdownRow('Button -', 'Button', gamepad.buttons, servo.buttonRemove);
        // Make sure the inputs update the servo.
        axisSpeedRow.querySelector('input').addEventListener('input', event => {
            servo.axisSpeed = event.target.value
        });
        buttonSpeedRow.querySelector('input').addEventListener('input', event => {
            servo.buttonSpeed = event.target.value
        });
        axisRow.querySelector('select').addEventListener('change', event => {
            servo.axis = parseInt(event.target.value);
        });
        buttonIncreaseRow.querySelector('select').addEventListener('change', event => {
            servo.buttonAdd = parseInt(event.target.value);
        });
        buttonDecreaseRow.querySelector('select').addEventListener('change', event => {
            servo.buttonRemove = parseInt(event.target.value);
        });
        // Assemble the row.
        settingsFragment.appendChild(axisSpeedRow);
        settingsFragment.appendChild(axisRow);
        settingsFragment.appendChild(buttonSpeedRow);
        settingsFragment.appendChild(buttonIncreaseRow);
        settingsFragment.appendChild(buttonDecreaseRow);
        return settingsFragment;
    }

    #createSliderRow(name, initialValue, typename) {
        const row = document.createElement('div');
        row.className = `servo__row row-${typename}`;

        const nameElement = document.createElement('span');
        nameElement.textContent = name;
        
        const value = document.createElement('span');
        value.textContent = initialValue;
        value.className = 'slider-value';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 255;
        slider.step = 1;
        slider.value = initialValue;
        slider.className = 'slider-input';

        row.appendChild(nameElement);
        row.appendChild(value);
        row.appendChild(slider);
        return row;
    }

    #createInputRow(name, initialValue) {
        const row = document.createElement('div');
        row.className = 'servo__row';

        const label = document.createElement('label');
        label.textContent = name;

        const input = document.createElement('input');
        input.type = 'number';
        input.min = -5;
        input.max = 5;
        input.step = 0.1;
        input.value = initialValue;

        row.appendChild(label);
        row.appendChild(input);
        return row;
    }

    #createDropdownRow(name, typename, values, initialValue) {
        const row = document.createElement('div');
        row.className = 'servo__row';

        const label = document.createElement('label');
        label.textContent = name;

        const dropdown = document.createElement('select');
        // Add default option.
        const defaultOption = document.createElement('option');
        defaultOption.value = null;
        defaultOption.text = 'Unbound';
        if (initialValue == null) {
            defaultOption.selected = true;
        }
        dropdown.appendChild(defaultOption);
        // Add all other options.
        for (const i in values) {
            const option = document.createElement('option');
            option.value = i;
            option.text = `${typename}: ${i}`;
            if (initialValue == i) {
                option.selected = true;
            }
            dropdown.appendChild(option);
        }

        row.appendChild(label);
        row.appendChild(dropdown);
        return row;
    }

    /**
     * TODO: Add description.
     * 
     * @param {HTMLElement} servoElement 
     */
    #updateSlider(rowClass, value) {
        const row = this.#root.querySelector(`.${rowClass}`);
        const inputElement = row.querySelector('.slider-input');
        const valueElement = row.querySelector('.slider-value');
        inputElement.value = value;
        valueElement.textContent = Math.round(value);
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
        view.tryAddGamepadSettings(servo, gamepad);
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
            servoView.tryAddGamepadSettings(servo, gamepad);
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
