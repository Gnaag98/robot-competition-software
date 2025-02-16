class GamepadViewData {
    /** @type {string} */
    name = '';
    /** 
     * User-specified button names.
     *  
     * @type {string[]} */
    buttons;
    /** 
     * User-specified axis names.
     *  
     * @type {string[]} */
    axes;

    /**
     * 
     * @param {Gamepad} gamepad 
     */
    constructor(gamepad) {
        if (gamepad) {
            this.buttons = Array(gamepad.buttons.length).fill('')
            this.axes = Array(gamepad.axes.length).fill('')
        }
    }

    toJSON() {
        return {
            name: this.name,
            buttons: this.buttons,
            axes: this.axes
        };
    }

    static fromJSON({ name, buttons, axes }) {
        let data = new GamepadViewData();
        data.name = name;
        data.buttons = buttons;
        data.axes = axes;
        return data;
    }
}
