package com.example.tubesIoT;

import com.example.tubesIoT.Model.SensorReading;
import com.example.tubesIoT.Repository.SensorReadingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sensors")
@CrossOrigin(origins = "*")
public class SensorController {

    @Autowired
    private SensorReadingRepository sensorRepository;

    @Autowired
    private XBeeReceiver xbeeReceiver;

    /**
     * Get semua data sensor terbaru
     */
    @GetMapping("/latest-all")
    public List<SensorReading> getAllLatest() {
        return sensorRepository.findAll(); 
    }

    /**
     * Get riwayat sensor berdasarkan ID Lahan dengan limit 10 entri
     */
    @GetMapping("/history/{lahanId}")
    public ResponseEntity<?> getHistory(@PathVariable Long lahanId) {
        List<SensorReading> readings = sensorRepository.findByLahan_IdLahan(lahanId);
        
        // Batasi hanya 10 entri terbaru
        List<SensorReading> limitedReadings = readings.stream()
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .limit(10)
                .collect(Collectors.toList());

        if (limitedReadings.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "data", limitedReadings,
                    "message", "Tidak ada data sensor untuk lahan ini"
            ));
        }

        return ResponseEntity.ok(Map.of(
                "data", limitedReadings,
                "count", limitedReadings.size()
        ));
    }

    /**
     * Trigger pengambilan data sensor dari XBee
     * Endpoint ini akan mengirim perintah ke Arduino untuk mengambil data sensor
     */
    @PostMapping("/trigger-read")
    public ResponseEntity<?> triggerSensorRead() {
        try {
            // Panggil method triggerManualRead dari XBeeReceiver secara manual
            xbeeReceiver.triggerManualRead();
            
            return ResponseEntity.ok(Map.of(
                    "message", "Perintah pembacaan sensor telah dikirim",
                    "status", "success"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Gagal mengirim perintah pembacaan sensor: " + e.getMessage(),
                    "status", "error"
            ));
        }
    }
}
