package com.example.tubesIoT;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Locale;
import java.util.Random;

@Component
public class DummyBlynkTester {

    private final RestTemplate restTemplate = new RestTemplate();
    private final Random random = new Random();
    
    // GANTI DENGAN AUTH TOKEN ASLI KAMU
    private final String BLYNK_TOKEN = "1QzHqCb7htY3qhZc-TIgytGRAC-XH93n";

    @Scheduled(fixedDelay = 5000) // Kirim setiap 5 detik
    public void sendDummyData() {
        // Buat data acak
        int soil = random.nextInt(100);        // 0 - 100%
        double temp = 25 + (35 - 25) * random.nextDouble(); // 25.0 - 35.0 C
        double ph = 5.5 + (8.5 - 5.5) * random.nextDouble(); // 5.5 - 8.5
        int lux = random.nextInt(1000);       // 0 - 1000 Lux

        System.out.println("=== MENGIRIM DATA DUMMY KE BLYNK ===");
        System.out.println("Soil: " + soil + " | Temp: " + String.format("%.2f", temp));

        try {
            // Tembak API Blynk untuk masing-masing Pin
            updatePin("V0", String.valueOf(soil));
            updatePin("V3", String.format(Locale.US, "%.2f", temp));
            updatePin("V1", String.format(Locale.US, "%.2f", ph));
            updatePin("V2", String.valueOf(lux));
            
            System.out.println("Status: Berhasil Terkirim!");
        } catch (Exception e) {
            System.err.println("Status: Gagal! Cek Koneksi Internet atau Token.");
        }
    }

    private void updatePin(String pin, String value) {
        String url = "https://sgp1.blynk.cloud/external/api/update?token=" + BLYNK_TOKEN + "&" + pin + "=" + value;
        restTemplate.getForObject(url, String.class);
    }
}