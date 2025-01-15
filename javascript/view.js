class View {
    servoCards = new Map();
    // TODO: Interate over a list of update functions, instead of iterating over
    // DOM elements.
    update(servos) {
        servos.forEach((servo) => {
            this.servoCards.get(servo['index'].toString()).update(servo);
        });
    }

    /**
     * TODO: Add description.
     * 
     * @param {Gamepad} gamepad 
     */
    addGamepadCard(gamepad) {
        // Create a new gamepad card from the template.
        /** @type {HTMLTemplateElement} */
        const template = document.getElementById('gamepad');
        /** @type {DocumentFragment} */
        const gamepadFragment = template.content.cloneNode(true);
        gamepadFragment.querySelector('.card__header').textContent = `Gamepad ${gamepad.index}`;

        // Add button indicators.
        for (let i in gamepad.buttons) {
            const button_element = document.createElement('span');
            button_element.textContent = i;
            button_element.className = 'gamepad__button';
            buttons.push(gamepadFragment.querySelector('.gamepad__buttons').appendChild(button_element));
        }
        // Add axis indicators.
        for (let i in gamepad.axes) {
            const axis_element = document.createElement('div');
            axis_element.className = 'gamepad__axis';
            const axis_index = document.createElement('span');
            axis_index.textContent = i;
            axis_element.appendChild(axis_index);
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '-1';
            slider.max = '1';
            slider.value = '0';
            slider.step = '0.01';
            sliders.push(axis_element.appendChild(slider));
            gamepadFragment.querySelector('.gamepad__axes').appendChild(axis_element);
        }
        // Remove the placeholder if it still exits.
        document.getElementById('gamepad-placeholder')?.remove();
        // Add the gamepad card to the DOM.
        document.getElementById('gamepads').appendChild(gamepadFragment);
        
        this.servoCards.forEach(servoCard => {
            servoCard.addGamepadSettings(gamepad);
        });
    }

    addServoCard(servo, gamepad) {
        this.servoCards.set(servo.index.toString(), this.#createServoCard(servo, gamepad));
    }

    #createServoCard(servo, gamepad) {
        // Create servo card.
        const servoElement = document.createElement('div');
        servoElement.className = 'servo card';
        // Create editable header.
        const header = document.createElement('input');
        header.type = 'input';
        header.placeholder = servo.name;
        header.maxLength = 16;
        header.addEventListener('input', () => {
            // Update the servo name and use the placeholder as a fallback.
            servo.name = header.value ? header.value : header.placeholder;
        });
        header.className = 'card__header servo__header';
        // Create sliders.
        const pwmRow = this.#createSliderRow('PWM', servo.pwm);
        const minRow = this.#createSliderRow('Min', servo.min);
        const maxRow = this.#createSliderRow('Max', servo.max);
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
        // XXX: This adds functions to the DOM. Neat, but is there another way?
        servoElement.update = servo => {
            pwmSlider.value = servo.pwm;
            minSlider.value = servo.min;
            maxSlider.value = servo.max;
            pwmValueElement.textContent = servo.pwm;
            minValueElement.textContent = servo.min;
            maxValueElement.textContent = servo.max;
        }

        // XXX: Add function to DOM element. Neat, but is there another way?
        servoElement.addGamepadSettings = (gamepad) => {
            servoElement.appendChild(this.#createGamepadSettings(gamepad, servo));
        };

        if (gamepad) {
            servoElement.addGamepadSettings(gamepad);
        }

        return document.getElementById('servos').appendChild(servoElement);
    }

    #createGamepadSettings(gamepad, servo) {
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

    #createSliderRow(name, initialValue) {
        const row = document.createElement('div');
        row.className = 'servo__row';

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
        for (let i in values) {
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

    log(message) {
        const logger = document.getElementById('logger');
        const log = document.createElement('p');
        log.textContent = message;
        logger.appendChild(log);
        logger.scrollTo(0, logger.scrollHeight);
    }

    // TODO: Refactor.
    clearServos() {
        this.servoCards.forEach((servoCard, servoIndex) => {
            servoCard.remove();
            this.servoCards.delete(servoIndex);
        });
    }
}
