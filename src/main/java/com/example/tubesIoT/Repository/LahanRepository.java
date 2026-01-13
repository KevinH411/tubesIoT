package com.example.tubesIoT.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.tubesIoT.Model.Lahan;

@Repository
public interface LahanRepository extends JpaRepository<Lahan, Long>{
    
}
