/*
 * Prints device MAC address to serial
 *
 * Intended to be uploaded to an ESP32 microcontroller.
 */

#include "MacAddress.h"
#include "WiFi.h"

void setup() {
  Serial.begin(9600);

  // Diagnostics LED.
  pinMode(LED_BUILTIN, OUTPUT);

  // Initialize Wi-Fi.
  WiFi.mode(WIFI_STA);
  while (!WiFi.STA.started()) {
    delay(100);
  }
}
// 1. DC:DA:0C:20:EB:B8
// 2. 74:4D:BD:A1:35:60
void loop() {
  // Arbitrarily placed here. Could as well print in setup().
  Serial.print("MAC Address: ");
  Serial.println(WiFi.macAddress());

  // Toggle LED.
  digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
  delay(1000);
}
