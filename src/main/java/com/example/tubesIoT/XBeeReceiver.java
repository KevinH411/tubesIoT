package com.example.tubesIoT;

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
    @Value("${xbee.port}")
    private String portName;

    @Value("${xbee.baud}")
    private int baudRate;

    private volatile String latestMessage = null;

    @PostConstruct
    public void init() {
        SerialPort port = SerialPort.getCommPort(portName);
        port.setBaudRate(baudRate);
        port.setComPortTimeouts(
                SerialPort.TIMEOUT_READ_BLOCKING,
                0, 0);

        if (!port.openPort()) {
            throw new RuntimeException("Failed to open XBee port: " + portName);
        }

        new Thread(() -> {
            try (Scanner scanner = new Scanner(port.getInputStream())) {
                while (scanner.hasNextLine()) {
                    latestMessage = scanner.nextLine().trim();
                }
            }
        }).start();
    }

    public String getLatestMessage() {
        String msg = latestMessage;
        latestMessage = null;
        return msg;
    }
}
