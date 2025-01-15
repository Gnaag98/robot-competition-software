class Model {
    onMessage = console.log;
    /** @type {WebSocket | null} */
    #socket = null;
    /** @type {Servo[]} */
    servos = [];
    /** Set the deadzone large enough to prevent axis drift. */
    #gamepadAxisDeadzone = 0.2;

    connect(address, port) {
        const socket = new WebSocket(`ws://${address}:${port}`);
        socket.addEventListener('open', () => {
            this.#socket = socket;
            this.onMessage('Connected!');
        });
        socket.addEventListener('close', () => {
            this.#socket = null;
            this.onMessage('Disconnected!')
        });
        socket.addEventListener('message', event => this.onMessage(event.data));
    }

    addServo(servo) {
        this.servos.push(servo);
    }

    clearServos() {
        this.servos = [];
        Servo.resetIndices();
    }

    /**
     * TODO: Move servos and send data to server.
     * 
     * @param {number} deltaTime Time in milliseconds since last update.
     * @param {Gamepad} gamepad 
     */
    update(deltaTime, gamepad) {
        this.#moveServos(deltaTime, gamepad);
        this.#sendServoData();
    }

    /**
     * TODO: Use gamepad input to update servos.
     * 
     * @param {number} deltaTime Time in milliseconds since last update.
     * @param {Gamepad} gamepad 
     */
    #moveServos(deltaTime, gamepad) {
        if (!gamepad) {
            return;
        }
        for (const servo of this.servos) {
            const axisInput = gamepad.axes[servo.axis];
            if (axisInput != undefined) {
                if (Math.abs(axisInput) > this.#gamepadAxisDeadzone) {
                    servo.move(axisInput * servo.axisSpeed * deltaTime);
                }
            }
            const addInput = gamepad.buttons[servo.buttonAdd];
            if (addInput != undefined) {
                servo.move(addInput.value * servo.buttonSpeed * deltaTime);
            }
            const removeInput = gamepad.buttons[servo.buttonRemove];
            if (removeInput != undefined) {
                servo.move(-removeInput.value * servo.buttonSpeed * deltaTime);
            }
        }
    }

    /**
     * Send all servo PWM values to webserver.
     */
    #sendServoData() {
        if (this.#socket == null || this.#socket.readyState != WebSocket.OPEN) {
            return;
        }

        const message = {
            'servos': {}
        };
        for (const servo of this.servos) {
            message['servos'][servo.index] = Math.round(servo.pwm);
        }
        this.#socket.send(JSON.stringify(message));
    }
}