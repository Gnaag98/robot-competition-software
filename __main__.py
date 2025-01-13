import asyncio
import json
from sys import argv, stderr
from time import time

from serial import Serial
import websockets

# The baud rate is the speed in bits per second (bps) of the serial
# communication over USB. The baud rate set here should match what is being used
# on the attached device (Arduino).
serial_baud_rate = 115200
# The socket port is used to communicate with the webpage using WebSocket. To
# change the port you must edit both here and in the Javascript code.
socket_port = 9876


async def main():
	# Read command line arguments.
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
		async def pass_serial_to_socket(websocket):
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

		# TODO: Determine when/how often this function is called. Does it behave
		# as an event loop?
		async def socket_handler(websocket):
			last_message_time = time()
			async for socket_message in websocket:
				now = time()
				# XXX: The purpose of this if-statement was not commented in the
				# original code. Does it prevent duplicate messages or just
				# reduce the message rate?
				undocumented_magic_number = 0.02
				if now - last_message_time < undocumented_magic_number:
					continue
				last_message_time = now

				message_json = json.loads(socket_message)
				# Get a list of pwm values, one for each servo.
				pwm_list = message_json['servos'].values()
				# Stop parsing the message if there are no pwm values.
				if len(pwm_list) < 1:
					continue

				pwm_bytes = bytearray(pwm_list)

				# Send a message with a start flag, data and a checksum.
				# TODO: Extract the message creation into a function with start
				# flag as a parameter to allow for more message types.
				serial_message = bytearray(3+len(pwm_list))
				serial_message[0] = 2  # STX (Start Of Text)
				serial_message[1] = len(pwm_bytes)  # Number of servos
				serial_message[2: -1] = pwm_bytes  # PWM values
				serial_message[-1] = sum(pwm_bytes) % 256  # Checksum of values
				serial.write(serial_message)

				# Now that outgoing message have been handled it is time to
				# check the incoming messages.
				await pass_serial_to_socket(websocket)

		# Start the WebSocket server. This server is also responsible for the
		# serial communication.
		async with websockets.serve(socket_handler, 'localhost', socket_port):
			await asyncio.get_running_loop().create_future()


if __name__ == '__main__':
	try:
		asyncio.run(main())
	except KeyboardInterrupt:
		exit(0)
