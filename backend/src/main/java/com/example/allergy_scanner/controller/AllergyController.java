package com.example.allergy_scanner.controller;

import com.example.allergy_scanner.dto.ScanResult;
import com.example.allergy_scanner.model.ScanHistory;
import com.example.allergy_scanner.model.UserProfile;
import com.example.allergy_scanner.repository.ScanHistoryRepository;
import com.example.allergy_scanner.repository.UserProfileRepository;
import com.example.allergy_scanner.service.AllergyScannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class AllergyController {

    private final AllergyScannerService scannerService;
    private final UserProfileRepository userProfileRepository;
    private final ScanHistoryRepository scanHistoryRepository;

    // --- Profile Management ---
    @GetMapping("/profile")
    public ResponseEntity<UserProfile> getProfile(@RequestParam(defaultValue = "1") Long userId) {
        return ResponseEntity.ok(userProfileRepository.findById(userId)
                .orElseGet(() -> {
                    UserProfile newProfile = new UserProfile(userId, "Default User", "user@example.com", new ArrayList<>());
                    return userProfileRepository.save(newProfile);
                }));
    }

    @PostMapping("/profile")
    public ResponseEntity<UserProfile> updateProfile(@RequestBody UserProfile updatedProfile) {
        UserProfile profile = userProfileRepository.findById(updatedProfile.getId())
                .orElse(new UserProfile(updatedProfile.getId(), "Default User", "user@example.com", new ArrayList<>()));
        profile.setAllergies(updatedProfile.getAllergies());
        return ResponseEntity.ok(userProfileRepository.save(profile));
    }

    // --- History Management ---
    @GetMapping("/history")
    public ResponseEntity<List<ScanHistory>> getHistory(@RequestParam(defaultValue = "1") Long userId) {
        return ResponseEntity.ok(scanHistoryRepository.findByUserIdOrderByScanDateDesc(userId));
    }

    // --- Scanner ---
    @PostMapping("/scan")
    public ResponseEntity<ScanResult> scanImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mode", defaultValue = "menu") String mode,
            @RequestParam(value = "userId", defaultValue = "1") Long userId,
            @RequestParam(value = "language", defaultValue = "Bahasa Indonesia") String language) {
        
        ScanResult result = scannerService.scanMenu(file, mode, userId, language);
        return ResponseEntity.ok(result);
    }
}
