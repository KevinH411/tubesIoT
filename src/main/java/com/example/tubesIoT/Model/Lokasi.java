package com.example.tubesIoT.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "lokasi")
@AllArgsConstructor
@NoArgsConstructor
@Data
@ToString(exclude = {"tanah", "sensorReadings"})
public class Lokasi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lokasi")
    private Long idLokasi;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "id_tanah", nullable = false)
    private Tanah tanah;

    @Column(name = "last_update")
    private LocalDateTime lastUpdate;

    @Column(nullable = false)
    private String note;

    @JsonIgnore
    @OneToMany(mappedBy = "lokasi", cascade = CascadeType.ALL)
    private List<SensorReading> sensorReadings;
}
