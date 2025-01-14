class Action {
    address;
    pwm;
    delay;

    constructor(address, pwm, delay) {
        this.address = address;
        this.pwm = pwm;
        this.delay = delay;
    }

    static fromJSON({address, pwm, delay}) {
        return new Action(address, pwm, delay);
    }
}

class Model {
    servos = [];
    socket = null;
    loggerCallback = console.log;
    deadzone = 0.2;

    addServo(servo) {
        this.servos.push(servo);
    }

    clearServos() {
        this.servos = [];
    }

    setServo(address, pwm) {
        this.servos[address].pwm = pwm;
    }

    update(delta, gamepad) {
        this.servos.forEach(servo => {
                if (!gamepad) {
                    return;
                }
                if (servo.axis != null && gamepad.axes[servo.axis] != null) {
                    const input = gamepad.axes[servo.axis];
                    if (Math.abs(input) > this.deadzone) {
                        servo.move(input * servo.axisSpeed * delta);
                    }
                }
                if (servo.buttonAdd != null && gamepad.buttons[servo.buttonAdd] != null) {
                    servo.move(gamepad.buttons[servo.buttonAdd].value * servo.buttonSpeed * delta);
                }
                if (servo.buttonRemove != null && gamepad.buttons[servo.buttonRemove] != null) {
                    servo.move(-gamepad.buttons[servo.buttonRemove].value * servo.buttonSpeed * delta);
                }
            }
        );

        this.sendPWMs();
    }

    connect(address, port) {
        const socket = new WebSocket(`ws://${address}:${port}`);
        socket.addEventListener('open', _ => this.onSocketOpen(socket));
        socket.addEventListener('close', (_) => {
            this.socket = null;
            this.loggerCallback("Disconnected!")
        });
        socket.addEventListener('message', ({data}) => this.loggerCallback(data));
    }

    onSocketOpen(socket) {
        this.socket = socket;
        this.loggerCallback("Connected!");
    }

    sendPWMs() {
        if (this.socket != null) {
            const data = {"servos": {}};
            this.servos.forEach(({address, pwm}) => data["servos"][address] = Math.round(pwm));
            this.socket.send(JSON.stringify(data));
        }
    }
}