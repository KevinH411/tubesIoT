package com.example.tubesIoT;

import com.example.tubesIoT.DTO.CreateTanahRequest;
import com.example.tubesIoT.Model.Tanah;
import com.example.tubesIoT.Model.User;
import com.example.tubesIoT.Repository.TanahRepository;
import com.example.tubesIoT.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tanah")
@CrossOrigin(origins = "*")
public class TanahController {

    @Autowired
    private TanahRepository tanahRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get semua tanah, atau filter berdasarkan user_id jika parameter diberikan
     */
    @GetMapping
    public ResponseEntity<List<Tanah>> getAllTanah(@RequestParam(required = false) Long userId) {
        if (userId != null) {
            List<Tanah> tanahList = tanahRepository.findByUserId(userId);
            return ResponseEntity.ok(tanahList);
        }
        List<Tanah> tanahList = tanahRepository.findAll();
        return ResponseEntity.ok(tanahList);
    }

    /**
     * Get tanah by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Tanah> getTanahById(@PathVariable Long id) {
        return tanahRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Create tanah
     */
    @PostMapping
    public ResponseEntity<?> createTanah(@RequestBody CreateTanahRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Tanah tanah = new Tanah();
        tanah.setPemilik(request.getPemilik());
        tanah.setAddress(request.getAddress());

        tanah.getUsers().add(user);
        user.getTanahList().add(tanah);

        tanahRepository.save(tanah);

        return ResponseEntity.ok(tanah);
    }
}
