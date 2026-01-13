package com.example.tubesIoT;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.tubesIoT.Model.Lahan;
import com.example.tubesIoT.Model.SensorReading;
import com.example.tubesIoT.Repository.SensorReadingRepository;

import java.time.LocalDateTime;
import java.util.Random;

@Component
public class IoTSimulator {

    @Autowired
    private SensorReadingRepository sensorRepository;

    private final Random random = new Random();

    // Simulasi pengiriman data dari 3 lahan setiap 5 detik
    @Scheduled(fixedDelay = 5000)
    public void simulateSensorData() {
        System.out.println("Simulating IoT Data Transmission...");
        
        simulateForLahan(1L);
        simulateForLahan(2L);
        simulateForLahan(3L);
        
        System.out.println("Simulation complete. Data saved to H2 Database.");
    }

    private void simulateForLahan(Long lahanId) {
        SensorReading data = new SensorReading();
        Lahan lahan = new Lahan();
        lahan.setIdLahan(lahanId);
        data.setLahan(lahan);
        
        // Generate data acak yang masuk akal
        data.setSoilMoisture(20 + random.nextInt(60)); // 20% - 80%
        data.setTemperature(25.0 + (random.nextDouble() * 10)); // 25.0 - 35.0 C
        data.setPh(5.5 + (random.nextDouble() * 2)); // 5.5 - 7.5
        data.setLight((double)200 + random.nextInt(800)); // 200 - 1000 Lux
        
        data.setTimestamp(LocalDateTime.now());
        sensorRepository.save(data);
    }
}
