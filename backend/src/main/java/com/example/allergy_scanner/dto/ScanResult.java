package com.example.allergy_scanner.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ScanResult {
    private String textExtracted;
    private List<FoodAnalysis> foods;
    private List<String> activeProfileAllergies;
}
