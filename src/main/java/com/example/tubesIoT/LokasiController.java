package com.example.tubesIoT;

import com.example.tubesIoT.DTO.CreateLokasiRequest;
import com.example.tubesIoT.Model.Lokasi;
import com.example.tubesIoT.Repository.LokasiRepository;
import com.example.tubesIoT.Repository.TanahRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lokasi")
@CrossOrigin(origins = "*")
public class LokasiController {

    @Autowired
    private LokasiRepository lokasiRepository;
    @Autowired
    private TanahRepository tanahRepository;

    /**
     * Get semua lokasi
     */
    @GetMapping
    public ResponseEntity<List<Lokasi>> getAllLokasi() {
        List<Lokasi> lokasiList = lokasiRepository.findAll();
        return ResponseEntity.ok(lokasiList);
    }

    /**
     * Get lokasi by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Lokasi> getLokasiById(@PathVariable Long id) {
        return lokasiRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Get lokasi berdasarkan ID Tanah
     */
    @GetMapping("/by-tanah/{tanahId}")
    public ResponseEntity<List<Lokasi>> getLokasiByTanahId(@PathVariable Long tanahId) {
        List<Lokasi> lokasiList = lokasiRepository.findByTanahIdTanah(tanahId);
        return ResponseEntity.ok(lokasiList);
    }

    /**
     * Create Lokasi
     */
    @PostMapping
    public ResponseEntity<Lokasi> createLokasi(@RequestBody CreateLokasiRequest request) {

        return tanahRepository.findById(request.getIdTanah())
                .map(tanah -> {
                    Lokasi lokasi = new Lokasi();
                    lokasi.setTanah(tanah);
                    lokasi.setNote(request.getNote());

                    Lokasi saved = lokasiRepository.save(lokasi);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.badRequest().build());
    }
}
