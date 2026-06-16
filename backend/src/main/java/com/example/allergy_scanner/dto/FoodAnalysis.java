package com.example.allergy_scanner.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FoodAnalysis {
    private String foodName;
    private List<String> containedAllergens;
    private List<String> affectedAllergies;
    private List<String> potentialSymptoms;
    private boolean isSafe;
}
