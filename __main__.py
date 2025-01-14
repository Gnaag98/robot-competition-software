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
socket_port = 8765

# Maximum rate that WebSocket messages should be transfered over serial.
messages_per_second = 50


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
		print(f'Connected to serial port {serial_port}')


		def serial_send_bytes(data: bytearray | list):
			"""Send a list of bytes, or ints in the inclusive range 0-255, over serial."""
			start_flag = 0x02

			# Make space for message header, body and footer.
			message = bytearray(2 + len(data) + 1)
			# Message header including start flag and message body length.
			message[0] = start_flag
			message[1] = len(data)
			# Message body.
			message[2: -1] = data
			# Message footer.
			message[-1] = sum(data) % 256	# Checksum of body
			serial.write(message)


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


		async def socket_handler(websocket):
			print('Connected to web interface')
			last_message_time = time()
			# Main event loop. Will only advance to the next iteration when the
			# next WebSocket message arives.
			async for socket_message in websocket:
				now = time()
				# A WebSocket message is generated once per frame, the speed of
				# which is mostly dictated by the monitor refresh rate. Here we
				# set our own transfer rate over serial by ignoring messages.
				message_delay = 1 / messages_per_second
				if now - last_message_time > message_delay:
					message_json = json.loads(socket_message)
					# Get a list of pwm values, one for each servo.
					pwm_list = message_json['servos'].values()
					# Stop parsing the message if the pwm values are missing.
					if len(pwm_list) < 1:
						continue
					serial_send_bytes(pwm_list)
					last_message_time = now


				# Check for incoming messages on every iteration.
				await pass_serial_to_socket(websocket)
			print('Disconnected from web interface')


		# Start the WebSocket server. This server is also responsible for the
		# serial communication.
		async with websockets.serve(socket_handler, 'localhost', socket_port):
			await asyncio.get_running_loop().create_future()


if __name__ == '__main__':
	try:
		asyncio.run(main())
	except KeyboardInterrupt:
		exit(0)
