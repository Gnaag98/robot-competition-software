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
        gamepadFragment.querySelector('.gamepad__header').textContent = `Gamepad ${gamepad.index}`;

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
        const servoDiv = document.createElement('div');
        servoDiv.className = 'servo card';
        servoDiv.servoAddress = servo.index;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'card-header';
        const header = document.createElement('h1');
        header.textContent = servo.name;
        headerDiv.appendChild(header);

        const nameinputdiv = this.#createTextInputRow('Name:',servo.name, (name) => { 
            servo.name = name;
            header.textContent = servo.name;
        });

        const pwmUpdate = (input, value, {pwm}) => {
            input.value = pwm.toString();
            value.textContent = Math.round(pwm).toString();
        }
        const pwmDiv = this.#createSliderRow('PWM', 0, 255, servo.pwm, 1, (pwm) => servo.pwm = pwm, pwmUpdate);

        const minUpdate = (input, value, {min}) => {
            input.value = min;
            value.textContent = min;
        }
        const minDiv = this.#createSliderRow('Min', 0, 255, servo.min, 1, (min) => servo.min = min, minUpdate);

        const maxUpdate = (input, value, {max}) => {
            input.value = max;
            value.textContent = max;
        }
        const maxDiv = this.#createSliderRow('Max', 0, 255, servo.max, 1, (max) => servo.max = max, maxUpdate);

        servoDiv.appendChild(headerDiv);
        servoDiv.appendChild(nameinputdiv);
        servoDiv.appendChild(pwmDiv);
        servoDiv.appendChild(minDiv);
        servoDiv.appendChild(maxDiv);


        servoDiv.addGamepadController = (gamepad) => {
            servoDiv.appendChild(this.#addGamepadControllingPart(gamepad,servo));
        };

        if (gamepad) {
            servoDiv.addGamepadController(gamepad);
        }    

        servoDiv.update = (servo) => {
            pwmDiv.update(servo);
            minDiv.update(servo);
            maxDiv.update(servo);
        };

        return document.getElementById('servos').appendChild(servoDiv);
    }

    #addGamepadControllingPart(gamepad, servo){
        const gamepadcontrollerDiv = document.createElement('div');

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

    #createSliderRow(name, min, max, value, step, callback, update) {
        const div = document.createElement('div');
        div.className = 'sliderDiv row';
        const label = document.createElement('label');
        label.textContent = name + ': ';
        const val = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'range';
        input.min = min.toString();
        input.max = max.toString();
        input.value = val.toString();
        input.step = step.toString();
        input.oninput = () => callback(parseInt(input.value));
        val.textContent = input.value.toString();

        div.appendChild(label);
        div.appendChild(val);
        div.appendChild(input);
        div.update = (state) => update(input, val, state);
        return div;
    }

    #createTextInputRow(name, servoName, callback) {
        const div = document.createElement('div');
        div.className = 'sliderDiv row';
        const label = document.createElement('label');
        label.textContent = name;
        const val = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'input';
        input.placeholder = servoName;
        input.size = 16;
        input.maxLength = 16;
        input.oninput = () => callback(input.value);
        
        val.textContent = input.value.toString();

        div.appendChild(label);
        div.appendChild(val);
        div.appendChild(input);
        return div;
    }

    #createInputRow(name, min, max, value, step, callback) {
        const div = document.createElement('div');
        div.className = 'row';
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
        div.className = 'row';
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

    #createLabel(text) {
        const label = document.createElement('label');
        label.textContent = text;
        return label;
    }

    #addActionRow(loadedAction = null) {
        let action;
        if (loadedAction === null) {
            action = new Action(0, 0, 0);
        } else {
            action = loadedAction;
        }

        const row = document.createElement('div');
        row.className = 'action-row';

        row.appendChild(this.#createLabel('Address: '));
        const address = document.createElement('input');
        address.type = 'number';
        address.placeholder = 'Address';
        address.min = '0';
        address.value = action.address.toString();
        address.addEventListener('input', (event) => action.address = event.target.value)
        row.appendChild(address);

        row.appendChild(this.#createLabel('Value: '));
        const pwm = document.createElement('input');
        pwm.type = 'number';
        pwm.placeholder = 'Value (0-255)';
        pwm.min = '0';
        pwm.max = '255';
        pwm.value = action.pwm.toString();
        pwm.addEventListener('input', (event) => action.pwm = event.target.value)
        row.appendChild(pwm);

        row.appendChild(this.#createLabel('Delay (s): '));
        const delay = document.createElement('input');
        delay.type = 'number';
        delay.placeholder = 'Delay (s)';
        delay.min = '0';
        delay.step = '0.1';
        delay.value = action.delay.toString();
        delay.addEventListener('input', (event) => action.delay = event.target.value)
        row.appendChild(delay);

        return row;
    }
}
