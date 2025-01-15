class View {
    /**
     * TODO: Add description.
     * 
     * @param {Servo[]} servos 
     */
    static update(servos) {
        // Update the sliders to reflect changes made elsewhere.
        for (const servo of servos) {
            const servoElement = document.getElementById(servo.id);
            this.#adjustServoSlider(servoElement, 'row-pwm', servo.pwm);
            this.#adjustServoSlider(servoElement, 'row-min', servo.min);
            this.#adjustServoSlider(servoElement, 'row-max', servo.max);
        }
    }

    /**
     * TODO: Add description.
     * 
     * @param {HTMLElement} servoElement 
     */
    static #adjustServoSlider(servoElement, rowClass, value) {
        const row = servoElement.querySelector(`.${rowClass}`);
        const slider = row.querySelector('input');
        const valueElement = row.querySelector('.slider-value');
        slider.value = value;
        valueElement.textContent = Math.round(value);
    }

    /**
     * TODO: Add description.
     * 
     * @param {Servo[]} servos 
     * @param {Gamepad} gamepad 
     */
    static addGamepadCard(servos, gamepad) {
        // Create a new gamepad card from the template.
        /** @type {HTMLTemplateElement} */
        const template = document.getElementById('gamepad');
        /** @type {DocumentFragment} */
        const gamepadFragment = template.content.cloneNode(true);
        gamepadFragment.querySelector('.card__header').placeholder = `Gamepad ${gamepad.index}`;

        // Add button indicators.
        for (const i in gamepad.buttons) {
            const buttonElement = document.createElement('input');
            buttonElement.placeholder = i;
            buttonElement.maxLength = 2;
            buttonElement.className = 'gamepad__button';
            gamepadFragment.querySelector('.gamepad__buttons').appendChild(buttonElement);
            buttonElements.push(buttonElement);
        }
        // Add axis indicators.
        for (const i in gamepad.axes) {
            const axisElement = document.createElement('div');
            axisElement.className = 'gamepad__axis';
            const axis_name = document.createElement('input');
            axis_name.type = 'text';
            axis_name.placeholder = i;
            axis_name.maxLength = 2;
            axisElement.appendChild(axis_name);
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '-1';
            slider.max = '1';
            slider.value = '0';
            slider.step = '0.01';
            slider.tabIndex = -1;
            axisElement.appendChild(slider);
            sliderElements.push(slider);
            gamepadFragment.querySelector('.gamepad__axes').appendChild(axisElement);
        }
        // Remove the placeholder if it still exits.
        document.getElementById('gamepad-placeholder')?.remove();
        // Add the gamepad card to the DOM.
        document.getElementById('gamepads').appendChild(gamepadFragment);
        // Add gamepad settings to all existing servo cards.
        for (const servo of servos) {
            this.tryAddGamepadSettings(servo, gamepad);
        }
    }

    static addServoCard(servo, gamepad) {
        this.#createServoCard(servo, gamepad);

    }

    static #createServoCard(servo, gamepad) {
        // Create servo card.
        const servoElement = document.createElement('div');
        servoElement.id = servo.id;
        servoElement.className = 'servo card';
        // Create editable header.
        const header = document.createElement('input');
        header.placeholder = servo.name;
        header.maxLength = 16;
        header.addEventListener('input', () => {
            // Update the servo name and use the placeholder as a fallback.
            servo.name = header.value ? header.value : header.placeholder;
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
        const pwmSlider = pwmRow.querySelector('input');
        const minSlider = minRow.querySelector('input');
        const maxSlider = maxRow.querySelector('input');
        pwmSlider.addEventListener('input', () => servo.pwm = parseInt(pwmSlider.value));
        minSlider.addEventListener('input', () => servo.min = parseInt(minSlider.value));
        maxSlider.addEventListener('input', () => servo.max = parseInt(maxSlider.value));
        // Enable the sliders to be updated indirectly, e.g., from a gamepad.
        const pwmValueElement = pwmRow.querySelector('.slider-value');
        const minValueElement = minRow.querySelector('.slider-value');
        const maxValueElement = maxRow.querySelector('.slider-value');
        // Add the servo card to the DOM.
        document.getElementById('servos').appendChild(servoElement);
        // Try to add gamepad settings.
        this.tryAddGamepadSettings(servo, gamepad);

        return servoElement;
    }

    static tryAddGamepadSettings(servo, gamepad) {
        const servoElement = document.getElementById(servo.id);
        if (!servoElement || !gamepad) {
            return;
        }
        servoElement.appendChild(this.#createGamepadSettings(gamepad, servo));
    }

    static #createGamepadSettings(gamepad, servo) {
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

    static #createSliderRow(name, initialValue, typename) {
        const row = document.createElement('div');
        row.className = `servo__row row-${typename}`;

        const label = document.createElement('span');
        label.textContent = name;

        const value = document.createElement('span');
        value.className = 'slider-value';
        value.textContent = initialValue;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 255;
        slider.step = 1;
        slider.value = initialValue;

        row.appendChild(label);
        row.appendChild(value);
        row.appendChild(slider);
        return row;
    }

    static #createInputRow(name, initialValue) {
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

    static #createDropdownRow(name, typename, values, initialValue) {
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
     * @param {Servo[]} servos
     */
    static clearServos(servos) {
        for (const servo of servos) {
            const servoElement = document.getElementById(servo.id);
            servoElement.remove();
        }
    }
}
