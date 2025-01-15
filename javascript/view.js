class View {
    servoCards = new Map();

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
            servoCard.addGamepadController(gamepad);
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
        header.oninput = () => {
            // Update the servo name and use the placeholder as a fallback.
            servo.name = header.value ? header.value : header.placeholder;
        };
        header.className = 'card__header servo__header';
        // Create sliders.
        const pwmRow = this.#createSliderRow('PWM', pwm => servo.pwm = pwm);
        const minRow = this.#createSliderRow('Min', min => servo.min = min);
        const maxRow = this.#createSliderRow('Max', max => servo.max = max);
        // Assemble the row.
        servoElement.appendChild(header);
        servoElement.appendChild(pwmRow);
        servoElement.appendChild(minRow);
        servoElement.appendChild(maxRow);
        // Make sure that the servo is updated when the sliders move.
        const pwmSlider = pwmRow.querySelector('input');
        const minSlider = minRow.querySelector('input');
        const maxSlider = maxRow.querySelector('input');
        pwmSlider.oninput = () => servo.pwm = parseInt(pwmSlider.value);
        minSlider.oninput = () => servo.min = parseInt(minSlider.value);
        maxSlider.oninput = () => servo.max = parseInt(maxSlider.value);

        const pwmValueElement = pwmRow.querySelector('.slider-value');
        const minValueElement = minRow.querySelector('.slider-value');
        const maxValueElement = maxRow.querySelector('.slider-value');

        const pwmUpdate = (servo) => {
            pwmSlider.value = servo.pwm;
            pwmValueElement.textContent = servo.pwm;
        }
        const minUpdate = (servo) => {
            minSlider.value = servo.min;
            minValueElement.textContent = servo.min;
        }
        const maxUpdate = (servo) => {
            maxSlider.value = servo.max;
            maxValueElement.textContent = servo.max;
        }


        servoElement.addGamepadController = (gamepad) => {
            servoElement.appendChild(this.#addGamepadControllingPart(gamepad,servo));
        };

        if (gamepad) {
            servoElement.addGamepadController(gamepad);
        }    

        // XXX: Add update function to DOM element. Neat, but is there another way?
        servoElement.update = (servo) => {
            pwmUpdate(servo);
            minUpdate(servo);
            maxUpdate(servo);
        };

        return document.getElementById('servos').appendChild(servoElement);
    }

    #addGamepadControllingPart(gamepad, servo){
        const gamepadcontrollerDiv = document.createElement('div');
        gamepadcontrollerDiv.className = 'servo__additional-controls';

        const axisSpeedDiv = this.#createInputRow('Axis speed', -5, 5, servo.axisSpeed, 0.1, (axisSpeed) => servo.axisSpeed = axisSpeed);
        const buttonSpeedDiv = this.#createInputRow('Button speed', -5, 5, servo.buttonSpeed, 0.1, (buttonSpeed) => servo.buttonSpeed = buttonSpeed);

        gamepadcontrollerDiv.appendChild(axisSpeedDiv);
        gamepadcontrollerDiv.appendChild(this.#createDropdownRow('Axis', gamepad.axes, 'Axis', parseInt(servo.axis), (axis) => {
            servo.axis = axis
        }));

        gamepadcontrollerDiv.appendChild(buttonSpeedDiv);
        gamepadcontrollerDiv.appendChild(this.#createDropdownRow('Button +', gamepad.buttons, 'Button', parseInt(servo.buttonAdd), (buttonAdd) => servo.buttonAdd = buttonAdd));
        gamepadcontrollerDiv.appendChild(this.#createDropdownRow('Button -', gamepad.buttons, 'Button', parseInt(servo.buttonRemove), (buttonRemove) => servo.buttonRemove = buttonRemove));
        return gamepadcontrollerDiv;
    }

    #createSliderRow(name, onInputCallback) {
        const row = document.createElement('div');
        row.className = 'servo__row';

        const nameElement = document.createElement('span');
        nameElement.textContent = name;

        const valueElement = document.createElement('span');
        valueElement.className = 'slider-value';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 255;
        slider.step = 1;
        slider.oninput = () => onInputCallback(parseInt(slider.value));

        row.appendChild(nameElement);
        row.appendChild(valueElement);
        row.appendChild(slider);
        return row;
    }

    #createInputRow(name, min, max, value, step, callback) {
        const div = document.createElement('div');
        div.className = 'servo__row';
        const label = document.createElement('label');
        label.textContent = name;
        const input = document.createElement('input');
        input.className = 'dropdown';
        input.type = 'number';
        input.min = min.toString();
        input.max = max.toString();
        input.value = value.toString();
        input.step = step.toString();
        input.addEventListener('input', (event) => callback(event.target.value));

        div.appendChild(label);
        div.appendChild(input);
        return div;
    }

    #createDropdownRow(name, inputs, typeName, value, callback) {
        const div = document.createElement('div');
        div.className = 'servo__row';
        const label = document.createElement('label');
        label.textContent = name;
        const input = document.createElement('select');

        let option;
        option = document.createElement('option');

        option.value = null;
        option.text = 'Unbound';
        option.selected = true;
        input.appendChild(option);

        for (let i = 0; i < inputs.length; i++) {
            option = document.createElement('option');
            option.value = i.toString();
            option.text = typeName + ': ' + i;
            if (value === i) {
                option.selected = true;
            }
            input.appendChild(option);
        }

        input.onchange = (ev) => {
            const value = ev.target.options[ev.target.selectedIndex].value;
            callback(value);
        }
        div.appendChild(label);
        div.appendChild(input);
        return div;
    }

    log(msg) {
        const logger = document.getElementById('logger');
        const log = document.createElement('p');
        log.textContent = msg;
        logger.appendChild(log);
        logger.scrollTo(0, logger.scrollHeight);
    }

    clearServos() {
        this.servoCards.forEach((val, key) => {
            val.remove();
            this.servoCards.delete(key);
        });
    }
}
