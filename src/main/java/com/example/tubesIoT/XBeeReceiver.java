package com.example.tubesIoT;

import com.example.tubesIoT.Model.SensorReading;
import com.example.tubesIoT.Repository.LahanRepository;
import com.example.tubesIoT.Repository.SensorReadingRepository;
import com.fazecast.jSerialComm.SerialPort;
import com.fazecast.jSerialComm.SerialPortDataListener;
import com.fazecast.jSerialComm.SerialPortEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;

@Component
@Profile("!test")
public class XBeeReceiver {
    private static final Logger logger = LoggerFactory.getLogger(XBeeReceiver.class);

    @Autowired
    private SensorReadingRepository sensorRepository;

    @Autowired
    private LahanRepository lahanRepository;

    @Value("${xbee.port}")
    private String portName;

    @Value("${xbee.baud}")
    private int baudRate;

    private SerialPort globalPort;
    private final StringBuilder buffer = new StringBuilder();

    @PostConstruct
    public void init() {
        logger.info("====================================================");
        logger.info("🔍 MEMULAI DEBUGGING XBEE");
        logger.info("📍 Port Target: {}", portName);
        logger.info("🚀 Baud Rate: {}", baudRate);
        logger.info("====================================================");

        try {
            globalPort = SerialPort.getCommPort(portName);
            
            // Log semua port yang tersedia untuk membantu user jika portName salah
            SerialPort[] availablePorts = SerialPort.getCommPorts();
            logger.info("📋 Port yang terdeteksi di sistem: {}", 
                Arrays.stream(availablePorts).map(SerialPort::getSystemPortName).toList());

            globalPort.setBaudRate(baudRate);
            globalPort.setNumDataBits(8);
            globalPort.setNumStopBits(SerialPort.ONE_STOP_BIT);
            globalPort.setParity(SerialPort.NO_PARITY);
            globalPort.setComPortTimeouts(SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 2000, 0);

            if (!globalPort.openPort()) {
                logger.error("❌ GAGAL MEMBUKA PORT: {}. Kemungkinan penyebab:", portName);
                logger.error("   1. Port sedang digunakan aplikasi lain (Serial Monitor/Kode Tes).");
                logger.error("   2. Nama port salah (Cek daftar port di atas).");
                logger.error("   3. Kabel USB/XBee tidak terhubung dengan baik.");
                return;
            }

            logger.info("✅ PORT BERHASIL DIBUKA: {}", portName);

            globalPort.addDataListener(new SerialPortDataListener() {
                @Override
                public int getListeningEvents() {
                    return SerialPort.LISTENING_EVENT_DATA_AVAILABLE;
                }

                @Override
                public void serialEvent(SerialPortEvent event) {
                    if (event.getEventType() != SerialPort.LISTENING_EVENT_DATA_AVAILABLE) return;

                    int bytesAvailable = globalPort.bytesAvailable();
                    if (bytesAvailable <= 0) return;

                    byte[] newData = new byte[bytesAvailable];
                    int numRead = globalPort.readBytes(newData, newData.length);
                    
                    if (numRead > 0) {
                        String rawPart = new String(newData, 0, numRead, StandardCharsets.US_ASCII);
                        logger.debug("📥 Raw Bytes Masuk ({} bytes): [{}]", numRead, rawPart.replace("\n", "\\n").replace("\r", "\\r"));
                        
                        buffer.append(rawPart);
                        
                        // Proses jika ada newline (pesan lengkap)
                        int newlineIndex;
                        while ((newlineIndex = buffer.indexOf("\n")) != -1) {
                            String fullMessage = buffer.substring(0, newlineIndex).trim();
                            buffer.delete(0, newlineIndex + 1);
                            
                            if (!fullMessage.isEmpty()) {
                                logger.info("📩 PESAN LENGKAP DITERIMA: '{}'", fullMessage);
                                processAndSaveToDb(fullMessage);
                            }
                        }
                    }
                }
            });

        } catch (Exception e) {
            logger.error("💥 CRITICAL ERROR saat inisialisasi: ", e);
        }
    }

    @PreDestroy
    public void cleanup() {
        if (globalPort != null && globalPort.isOpen()) {
            globalPort.closePort();
            logger.info("🔌 Port {} telah ditutup dengan aman.", portName);
        }
    }

    public void triggerManualRead() {
        logger.info("🔘 Trigger manual dipanggil...");
        if (globalPort != null && globalPort.isOpen()) {
            String cmd = "send\n";
            byte[] command = cmd.getBytes(StandardCharsets.US_ASCII);
            int written = globalPort.writeBytes(command, command.length);
            
            if (written > 0) {
                logger.info("➡️ Perintah 'send' BERHASIL dikirim ({} bytes). Menunggu balasan...", written);
            } else {
                logger.warn("⚠️ Perintah terkirim tapi 0 bytes tertulis. Cek koneksi hardware.");
            }
        } else {
            logger.error("❌ GAGAL TRIGGER: Port tidak terbuka atau null!");
        }
    }

    private void processAndSaveToDb(String data) {
        logger.info("⚙️ Memproses data untuk database...");
        try {
            String[] parts = data.split(";");
            SensorReading entity = new SensorReading();
            entity.setTimestamp(LocalDateTime.now());

            boolean hasData = false;
            Long detectedLahanId = null;

            for (String part : parts) {
                String[] pair = part.split(":");
                if (pair.length < 2) {
                    logger.warn("⚠️ Part data tidak valid (skip): {}", part);
                    continue;
                }

                String key = pair[0].trim();
                String value = pair[1].trim();
                logger.debug("   🔍 Parsing -> {}: {}", key, value);

                try {
                    switch (key) {
                        case "ID" -> detectedLahanId = Long.parseLong(value);
                        case "SM" -> { entity.setSoilMoisture(Integer.parseInt(value)); hasData = true; }
                        case "T"  -> { entity.setTemperature(Double.parseDouble(value)); hasData = true; }
                        case "PH" -> { entity.setPh(Double.parseDouble(value)); hasData = true; }
                        case "L"  -> { entity.setLight(Double.parseDouble(value)); hasData = true; }
                    }
                } catch (NumberFormatException e) {
                    logger.error("❌ Gagal konversi nilai '{}' untuk kunci '{}'", value, key);
                }
            }

            if (hasData) {
                final Long finalId = (detectedLahanId != null) ? detectedLahanId : 1L;
                logger.info("💾 Mencoba menyimpan ke Lahan ID: {}", finalId);
                
                lahanRepository.findById(finalId).ifPresentOrElse(
                    lahan -> {
                        entity.setLahan(lahan);
                        sensorRepository.save(entity);
                        logger.info("✅ DATA BERHASIL DISIMPAN KE DATABASE.");
                    },
                    () -> logger.error("❌ GAGAL SIMPAN: Lahan ID {} tidak ada di database!", finalId)
                );
            } else {
                logger.warn("⚠️ Data diterima tapi tidak mengandung nilai sensor yang valid.");
            }
        } catch (Exception e) {
            logger.error("❌ ERROR saat parsing/saving: ", e);
        }
    }
}
