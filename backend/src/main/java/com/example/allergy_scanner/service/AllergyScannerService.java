package com.example.allergy_scanner.service;

import com.example.allergy_scanner.dto.FoodAnalysis;
import com.example.allergy_scanner.dto.ScanResult;
import com.example.allergy_scanner.model.ScanHistory;
import com.example.allergy_scanner.model.UserProfile;
import com.example.allergy_scanner.repository.ScanHistoryRepository;
import com.example.allergy_scanner.repository.UserProfileRepository;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AllergyScannerService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .enable(DeserializationFeature.ACCEPT_SINGLE_VALUE_AS_ARRAY);
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();
            
    private final UserProfileRepository userProfileRepository;
    private final ScanHistoryRepository scanHistoryRepository;

    public ScanResult scanMenu(MultipartFile file, String mode, Long userId, String language) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty() || geminiApiKey.equals("YOUR_API_KEY_HERE")) {
            return getMockData(mode, "[Peringatan: API Key Gemini belum dikonfigurasi. Ini adalah data simulasi] ");
        }

        try {
            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
            String mimeType = file.getContentType();
            if (mimeType == null) mimeType = "image/jpeg";
            
            // Get user profile
            UserProfile profile = userProfileRepository.findById(userId).orElse(null);
            String userAllergiesStr = (profile != null && profile.getAllergies() != null && !profile.getAllergies().isEmpty())
                    ? String.join(", ", profile.getAllergies())
                    : "KOSONG (Tidak ada profil spesifik)";

            String prompt = "Anda adalah ahli gizi dan pendeteksi alergi profesional. " +
                    "Saya memberikan gambar berupa " + (mode.equals("food") ? "makanan" : "daftar menu restoran") + ". " +
                    "Terjemahkan teks dan deskripsi risiko ke dalam bahasa: " + language + ".\n\n" +
                    "PROFIL ALERGI PENGGUNA SAAT INI: [" + userAllergiesStr + "].\n\n" +
                    "PERINGATAN KERAS: JANGAN sekadar menyalin seluruh daftar profil alergi pengguna ke hasil deteksi! Anda HARUS menganalisis makanan secara logis dan objektif.\n\n" +
                    "Tugas Anda:\n" +
                    "1. Identifikasi nama makanan di gambar.\n" +
                    "2. Untuk setiap makanan, pikirkan resep dan komposisi bahan-bahannya secara mendalam dan nyata. (Pikirkan juga garnish atau bumbu kaldu, misalnya: sop/soto pasti memakai seledri/celery, kecap memakai kedelai/soy dan gandum/wheat).\n" +
                    "3. Pada field 'containedAllergens', tulis alergen yang BENAR-BENAR MUNGKIN terkandung dalam makanan tersebut. Anda HANYA BOLEH menggunakan keyword baku berikut: [peanut, milk, egg, wheat, soy, fish, shellfish, tree_nut, sesame, celery, mustard, sulfite, lupin, mollusc, coconut, corn, oats, rye, barley, buckwheat, rice, beef, pork, poultry, tomato, potato, garlic, onion, mushroom, banana, avocado, kiwi, strawberry, peach, apple, cocoa, caffeine, alcohol, msg, artificial_colors, artificial_sweeteners, gelatin, seeds, legumes, yeast, histamine].\n" +
                    "4. Pada field 'affectedAllergies':\n" +
                    "   - Jika PROFIL ALERGI PENGGUNA adalah 'KOSONG', salin semua isi 'containedAllergens' ke 'affectedAllergies' sebagai peringatan umum.\n" +
                    "   - Jika TIDAK KOSONG, tulis HANYA alergen dari 'containedAllergens' yang JUGA TERDAPAT di PROFIL ALERGI PENGGUNA.\n" +
                    "5. Atur 'safe' menjadi false HANYA JIKA 'affectedAllergies' TIDAK KOSONG. Jika kosong, atur 'safe' menjadi true.\n" +
                    "6. Kembalikan HASIL HANYA DALAM FORMAT JSON SEPERTI CONTOH BERIKUT TANPA MARKDOWN ATAU TEKS TAMBAHAN:\n" +
                    "{\n" +
                    "  \"textExtracted\": \"Ringkasan teks/nama menu dari gambar...\",\n" +
                    "  \"foods\": [\n" +
                    "    {\n" +
                    "      \"foodName\": \"Nama Makanan\",\n" +
                    "      \"containedAllergens\": [\"peanut\", \"soy\"],\n" +
                    "      \"affectedAllergies\": [\"peanut\"],\n" +
                    "      \"potentialSymptoms\": [\"Gejala klinis spesifik jika tertelan\"],\n" +
                    "      \"safe\": false\n" +
                    "    }\n" +
                    "  ]\n" +
                    "}";

            String jsonPrompt = objectMapper.writeValueAsString(prompt);
            String requestBody = """
                    {
                      "contents": [
                        {
                          "parts": [
                            {"text": %s},
                            {
                              "inline_data": {
                                "mime_type": "%s",
                                "data": "%s"
                              }
                            }
                          ]
                        }
                      ],
                      "generationConfig": {
                         "response_mime_type": "application/json"
                      }
                    }
                    """.formatted(jsonPrompt, mimeType, base64Image);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() != 200) {
                System.err.println("Gemini API Error: " + response.body());
                return getMockData(mode, "[Error API Gemini: " + response.statusCode() + ". Menggunakan data simulasi] ");
            }

            Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            String jsonText = (String) parts.get(0).get("text");

            // Clean up JSON if Gemini returns markdown wrappers
            jsonText = jsonText.replaceAll("(?s)^```json(.*)```$", "$1").trim();

            ScanResult result = objectMapper.readValue(jsonText, ScanResult.class);
            
            // Embed active profile allergies
            result.setActiveProfileAllergies(profile != null && profile.getAllergies() != null ? profile.getAllergies() : new ArrayList<>());
            
            // Re-serialize with embedded profile
            String finalJsonResult = objectMapper.writeValueAsString(result);
            
            // Save to History
            ScanHistory history = new ScanHistory();
            history.setUserId(userId);
            history.setMode(mode);
            history.setJsonResult(finalJsonResult);
            history.setScanDate(LocalDateTime.now());
            scanHistoryRepository.save(history);

            return result;

        } catch (Exception e) {
            e.printStackTrace();
            return getMockData(mode, "[Kesalahan Sistem: " + e.getMessage() + ". Menggunakan data simulasi] ");
        }
    }

    private ScanResult getMockData(String mode, String prefix) {
        // ... omitted mock data creation for brevity ...
        List<FoodAnalysis> analysisList = new ArrayList<>();
        String mockExtractedText = prefix + "\n1. Roti Lapis Selai Kacang\n2. Salad Caesar\n3. Jus Apel";
        FoodAnalysis food1 = new FoodAnalysis("Roti Lapis Selai Kacang", Arrays.asList("Kacang Tanah", "Gluten", "Susu"), Arrays.asList("Alergi Kacang Tanah", "Penyakit Celiac", "Intoleransi Laktosa"), Arrays.asList("Anafilaksis", "Gatal-gatal", "Sakit Perut", "Kembung"), false);
        analysisList.add(food1);
        return new ScanResult(mockExtractedText, analysisList, new ArrayList<>());
    }
}
