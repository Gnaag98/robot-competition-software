/** Set the deadzone large enough to prevent axis drift. */
const gamepadAxisDeadzone = 0.2;

const view = new View();

/** @type {Servo[]} */
let servos = [];
/** @type {GamepadViewData[]} */
let gamepadSettings = [];
// The Gamepad object represents the state of the gamepad at a specific point in
// time. Using the index we can request the latest state when needed.
// TODO: Replace the singular index to allow for multiple controllers.
let gamepadIndex;
/** @type {ServerConnection} */
let connection;

let lastFrameTime = Date.now();

// Run the setup, and in turn the loop.
setup();

/** Initialize things and start the loop. */
function setup() {
    connection = new ServerConnection(onConnected, onDisconnected, View.log);
    // Make the visible menu buttons interactive.
    document.getElementById('connect').addEventListener('click', connectOnClick);
    document.getElementById('load').addEventListener('change', load);
    document.getElementById('save').addEventListener('click', save);
    document.getElementById('add-servo').addEventListener('click', () => {
        addServo();
    });
    // Start listening for gamepads connecting.
    window.addEventListener('gamepadconnected', event => addGamepad(event.gamepad));
    // Start the main loop that should run on each frame.
    window.requestAnimationFrame(loop);
}

/** Main loop that runs on every frame. */
function loop() {
    const timeNow = Date.now();
    // Time since the last frame.
    const deltaTime = timeNow - lastFrameTime;
    // Get a snapshot of the gamepad.
    const gamepad = navigator.getGamepads()[gamepadIndex];
    // Respond to gamepad input.
    moveServos(gamepad, deltaTime);
    // Update all views.
    view.update(servos, gamepad);
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
    for (const servo of servos) {
        servoMap[servo.index] = Math.round(servo.pwm);
    }
    const message = {
        'servos': servoMap
    };
    connection.send(message);
}

/** @param {Event} event */
function load(event) {
    clearServos();
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
    });
    // Start loading the file.
    reader.readAsText(file);
}

function save() {
    const json = {
        'gamepads': gamepadSettings,
        'servos': servos
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
    view.addServo(servo, navigator.getGamepads()[gamepadIndex]);
}

/**
 * Add the gamepad and render a view for it.
 * 
 * @param {Gamepad} gamepad 
 */
function addGamepad(gamepad) {
    gamepadIndex = gamepad.index;
    if (!gamepadSettings[gamepad.index]) {
        // Create default data if none was loaded.
        gamepadSettings[gamepad.index] = new GamepadViewData(gamepad);
    }
    const gamepadViewData = gamepadSettings[gamepad.index];
    view.addGamepad(servos, gamepad, gamepadViewData);
}

/**
 * Use gamepad input to update servos.
 * 
 * @param {Gamepad} gamepad Readonly representation of the gamepad as it was
 * when it was last fetched using its ID.
 * @param {number} deltaTime Time in milliseconds since last update.
 */
function moveServos(gamepad, deltaTime) {
    if (!gamepad) {
        return;
    }
    for (const servo of servos) {
        const axisInput = gamepad.axes[servo.axis];
        if (axisInput != undefined) {
            if (Math.abs(axisInput) > gamepadAxisDeadzone) {
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

function clearServos() {
    servos = [];
    Servo.resetIndices();
    view.clearServos();
}

function clearGamepads() {
    gamepadSettings = [];
    view.clearGamepads();
}
