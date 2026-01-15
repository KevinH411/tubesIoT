package com.example.tubesIoT;

import com.example.tubesIoT.DTO.CreateLahanRequest;
import com.example.tubesIoT.Model.Lahan;
import com.example.tubesIoT.Repository.LahanRepository;
import com.example.tubesIoT.Repository.TanahRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lahan")
@CrossOrigin(origins = "*")
public class LahanController {

    @Autowired
    private LahanRepository lahanRepository;
    @Autowired
    private TanahRepository tanahRepository;

    /**
     * Get semua lahan
     */
    @GetMapping
    public ResponseEntity<List<Lahan>> getAllLahan() {
        List<Lahan> lahanList = lahanRepository.findAll();
        return ResponseEntity.ok(lahanList);
    }

    /**
     * Get lahan by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Lahan> getLahanById(@PathVariable Long id) {
        return lahanRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Get lahan berdasarkan ID Tanah
     */
    @GetMapping("/by-tanah/{tanahId}")
    public ResponseEntity<List<Lahan>> getLahanByTanahId(@PathVariable Long tanahId) {
        List<Lahan> lahanList = lahanRepository.findByTanahIdTanah(tanahId);
        return ResponseEntity.ok(lahanList);
    }

    /**
     * Create Lahan
     */
    @PostMapping
    public ResponseEntity<Lahan> createLahan(@RequestBody CreateLahanRequest request) {

        return tanahRepository.findById(request.getIdTanah())
                .map(tanah -> {
                    Lahan lahan = new Lahan();
                    lahan.setTanah(tanah);
                    lahan.setNote(request.getNote());

                    Lahan saved = lahanRepository.save(lahan);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.badRequest().build());
    }
}
