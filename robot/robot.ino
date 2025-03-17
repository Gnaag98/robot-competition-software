/*
 * Robot starter code
 * 
 * Adapted from robotArmController.ino by frepet at
 * https://github.com/frepet/Robot-Arm-Controller.
 * 
 * Reads servo messages (defined below) from serial and updates the attached
 * servos accordingly. Reading motor messages (also defined below) is left as
 * an exercise.
 *
 * ┌─────────┬───────┬─Servo message────────────────────┐
 * │  BYTE   │ VALUE │               NOTE               │
 * ├─────────┼───────┼──────────────────────────────────┤
 * │    0    │   2   │ Start                            │
 * │    1    │ 0-255 │ Number of servos                 │
 * │ 2:end-1 │ 0-255 │ PWM-value                        │
 * │   end   │ 0-255 │ Checksum = sum(PWM-values) % 256 │
 * └─────────┴───────┴──────────────────────────────────┘
 * ┌─────────┬───────┬────────────Motor message────────────────────────────────┐
 * │  BYTE   │ VALUE │                          NOTE                           │
 * ├─────────┼───────┼─────────────────────────────────────────────────────────┤
 * │    0    │   4   │ Start                                                   │
 * │    1    │ 0-255 │ Number of motors                                        │
 * │ 2:end-1 │ 0-255 │ PWM-value (0-126: reverse, 127: stop, 128-255: forward) │
 * │   end   │ 0-255 │ Checksum = sum(PWM-values) % 256                        │
 * └─────────┴───────┴─────────────────────────────────────────────────────────┘
 */

#include <Servo.h>

const int baud_rate = 19200;

// Connect servos to pins first_servo_pin, first_servo_pin + 1, ..., 
// first_servo_pin + servo_count - 1.
const int first_servo_pin = 8;
const int servo_count = 6;

// Messeges starting with this byte will be interpreted as a servo message.
const byte servo_start_flag = 2;
// Messeges starting with this byte will be interpreted as a motor message.
const byte motor_start_flag = 4;

// Connect an LED to this pin if you want a visual indicator of transmission
// issues.
const int bad_checksum_led_pin = LED_BUILTIN;
const unsigned int led_on_duration = 100;

unsigned long last_bad_checksum = millis();

// Servo data is stored here before being applied to the servos.
byte servo_pwms[servo_count];
// Each Servo object represent an attached servo.
Servo servos[servo_count];

/**
 * Runs once at the start of the program.
 */
void setup() {
  Serial.begin(baud_rate);

  // Setup LED.
  pinMode(bad_checksum_led_pin, OUTPUT);

  // Setup servos.
  for (int i = 0; i < servo_count; i++) {
    servos[i].attach(first_servo_pin + i);
  }
}

/*
 * Wait for and return the next received byte.
 */
byte nextByte() {
  byte b = Serial.read();
  while (b == -1) {
    b = Serial.read();
    delay(10);
  }
  return b;
}

void clearServoMessage() {
  memset(servo_pwms, 0, servo_count);
}

/**
 * Wait for and consume start flag of servo message.
 */
void waitForServoMessage() {
  byte receivedByte = nextByte();
  while (receivedByte != servo_start_flag) {
    receivedByte = nextByte();
    delay(10);
  }
}

/**
 * Returns true if a servo message was successfully read.
 */
bool readServoMessage() {
  // The byte after the start flag contain the number of servos in the message.
  const byte message_servo_count = nextByte();

  // Temporary storage that we throw away if the checksum is incorrect.
  byte message_pwms[message_servo_count];

  byte computed_checksum = 0;
  for (int i = 0; i < message_servo_count; i++) {
    // We assume the correct number of bytes are sent and wait for each of them.
    message_pwms[i] = nextByte();
    computed_checksum += message_pwms[i];
  }

  // Don't copy the new PWM values if the checksum is incorrect.
  const byte received_checksum = nextByte();
  if (received_checksum != computed_checksum) {
    Serial.print("Bad checksum, received: ");
    Serial.print(received_checksum);
    Serial.print(", computed: ");
    Serial.println(computed_checksum);
    last_bad_checksum = millis();
    return false;
  }

  // If data for too many servos was sent, only copy to attached servos.
  const byte byteCount = min(message_servo_count, servo_count);
  memcpy(servo_pwms, message_pwms, byteCount);
  return true;
}

/**
 * Update servo positions using stored data.
 */
void updateServos() {
  for (int i = 0; i < servo_count; i++) {
    // Default values for DFRobot DSS-M15 servo. Can differ between servos.
    // https://www.dfrobot.com/product-120.html.
    const int min_us = 500;
    const int max_us = 2500;

    // Map PWM byte to servo microseconds.
    const int microseconds = map(servo_pwms[i], 0, 255, min_us, max_us);
    servos[i].writeMicroseconds(microseconds);
  }
}

/**
 * Runs forever after setup().
 */
void loop() {
  // Control servos.
  clearServoMessage();
  waitForServoMessage();
  if (readServoMessage()) {
    updateServos();
  }

  // Control motors.
  // EXERCISE: Implement functions similar to the ones above but for motors.

  // Light the LED if a bad cheksum was received recently.
  const bool is_led_on = millis() - last_bad_checksum <= led_on_duration;
  digitalWrite(bad_checksum_led_pin, is_led_on);
}
