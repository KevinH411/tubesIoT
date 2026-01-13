package com.example.tubesIoT.Config;

import com.example.tubesIoT.Model.SensorData;
import com.example.tubesIoT.Repository.SensorDataRepository;
import com.fazecast.jSerialComm.SerialPort;
import java.util.Scanner;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

// buat cara makenya buat @Autowired di filenya
// abis gitu pake xBeeReceiver.getLatestMessage()
// karena ngebacanya pake thread, kodenya bakal jalan terus jadi harus pake stopper
// ini antara pake while(true) sama Thread.sleep(500) ato fungsinya kasih @Scheduled(fixedDelay=500) tapi ga usah di loop, itu 500ms

// @Autowired
// private XBeeReceiver xbeeReceiver;

// @Scheduled(fixedDelay = 500)
// public void readSensor() {
//     String data = xbeeReceiver.getLatestMessage();
//     if (data != null) {
//         System.out.println("Received: " + data);
//         // parse & save to DB
//     }
// }

//itu kode diatas buat nerima stringnya darisini

@Component
@Profile("!test") // biar waktu xbee nya g dipake masih bisa build
public class XBeeReceiver {
    @Autowired
    private SensorDataRepository sensorRepository;

    @Value("${xbee.port}")
    private String portName;

    @Value("${xbee.baud}")
    private int baudRate;

    private volatile String latestMessage = null;
    private SerialPort globalPort;

    @PostConstruct
    public void init() {
        try {
            SerialPort port = SerialPort.getCommPort(portName);
            this.globalPort = port;
            port.setBaudRate(baudRate);
            port.setComPortTimeouts(
                    SerialPort.TIMEOUT_READ_BLOCKING,
                    0, 0);

            if (!port.openPort()) {
                System.err.println("⚠ XBee not connected on " + portName);
                globalPort = null;
                return; // JANGAN crash Spring
            }

            new Thread(() -> {
                try (Scanner scanner = new Scanner(port.getInputStream())) {
                    while (scanner.hasNextLine()) {
                        latestMessage = scanner.nextLine().trim();
                    }
                }
            }).start();

            System.out.println("✅ XBee connected on " + portName);

        } catch (Exception e) {
            System.err.println("⚠ XBee init failed: " + e.getMessage());
            globalPort = null;
        }
    }

    @Scheduled(fixedDelay = 5000)
    public void processAndSaveToDb() {
        // 1. Kirim perintah "send" ke Arduino (sesuai logika arduino_code.ino)
        if (globalPort != null && globalPort.isOpen()) {
            byte[] command = "send\n".getBytes();
            globalPort.writeBytes(command, command.length);
        }

        // 2. Ambil pesan terbaru
        String data = getLatestMessage();

        // 3. Parsing dan Simpan jika format benar (SM:%d;T:%s;PH:%s;L:%s)
        if (data != null && data.startsWith("SM:")) {
            try {
                String[] parts = data.split(";");
                SensorData entity = new SensorData();

                for (String part : parts) {
                    String[] pair = part.split(":");
                    if (pair.length < 2)
                        continue;

                    String key = pair[0];
                    String value = pair[1];

                    switch (key) {
                        case "SM":
                            entity.setSoilMoisture(Integer.parseInt(value));
                            break;
                        case "T":
                            entity.setTemperature(Double.parseDouble(value));
                            break;
                        case "PH":
                            entity.setPh(Double.parseDouble(value));
                            break;
                        case "L":
                            entity.setLight(Double.parseDouble(value));
                            break;
                    }
                }
                sensorRepository.save(entity);
                System.out.println("Data Berhasil Disimpan: " + data);
            } catch (Exception e) {
                System.err.println("Gagal parsing data: " + e.getMessage());
            }
        }
    }

    public String getLatestMessage() {
        String msg = latestMessage;
        latestMessage = null;
        return msg;
    }
}
