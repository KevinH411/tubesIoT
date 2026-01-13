package com.example.tubesIoT.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "lahan")
@AllArgsConstructor
@NoArgsConstructor
@Data
public class Lahan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lahan")
    private Long idLahan;

    @ManyToOne
    @JoinColumn(name = "id_tanah", nullable = false)
    private Tanah tanah;

    @Column(name = "last_update")
    private LocalDateTime lastUpdate;

    @Column(nullable = false)
    private String note;

    @OneToMany(mappedBy = "lahan", cascade = CascadeType.ALL)
    private List<SensorReading> sensorReadings;
}
