# Robot Competition Software
This software bundle consists mainly of two parts: Arduino starter code for a
robot receiving input from serial and a web-based GUI controller to send gamepad
input over serial. These parts go together and are located in the `robot` and
`controller` directories. The remaining directory `wireless_serial` contain
Arduino code meant to run on ESP32 microcontrollers to extend serial
communication wirelessly. The software in this bundle is explained in more
detail below.


## Robot & Controller
Using these two together without any modification will allow you to controll the
angle of multiple servos attached to an Arduino microcontroller using a web GUI
and optional gamepads. The UI is capable of supporting motors as well but this
feature is disabled in the Python code and unimplemented in the Arduino code. To
enable this feature, which has been left as an exercise, uncomment the
appropriate lines in the Python files and implement the necessary code to parse
serial messages containing motor data.

### Installation

#### Robot
1. Download and install the [Arduino IDE](https://www.arduino.cc/en/software).
2. Open the file `robot/robot.ino` in the Arduino IDE.
3. Install the Arduino Servo library.
    1. In the Arduino IDE, navigate to **Tools** and click on
	**Manage libraries...**
	2. Type *servo* in the search box and look for the *Servo* library by
	*Michael Margolis, Arduino*.
	3. Click on **INSTALL**. It should not matter which version you install.
4. Connect the Arduino to the computer via USB.
5. Select the microcontroller from the drop-down list, or navigate to **Tools**
and selet the correct *Board* and *Port*.
6. Upload the sketch using the upload button or equivalent.

#### Controller

1. Download and install [Python](https://www.python.org/downloads/).
2. Open a terminal window in the project root directory (the one including the
`LICENCE` file).
3. Create and activate a Python virtual environment.
    1. To create a virtual environment, run the command `python -m venv .venv`.
	A hidden directory named `.venv` is then created due to the leading period
	in the name. This directory basically includes a copy of your python
	installation.
	2. To activate the virtual environment run the command `.venv/bin/activate`
	(or `. .venv/bin/activate` if that didn't work). Using `python` on the
	command line will now use the Python instance in the virtual environment
	instead of the globally installed one. Sometimes the command prompt is
	prepended with `(.venv)` to show that the environment is activated.
4. Install Python library dependencies from the requirements file by running the
command `pip install -r requirements`.

### Usage
To be able to launch the controller program you need to have an Arduino plugged
in and know which port it is connected to. Make sure that the virtual
environment is activated and that you have navigated to the project root
directory.

#### Attach servos
The Arduino code for the robot (`robot/robot.ino`) assumes that servos are
attached to a continuous range of pins, e.g. 2-4 or 3-7, etc. This range is
customized by changing the values of the variables `first_servo_pin` and
`servo_count`. The first servo in the GUI will refer to the the servo attached
to pin `first_servo pin`, the next servo in the GUI to `first_servo_pin+1`, etc.

#### Launch webserver
To launch the webserver interacting with the GUI and Arduino run the command
`python controller <port>` where `<port>` is replaced with the port of the
connected Arduino (eg. `COM0` on Windows or `/dev/ttyACM0` or similar on Linux).
To stop the webserver press **CTRL+C** when in the terminal window or simply
close the window.

#### Open GUI and connect to webserver
With the webserver running open the file `controller/index.html`. This is most
easily by double-clicking the file in the file explorer. Click on the
**Connect** button to establish a connection between the webserver and the GUI.
If you have setup any servos in the GUI the data for these will now be streamed
to the Arduino. Any serial output from the Arduino will also show up in the
window at the bottom of the GUI.

#### Save/Load
To reuse a GUI configuration you click **Save** to save it to a file and
**Load** to reuse a configuration stored in a file. Most of the GUI can be
customized, including the names of servos, gamepads, buttons, etc.


## Wireless Serial
The `wireless_serial` directory includes two Arduino sketches meant to run on
ESP32 microcontrollers. We will assume the use of two *Arduino Nano ESP32*
microcontrollers. The two ESP32s will forward serial data wirelessly
using the ESP-NOW protocol. Connecting one of them to a PC and the other to an
Arduino will enable wireless serial communication without modifying the code on
the Arduino. A diagram of this is shown at the top of the file `esp_now_serial`
sketch.

Each ESP32 need to know the MAC-address of its peer ESP32. To find the
MAC-address of an ESP32 you can upload the `mac_address` sketch and look at the
serial output.

### Upload to an ESP32
Uploading to an ESP32 microcontroller using the Arduino IDE requires some extra
steps. We need the ESP32 board manager from Espressif because the board manager
for the Arduino Nano ESP32 from Arduino does not include the necessary ESP-NOW
serial library. But we need both to get the necessary drivers, at least for
Windows.

**NOTE:** Major issues on Linux, at least Linux Mint. If you are experiencing
problems like serial only working directly after uploading but not after
unplugging and plugging back in the USB, contact the Robot Group and we will
help you with an alternative ESP solution on the PC side.

1. Add the ESP32 board manager
    1. Navigate to **File->Preferences**.
	2. Next to *Additional boards manager URLs:* paste in the following URL: 
	*https://espressif.github.io/arduino-esp32/package_esp32_index.json* and
	click **OK**.
	3. Navigate to **Tools->Board:->Boards Manager...** and search for *esp32*.
	4. First install the board manager from *Arduino*. This is needed on Windows
	to get the neded drivers.
	5. Then install the board manager *esp32* by *Espressif
	Systems*. **NOTE:** At the time of writing (2025-03-19) you need to install
	the older version 3.1.1. Just make sure to not update the boards when
	prompted each time you open the Arduino IDE.
2. Select the *Arduino Nano ESP32* board
    1. Navigate to the annoyingly long drop down at **Tools->Boards:->esp32**.
	2. Scroll forever almost down to the bottom by hovering the mouse over the
	down-arrow at the bottom of the list until you see a board with an
	incredibly long name ending in *(ESP32-S3R8n16)*.
	3. Scroll down 11 more rows and select the board *Arduino Nano ESP32*.
3. Select the correct port. If you don't see any ports, try clicking on
**Tools->Reload Board Data** and wait a few seconds.
4. upload the `mac_address` sketch, and if you're a Linux user, pray.

If praying didn't work you might have gotten the lovely error message including
these two red lines:

> `dfu-util: No DFU capable USB device available`

> `Failed uploading: uploading error: exit status 74`

This will probably happen repeatedly and/or randomly. Here is the annoying way
of uploading when this happens:
1. Click the reset button on the ESP32. Shortly after, while the rainbow effect
is animating, press it again. This will cause the rainbow effect to keep
animating.
2. Press the reset button again. If you succeeded with the previous step this
will cause the RGB LED to slowly blink green repeatedly. If this didn't happen,
go back to step 1.
3. If the port dissappeared, click on **Tools->Reload Board Data** and wait a
few seconds.
4. Try uploading your code again.
5. Reboot the ESP32 by unplugging the USB cable and plugging it back in.
6. If you see text printing in the serial output, unplugg and plugg back in the
USB and see if you still get text printed.

If you are having persistent issues with receiving serial output from the
Arduino Nano ESP32, take a break, touch some grass and ask the Robot Group for
help. 

### Get MAC-address
To get the MAC-addresses of the ESP32 microcontrollers, upload the `mac_address`
sketches and note down the six hexadecimal numbers from the serial output. Make
sure to have the same baud rate specified in the serial monitor as in the setup
function.

### Pair ESP devices
To use the ESP32 microcontrollers as a serial forwarder, upload the
`esp_now_serial` sketch. In the sketch, modify the `peer_mac_address` variable
before uploading. Do this for each ESP you upload to.

To test if the pairing worked, connect both ESPs to your computer and open a
serial monitor for each device. Try writing in the serial monitor and see if it
appears on the other device.

### Connect ESP32 to Romeo
When the devices are paired, uncomment the line mentioned in the sketch for the
ESP on the robot side. This will make it output serial on the pins specified in
the sketch instead of out the USB port. We want to connect these pins via a
logic level shifter to the Romeo so that the RX pin on one device goes to the TX
pin on another, and vice versa. **WARNING:** if you don't use a logic level
shifter you will damage the ESP32, possibly breaking it. Conect according to the
circuit diagram below.

```
    Circuit diagram
┌──────────────────────┐
│                      │
│  Arduino Nano ESP32  │
│                      │
│ GND 2(RX) 3(TX) 3.3V │
└──┬────┬─────┬────┬───┘
   │    │     │    │
┌──┴────┴─────┴────┴──┐
│ GND  A2  A1     LV  │
│                     │
│ Logic Level Shifter │
│                     │
│ GND  B2    B1   HV  │
└──┬────┬─────┬────┬──┘
   │     ╲   ╱     │
   │      ╲ ╱      │
   │       ╳       │
   │      ╱ ╲      │
   │     ╱   ╲     │
┌──┴────┴─────┴────┴─┐
│ GND 0(RX) 1(TX) 5V │
│                    │
│       Romeo        │
│                    │
└────────────────────┘
```
