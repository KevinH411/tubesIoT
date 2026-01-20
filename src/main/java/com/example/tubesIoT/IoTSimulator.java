package com.example.tubesIoT;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.tubesIoT.Model.Lokasi;
import com.example.tubesIoT.Model.SensorReading;
import com.example.tubesIoT.Repository.SensorReadingRepository;

import java.time.LocalDateTime;
import java.util.Random;

@Component
public class IoTSimulator {

    @Autowired
    private SensorReadingRepository sensorRepository;

    private final Random random = new Random();

    // Simulasi pengiriman data dari 3 lokasi setiap 5 detik
    @Scheduled(fixedDelay = 5000)
    public void simulateSensorData() {
        System.out.println("Simulating IoT Data Transmission...");
        
        simulateForLokasi(1L);
        simulateForLokasi(2L);
        simulateForLokasi(3L);
        
        System.out.println("Simulation complete. Data saved to H2 Database.");
    }

    private void simulateForLokasi(Long lokasiId) {
        SensorReading data = new SensorReading();
        Lokasi lokasi = new Lokasi();
        lokasi.setIdLokasi(lokasiId);
        data.setLokasi(lokasi);
        
        // Generate data acak yang masuk akal
        data.setSoilMoisture(20 + random.nextInt(60)); // 20% - 80%
        data.setTemperature(25.0 + (random.nextDouble() * 10)); // 25.0 - 35.0 C
        data.setPh(5.5 + (random.nextDouble() * 2)); // 5.5 - 7.5
        data.setLight((double)200 + random.nextInt(800)); // 200 - 1000 Lux
        
        data.setTimestamp(LocalDateTime.now());
        sensorRepository.save(data);
    }
}
