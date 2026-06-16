const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Set up Multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Helper for Mock Data
const getMockData = (mode, prefix) => {
  return {
    textExtracted: `${prefix}\n1. Roti Lapis Selai Kacang\n2. Salad Caesar\n3. Jus Apel`,
    foods: [
      {
        foodName: "Roti Lapis Selai Kacang",
        containedAllergens: ["Kacang Tanah", "Gluten", "Susu"],
        affectedAllergies: ["Alergi Kacang Tanah", "Penyakit Celiac", "Intoleransi Laktosa"],
        potentialSymptoms: ["Anafilaksis", "Gatal-gatal", "Sakit Perut", "Kembung"],
        safe: false
      }
    ],
    activeProfileAllergies: []
  };
};

// --- Profile Management ---
app.get('/api/profile', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId || "1", 10);
    let profile = await prisma.userProfile.findUnique({
      where: { id: userId }
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          id: userId,
          username: "Default User",
          email: "user@example.com",
          allergies: JSON.stringify([])
        }
      });
    }

    // Parse allergies back to array
    profile.allergies = JSON.parse(profile.allergies);
    res.json(profile);
  } catch (error) {
    console.error("Profile GET Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const { id, username, email, allergies } = req.body;
    const userId = parseInt(id || "1", 10);
    
    let profile = await prisma.userProfile.findUnique({
      where: { id: userId }
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          id: userId,
          username: username || "Default User",
          email: email || "user@example.com",
          allergies: JSON.stringify(allergies || [])
        }
      });
    } else {
      profile = await prisma.userProfile.update({
        where: { id: userId },
        data: {
          allergies: JSON.stringify(allergies || [])
        }
      });
    }

    profile.allergies = JSON.parse(profile.allergies);
    res.json(profile);
  } catch (error) {
    console.error("Profile POST Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- History Management ---
app.get('/api/history', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId || "1", 10);
    const history = await prisma.scanHistory.findMany({
      where: { userId },
      orderBy: { scanDate: 'desc' }
    });
    res.json(history);
  } catch (error) {
    console.error("History GET Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Scanner ---
app.post('/api/scan', upload.single('file'), async (req, res) => {
  try {
    const mode = req.body.mode || "menu";
    const userId = parseInt(req.body.userId || "1", 10);
    const language = req.body.language || "Bahasa Indonesia";
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey || geminiApiKey.trim() === "" || geminiApiKey === "YOUR_GEMINI_API_KEY_HERE") {
      const mockResult = getMockData(mode, "[Peringatan: API Key Gemini belum dikonfigurasi. Ini adalah data simulasi] ");
      return res.json(mockResult);
    }

    const base64Image = file.buffer.toString('base64');
    let mimeType = file.mimetype || "image/jpeg";

    // Get user profile
    let profile = await prisma.userProfile.findUnique({
      where: { id: userId }
    });
    
    let allergiesList = [];
    if (profile && profile.allergies) {
      allergiesList = JSON.parse(profile.allergies);
    }

    const userAllergiesStr = allergiesList.length > 0 
      ? allergiesList.join(", ") 
      : "KOSONG (Tidak ada profil spesifik)";

    const prompt = `Anda adalah ahli gizi dan pendeteksi alergi profesional. ` +
      `Saya memberikan gambar berupa ${mode === 'food' ? 'makanan' : 'daftar menu restoran'}. ` +
      `Terjemahkan teks dan deskripsi risiko ke dalam bahasa: ${language}.\n\n` +
      `PROFIL ALERGI PENGGUNA SAAT INI: [${userAllergiesStr}].\n\n` +
      `PERINGATAN KERAS: JANGAN sekadar menyalin seluruh daftar profil alergi pengguna ke hasil deteksi! Anda HARUS menganalisis makanan secara logis dan objektif.\n\n` +
      `Tugas Anda:\n` +
      `1. Identifikasi nama makanan di gambar.\n` +
      `2. Untuk setiap makanan, pikirkan resep dan komposisi bahan-bahannya secara mendalam dan nyata. (Pikirkan juga garnish atau bumbu kaldu, misalnya: sop/soto pasti memakai seledri/celery, kecap memakai kedelai/soy dan gandum/wheat).\n` +
      `3. Pada field 'containedAllergens', tulis alergen yang BENAR-BENAR MUNGKIN terkandung dalam makanan tersebut. Anda HANYA BOLEH menggunakan keyword baku berikut: [peanut, milk, egg, wheat, soy, fish, shellfish, tree_nut, sesame, celery, mustard, sulfite, lupin, mollusc, coconut, corn, oats, rye, barley, buckwheat, rice, beef, pork, poultry, tomato, potato, garlic, onion, mushroom, banana, avocado, kiwi, strawberry, peach, apple, cocoa, caffeine, alcohol, msg, artificial_colors, artificial_sweeteners, gelatin, seeds, legumes, yeast, histamine].\n` +
      `4. Pada field 'affectedAllergies':\n` +
      `   - Jika PROFIL ALERGI PENGGUNA adalah 'KOSONG', isi array ini dengan SATU kalimat: "Peringatan Umum: Tidak cocok dikonsumsi untuk orang yang alergi terhadap bahan makanan di atas."\n` +
      `   - Jika TIDAK KOSONG, tulis HANYA alergen dari 'containedAllergens' yang JUGA TERDAPAT di PROFIL ALERGI PENGGUNA.\n` +
      `5. Atur 'safe' menjadi false HANYA JIKA 'affectedAllergies' TIDAK KOSONG. Jika kosong, atur 'safe' menjadi true.\n` +
      `6. Kembalikan HASIL HANYA DALAM FORMAT JSON SEPERTI CONTOH BERIKUT TANPA MARKDOWN ATAU TEKS TAMBAHAN:\n` +
      `{\n` +
      `  "textExtracted": "Ringkasan teks/nama menu dari gambar...",\n` +
      `  "foods": [\n` +
      `    {\n` +
      `      "foodName": "Nama Makanan",\n` +
      `      "containedAllergens": ["peanut", "soy"],\n` +
      `      "affectedAllergies": ["peanut"],\n` +
      `      "potentialSymptoms": ["Gejala klinis spesifik jika tertelan"],\n` +
      `      "safe": false\n` +
      `    }\n` +
      `  ]\n` +
      `}`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        response_mime_type: "application/json"
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return res.json(getMockData(mode, `[Error API Gemini: ${response.status}. Menggunakan data simulasi] `));
    }

    const responseData = await response.json();
    const candidates = responseData.candidates;
    if (!candidates || candidates.length === 0) {
        throw new Error("No candidates returned from Gemini");
    }
    
    let jsonText = candidates[0].content.parts[0].text;

    // Clean up JSON if Gemini returns markdown wrappers
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

    let result = JSON.parse(jsonText);
    
    // Embed active profile allergies
    result.activeProfileAllergies = allergiesList;
    
    // Save to History
    await prisma.scanHistory.create({
      data: {
        userId,
        mode,
        jsonResult: JSON.stringify(result)
      }
    });

    res.json(result);

  } catch (error) {
    console.error("Scan Error:", error);
    res.json(getMockData(req.body.mode || "menu", `[Kesalahan Sistem: ${error.message}. Menggunakan data simulasi] `));
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
