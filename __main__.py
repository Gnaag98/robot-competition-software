import asyncio
import json
from sys import argv, stderr
from time import time

from serial import Serial
import websockets

serial_baud_rate = 115200
socket_port = 9876


async def main():
	try:
		serial_port = argv[1]
	except IndexError:
		print(f"Usage: python {argv[0]} serial_port", file=stderr)
		exit(1)

	# timeout=0 and write_timeout=0 ensures that read() and write() are
	# non-blocking. If no incoming data is available then read() returns 0
	# bytes. if timeout=0 was not defined then read() would stop and wait for
	# incoming data.
	with Serial(serial_port, serial_baud_rate, timeout=0, write_timeout=0) as serial:
		async def read_serial_to_socket(websocket):
			if serial.in_waiting > 0:
				msg = ""
				b = serial.read().decode("ascii")
				while b != "\n":
					msg += b
					b = serial.read().decode("ascii")
				await websocket.send(msg)

		async def socket_handler(websocket):
			last_update = time()
			async for message in websocket:
				if time() < last_update + 0.02:
					continue
				last_update = time()

				message = json.loads(message)
				pwms = message["servos"].values()
				if len(pwms) < 1:
					continue

				buff = bytearray(3+len(pwms))
				buff[0] = 2  # STX
				buff[1] = len(pwms)  # Number of servos
				buff[2: -1] = bytearray(pwms)  # PWMs
				buff[-1] = sum(buff[2:-1]) % 256  # Checksum
				serial.write(buff)

				await read_serial_to_socket(websocket)

		async with websockets.serve(socket_handler, "localhost", socket_port):
			await asyncio.Future()


if __name__ == '__main__':
	try:
		asyncio.run(main())
	except KeyboardInterrupt:
		exit(0)
