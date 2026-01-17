#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <BH1750.h>
#include <avr/sleep.h>

// ---------- Pin definitions ----------
#define SOIL_PIN A0
#define PH_PIN A1
#define TEMP_DATA_PIN 22
#define SOIL_POWER_PIN -1

// ---------- Soil moisture calibration ----------
#define SOIL_RAW_DRY 1023   // air / very dry
#define SOIL_RAW_WET 200    // fully wet soil

// ---------- pH calibration ----------
#define PH_RAW_MIN 300
#define PH_RAW_MAX 800
#define PH_MIN 4.0
#define PH_MAX 9.0

// ---------- Sampling config ----------
#define SAMPLE_WINDOW_MS 1000UL   // how long to collect samples (1 second)
#define SAMPLE_INTERVAL_MS 100UL  // wait between samples (100 ms -> ~10 samples)
#define TEMP_READ_ONCE true       // read temperature once per window (recommended)
#define MAX_SAMPLES 32

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
char cmdBuf[64];
uint8_t cmdPos = 0;

// ---------- Requested timestamp storage (from basestation) ----------
char requestedTs[32]; // will store string like "2026-01-17 09:15:48" or empty

float harmonicMeanFloat(float vals[], int n) {
  float sumInv = 0.0f;
  int count = 0;
  const float EPS = 1e-6f; // avoid divide-by-zero
  for (int i = 0; i < n; ++i) {
    float v = vals[i];
    if (!isnan(v) && v > EPS) {
      sumInv += 1.0f / v;
      count++;
    }
  }
  if (count == 0) return NAN;
  return (float)count / sumInv;
}

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

  // init requestedTs as empty
  requestedTs[0] = '\0';

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
        // overflow: reset
        cmdPos = 0;
      }
    }
  }
}

// Accepts:
//  - "send"           -> no timestamp requested (Arduino will send TS_MS)
//  - "send:<YYYY-MM-DD HH:MM:SS>" -> Arduino will include TS:<that-string> in the response
void processCommand(const char *cmd) {
  // trim leading spaces
  int i = 0;
  while (cmd[i] == ' ') i++;

  // Make a lowercase copy of the first 4 chars to compare "send"
  char prefix[6] = {0};
  for (int j = 0; j < 5 && cmd[i + j]; ++j) {
    prefix[j] = tolower((unsigned char)cmd[i + j]);
  }

  if (strncmp(prefix, "send", 4) == 0) {
    // Skip "send"
    int k = i + 4;
    // Skip optional separators ":" or " " 
    while (cmd[k] == ' ' || cmd[k] == ':' ) k++;

    // If there's content after that, treat as timestamp string
    if (cmd[k] != '\0') {
      // copy remainder into requestedTs (trim whitespace)
      int dst = 0;
      int src = k;
      // trim leading spaces already done; copy until end or newline
      while (cmd[src] && dst < (int)(sizeof(requestedTs) - 1)) {
        requestedTs[dst++] = cmd[src++];
      }
      // trim trailing spaces
      while (dst > 0 && requestedTs[dst-1] == ' ') dst--;
      requestedTs[dst] = '\0';
    } else {
      requestedTs[0] = '\0';
    }

    // Now respond by sampling & sending (use requestedTs if set)
    sendSensorData(requestedTs);
  } else {
    XBEE_SERIAL.print("ERR:unknown:");
    XBEE_SERIAL.println(cmd);
  }
}

// ===================== MEASUREMENT =====================
// signature accepts optional timestamp. If tsStr is non-empty it will be used as TS:...
void sendSensorData(const char *tsStr) {
  if (SOIL_POWER_PIN >= 0) {
    digitalWrite(SOIL_POWER_PIN, HIGH);
    delay(80);
  }

  float soilPctSamples[MAX_SAMPLES];
  float phSamples[MAX_SAMPLES];
  float lightSamples[MAX_SAMPLES];
  int samples = 0;

  if (TEMP_READ_ONCE) {
    tempSensor.setResolution(9);
    tempSensor.requestTemperatures();
  }

  unsigned long windowStart = millis();
  unsigned long nextSampleAt = windowStart;

  // collect samples for SAMPLE_WINDOW_MS
  while (millis() - windowStart < SAMPLE_WINDOW_MS && samples < MAX_SAMPLES) {
    unsigned long now = millis();
    if (now >= nextSampleAt) {
      // ---- Soil (analog -> 0..100) ----
      int soilRaw = analogRead(SOIL_PIN);
      int soilMoisture = map(soilRaw, SOIL_RAW_WET, SOIL_RAW_DRY, 100, 0);
      soilMoisture = constrain(soilMoisture, 0, 100);
      soilPctSamples[samples] = (float)soilMoisture;

      // ---- pH (analog -> scaled) ----
      int phRaw = analogRead(PH_PIN);
      float phValue = (float)map(phRaw,
                              PH_RAW_MIN, PH_RAW_MAX,
                              (int)(PH_MIN * 100),
                              (int)(PH_MAX * 100)) / 100.0f;
      phValue = constrain(phValue, PH_MIN, PH_MAX);
      phSamples[samples] = phValue;

      // ---- Light (BH1750) ----
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
      lightSamples[samples] = lux;

      samples++;
      nextSampleAt += SAMPLE_INTERVAL_MS;
    } else {
      delay(5);
    }
  }

  // read temperature (if one-shot)
  float tempC = NAN;
  if (TEMP_READ_ONCE) {
    tempC = tempSensor.getTempCByIndex(0); // read temp after conversion
  } else {
    tempSensor.requestTemperatures();
    delay(100);
    tempC = tempSensor.getTempCByIndex(0);
  }

  if (SOIL_POWER_PIN >= 0) {
    digitalWrite(SOIL_POWER_PIN, LOW);
  }

  // compute harmonic means for soil, ph, light
  float soilAvg = harmonicMeanFloat(soilPctSamples, samples);
  float phAvg = harmonicMeanFloat(phSamples, samples);
  float lightAvg = harmonicMeanFloat(lightSamples, samples);

  // fallback for NaN cases
  if (isnan(lightAvg)) lightAvg = lastLux;
  if (isnan(soilAvg)) soilAvg = 0.0f;
  if (isnan(phAvg)) phAvg = (PH_MIN + PH_MAX) / 2.0f;

  // format numbers as strings
  char tBuf[8], phBuf[8], lBuf[10], smBuf[6];
  dtostrf(tempC, 0, 2, tBuf);
  dtostrf(phAvg, 0, 2, phBuf);
  dtostrf(lightAvg, 0, 2, lBuf);
  dtostrf(soilAvg, 0, 0, smBuf); // soil 0-100 integerish (no decimals)

  // timestamp: if tsStr provided and non-empty, use "TS:<tsStr>"
  // otherwise send TS_MS:<millis>
  char out[220];
  if (tsStr != NULL && tsStr[0] != '\0') {
    // use the provided timestamp verbatim (caller is basestation)
    snprintf(out, sizeof(out),
             "TS:%s;SM:%s;T:%s;PH:%s;L:%s",
             tsStr, smBuf, tBuf, phBuf, lBuf);
  } else {
    unsigned long ts = millis();
    snprintf(out, sizeof(out),
             "TS_MS:%lu;SM:%s;T:%s;PH:%s;L:%s",
             ts, smBuf, tBuf, phBuf, lBuf);
  }

  XBEE_SERIAL.println(out);

  requestedTs[0] = '\0';
}