/*
 * Serial over ESP-NOW
 *
 * Upload this code to two WiFi capable ESP32:s to act as a wireless repeater of
 * serial data. Simply specify the peer device MAC address in the code to pair
 * the devices.
 * 
 * For example, an Arduino tethered via USB to a computer can be
 * made wireless using the following setup:
 *
 * Before (wired):
 * ┌──────────┐       ┌─────────┐
 * │ Computer ┝━━USB━━┥ Arduino │
 * └──────────┘       └─────────┘
 * After (wireless):
 * ┌──────────┐       ┌───────┐                 ┌───────┐            ┌─────────┐
 * │ Computer ┝━━USB━━┥ ESP32 │ ))) ESP-NOW ((( │ ESP32 ┝━━pins━0-1━━┥ Arduino │
 * └──────────┘       └───────┘                 └───────┘            └─────────┘
 * 
 */

#include "ESP32_NOW_Serial.h"
#include "MacAddress.h"
#include "WiFi.h"

#include "esp_wifi.h"

// Set the MAC address of the peer device to communicate with.
// For example: F4:12:FA:40:64:4C is {0xF4, 0x12, 0xFA, 0x40, 0x64, 0x4C}
const MacAddress peer_mac_address({0x74, 0x4D, 0xBD, 0xA1, 0x35, 0x60});

// Choose which Wi-Fi channel to use. Must be same as peer. Allowed in EU: 1-13.
const int wifi_channel = 1;

// Choose which baud rate to use. Must be same as peer.
const int wireless_baud_rate = 19200;

// Choose which baud rate to use. Must be same as physically connected device.
const int serial_baud_rate = 19200;

// Status LEDs.
const int blink_led_pin = LED_BUILTIN;
const int serial_led_pin = LED_RED;
const int wireless_led_pin = LED_BLUE;
unsigned long last_blink_time;
unsigned int blink_duration = 1000;
// Record events so that the LEDs can be on a short while after.
unsigned long last_serial_read_time;
unsigned long last_wireless_read_time;
unsigned int led_on_duration = 50;

// Using the same syntax as Serial, this object is used to communicate with the
// peer ESP32 device.
ESP_NOW_Serial_Class Wireless(peer_mac_address, wifi_channel, WIFI_IF_STA);

void setup() {
  Serial.begin(serial_baud_rate);

  // Initialize status LEDs.
  pinMode(blink_led_pin, OUTPUT);
  pinMode(serial_led_pin, OUTPUT);
  pinMode(wireless_led_pin, OUTPUT);
  digitalWrite(blink_led_pin, LOW);
  // For RGB LED: LOW = on, HIGH = off.
  digitalWrite(serial_led_pin, HIGH);
  digitalWrite(wireless_led_pin, HIGH);

  // Initialize Wi-Fi.
  WiFi.mode(WIFI_STA);
  WiFi.setChannel(wifi_channel, WIFI_SECOND_CHAN_NONE);

  while (!WiFi.STA.started()) {
    // Blink fast while waiting on Wi-Fi.
    digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
    delay(100);
  }

  // NOTE: Comment out these diagnostic prints when the peers are paired so that
  // the text isn't sent to the connected device.
  Serial.print("Starting ESP-NOW on channel ");
  Serial.print(wifi_channel);
  Serial.print(" at ");
  Serial.print(wireless_baud_rate);
  Serial.println(" bps");

  // Initialize ESP-NOW wireless communication.
  Wireless.begin(wireless_baud_rate);

  // NOTE: Comment out these diagnostic prints when the peers are paired so that
  // the text isn't sent to the connected device.
  Serial.print("Send data to the peer using the Serial Monitor. Baud rate: ");
  Serial.print(serial_baud_rate);
  Serial.println(".\n");
}

void loop() {
  // Forward serial data from device to peer wirelessly.
  while (Serial.available() && Wireless.availableForWrite()) {
    if (Wireless.write(Serial.read()) <= 0) {
      // You can uncomment this diagnostics section when debugging.
      /*Serial.println("Failed to send data");
      break;*/
    }
    last_serial_read_time = millis();
  }

  // Forward wireless data from peer to device over serial.
  while (Wireless.available()) {
    Serial.write(Wireless.read());
    last_wireless_read_time = millis();
  }

  const unsigned long now = millis();
  // Blink LED to show the device working.
  const bool should_blink = now - last_blink_time > blink_duration;
  if (should_blink) {
    digitalWrite(blink_led_pin, !digitalRead(blink_led_pin));
    last_blink_time = now;
  }
  // Turn on/off status LEDs.
  const bool is_serial_led_on = now - last_serial_read_time <= led_on_duration;
  const bool is_wireless_led_on = now - last_wireless_read_time <= led_on_duration;
  // For RGB LED: LOW = on, LOW = off.
  digitalWrite(serial_led_pin, !is_serial_led_on);
  digitalWrite(wireless_led_pin, !is_wireless_led_on);
}
