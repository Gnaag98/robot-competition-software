/** @param {MouseEvent} event */
const connectOnClick = event => {
    // Remove the ability to double click the button.
    event.target.removeEventListener('click', connectOnClick);
    // Connect to the server.
    connection.connect('localhost', 8765);
}
/** @param {MouseEvent} event */
const disconnectOnClick = event => {
    // Remove the ability to double click the button.
    event.target.removeEventListener('click', disconnectOnClick);
    // Disconnect to the server.
    connection.disconnect();
}
/**
 * Enable disconnecting from the server by switching to and activating the disconnect button.
 */
const onConnected = () => {
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
const onDisconnected = () => {
    View.log('Disconnected!');
    // Show the connect button instead and enable it.
    const connectButton = document.getElementById('connect');
    const disconnectButton = document.getElementById('disconnect');
    connectButton.hidden = false;
    disconnectButton.hidden = true;
    connectButton.addEventListener('click', connectOnClick);
}

/** Set the deadzone large enough to prevent axis drift. */
const gamepadAxisDeadzone = 0.2;

/** @type {Servo[]} */
const servos = [];
// The Gamepad object represents the state of the gamepad at a specific point in
// time. Using the index we can request the latest state when needed.
// TODO: Replace the singular index to allow for multiple controllers.
let gamepadIndex;

const view = new View();
const connection = new ServerConnection(onConnected, onDisconnected, View.log);

let lastFrameTime = Date.now();


// Make the visible menu buttons interactive.
document.getElementById('connect').addEventListener('click', connectOnClick);
document.getElementById('load').addEventListener('change', load);
document.getElementById('save').addEventListener('click', () => { save() });
document.getElementById('add-servo').addEventListener('click', () => {
    addServo();
});
// Listen for gamepads connecting.
window.addEventListener('gamepadconnected', event => addGamepad(event.gamepad));
// Start the main loop that should run on each frame.
window.requestAnimationFrame(mainLoop);

/** Main loop that runs on every frame. */
function mainLoop() {
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
    window.requestAnimationFrame(mainLoop);
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

function load(event) {
    clearServos();
    const file = event.target.files[0];
    if (file.type !== 'application/json') {
        alert('Must be a .json savefile!');
        return;
    }
    const reader = new FileReader();
    reader.addEventListener('loadend', _ => loadSave(reader.result));
    reader.readAsText(file);
}

function loadSave(data) {
    let json = JSON.parse(data);
    json.servos.forEach(servo => addServo(servo));
}

function save() {
    download(JSON.stringify({
        'servos': servos
    }, null, 4), 'save.json', 'application/json');
}

function download(data, filename, type) {
    const file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        const a = document.createElement('a'),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

function addServo(servoJson = null) {
    const servo = servoJson ? Servo.fromJSON(servoJson) : new Servo();
    servos.push(servo);
    view.addServo(servo, navigator.getGamepads()[gamepadIndex]);
}

function addGamepad(gamepad) {
    gamepadIndex = gamepad.index;
    view.addGamepad(servos, gamepad);
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
