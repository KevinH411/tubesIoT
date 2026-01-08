#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <BH1750.h>
#include <avr/sleep.h>

// ---------- Pin definitions ----------
#define SOIL_PIN A0
#define PH_PIN A1
#define TEMP_DATA_PIN 22
#define SOIL_POWER_PIN -1   // set to GPIO if used, else -1

// ---------- Soil moisture calibration ----------
#define SOIL_RAW_DRY 1023   // air / very dry
#define SOIL_RAW_WET 200    // fully wet soil

// ---------- pH calibration ----------
#define PH_RAW_MIN 300
#define PH_RAW_MAX 800
#define PH_MIN 4.0
#define PH_MAX 9.0

// ---------- Serial / XBee ----------
#define XBEE_BAUD 9600
#define XBEE_SERIAL Serial1

// ---------- Temperature ----------
OneWire oneWire(TEMP_DATA_PIN);
DallasTemperature tempSensor(&oneWire);

// ---------- Light sensor ----------
BH1750 lightMeter(0x23);
bool bh1750Ready = false;
float lastLux = NAN;

// ---------- Command buffer ----------
char cmdBuf[32];
uint8_t cmdPos = 0;

// ===================== SETUP =====================
void setup() {
  XBEE_SERIAL.begin(XBEE_BAUD);

  tempSensor.begin();
  Wire.begin();
  delay(200);

  bh1750Ready = lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE);
  if (bh1750Ready) {
    float r = lightMeter.readLightLevel();
    if (r >= 0) lastLux = r;
  }

  if (SOIL_POWER_PIN >= 0) {
    pinMode(SOIL_POWER_PIN, OUTPUT);
    digitalWrite(SOIL_POWER_PIN, LOW);
  }

  XBEE_SERIAL.println("Ready");
}

// ===================== LOOP =====================
void loop() {
  if (!XBEE_SERIAL.available()) {
    goToSleep();
  }
  readIncoming(XBEE_SERIAL);
}

// ===================== SLEEP =====================
void goToSleep() {
  set_sleep_mode(SLEEP_MODE_IDLE); // UART stays alive
  sleep_enable();
  sleep_cpu();
  sleep_disable();
}

// ===================== INPUT =====================
void readIncoming(Stream &s) {
  while (s.available()) {
    char c = s.read();

    if (c == '\r' || c == '\n') {
      if (cmdPos > 0) {
        cmdBuf[cmdPos] = '\0';
        processCommand(cmdBuf);
        cmdPos = 0;
      }
    } else {
      if (cmdPos < sizeof(cmdBuf) - 1) {
        cmdBuf[cmdPos++] = c;
      } else {
        cmdPos = 0;
      }
    }
  }
}

void processCommand(const char *cmd) {
  String clean = "";
  for (int i = 0; cmd[i]; i++) {
    if (isAlpha(cmd[i])) {
      clean += (char)tolower(cmd[i]);
    }
  }

  if (clean == "send") {
    sendSensorData();
  } else {
    XBEE_SERIAL.print("ERR:unknown:");
    XBEE_SERIAL.println(cmd);
  }
}

// ===================== MEASUREMENT =====================
void sendSensorData() {
  if (SOIL_POWER_PIN >= 0) {
    digitalWrite(SOIL_POWER_PIN, HIGH);
    delay(80);
  }

  // ---- Soil moisture ----
  int soilRaw = analogRead(SOIL_PIN);
  int soilMoisture = map(soilRaw,
                          SOIL_RAW_WET,
                          SOIL_RAW_DRY,
                          100, 0);
  soilMoisture = constrain(soilMoisture, 0, 100);

  // ---- Temperature ----
  tempSensor.requestTemperatures();
  float tempC = tempSensor.getTempCByIndex(0);

  // ---- pH ----
  int phRaw = analogRead(PH_PIN);
  float fakePH = (float)map(phRaw,
                            PH_RAW_MIN, PH_RAW_MAX,
                            (int)(PH_MIN * 100),
                            (int)(PH_MAX * 100)) / 100.0;
  fakePH = constrain(fakePH, PH_MIN, PH_MAX);

  // ---- Light ----
  float lux = NAN;
  if (bh1750Ready) {
    float r = lightMeter.readLightLevel();
    if (r >= 0) {
      lux = r;
      lastLux = r;
    } else {
      lux = lastLux;
    }
  }

  if (SOIL_POWER_PIN >= 0) {
    digitalWrite(SOIL_POWER_PIN, LOW);
  }

  char tBuf[8], phBuf[8], lBuf[8];
  dtostrf(tempC, 0, 2, tBuf);
  dtostrf(fakePH, 0, 2, phBuf);
  dtostrf(isnan(lux) ? lastLux : lux, 0, 2, lBuf);

  char out[128];
  snprintf(out, sizeof(out),
           "SM:%d;T:%s;PH:%s;L:%s",
           soilMoisture, tBuf, phBuf, lBuf);

  XBEE_SERIAL.println(out);
}