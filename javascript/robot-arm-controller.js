// The Gamepad object represents the state of the gamepad at a specific point in
// time. Using the index we can request the latest state when needed.
// TODO: Replace the singular index to allow for multiple controllers.
let gamepadIndex;

const model = new Model();
const view = new View();
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
    // Update all views.
    view.update(model.servos, gamepad);
    model.send();
    // Continue the loop on the next frame.
    lastFrameTime = timeNow;
    window.requestAnimationFrame(mainLoop);
}

function load(event) {
    view.clearServos(model.servos);
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
    model.addServo(servo);
    view.addServo(servo, navigator.getGamepads()[gamepadIndex]);
}

function addGamepad(gamepad) {
    gamepadIndex = gamepad.index;
    view.addGamepad(model.servos, gamepad);
}
