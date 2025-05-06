/** Set the deadzone large enough to prevent axis drift. */
const gamepadAxisDeadzone = 0.2;

const view = new View();

/** @type {Servo[]} */
let servos = [];
/** @type {Motor[]} */
let motors = [];
/** @type {GamepadViewData[]} */
let gamepadSettings = [];
// The Gamepad object represents the state of the gamepad at a specific point in
// time. Using the index we can request the latest state when needed.
// TODO: Replace the singular index to allow for multiple controllers.
/** @type {ServerConnection} */
let connection;

let lastFrameTime = Date.now();

// Run the setup, and in turn the loop.
setup();

/** Initialize things and start the loop. */
function setup() {
    connection = new ServerConnection(onConnected, onDisconnected, View.log);
    // Make the visible menu buttons interactive.
    document.getElementById('connect').addEventListener(
        'click', connectOnClick
    );
    document.getElementById('load').addEventListener('change', load);
    document.getElementById('save').addEventListener('click', save);
    document.getElementById('add-servo').addEventListener('click', () => {
        addServo();
    });
    document.getElementById('add-motor').addEventListener('click', () => {
        addMotor();
    });
    // Start listening for gamepads connecting.
    window.addEventListener(
        'gamepadconnected', event => addGamepad(event.gamepad)
    );
    window.addEventListener('gamepaddisconnected', event => {
        view.removeGamepad(servos, motors, event.gamepad);
    });
    // Start the main loop that should run on each frame.
    window.requestAnimationFrame(loop);
}

/** Main loop that runs on every frame. */
function loop() {
    const timeNow = Date.now();
    // Time since the last frame.
    const deltaTime = timeNow - lastFrameTime;
    // Get a snapshot of the gamepad.
    const gamepads = navigator.getGamepads();
    // Respond to gamepad input.
    for (const gamepad of gamepads) {
        updateServos(gamepad, deltaTime);
        updateMotors(gamepad, deltaTime);
    }
    // Update all views.
    view.update(servos, motors, gamepads);
    // Send data to the server.
    send();
    // Continue the loop on the next frame.
    lastFrameTime = timeNow;
    window.requestAnimationFrame(loop);
}

/** @param {MouseEvent} event */
function connectOnClick(event) {
    // Remove the ability to double click the button.
    event.target.removeEventListener('click', connectOnClick);
    // Connect to the server.
    connection.connect('localhost', 8765);
}
/** @param {MouseEvent} event */
function disconnectOnClick(event) {
    // Remove the ability to double click the button.
    event.target.removeEventListener('click', disconnectOnClick);
    // Disconnect to the server.
    connection.disconnect();
}
/**
 * Enable disconnecting from the server by switching to and activating the disconnect button.
 */
function onConnected() {
    View.log('Connected!');
    // Show the disconnect button instead and enable it.
    const connectButton = document.getElementById('connect');
    const disconnectButton = document.getElementById('disconnect');
    connectButton.hidden = true;
    disconnectButton.hidden = false;
    disconnectButton.addEventListener('click', disconnectOnClick);
}
/**
 * Enable connecting from the server by switching to and activating the connect button.
 */
function onDisconnected() {
    View.log('Disconnected!');
    // Show the connect button instead and enable it.
    const connectButton = document.getElementById('connect');
    const disconnectButton = document.getElementById('disconnect');
    connectButton.hidden = false;
    disconnectButton.hidden = true;
    connectButton.addEventListener('click', connectOnClick);
}

/** Send data to the server. */
function send() {
    /** Mapping from servo index to servo integer pwm value.
     * @type {Object.<string, number>}
     */
    const servoMap = {};
    /** Mapping from motor index to motor integer pwm value.
     * @type {Object.<string, number>}
     */
    const motorMap = {};

    for (const servo of servos) {
        servoMap[servo.index] = Math.round(servo.pwm);
    }
    for (const motor of motors) {
        motorMap[motor.index] = Math.round(motor.pwm);
    }

    const message = {
        'servos': servoMap,
        'motors': motorMap
    };
    connection.send(message);
}

/** @param {Event} event */
function load(event) {
    clearServos();
    clearMotors();
    clearGamepads();
    /** @type {File} */
    const file = event.target.files[0];
    if (file.type !== 'application/json') {
        alert('Must be a .json savefile!');
        return;
    }
    const reader = new FileReader();
    // When the file is loaded, parse the content.
    reader.addEventListener('loadend', () => {
        const json = JSON.parse(reader.result);
        for (const gamepadViewDataJson of json['gamepads']) {
            const data = GamepadViewData.fromJSON(gamepadViewDataJson);
            gamepadSettings.push(data);
        }
        // Re-add all connected gamepads.
        for (const gamepad of navigator.getGamepads()) {
            if (gamepad) {
                addGamepad(gamepad);
            }
        }
        for (const servo of json['servos']) {
            addServo(servo);
        }
        for (const motor of json['motors']) {
            addMotor(motor);
        }
    });
    // Start loading the file.
    reader.readAsText(file);
}

function save() {
    const json = {
        'gamepads': gamepadSettings,
        'servos': servos,
        'motors': motors
    };
    const jsonString = JSON.stringify(json, null, 4);
    // Create a file and corresponding url.
    const file = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    // Create a download link and click it to download the file.
    const link = document.createElement('a');
    link.href = url;
    link.download = 'save.json';
    link.click();
    // Remove the url to free up memory.
    window.URL.revokeObjectURL(url);
}

function addServo(servoJson = null) {
    const servo = servoJson ? Servo.fromJSON(servoJson) : new Servo();
    servos.push(servo);
    view.addServo(servo);
}

function addMotor(motorJson = null) {
    const motor = motorJson ? Motor.fromJSON(motorJson) : new Motor();
    motors.push(motor);
    view.addMotor(motor);
}

/**
 * Add the gamepad and render a view for it.
 * 
 * @param {Gamepad} gamepad 
 */
function addGamepad(gamepad) {
    const gamepadIndex = gamepad.index;
    // Create default data if none already exists.
    if (!gamepadSettings[gamepadIndex]) {
        gamepadSettings[gamepadIndex] = new GamepadViewData(gamepad);
    }
    const gamepadViewData = gamepadSettings[gamepadIndex];
    view.addGamepad(servos, motors, gamepad, gamepadViewData);
}

/**
 * Update servos based on the inputs from a gamepad.
 * 
 * @param {Gamepad} gamepad Readonly representation of the gamepad as it was
 * when it was last fetched.
 * @param {number} deltaTime Time in milliseconds since last update.
 */
function updateServos(gamepad, deltaTime) {
    if (!gamepad) {
        return;
    }
    for (const servo of servos) {
        // Check axis binding.
        if (gamepad.index == servo.axis.gamepadIndex) {
            /** @type {number | undefined} */
            const axisValue = gamepad.axes[servo.axis.inputIndex];
            if (axisValue) {
                if (Math.abs(axisValue) > gamepadAxisDeadzone) {
                    servo.pwm += axisValue * servo.axisSpeed * deltaTime;
                }
            }
        }

        // Check increase-button binding.
        if (gamepad.index == servo.increaseButton.gamepadIndex) {
            /** @type {GamepadButton | undefined} */
            const button = gamepad.buttons[servo.increaseButton.inputIndex];
            if (button) {
                servo.pwm += button.value * servo.buttonSpeed * deltaTime;
            }
        }

        // Check decrease-button binding.
        if (gamepad.index == servo.decreaseButton.gamepadIndex) {
            /** @type {GamepadButton | undefined} */
            const button = gamepad.buttons[servo.decreaseButton.inputIndex];
            if (button) {
                servo.pwm -= button.value * servo.buttonSpeed * deltaTime;
            }
        }
    }
}

/**
 * Update motors based on the inputs from a gamepad.
 * 
 * @param {Gamepad} gamepad Readonly representation of the gamepad as it was
 * when it was last fetched.
 * @param {number} deltaTime Time in milliseconds since last update.
 */
function updateMotors(gamepad, deltaTime) {
    if (!gamepad) {
        return;
    }
    for (const motor of motors) {
        // Check axis binding.
        if (gamepad.index == motor.axis.gamepadIndex) {
            /** @type {number | undefined} */
            const axisValue = gamepad.axes[motor.axis.axisIndex];
            if (axisValue) {
                // XXX: Hardcoded smaller deadzone.
                if (Math.abs(axisValue) > gamepadAxisDeadzone / 4) {
                    motor.pwm = (axisValue + 1) / 2 * 255;
                } else {
                    motor.pwm = 127;
                }
            }
        }
    }
}

function clearServos() {
    servos = [];
    Servo.resetIndices();
    view.clearServos();
}

function clearMotors() {
    motors = [];
    Motor.resetIndices();
    view.clearMotors();
}

function clearGamepads() {
    gamepadSettings = [];
    view.clearGamepads();
}
