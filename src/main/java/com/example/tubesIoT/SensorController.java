package com.example.tubesIoT;

import com.example.tubesIoT.Model.SensorReading;
import com.example.tubesIoT.Repository.SensorReadingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sensors")
@CrossOrigin(origins = "*")
public class SensorController {

    @Autowired
    private SensorReadingRepository sensorRepository;

    @GetMapping("/latest-all")
    public List<SensorReading> getAllLatest() {
        return sensorRepository.findAll(); 
    }

    @GetMapping("/history/{lahanId}")
    public List<SensorReading> getHistory(@PathVariable Long lahanId) {
        // You might need to add a custom query in SensorReadingRepository for this
        return sensorRepository.findAll(); 
    }
}
