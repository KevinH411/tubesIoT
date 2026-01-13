package com.example.tubesIoT.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_readings")
@AllArgsConstructor
@NoArgsConstructor
@Data
public class SensorReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "id_lahan", nullable = false)
    private Lahan lahan;

    @Column(nullable = false)
    private Integer soilMoisture;

    @Column(nullable = false)
    private Double temperature;

    @Column(nullable = false)
    private Double ph;

    @Column(nullable = false)
    private Double light;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;
}
