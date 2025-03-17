class GamepadViewData {
    /** 
     * Index of the corresponding connected gamepad.
     * 
     *  @type {number} */
    #index;
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
     * @param {Gamepad | number} parameter - gamepad or index.
     */
    constructor(parameter) {
        if (parameter instanceof Gamepad) {
            this.#index = parameter.index;
            this.buttons = Array(parameter.buttons.length).fill('')
            this.axes = Array(parameter.axes.length).fill('')
        } else {
            this.#index = parameter;
        }
    }

    get index() {
        return this.#index;
    }

    toJSON() {
        return {
            index: this.#index,
            name: this.name,
            buttons: this.buttons,
            axes: this.axes
        };
    }

    static fromJSON({ index, name, buttons, axes }) {
        let data = new GamepadViewData(index);
        data.name = name;
        data.buttons = buttons;
        data.axes = axes;
        return data;
    }
}
