package com.example.tubesIoT.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.tubesIoT.Model.SensorData;

@Repository
public interface SensorDataRepository extends JpaRepository<SensorData, Long> {
}