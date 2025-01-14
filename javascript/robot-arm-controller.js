// TODO: Replace the singular index to allow for multiple controllers.
let gamepadIndex;
const buttons = [];
const sliders = [];

const model = new Model();
const view = new View();
model.loggerCallback = view.log;

let lastUpdate = Date.now();

document.getElementById('connect').addEventListener('click', () => { connect() });
document.getElementById('load').addEventListener('change', load);
document.getElementById('save').addEventListener('click', () => { save() });
document.getElementById('add-servo').addEventListener('click', () => { addServo() });

window.addEventListener('gamepadconnected', (event) => addGamepad(event.gamepad));
window.requestAnimationFrame(updateStatus);

function addGamepad(gamepad) {
    gamepadIndex = gamepad.index;
    view.addGamepadCard(gamepad);
}

function updateStatus() {
    const gamepad = navigator.getGamepads()[gamepadIndex];
    model.update(Date.now() - lastUpdate, gamepad);
    view.update(model.servos);
    lastUpdate = Date.now();

    if (gamepad) {
        for (let i = 0; i < gamepad.buttons.length; i++) {
            let val = gamepad.buttons[i];
            buttons[i].className = 'gamepad__button' + (val.pressed ? ' pressed' : '');
        }

        for (let i = 0; i < gamepad.axes.length; i++) {
            sliders[i].value = gamepad.axes[i];
        }
    }

    window.requestAnimationFrame(updateStatus);
}

function connect() {
    model.connect('localhost', '8765');
}

function load(event) {
    model.clearServos();
    view.clearServos();

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
    view.addServoCard(servo, navigator.getGamepads()[gamepadIndex]);
    model.addServo(servo);
}
