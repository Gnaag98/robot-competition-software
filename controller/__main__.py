import asyncio
import functools
import json
from sys import argv, stderr
from time import time

from serial import Serial
import websockets

# The baud rate is the speed in bits per second (bps) of the serial
# communication over USB. The baud rate set here should match what is being used
# on the attached device (Arduino).
serial_baud_rate = 19200
# The websocket port is used to communicate with the webpage using WebSocket. To
# change the port you must edit both here and in the Javascript code.
websocket_port = 8765

# Maximum rate that WebSocket messages should be transfered over serial.
messages_per_second = 50


def serial_send_bytes(serial: Serial, start_flag: int, data: bytearray | list):
	"""Send a list of bytes, or ints in the inclusive range 0-255, over serial."""
	if start_flag < 0 or start_flag > 255:
		print(f'Start flag ({start_flag}) is not in the range 0-255.')
		return

	# Make space for message header, body and footer.
	message = bytearray(2 + len(data) + 1)
	# Message header including start flag and message body length.
	message[0] = start_flag
	message[1] = len(data)
	# Message body.
	message[2: -1] = data
	# Message footer.
	message[-1] = sum(data) % 256 # Checksum of body
	serial.write(message)


async def pass_serial_to_socket(serial: Serial, websocket):
	"""Pass incoming serial data to the webpage via WebSocket."""
	if serial.in_waiting > 0:
		# Stop reading from serial after this many idle seconds.
		message_timeout_seconds = 1

		message = ''
		wait_duration = 0
		# Read one character at a time until a newline is found, or
		# until no data has been received for a while.
		character = serial.read().decode('ascii')
		while character != '\n' and wait_duration < message_timeout_seconds:
			# If a character was received, reset the timeout timer and
			# add the character to the message.
			if character:
				receive_time = time()
				message += character
			# Prepare for the next iteration.
			character = serial.read().decode('ascii')
			wait_duration = time() - receive_time
		await websocket.send(message)


async def event_loop(serial: Serial, websocket):
	"""Main event loop. Will only advance to the next iteration when the next WebSocket message arives."""
	print('Connected to web interface')
	servo_start_flag = 0x02
	motor_start_flag = 0x04

	last_message_time = time()
	async for websocket_message in websocket:
		now = time()
		# A WebSocket message is generated once per frame, the speed of
		# which is mostly dictated by the monitor refresh rate. Here we
		# set our own transfer rate over serial by ignoring messages.
		message_delay = 1 / messages_per_second
		if now - last_message_time > message_delay:
			message_json = json.loads(websocket_message)

			# Send servos message.
			servos_pwm = message_json['servos'].values()
			if len(servos_pwm) > 0:
				serial_send_bytes(serial, servo_start_flag, servos_pwm)

			# Send motors message.
			# TODO: Implement support for motors in the UI.
			# NOTE: Uncomment this if you intend to implement parsing these
			# messages on the receiving end.
			#motors_pwm = message_json['motors'].values()
			#if len(motors_pwm) > 0:
			#	serial_send_bytes(serial, motor_start_flag, motors_pwm)

			last_message_time = now


		# Check for incoming messages on every iteration.
		await pass_serial_to_socket(serial, websocket)
	print('Disconnected from web interface')


async def main():
	# Read command line arguments. argv[0] is always the command used to run the
	# script, usually the filename, or ".".
	try:
		serial_port = argv[1]
	except IndexError:
		print(f'Usage: python {argv[0]} serial_port', file=stderr)
		exit(1)

	# timeout=0 and write_timeout=0 ensures that read() and write() are
	# non-blocking. If no incoming data is available then read() returns 0
	# bytes. if timeout=0 was not defined then read() would stop and wait for
	# incoming data.
	with Serial(serial_port, serial_baud_rate, timeout=0, write_timeout=0) as serial:
		print('Press CTRL+C to exit the program')
		print(f'Connected to serial port {serial_port}')

		# The websocket handler passed to serve() can only take one argument,
		# the webserver instance. Therefore we need to bind all preceding
		# arguments using partial().
		websocket_handler = functools.partial(event_loop, serial)

		# Start the WebSocket server. This server is also responsible for the
		# serial communication.
		async with websockets.serve(websocket_handler, 'localhost', websocket_port):
			await asyncio.get_running_loop().create_future()


if __name__ == '__main__':
	try:
		asyncio.run(main())
	except KeyboardInterrupt:
		exit(0)
