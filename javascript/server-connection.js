class ServerConnection {
	/**
	 * @callback ConnectionCallback
	 * @returns {void}
	*/
	
	/**
	 * @callback MessageCallback
	 * @param {any} message - The received message.
	 * @returns {void}
	*/

	/** @type {WebSocket | null} */
    #socket = null;
	/** 
	 * Function that is called when the server connects.
	 * @type {MessageCallback}
	 */
	#onMessage;
	/** 
	 * Function that is called when the server disconnects.
	 * @type {MessageCallback}
	 */
	#onConnected;
	/** 
	 * Function that handles incoming messages.
	 * @type {MessageCallback}
	 */
	#onDisconnected;

	/**
	 * @param {ConnectionCallback} onConnected - called when the server connects.
	 * @param {ConnectionCallback} onDisconnected - called when the server disconnects.
	 * @param {MessageCallback} onMessage - called when a message arrives from the server.
	 */
	constructor(onConnected, onDisconnected, onMessage = console.log) {
		this.#onConnected = onConnected;
		this.#onDisconnected = onDisconnected;
		this.#onMessage = onMessage;
	}

	/**
	 * Connect to a server, disconnecting any previous connection first.
	 * @param {string} host - server hostname, e.g., localhost or example.com.
	 * @param {number} port - port that the server listens to.
	 */
	connect(host, port) {
		// Disconnect any previous connection before opening a new one.
		this.disconnect();
		// Don't add the socket to the class yet. Leave that to the open event.
		const socket = new WebSocket(`ws://${host}:${port}`);
		socket.addEventListener('open', () => {
            this.#socket = socket;
            this.#onConnected();
        });
		socket.addEventListener('close', () => {
            // Don't null the socket here since we don't know if the open event
			// of the new conenction will fire before or after the close event
			// of the old one.
            this.#onDisconnected();
        });
        socket.addEventListener('message', event => {
			this.#onMessage(event.data);
		});
	}

	/** Disconnect from the server, if one is connected. */
	disconnect() {
		// No need to null the socket since this is handled by the close event.
		this.#socket?.close();
		this.#socket = null;
	}

	/**
	 * Send data over WebSocket.
	 * @param {any} json - JSON object to be stringified.
	 */
	send(json) {
		// Make sure there is a connection before sending.
		if (!this.#socket || this.#socket.readyState != WebSocket.OPEN) {
            return;
        }
		this.#socket.send(JSON.stringify(json));
	}
}
