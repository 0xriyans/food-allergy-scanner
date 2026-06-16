import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Camera, User, Clock, FileText, Utensils, Volume2, Download } from 'lucide-react';
import Swal from 'sweetalert2';
import './index.css';

const ALLERGY_KEYS = [
  'peanut', 'milk', 'egg', 'wheat', 'soy', 'fish', 'shellfish', 'tree_nut',
  'sesame', 'celery', 'mustard', 'sulfite', 'lupin', 'mollusc',
  'coconut', 'corn', 'oats', 'rye', 'barley', 'buckwheat', 'rice',
  'beef', 'pork', 'poultry', 'tomato', 'potato', 'garlic', 'onion', 'mushroom',
  'banana', 'avocado', 'kiwi', 'strawberry', 'peach', 'apple',
  'cocoa', 'caffeine', 'alcohol', 'msg', 'artificial_colors', 'artificial_sweeteners',
  'gelatin', 'seeds', 'legumes', 'yeast', 'histamine'
];

const UI_TEXT = {
  'Bahasa Indonesia': {
    title: 'Pemindai Alergi',
    subtitle: 'Pendeteksi Alergen Pintar AI',
    tabScanner: '📷 Pemindai',
    tabProfile: '👤 Profil Saya',
    tabHistory: '🕒 Riwayat',
    scanMenu: '📄 Pindai Menu',
    scanFood: '🍔 Pindai Makanan',
    translateTo: 'Terjemahkan ke: ',
    uploadHint: 'Ketuk untuk mengunggah gambar',
    btnChange: 'Ganti Gambar',
    btnSelect: 'Galeri',
    btnCamera: 'Kamera',
    btnScan: 'Mulai Pemindaian',
    btnScanning: 'Menganalisis...',
    profileTitle: 'Profil Alergi Saya',
    profileDesc: 'Tandai bahan makanan yang harus Anda hindari. AI akan menyesuaikan peringatan untuk Anda.',
    btnSave: 'Simpan Profil',
    historyTitle: 'Riwayat Pemindaian',
    historyEmpty: 'Belum ada riwayat pemindaian.',
    activeProfile: 'Profil Alergi Aktif:',
    summaryTitle: 'Ringkasan Analisis',
    detectedText: 'Teks Terdeteksi:',
    detectionResult: 'Hasil Deteksi',
    safeBadge: 'AMAN UNTUK ANDA',
    warningBadge: 'PERINGATAN',
    safeDesc: 'Tidak mengandung alergen dari profil Anda.',
    detectedAllergens: 'Alergen Terdeteksi:',
    affectedAllergies: 'Berdampak pada Alergi:',
    potentialRisks: 'Potensi Risiko:',
    emptyProfileBannerBold: 'Profil Kosong.',
    emptyProfileBannerText: 'Harap isi profil alergi Anda!',
    selectAll: 'Pilih Semua',
    deselectAll: 'Hapus Semua',
    ALLERGIES: {
      peanut: 'Alergi Kacang Tanah', milk: 'Alergi Susu (Laktosa)', egg: 'Alergi Telur', wheat: 'Alergi Gandum (Gluten)',
      soy: 'Alergi Kedelai', fish: 'Alergi Ikan', shellfish: 'Alergi Kerang/Udang', tree_nut: 'Alergi Kacang Pohon',
      sesame: 'Alergi Wijen', celery: 'Alergi Seledri', mustard: 'Alergi Mustar', sulfite: 'Alergi Sulfit',
      lupin: 'Alergi Lupin', mollusc: 'Alergi Moluska',
      coconut: 'Alergi Kelapa', corn: 'Alergi Jagung', oats: 'Alergi Oat/Gandum',
      rye: 'Alergi Gandum Hitam (Rye)', barley: 'Alergi Barley', buckwheat: 'Alergi Soba (Buckwheat)',
      rice: 'Alergi Beras', beef: 'Alergi Daging Sapi (Alpha-Gal)', pork: 'Alergi Daging Babi',
      poultry: 'Alergi Daging Unggas', tomato: 'Alergi Tomat', potato: 'Alergi Kentang',
      garlic: 'Alergi Bawang Putih', onion: 'Alergi Bawang Merah/Bombay', mushroom: 'Alergi Jamur',
      banana: 'Alergi Pisang', avocado: 'Alergi Alpukat', kiwi: 'Alergi Kiwi',
      strawberry: 'Alergi Stroberi', peach: 'Alergi Persik', apple: 'Alergi Apel',
      cocoa: 'Alergi Kakao/Cokelat', caffeine: 'Sensitivitas Kafein', alcohol: 'Intoleransi Alkohol',
      msg: 'Intoleransi MSG (Micin)', artificial_colors: 'Pewarna Buatan',
      artificial_sweeteners: 'Pemanis Buatan', gelatin: 'Alergi Gelatin',
      seeds: 'Biji-bijian Lain (Bunga Matahari/Poppy)', legumes: 'Kacang Lainnya (Lentil/Ercis)',
      yeast: 'Alergi Ragi (Yeast)', histamine: 'Intoleransi Histamin'
    },
    swal: {
      noImageTitle: 'Oops...', noImageText: 'Silakan pilih gambar terlebih dahulu.',
      emptyProfileTitle: 'Profil Kosong!',
      emptyProfileText: 'Sistem tidak bisa memberikan peringatan personal jika Anda tidak memilih alergi. Ingin mengisi profil sekarang?',
      btnFillProfile: 'Ya, Isi Profil', btnScanGeneral: 'Lanjut Scan Umum',
      serverErrorTitle: 'Kesalahan Server', serverErrorText: 'Terjadi kesalahan saat menghubungi server.',
      saveSuccessTitle: 'Berhasil!', saveSuccessText: 'Profil alergi berhasil disimpan!',
      saveErrorTitle: 'Gagal!', saveErrorText: 'Terjadi kesalahan saat menyimpan profil.',
      noTtsTitle: 'Maaf', noTtsText: 'Browser Anda tidak mendukung fitur Text-to-Speech.'
    }
  },
  'English': {
    title: 'Allergy Scanner',
    subtitle: 'AI Smart Allergen Detector',
    tabScanner: '📷 Scanner',
    tabProfile: '👤 My Profile',
    tabHistory: '🕒 History',
    scanMenu: '📄 Scan Menu',
    scanFood: '🍔 Scan Food',
    translateTo: 'Translate to: ',
    uploadHint: 'Tap to upload image',
    btnChange: 'Change Image',
    btnSelect: 'Gallery',
    btnCamera: 'Camera',
    btnScan: 'Start Scan',
    btnScanning: 'Analyzing...',
    profileTitle: 'My Allergy Profile',
    profileDesc: 'Mark the ingredients you must avoid. AI will customize the warnings for you.',
    btnSave: 'Save Profile',
    historyTitle: 'Scan History',
    historyEmpty: 'No scan history yet.',
    activeProfile: 'Active Allergy Profile:',
    summaryTitle: 'Analysis Summary',
    detectedText: 'Detected Text:',
    detectionResult: 'Detection Result',
    safeBadge: 'SAFE FOR YOU',
    warningBadge: 'WARNING',
    safeDesc: 'Does not contain allergens from your profile.',
    detectedAllergens: 'Detected Allergens:',
    affectedAllergies: 'Affected Allergies:',
    potentialRisks: 'Potential Risks:',
    emptyProfileBannerBold: 'Empty Profile.',
    emptyProfileBannerText: 'Please fill in your allergy profile!',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    ALLERGIES: {
      peanut: 'Peanut Allergy', milk: 'Milk Allergy (Lactose)', egg: 'Egg Allergy', wheat: 'Wheat Allergy (Gluten)',
      soy: 'Soy Allergy', fish: 'Fish Allergy', shellfish: 'Shellfish Allergy', tree_nut: 'Tree Nut Allergy',
      sesame: 'Sesame Allergy', celery: 'Celery Allergy', mustard: 'Mustard Allergy', sulfite: 'Sulfite Allergy',
      lupin: 'Lupin Allergy', mollusc: 'Mollusc Allergy',
      coconut: 'Coconut Allergy', corn: 'Corn Allergy', oats: 'Oats Allergy',
      rye: 'Rye Allergy', barley: 'Barley Allergy', buckwheat: 'Buckwheat Allergy',
      rice: 'Rice Allergy', beef: 'Beef/Red Meat (Alpha-Gal)', pork: 'Pork Allergy',
      poultry: 'Poultry Allergy', tomato: 'Tomato Allergy', potato: 'Potato Allergy',
      garlic: 'Garlic Allergy', onion: 'Onion Allergy', mushroom: 'Mushroom Allergy',
      banana: 'Banana Allergy', avocado: 'Avocado Allergy', kiwi: 'Kiwi Allergy',
      strawberry: 'Strawberry Allergy', peach: 'Peach Allergy', apple: 'Apple Allergy',
      cocoa: 'Cocoa/Chocolate', caffeine: 'Caffeine Sensitivity', alcohol: 'Alcohol Intolerance',
      msg: 'MSG Intolerance', artificial_colors: 'Artificial Colors',
      artificial_sweeteners: 'Artificial Sweeteners', gelatin: 'Gelatin Allergy',
      seeds: 'Other Seeds (Sunflower/Poppy)', legumes: 'Other Legumes (Lentils/Peas)',
      yeast: 'Yeast Allergy', histamine: 'Histamine Intolerance'
    },
    swal: {
      noImageTitle: 'Oops...', noImageText: 'Please select an image first.',
      emptyProfileTitle: 'Empty Profile!',
      emptyProfileText: 'The system cannot provide personalized warnings if you do not select any allergies. Do you want to fill out your profile now?',
      btnFillProfile: 'Yes, Fill Profile', btnScanGeneral: 'Continue General Scan',
      serverErrorTitle: 'Server Error', serverErrorText: 'An error occurred while contacting the server.',
      saveSuccessTitle: 'Success!', saveSuccessText: 'Allergy profile saved successfully!',
      saveErrorTitle: 'Failed!', saveErrorText: 'An error occurred while saving the profile.',
      noTtsTitle: 'Sorry', noTtsText: 'Your browser does not support Text-to-Speech.'
    }
  },
  '日本語 (Japanese)': {
    title: 'アレルギースキャナー',
    subtitle: 'AI スマートアレルゲン検出器',
    tabScanner: '📷 スキャナー',
    tabProfile: '👤 プロフィール',
    tabHistory: '🕒 履歴',
    scanMenu: '📄 メニューをスキャン',
    scanFood: '🍔 食べ物をスキャン',
    translateTo: '翻訳先：',
    uploadHint: 'タップして画像をアップロード',
    btnChange: '画像を変更',
    btnSelect: 'ギャラリー',
    btnCamera: 'カメラ',
    btnScan: 'スキャン開始',
    btnScanning: '分析中...',
    profileTitle: 'マイアレルギープロフィール',
    profileDesc: '避けるべき食材をマークしてください。AIが警告をカスタマイズします。',
    btnSave: '保存する',
    historyTitle: 'スキャン履歴',
    historyEmpty: 'スキャン履歴はまだありません。',
    activeProfile: 'アクティブなアレルギープロファイル:',
    summaryTitle: '分析の概要',
    detectedText: '検出されたテキスト:',
    detectionResult: '検出結果',
    safeBadge: '安全',
    warningBadge: '警告',
    safeDesc: 'プロフィールのアレルゲンは含まれていません。',
    detectedAllergens: '検出されたアレルゲン:',
    affectedAllergies: '影響を受けるアレルギー:',
    potentialRisks: '潜在的なリスク:',
    emptyProfileBannerBold: '空のプロフィール。',
    emptyProfileBannerText: 'アレルギーのプロフィールを入力してください！',
    selectAll: 'すべて選択',
    deselectAll: 'すべて選択解除',
    ALLERGIES: {
      peanut: 'ピーナッツアレルギー', milk: '牛乳アレルギー', egg: '卵アレルギー', wheat: '小麦アレルギー',
      soy: '大豆アレルギー', fish: '魚アレルギー', shellfish: '甲殻類アレルギー', tree_nut: '木の実アレルギー',
      sesame: 'ゴマアレルギー', celery: 'セロリアレルギー', mustard: 'マスタードアレルギー', sulfite: '亜硫酸塩アレルギー',
      lupin: 'ルパンアレルギー', mollusc: '軟体動物アレルギー',
      coconut: 'ココナッツアレルギー', corn: 'トウモロコシアレルギー', oats: 'オーツ麦アレルギー',
      rye: 'ライ麦アレルギー', barley: '大麦アレルギー', buckwheat: 'そばアレルギー',
      rice: '米アレルギー', beef: '牛肉アレルギー (Alpha-Gal)', pork: '豚肉アレルギー',
      poultry: '家禽アレルギー', tomato: 'トマトアレルギー', potato: 'ジャガイモアレルギー',
      garlic: 'ニンニクアレルギー', onion: '玉ねぎアレルギー', mushroom: 'キノコアレルギー',
      banana: 'バナナアレルギー', avocado: 'アボカドアレルギー', kiwi: 'キウイアレルギー',
      strawberry: 'イチゴアレルギー', peach: '桃アレルギー', apple: 'リンゴアレルギー',
      cocoa: 'カカオ/チョコレートアレルギー', caffeine: 'カフェイン過敏症', alcohol: 'アルコール不耐症',
      msg: 'MSG不耐症', artificial_colors: '人工着色料',
      artificial_sweeteners: '人工甘味料', gelatin: 'ゼラチンアレルギー',
      seeds: 'その他の種子 (ヒマワリ/ケシ)', legumes: 'その他のマメ科 (レンズ豆/エンドウ豆)',
      yeast: 'イーストアレルギー', histamine: 'ヒスタミン不耐症'
    },
    swal: {
      noImageTitle: 'おっと...', noImageText: 'まず画像を選択してください。',
      emptyProfileTitle: '空のプロフィール！',
      emptyProfileText: 'アレルギーを選択しないと、システムはパーソナライズされた警告を提供できません。今すぐプロフィールを入力しますか？',
      btnFillProfile: 'はい、入力します', btnScanGeneral: '一般スキャンを続ける',
      serverErrorTitle: 'サーバーエラー', serverErrorText: 'サーバーとの通信中にエラーが発生しました。',
      saveSuccessTitle: '成功！', saveSuccessText: 'アレルギープロフィールを保存しました！',
      saveErrorTitle: '失敗！', saveErrorText: 'プロフィールの保存中にエラーが発生しました。',
      noTtsTitle: 'ごめんなさい', noTtsText: 'お使いのブラウザは音声合成をサポートしていません。'
    }
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner', 'profile', 'history'
  
  // Profile State
  const [userAllergies, setUserAllergies] = useState([]);
  
  // Scanner State
  const [scanMode, setScanMode] = useState('menu');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('Bahasa Indonesia');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const resultRef = useRef(null);

  // History State
  const [histories, setHistories] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchHistory();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/profile?userId=1');
      const data = await res.json();
      
      // Migrate old string values to keys if necessary
      const reverseMap = {
        'Alergi Kacang Tanah': 'peanut', 'Peanut Allergy': 'peanut', 'ピーナッツアレルギー': 'peanut',
        'Alergi Susu (Laktosa)': 'milk', 'Milk Allergy (Lactose)': 'milk', '牛乳アレルギー': 'milk',
        'Alergi Telur': 'egg', 'Egg Allergy': 'egg', '卵アレルギー': 'egg',
        'Alergi Gandum (Gluten)': 'wheat', 'Wheat Allergy (Gluten)': 'wheat', '小麦アレルギー': 'wheat',
        'Alergi Kedelai': 'soy', 'Soy Allergy': 'soy', '大豆アレルギー': 'soy',
        'Alergi Ikan': 'fish', 'Fish Allergy': 'fish', '魚アレルギー': 'fish',
        'Alergi Kerang/Udang': 'shellfish', 'Shellfish Allergy': 'shellfish', '甲殻類アレルギー': 'shellfish',
        'Alergi Kacang Pohon': 'tree_nut', 'Tree Nut Allergy': 'tree_nut', '木の実アレルギー': 'tree_nut'
      };
      
      const migratedAllergies = (data.allergies || []).map(a => reverseMap[a] || a);
      setUserAllergies(migratedAllergies);
    } catch (err) {
      console.error('Failed to load profile', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/history?userId=1');
      const data = await res.json();
      setHistories(data);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const saveProfile = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1, allergies: userAllergies })
      });
      const t = UI_TEXT[language] || UI_TEXT['Bahasa Indonesia'];
      if (res.ok) Swal.fire({title: t.swal.saveSuccessTitle, text: t.swal.saveSuccessText, icon: 'success', customClass: {popup: 'glass-swal'}, background: 'transparent'});
    } catch (err) {
      const t = UI_TEXT[language] || UI_TEXT['Bahasa Indonesia'];
      Swal.fire({title: t.swal.saveErrorTitle, text: t.swal.saveErrorText, icon: 'error', customClass: {popup: 'glass-swal'}, background: 'transparent'});
    }
  };

  const handleSelectAll = () => {
    setUserAllergies([...ALLERGY_KEYS]);
  };

  const handleDeselectAll = () => {
    setUserAllergies([]);
  };

  const toggleAllergy = (allergy) => {
    if (userAllergies.includes(allergy)) {
      setUserAllergies(userAllergies.filter(a => a !== allergy));
    } else {
      setUserAllergies([...userAllergies, allergy]);
    }
  };

  const handleModeChange = (newMode) => {
    setScanMode(newMode);
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleScan = async () => {
    const t = UI_TEXT[language] || UI_TEXT['Bahasa Indonesia'];
    if (!file) {
      Swal.fire({title: t.swal.noImageTitle, text: t.swal.noImageText, icon: 'warning', customClass: {popup: 'glass-swal'}, background: 'transparent'});
      return;
    }
    
    if (userAllergies.length === 0) {
      const result = await Swal.fire({
        title: t.swal.emptyProfileTitle,
        text: t.swal.emptyProfileText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4facfe',
        cancelButtonColor: '#f56565',
        confirmButtonText: t.swal.btnFillProfile,
        cancelButtonText: t.swal.btnScanGeneral,
        customClass: {popup: 'glass-swal'},
        background: 'transparent'
      });

      if (result.isConfirmed) {
        setActiveTab('profile');
        return;
      }
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', scanMode);
      formData.append('userId', 1);
      formData.append('language', language);

      const scanRes = await fetch(`http://localhost:8080/api/scan`, {
        method: 'POST',
        body: formData
      });

      const scanData = await scanRes.json();
      setResult(scanData);
      setLoading(false);
      fetchHistory(); // Refresh history
    } catch (error) {
      const t = UI_TEXT[language] || UI_TEXT['Bahasa Indonesia'];
      console.error(error);
      Swal.fire({title: t.swal.serverErrorTitle, text: t.swal.serverErrorText, icon: 'error', customClass: {popup: 'glass-swal'}, background: 'transparent'});
      setLoading(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'English' ? 'en-US' : 'id-ID';
      window.speechSynthesis.speak(utterance);
    } else {
      const t = UI_TEXT[language] || UI_TEXT['Bahasa Indonesia'];
      Swal.fire({title: t.swal.noTtsTitle, text: t.swal.noTtsText, icon: 'info', customClass: {popup: 'glass-swal'}, background: 'transparent'});
    }
  };

  const speakResult = () => {
    if (!result) return;
    let text = 'Hasil deteksi: ';
    result.foods.forEach(food => {
      text += `${food.foodName}. `;
      if (food.safe) {
        text += 'Aman untuk Anda. ';
      } else {
        text += `Peringatan! Mengandung ${food.containedAllergens.join(', ')}. `;
      }
    });
    speakText(text);
  };

  const downloadPDF = async () => {
    if (!resultRef.current) return;
    const canvas = await html2canvas(resultRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('Hasil_Deteksi_Alergi.pdf');
  };

  const viewHistory = (historyRecord) => {
    const data = JSON.parse(historyRecord.jsonResult);
    setResult(data);
    setActiveTab('scanner');
    setTimeout(() => {
      if (resultRef.current) resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatAllergen = (allergen, textDict) => {
    if (textDict.ALLERGIES[allergen]) {
      return textDict.ALLERGIES[allergen].replace('Alergi ', '').replace(' Allergy', '').replace('アレルギー', '');
    }
    // Handle cases where Gemini might pluralize or modify the key
    const foundKey = Object.keys(textDict.ALLERGIES).find(k => allergen.toLowerCase().includes(k));
    if (foundKey) {
      return textDict.ALLERGIES[foundKey].replace('Alergi ', '').replace(' Allergy', '').replace('アレルギー', '');
    }
    return allergen;
  };

  const t = UI_TEXT[language] || UI_TEXT['Bahasa Indonesia'];

  return (
    <div className="app-container">
      <div className="header">
        <div className="header-content">
          <div>
            <h1>{t.title}</h1>
            <p className="subtitle">{t.subtitle}</p>
          </div>
          <div className="language-selector header-lang" style={{ display: 'flex', gap: '10px' }}>
            <img 
              src="https://flagcdn.com/w80/id.png" 
              alt="Bahasa Indonesia" 
              className={`flag-icon ${language === 'Bahasa Indonesia' ? 'active' : ''}`}
              onClick={() => setLanguage('Bahasa Indonesia')}
              title="Bahasa Indonesia"
            />
            <img 
              src="https://flagcdn.com/w80/us.png" 
              alt="English" 
              className={`flag-icon ${language === 'English' ? 'active' : ''}`}
              onClick={() => setLanguage('English')}
              title="English"
            />
            <img 
              src="https://flagcdn.com/w80/jp.png" 
              alt="日本語" 
              className={`flag-icon ${language === '日本語 (Japanese)' ? 'active' : ''}`}
              onClick={() => setLanguage('日本語 (Japanese)')}
              title="日本語"
            />
          </div>
        </div>
      </div>

      <div className="nav-tabs glass-panel">
        <button className={`nav-tab ${activeTab === 'scanner' ? 'active' : ''}`} onClick={() => setActiveTab('scanner')}>
          <Camera size={18} /> {t.tabScanner.replace('📷 ', '')}
        </button>
        <button className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={18} /> {t.tabProfile.replace('👤 ', '')}
        </button>
        <button className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <Clock size={18} /> {t.tabHistory.replace('🕒 ', '')}
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="glass-panel slide-in profile-container">
          <h2>{t.profileTitle}</h2>
          <p>{t.profileDesc}</p>
          
          <div className="profile-actions-row">
            <button className="btn-secondary small-btn" onClick={handleSelectAll}>✓ {t.selectAll}</button>
            <button className="btn-secondary small-btn" style={{backgroundColor: 'rgba(255,100,100,0.1)', color: '#e53e3e'}} onClick={handleDeselectAll}>✗ {t.deselectAll}</button>
          </div>

          <div className="allergy-grid">
            {ALLERGY_KEYS.map(key => (
              <label key={key} className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={userAllergies.includes(key)} 
                  onChange={() => toggleAllergy(key)} 
                />
                {t.ALLERGIES[key]}
              </label>
            ))}
          </div>
          <button className="btn-primary" onClick={saveProfile} style={{marginTop: '20px'}}>{t.btnSave}</button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="glass-panel slide-in history-container">
          <h2>{t.historyTitle}</h2>
          {histories.length === 0 ? <p>{t.historyEmpty}</p> : (
            <div className="history-list">
              {histories.map(h => {
                const data = JSON.parse(h.jsonResult);
                return (
                  <div key={h.id} className="history-card glass-panel" onClick={() => viewHistory(h)} style={{cursor: 'pointer'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <p className="history-date">{new Date(h.scanDate).toLocaleString()}</p>
                        <p><strong>Mode:</strong> {h.mode === 'menu' ? t.scanMenu.replace('📄 ', '') : t.scanFood.replace('🍔 ', '')}</p>
                        <p className="history-summary">{data.foods?.length} items detected.</p>
                        {data.activeProfileAllergies && data.activeProfileAllergies.length > 0 && (
                          <div className="active-allergy-tags" style={{marginTop: '12px', gap: '4px'}}>
                            {data.activeProfileAllergies.map(key => (
                              <span key={key} className="allergy-tag" style={{fontSize: '10px', padding: '2px 8px'}}>
                                {(t.ALLERGIES[key] || key).replace('Alergi ', '').replace(' Allergy', '')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{color: 'var(--primary-color)'}}>
                        <FileText size={24} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'scanner' && (
        <div className="slide-in">
          {userAllergies.length > 0 ? (
            <div className="glass-panel active-profile-banner">
              <div className="profile-banner-header">
                <User size={16} /> <strong>{t.activeProfile}</strong>
              </div>
              <div className="active-allergy-tags">
                {userAllergies.map(key => (
                  <span key={key} className="allergy-tag">
                    {(t.ALLERGIES[key] || key).replace('Alergi ', '').replace(' Allergy', '')}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-panel active-profile-banner" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', borderLeft: '4px solid red' }}>
              <div className="profile-banner-header">
                <span style={{color: 'red', fontSize: '14px'}}>
                  ⚠️ <strong>{t.emptyProfileBannerBold}</strong> {t.emptyProfileBannerText}
                </span>
              </div>
            </div>
          )}

          <div className="mode-selector glass-panel">
            <button className={`mode-btn ${scanMode === 'menu' ? 'active' : ''}`} onClick={() => handleModeChange('menu')}>
              <FileText size={18} className="icon" /> {t.scanMenu.replace('📄 ', '')}
            </button>
            <button className={`mode-btn ${scanMode === 'food' ? 'active' : ''}`} onClick={() => handleModeChange('food')}>
              <Utensils size={18} className="icon" /> {t.scanFood.replace('🍔 ', '')}
            </button>
          </div>

          <div className="scanner-container glass-panel">
            <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} ref={cameraInputRef} style={{ display: 'none' }} />
            
            {preview ? (
              <div className="preview-box">
                <img src={preview} alt="Upload preview" className="preview-img" />
                {loading && <div className="laser-scanner"></div>}
              </div>
            ) : (
              <div className="upload-placeholder" onClick={() => { fileInputRef.current.value = null; fileInputRef.current.click(); }}>
                <div className="upload-icon"><Camera size={48} color="#a0aec0" /></div><p>{t.uploadHint}</p>
              </div>
            )}
            
            <div className="action-row">
               {!preview ? (
                 <>
                   <button className="btn-secondary" onClick={() => { fileInputRef.current.value = null; fileInputRef.current.click(); }}>
                     {t.btnSelect}
                   </button>
                   <button className="btn-secondary" onClick={() => { cameraInputRef.current.value = null; cameraInputRef.current.click(); }}>
                     <Camera size={18} style={{marginRight: '6px', verticalAlign: 'middle'}}/> {t.btnCamera}
                   </button>
                 </>
               ) : (
                 <button className="btn-secondary" onClick={() => { fileInputRef.current.value = null; fileInputRef.current.click(); }}>
                   {t.btnChange}
                 </button>
               )}
               <button className={`btn-primary ${loading ? 'scanning' : ''}`} onClick={handleScan} disabled={loading || !preview} style={{flex: 1}}>
                 {loading ? t.btnScanning : t.btnScan}
               </button>
            </div>
          </div>

          {result && (
            <div className="result-container fade-in" ref={resultRef} style={{marginTop: '32px'}}>
              <div className="glass-panel text-panel" style={{marginBottom: '24px'}}>
                <div className="result-header-row">
                   <h2>{t.summaryTitle}</h2>
                   <div className="result-actions">
                     <button className="btn-icon" onClick={speakResult} title="Speak"><Volume2 size={20} /></button>
                     <button className="btn-icon" onClick={downloadPDF} title="Download PDF"><Download size={20} /></button>
                   </div>
                </div>
                <div className="extracted-text">
                  <strong>{t.detectedText}</strong><br/>
                  {result.textExtracted.split('\n').map((line, i) => <div key={i} className="code-line">{line}</div>)}
                </div>
              </div>

              <h3 className="section-title">{t.detectionResult}</h3>
              <div className="food-list">
                {result.foods.map((food, idx) => (
                  <div key={idx} className={`glass-panel food-card ${food.safe ? 'safe-card' : 'danger-card'}`}>
                    <div className="card-header">
                       <h4>{food.foodName}</h4>
                       {food.safe ? <span className="badge safe">{t.safeBadge}</span> : <span className="badge danger">{t.warningBadge}</span>}
                    </div>
                    {food.safe ? (
                      <p className="status-safe">{t.safeDesc}</p>
                    ) : (
                      <div className="food-details">
                        <div className="detail-row"><span className="label">{t.detectedAllergens}</span><span className="value danger-text">{food.containedAllergens.map(a => formatAllergen(a, t)).join(', ')}</span></div>
                        <div className="detail-row"><span className="label">{t.affectedAllergies}</span><span className="value warning-text">{food.affectedAllergies.map(a => formatAllergen(a, t)).join(', ')}</span></div>
                        <div className="detail-row"><span className="label">{t.potentialRisks}</span><span className="value">{food.potentialSymptoms.join(', ')}</span></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
