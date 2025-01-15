// The Gamepad object represents the state of the gamepad at a specific point in
// time. Using the index we can request the latest state when needed.
// TODO: Replace the singular index to allow for multiple controllers.
let gamepadIndex;
/** @type {HTMLInputElement[]} */

// TODO: Stop storing these elements and find them using querySelector when needed.
const buttonElements = [];
/** @type {HTMLInputElement[]} */
const sliderElements = [];

const model = new Model();
model.onMessage = View.log;

let lastFrameTime = Date.now();

// Make menu buttons interactive.
document.getElementById('connect').addEventListener('click', () => {
    model.connect('localhost', '8765');
});
document.getElementById('load').addEventListener('change', load);
document.getElementById('save').addEventListener('click', () => { save() });
document.getElementById('add-servo').addEventListener('click', () => { addServo() });
// Listen for gamepads connecting.
window.addEventListener('gamepadconnected', event => addGamepad(event.gamepad));
// Start the main loop that should run on each frame.
window.requestAnimationFrame(mainLoop);

function mainLoop() {
    const timeNow = Date.now();
    // Time since the last frame.
    const deltaTime = timeNow - lastFrameTime;
    // Get a snapshot of the gamepad.
    const gamepad = navigator.getGamepads()[gamepadIndex];
    // Respond to gamepad input.
    model.handleGamepadInput(gamepad, deltaTime);
    // Update the 
    View.update(model.servos);
    model.send();
    
    if (gamepad) {
        for (const buttonIndex in gamepad.buttons) {
            const button = gamepad.buttons[buttonIndex];
            const buttonElement = buttonElements[buttonIndex];
            if (button.pressed) {
                buttonElement.classList.add('pressed');
            } else {
                buttonElement.classList.remove('pressed');
            }
        }

        for (const axisIndex in gamepad.axes) {
            const axis = gamepad.axes[axisIndex];
            const sliderElement = sliderElements[axisIndex];
            sliderElement.value = axis;
        }
    }
    // Continue the loop on the next frame.
    lastFrameTime = timeNow;
    window.requestAnimationFrame(mainLoop);
}

function addGamepad(gamepad) {
    gamepadIndex = gamepad.index;
    View.addGamepadCard(model.servos, gamepad);
}

function load(event) {
    View.clearServos(model.servos);
    model.clearServos();

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
        'servos': model.servos
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

function addServo(savedData = null) {
    let servo;
    if (savedData === null) {
        servo = new Servo();
    } else {
        servo = Servo.fromJSON(savedData);
    }
    View.addServoCard(servo, navigator.getGamepads()[gamepadIndex]);
    model.addServo(servo);
}
