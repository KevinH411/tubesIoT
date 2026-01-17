package com.example.tubesIoT.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_readings")
@AllArgsConstructor
@NoArgsConstructor
@Data
@ToString(exclude = "lahan")
public class SensorReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
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
