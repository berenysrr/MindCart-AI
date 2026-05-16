import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  analyzeProduct,
  getAnalysisHistory,
  getCooldownItems,
} from "./services/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5222";

const demoLinks = {
  cosmetic: "https://www.trendyol.com/cilt-bakim-serumu-899",
  fashion: "https://www.trendyol.com/stradivarius/suni-suet-canta-1500",
  electronics: "https://www.amazon.com/wireless-mouse-650",
};

function App() {
  const [formData, setFormData] = useState({
    productName: "",
    price: "",
    category: "",
    productUrl: "",
    description: "",
    reviewsText: "",
    monthlyBudget: "",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [cooldownItems, setCooldownItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activePage, setActivePage] = useState("center");
  const [productLink, setProductLink] = useState("");
  const [fetchingProduct, setFetchingProduct] = useState(false);

  const [chatPrompt, setChatPrompt] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    loadLists();
  }, []);

  async function loadLists() {
    try {
      const historyData = await getAnalysisHistory();
      const cooldownData = await getCooldownItems();

      setHistory(Array.isArray(historyData) ? historyData : []);
      setCooldownItems(Array.isArray(cooldownData) ? cooldownData : []);
    } catch (error) {
      console.error("Liste verileri alınamadı:", error);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function extractPriceFromText(text) {
    const normalized = String(text || "")
      .toLowerCase()
      .replace(/\./g, "")
      .replace(/,/g, ".");

    const pricePatterns = [
      /(\d{3,6})\s*(tl|₺|try)/i,
      /(tl|₺|try)\s*(\d{3,6})/i,
      /\b(\d{3,6})\b/,
    ];

    for (const pattern of pricePatterns) {
      const match = normalized.match(pattern);
      if (match) {
        const value = Number(match[1] || match[2]);
        if (!Number.isNaN(value)) return value;
      }
    }

    return null;
  }

  function removeCommonUrlNoise(text) {
    return String(text || "")
      .replace(/https?:\/\//g, " ")
      .replace(/www\./g, " ")
      .replace(/trendyol\.com/g, " ")
      .replace(/amazon\.com/g, " ")
      .replace(/hepsiburada\.com/g, " ")
      .replace(/udemy\.com/g, " ")
      .replace(/n11\.com/g, " ")
      .replace(/product/g, " ")
      .replace(/urun/g, " ")
      .replace(/ürün/g, " ")
      .replace(/demo/g, " ")
      .replace(/\bp-\d+/g, " ")
      .replace(/\b\d{3,}\b/g, " ")
      .replace(/[/?=&.%]/g, " ")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeTurkishProductName(name) {
    return name
      .replace(/Suet/g, "Süet")
      .replace(/Canta/g, "Çanta")
      .replace(/Yastik/g, "Yastık")
      .replace(/Ayakkabi/g, "Ayakkabı")
      .replace(/Kulaklik/g, "Kulaklık")
      .replace(/Bakim/g, "Bakım")
      .replace(/Serumu/g, "Serumu")
      .replace(/Sinirli/g, "Sınırlı")
      .replace(/Stok/g, "Stok");
  }

  function formatProductNameFromLink(input) {
    const cleaned = removeCommonUrlNoise(String(input || "").toLowerCase());
    if (!cleaned) return "Demo Ürün";

    const stopWords = [
      "com",
      "tr",
      "html",
      "kategori",
      "marka",
      "search",
      "q",
      "utm",
      "ref",
      "campaign",
      "source",
      "www",
      "https",
      "http",
    ];

    const words = cleaned
      .split(" ")
      .filter((word) => word.length > 2 && !stopWords.includes(word))
      .slice(-6);

    if (words.length === 0) return "Demo Ürün";

    const formattedName = words
      .join(" ")
      .replace(/\b\w/g, (char) => char.toLocaleUpperCase("tr-TR"));

    return normalizeTurkishProductName(formattedName);
  }

  function createDemoProductFromInput(input) {
    const lowerInput = String(input || "").toLowerCase();
    const productName = formatProductNameFromLink(input);
    const detectedPrice = extractPriceFromText(input);

    if (
      lowerInput.includes("cilt-bakim-serumu") ||
      lowerInput.includes("cilt bakım serumu")
    ) {
      return {
        productName: "Cilt Bakım Serumu",
        price: detectedPrice || 899,
        category: "Cosmetic / Beauty",
        productUrl: input,
        description:
          "Fenomenlerin favorisi olarak öne çıkarılan, sınırlı stok ve özel indirim vurgusuyla pazarlanan bir bakım ürünü.",
        reviewsText:
          "Harika ürün. Cildimi değiştirdi. Herkes almalı. Mükemmel sonuç verdi.",
        monthlyBudget: 6000,
      };
    }

    if (
      lowerInput.includes("suni-suet-canta") ||
      lowerInput.includes("suni süet çanta") ||
      lowerInput.includes("stradivarius")
    ) {
      return {
        productName: "Stradivarius Suni Süet Çanta",
        price: detectedPrice || 1500,
        category: "Fashion",
        productUrl: input,
        description:
          "Popüler tasarım, sınırlı stok ve sezon indirimi vurgusuyla öne çıkarılan moda ürünü.",
        reviewsText:
          "Görünüşü güzel. Kalıbı biraz dar diyenler var. Bazı kullanıcılar fiyatını yüksek bulmuş.",
        monthlyBudget: 12000,
      };
    }

    if (lowerInput.includes("wireless-mouse")) {
      return {
        productName: "Basic Wireless Mouse",
        price: detectedPrice || 650,
        category: "Electronics",
        productUrl: input,
        description:
          "Kablosuz mouse, 2.4 GHz bağlantı, 12 ay pil ömrü ve ergonomik tasarım vadeden temel seviye elektronik ürün.",
        reviewsText:
          "Pil ömrü iyi. Günlük kullanım için yeterli. Malzeme kalitesi fiyatına göre normal.",
        monthlyBudget: 12000,
      };
    }

    if (
      lowerInput.includes("ortopedik-boyun-yastik") ||
      lowerInput.includes("ortopedik boyun yastık")
    ) {
      return {
        productName: "Ortopedik Boyun Yastığı",
        price: detectedPrice || 799,
        category: "Home / Sleep",
        productUrl: input,
        description:
          "Ev ve uyku konforu için tasarlanmış ergonomik destek ürünü.",
        reviewsText:
          "Rahat olduğunu söyleyen kullanıcılar var. Fiyatına göre makul bulunmuş.",
        monthlyBudget: 12000,
      };
    }

    if (lowerInput.includes("python-kursu")) {
      return {
        productName: "Python Kursu",
        price: detectedPrice || 350,
        category: "Education",
        productUrl: input,
        description:
          "Eğitim ve kişisel gelişim amacıyla kullanılabilecek uzun vadeli fayda potansiyeli taşıyan dijital kurs.",
        reviewsText:
          "İçeriği faydalı bulan kullanıcılar var. Bazıları anlatımı yeterli bulmuş.",
        monthlyBudget: 8000,
      };
    }

    if (lowerInput.includes("viral-urun-sinirli-stok")) {
      return {
        productName: "Viral Sınırlı Stok Ürün",
        price: detectedPrice || 1899,
        category: "General",
        productUrl: input,
        description:
          "Sadece bugün geçerli kampanya, sınırlı stok ve viral ürün vurgusuyla pazarlanan bir ürün.",
        reviewsText:
          "Çok iyi ürün. Herkes almalı. Mükemmel. Beklediğimden iyi çıktı.",
        monthlyBudget: 12000,
      };
    }

    if (lowerInput.includes("gaming-keyboard")) {
      return {
        productName: "Gaming Keyboard",
        price: detectedPrice || 4250,
        category: "Electronics",
        productUrl: input,
        description:
          "RGB aydınlatma, oyuncu modu ve sınırlı kampanya vurgusuyla öne çıkarılan klavye.",
        reviewsText:
          "Ürün harika, performansı çok iyi. Herkes almalı diyen yorumlar var.",
        monthlyBudget: 12000,
      };
    }

    if (
      lowerInput.includes("mouse") ||
      lowerInput.includes("klavye") ||
      lowerInput.includes("keyboard") ||
      lowerInput.includes("kulaklık") ||
      lowerInput.includes("kulaklik") ||
      lowerInput.includes("headphone") ||
      lowerInput.includes("laptop") ||
      lowerInput.includes("telefon")
    ) {
      return {
        productName,
        price:
          detectedPrice ||
          (lowerInput.includes("klavye") || lowerInput.includes("keyboard")
            ? 4250
            : 650),
        category: "Electronics",
        productUrl: input,
        description:
          "Teknoloji kategorisinde yer alan bu ürün, günlük kullanım ve performans beklentileri için öne çıkarılıyor.",
        reviewsText:
          "Kullanımı rahat. Günlük kullanım için yeterli. Bazı kullanıcılar fiyatına göre performansını iyi bulmuş.",
        monthlyBudget: 12000,
      };
    }

    if (
      lowerInput.includes("serum") ||
      lowerInput.includes("cilt") ||
      lowerInput.includes("krem") ||
      lowerInput.includes("kozmetik") ||
      lowerInput.includes("beauty") ||
      lowerInput.includes("makyaj") ||
      lowerInput.includes("parfüm") ||
      lowerInput.includes("parfum")
    ) {
      return {
        productName,
        price: detectedPrice || 1299,
        category: "Cosmetic / Beauty",
        productUrl: input,
        description:
          "Fenomenlerin favorisi olarak öne çıkarılan, sınırlı stok ve özel indirim vurgusuyla pazarlanan bir bakım ürünü.",
        reviewsText:
          "Harika ürün. Cildimi değiştirdi. Herkes almalı. Mükemmel sonuç verdi.",
        monthlyBudget: 6000,
      };
    }

    if (
      lowerInput.includes("ayakkabi") ||
      lowerInput.includes("ayakkabı") ||
      lowerInput.includes("sneaker") ||
      lowerInput.includes("çanta") ||
      lowerInput.includes("canta") ||
      lowerInput.includes("elbise") ||
      lowerInput.includes("ceket") ||
      lowerInput.includes("mont") ||
      lowerInput.includes("zara") ||
      lowerInput.includes("bershka")
    ) {
      return {
        productName,
        price: detectedPrice || 2199,
        category: "Fashion",
        productUrl: input,
        description:
          "Popüler tasarım, sınırlı stok ve sezon indirimi vurgusuyla öne çıkarılan moda ürünü.",
        reviewsText:
          "Görünüşü güzel. Bazı kullanıcılar fiyatını yüksek bulmuş.",
        monthlyBudget: 10000,
      };
    }

    if (
      lowerInput.includes("kitap") ||
      lowerInput.includes("book") ||
      lowerInput.includes("defter") ||
      lowerInput.includes("kalem") ||
      lowerInput.includes("kurs") ||
      lowerInput.includes("egitim") ||
      lowerInput.includes("eğitim")
    ) {
      return {
        productName,
        price: detectedPrice || 350,
        category: "Education",
        productUrl: input,
        description:
          "Eğitim ve kişisel gelişim amacıyla kullanılabilecek, uzun vadeli fayda potansiyeli taşıyan bir ürün.",
        reviewsText:
          "İçeriği faydalı bulan kullanıcılar var. Bazıları fiyatını uygun bulmuş.",
        monthlyBudget: 8000,
      };
    }

    return {
      productName,
      price: detectedPrice || 1899,
      category: "General",
      productUrl: input,
      description:
        "Popüler ürün etiketi, kampanya vurgusu ve sınırlı stok mesajlarıyla öne çıkarılan bir ürün.",
      reviewsText:
        "Çok iyi ürün. Herkes almalı. Mükemmel. Beklediğimden iyi çıktı.",
      monthlyBudget: 12000,
    };
  }

  function applyDemoScenario(input) {
    setProductLink(input);
    setShowAdvanced(true);
    setAnalysis(null);
    setFormData(createDemoProductFromInput(input));
    setActivePage("scan");
  }

  function simulateProductFetch() {
    if (!productLink.trim()) {
      alert("Lütfen bir ürün linki, ürün adı veya ürün adı + fiyat gir.");
      return;
    }

    setFetchingProduct(true);
    setAnalysis(null);

    setTimeout(() => {
      setShowAdvanced(true);
      setFormData(createDemoProductFromInput(productLink));
      setFetchingProduct(false);
    }, 550);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        userId: 1,
        ...formData,
        category: formData.category || "General",
        description:
          formData.description ||
          "Ürün açıklaması girilmedi. Analizi ürün adı, fiyat ve bütçe üzerinden yap.",
        reviewsText:
          formData.reviewsText ||
          "Yorum verisi girilmedi. Sahte yorum riskini sınırlı veriyle değerlendir.",
        price: Number(formData.price),
        monthlyBudget: Number(formData.monthlyBudget || 0),
      };

      const result = await analyzeProduct(payload);
      setAnalysis(result);
      loadLists();
    } catch (error) {
      alert("Analiz sırasında hata oluştu. Backend çalışıyor mu kontrol et.");
      console.error("Analiz hatası:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleChatSubmit(e) {
    e.preventDefault();

    if (!chatPrompt.trim()) {
      alert("Lütfen MindCart'a bir soru yaz.");
      return;
    }

    setChatLoading(true);
    setChatResponse("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatPrompt),
      });

      if (!response.ok) throw new Error("Chat request failed");

      const data = await response.json();
      setChatResponse(data.response);
    } catch (error) {
      alert("MindCart Asistan yanıt veremedi. Backend çalışıyor mu kontrol et.");
      console.error("Chat hatası:", error);
    } finally {
      setChatLoading(false);
    }
  }

  function getShortDecision(score) {
    if (score < 45) return "Bekle";
    if (score < 70) return "Karşılaştır";
    return "Mantıklı";
  }

  function getDecisionSubtext(score) {
    if (score < 45) return "Risk yüksek. Acele etme.";
    if (score < 70) return "Alternatifleri değerlendir.";
    return "Düşük riskli görünüyor.";
  }

  function getRiskLevel(value) {
    if (value <= 40) return "Düşük Risk";
    if (value <= 70) return "Orta Risk";
    return "Yüksek Risk";
  }

  function getBudgetImpact() {
    const price = Number(formData.price || 0);
    const budget = Number(formData.monthlyBudget || 0);
    if (!price || !budget) return 0;
    return Math.round((price / budget) * 100);
  }

  function getRecommendedAction() {
    if (!analysis) return "Analiz bekleniyor";

    const budgetImpact = getBudgetImpact();

    if (analysis.isCoolDownSuggested || analysis.decisionScore < 45) {
      return "24 saat bekle / karşılaştır";
    }

    if (budgetImpact >= 20 || analysis.decisionScore < 70) {
      return "Alternatifleri karşılaştır";
    }

    return "Satın alma kararı mantıklı görünüyor";
  }

  function detectRiskSignals() {
    const combinedText = `${formData.description} ${formData.reviewsText}`.toLowerCase();

    const signals = [
      "sadece bugün",
      "sınırlı stok",
      "kaçırırsan üzülürsün",
      "kaçırılmayacak",
      "fenomen",
      "influencer",
      "herkes almalı",
      "hayatımı değiştirdi",
      "son fırsat",
      "stoklar tükeniyor",
      "sezon indirimi",
      "popüler ürün",
      "viral",
    ];

    return signals.filter((signal) => combinedText.includes(signal));
  }

  function cleanMarkdown(text) {
    return (text || "")
      .replace(/\*\*/g, "")
      .replace(/KARAR:/gi, "Karar:")
      .replace(/SEBEP:/gi, "Sebep:")
      .replace(/ÖNERİ:/gi, "Öneri:")
      .trim();
  }

  function parseRecommendation(text) {
    const cleaned = cleanMarkdown(text);

    if (!cleaned) {
      return { karar: "", sebep: "", oneri: "", raw: "" };
    }

    const kararMatch = cleaned.match(/Karar:\s*(.*?)(?=Sebep:|Öneri:|$)/is);
    const sebepMatch = cleaned.match(/Sebep:\s*(.*?)(?=Öneri:|$)/is);
    const oneriMatch = cleaned.match(/Öneri:\s*(.*)$/is);

    return {
      karar: kararMatch?.[1]?.trim() || "",
      sebep: sebepMatch?.[1]?.trim() || "",
      oneri: oneriMatch?.[1]?.trim() || "",
      raw: cleaned,
    };
  }

  function getScoreExplanation() {
    const budgetImpact = getBudgetImpact();
    const signals = detectRiskSignals();

    return [
      {
        title: "Manipulation Risk",
        text:
          signals.length > 0
            ? `Ürün metninde ${signals
                .slice(0, 3)
                .map((s) => `“${s}”`)
                .join(", ")} gibi baskı oluşturan ifadeler var.`
            : "Ürün açıklamasında güçlü bir manipülasyon sinyali tespit edilmedi.",
      },
      {
        title: "Impulse Risk",
        text:
          budgetImpact > 0
            ? `Bu ürün aylık bütçenin yaklaşık %${budgetImpact}'ini oluşturuyor. Oran yükseldikçe dürtüsel harcama riski artar.`
            : "Aylık bütçe girilmediği için bütçe etkisi sınırlı veriyle değerlendirildi.",
      },
      {
        title: "Fake Review Risk",
        text:
          Number(analysis?.fakeReviewRisk || 0) > 50
            ? "Yorumlarda aşırı olumlu ve genel ifadeler bulunduğu için sahte yorum riski yükseliyor."
            : "Yorumlar daha dengeli göründüğü için sahte yorum riski düşük seviyede.",
      },
      {
        title: "Overpriced Risk",
        text:
          Number(analysis?.overpricedRisk || 0) > 55
            ? "Fiyat, kategori ve bütçe oranına göre dikkatli karşılaştırma gerektiriyor."
            : "Fiyat seviyesi kategoriye göre daha kontrollü görünüyor.",
      },
    ];
  }

  function openHistoryItem(item) {
    setFormData((prev) => ({
      ...prev,
      productName: item.productName || prev.productName,
      price: item.productPrice || prev.price,
      category: item.productCategory || prev.category,
      monthlyBudget: prev.monthlyBudget || 12000,
    }));

    setAnalysis({
      fakeReviewRisk: item.fakeReviewRisk,
      manipulationRisk: item.manipulationRisk,
      overpricedRisk: item.overpricedRisk,
      impulseRisk: item.impulseRisk,
      decisionScore: item.decisionScore,
      finalRecommendation: item.finalRecommendation,
      isCoolDownSuggested: item.isCoolDownSuggested,
      coolDownReason: item.isCoolDownSuggested
        ? "Bu ürün için daha önce 24 saatlik düşünme sepeti önerilmişti."
        : "",
    });

    setActivePage("scan");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getCooldownName(item) {
    return item.productName || item.product?.name || "Ürün";
  }

  function getCooldownPrice(item) {
    return item.productPrice || item.product?.price || 0;
  }

  function getCooldownCategory(item) {
    return item.productCategory || item.product?.category || "Kategori";
  }

  function getCooldownReason(item) {
    return item.reason || "Manipülasyon ve dürtüsel alışveriş riski.";
  }

  function getRemainingTime(lockedUntil) {
    if (!lockedUntil) return "24 saatlik süreçte";

    const end = new Date(lockedUntil).getTime();
    if (Number.isNaN(end)) return "24 saatlik süreçte";

    const diff = end - Date.now();
    if (diff <= 0) return "Süre doldu";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${hours} saat ${minutes} dakika kaldı`;
  }

  const protectedAmount = useMemo(
    () => cooldownItems.reduce((total, item) => total + Number(getCooldownPrice(item) || 0), 0),
    [cooldownItems]
  );

  const averageScore = useMemo(
    () =>
      history.length > 0
        ? Math.round(
            history.reduce((total, item) => total + Number(item.decisionScore || 0), 0) /
              history.length
          )
        : 0,
    [history]
  );

  const budgetImpact = getBudgetImpact();
  const riskSignals = detectRiskSignals();
  const parsedRecommendation = parseRecommendation(analysis?.finalRecommendation);

  const sampleCooldownCards =
    cooldownItems.length > 0
      ? cooldownItems
      : [
          {
            id: "sample-1",
            productName: "Sony WH-1000XM5",
            productPrice: 9999,
            productCategory: "Kulaklık",
            reason: "Yüksek fiyatlı, dürtüsel satın alma riski",
            lockedUntil: new Date(Date.now() + 23 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString(),
          },
          {
            id: "sample-2",
            productName: "iPhone 15 Pro Max",
            productPrice: 69999,
            productCategory: "Akıllı Telefon",
            reason: "Çok yüksek tutarlı harcama",
            lockedUntil: new Date(Date.now() + 18 * 60 * 60 * 1000 + 47 * 60 * 1000).toISOString(),
          },
          {
            id: "sample-3",
            productName: "Canon EOS R8",
            productPrice: 34999,
            productCategory: "Fotoğraf Makinesi",
            reason: "Planlanmamış, yüksek bütçeli alışveriş",
            lockedUntil: new Date(Date.now() + 20 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
          },
        ];

  return (
    <main className="page">
      <nav className="navbar">
        <div className="brand-block">
          <div className="brand-line">
            <span className="brand-icon">🛡️</span>
            <div>
              <div className="brand">MindCart AI</div>
              <span>AI Shopping Decision Guard</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={activePage === "center" ? "active-nav" : ""}
          onClick={() => setActivePage("center")}
        >
          Karar Merkezi
        </button>

        <button
          type="button"
          className={activePage === "scan" ? "active-nav" : ""}
          onClick={() => setActivePage("scan")}
        >
          Yeni Analiz
        </button>

        <button
          type="button"
          className={activePage === "cooldown" ? "active-nav" : ""}
          onClick={() => setActivePage("cooldown")}
        >
          🛒 Düşünme Sepeti
        </button>

        <button
          type="button"
          className={activePage === "history" ? "active-nav" : ""}
          onClick={() => setActivePage("history")}
        >
          Karar Geçmişim
        </button>

        <button
          type="button"
          className={activePage === "chat" ? "active-nav" : ""}
          onClick={() => setActivePage("chat")}
        >
          💬 Chat Asistanı
        </button>
      </nav>

      {activePage === "center" && (
        <section className="center-page">
          <section className="hero landing-hero">
            <h1 className="hero-gradient">
              BİLİNÇLİ ALIŞVERİŞE
              <br />
              İLK ADIM.
            </h1>

            <p>
              MindCart AI; ürün linklerini, fiyatları ve yorum sinyallerini analiz ederek
              sahte yorum, manipülasyon, şişirilmiş fiyat ve dürtüsel alışveriş risklerini görünür hale getirir.
            </p>

            <div className="hero-actions">
              <button className="primary hero-cta" onClick={() => setActivePage("scan")}>
                🔎 Ürün Analiz Et
              </button>

              <button className="ghost-cta" onClick={() => applyDemoScenario(demoLinks.cosmetic)}>
                Demo Ürün Dene
              </button>
            </div>

            <div className="hero-showcase hero-showcase-final" aria-hidden="true">
              <span className="risk-chip chip-left-top">💬 Sahte Yorum</span>
              <span className="risk-chip chip-right-top">⚠️ Manipülasyon</span>
              <span className="risk-chip chip-left-bottom">🏷️ Fake İndirim</span>
              <span className="risk-chip chip-right-bottom">⚡ Dürtüsel Risk</span>

              <div className="hero-scan-card">
                <div className="scan-glow-ring" />

                <div className="scan-card-window">
                  <div className="scan-card-header">
                    <span className="scan-dot" />
                    <span className="scan-dot" />
                    <span className="scan-dot" />
                    <strong>MindCart Scan</strong>
                  </div>

                  <div className="scan-product-row">
                    <div className="scan-product-icon">🛍️</div>
                    <div>
                      <span>AI Risk Check</span>
                      <strong>Manipulation detected</strong>
                    </div>
                  </div>

                  <div className="scan-score-row">
                    <div className="scan-score-circle">57</div>
                    <div className="scan-bars">
                      <i style={{ width: "78%" }} />
                      <i style={{ width: "56%" }} />
                      <i style={{ width: "42%" }} />
                    </div>
                  </div>
                </div>

                <div className="scan-shield">🛡️</div>
              </div>
            </div>
          </section>

          <section className="stats-grid">
            <div className="stat-card metric-card">
              <span className="metric-icon">⌕</span>
              <div>
                <span>Toplam Analiz</span>
                <strong>{history.length || 12}</strong>
              </div>
            </div>

            <div className="stat-card metric-card">
              <span className="metric-icon">🛒</span>
              <div>
                <span>Düşünme Sepetindeki Ürün</span>
                <strong>{cooldownItems.length || 2}</strong>
              </div>
            </div>

            <div className="stat-card metric-card">
              <span className="metric-icon">🛡️</span>
              <div>
                <span>Korunan Riskli Harcama</span>
                <strong>{(protectedAmount || 5149).toLocaleString("tr-TR")} TL</strong>
              </div>
            </div>

            <div className="stat-card metric-card">
              <span className="metric-icon">◔</span>
              <div>
                <span>Ortalama MindCart Score</span>
                <strong>{averageScore || 52}/100</strong>
              </div>
            </div>
          </section>

          <section className="panel how-card">
            <h2>✦ MindCart AI Nasıl Çalışır?</h2>

            <div className="feature-grid three">
              <div className="feature-tile blue">
                <div className="feature-orb">◎</div>
                <strong>Detect</strong>
                <span>
                  Ürün linkleri ve yorumlardaki manipülatif sinyalleri ve sahte
                  etkileşimleri tespit eder.
                </span>
              </div>

              <div className="feature-tile purple">
                <div className="feature-orb">盾</div>
                <strong>Protect</strong>
                <span>
                  Bütçeni ve karar kaliteni korur. Riskli uyaranları görünür
                  kılar, daha bilinçli seçimler yapmanı sağlar.
                </span>
              </div>

              <div className="feature-tile violet">
                <div className="feature-orb">◷</div>
                <strong>Cooldown</strong>
                <span>
                  Riskli alışverişlerde 24 saatlik bekleme süreciyle dürtüsel
                  harcamaların önüne geçer.
                </span>
              </div>
            </div>
          </section>
        </section>
      )}

      {activePage === "scan" && (
        <section className="page-section scan-page">
          <section className="scan-heading">
            <div>
              <h1>ÜRÜN ANALİZİ</h1>
              <p>Bir ürün linki girin, MindCart AI risksiz alışveriş için analiz etsin.</p>
            </div>
          </section>

          <section className="analysis-layout">
            <form className="panel form analysis-form" onSubmit={handleSubmit}>
              <div className="link-fetch-card">
                <h3>🔗 Linkten Ürün Verisi Hazırla</h3>
                <p>
                  MVP sürümünde akıllı demo simülasyonu kullanıyoruz. Gelecekte
                  e-ticaret API’leri veya tarayıcı eklentileri ile gerçek zamanlı veri çekilecektir.
                </p>

                <div className="link-row">
                  <input
                    placeholder="https://www.ornek.com/urun/xyz"
                    value={productLink}
                    onChange={(e) => setProductLink(e.target.value)}
                  />

                  <button type="button" className="gradient-button" onClick={simulateProductFetch}>
                    {fetchingProduct ? "Hazırlanıyor..." : "✦ Ürün Verilerini Getir"}
                  </button>
                </div>
              </div>

              <div className="demo-area">
                <span>Demo Ürünler</span>

                <div className="demo-buttons">
                  <button type="button" className="danger-pill" onClick={() => applyDemoScenario(demoLinks.cosmetic)}>
                    ⚗ Riskli Kozmetik
                  </button>

                  <button type="button" className="blue-pill" onClick={() => applyDemoScenario(demoLinks.fashion)}>
                    ♙ Moda Ürünü
                  </button>

                  <button type="button" className="safe-pill" onClick={() => applyDemoScenario(demoLinks.electronics)}>
                    ▣ Güvenli Elektronik
                  </button>
                </div>
              </div>

              <label className="field-label">Ürün adı veya link</label>
              <input
                name="productName"
                placeholder="Ürün adı yazın veya link yapıştırın..."
                value={formData.productName}
                onChange={handleChange}
                required
              />

              <div className="two-col">
                <div>
                  <label className="field-label">Fiyat (TL)</label>
                  <input
                    name="price"
                    placeholder="Örn. 999,90"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Aylık bütçe (TL)</label>
                  <input
                    name="monthlyBudget"
                    placeholder="Örn. 6.000"
                    type="number"
                    value={formData.monthlyBudget}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="button"
                className="accordion-button"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                ▣ {showAdvanced ? "Detaylı alanları gizle" : "Detaylı analiz için açıklama ve yorum ekle"}
                <span>{showAdvanced ? "⌃" : "⌄"}</span>
              </button>

              {showAdvanced && (
                <div className="advanced-fields">
                  <input
                    name="category"
                    placeholder="Kategori"
                    value={formData.category}
                    onChange={handleChange}
                  />

                  <input
                    name="productUrl"
                    placeholder="Ürün linki"
                    value={formData.productUrl}
                    onChange={handleChange}
                  />

                  <textarea
                    name="description"
                    placeholder="Ürün açıklaması veya kampanya metni"
                    value={formData.description}
                    onChange={handleChange}
                  />

                  <textarea
                    name="reviewsText"
                    placeholder="Örnek kullanıcı yorumları"
                    value={formData.reviewsText}
                    onChange={handleChange}
                  />
                </div>
              )}

              <button className="primary full-button" type="submit" disabled={loading}>
                {loading ? "MindCart AI analiz ediyor..." : "✦ Analyze with MindCart AI"}
              </button>
            </form>

            <section className="panel risk-report">
              <div className="report-header">
                <h2>🛡️ MindCart Risk Report</h2>
                <span>AI ANALYSIS</span>
              </div>

              {!analysis && (
                <div className="empty-state report-empty">
                  <h3>Henüz analiz yapılmadı.</h3>
                  <p>Demo ürün seçin veya link girerek risk raporu oluşturun.</p>
                </div>
              )}

              {analysis && (
                <>
                  <section className="report-top-grid">
                    <div className="report-box">
                      <span>Decision</span>
                      <strong>⚖ {getShortDecision(analysis.decisionScore)}</strong>
                      <p>{getDecisionSubtext(analysis.decisionScore)}</p>
                    </div>

                    <div className="report-box score-box">
                      <span>MindCart Score</span>
                      <div
                        className="score-donut"
                        style={{ "--score": `${analysis.decisionScore * 3.6}deg` }}
                      >
                        <strong>{analysis.decisionScore}<small>/100</small></strong>
                        <em>{getRiskLevel(100 - analysis.decisionScore)}</em>
                      </div>
                    </div>

                    <div className="report-box">
                      <span>Budget Impact</span>
                      <strong>💼 %{budgetImpact}</strong>
                      <p>
                        {budgetImpact >= 20
                          ? "Bütçeni zorlayabilir"
                          : budgetImpact > 0
                          ? "Bütçende etkisi var"
                          : "Bütçe verisi sınırlı"}
                      </p>
                    </div>
                  </section>

                  <section className="risk-signals">
                    <h3>Tespit Edilen Sinyaller</h3>
                    <div className="signal-list">
                      {(riskSignals.length > 0 ? riskSignals : ["belirgin risk sinyali yok"]).map(
                        (signal) => (
                          <span key={signal}>#{signal}</span>
                        )
                      )}
                    </div>
                  </section>

                  <section className="recommended-action">
                    <div className="action-icon">⏳</div>
                    <div>
                      <span>Önerilen Aksiyon</span>
                      <strong>{getRecommendedAction()}</strong>
                      <p>Fiyat dalgalanması ve alternatifleri kontrol etmen önerilir.</p>
                    </div>
                    <b>›</b>
                  </section>

                  <section className="risk-grid">
                    <RiskCard title="Fake Review" icon="💬" value={analysis.fakeReviewRisk} />
                    <RiskCard title="Manipulation" icon="🎭" value={analysis.manipulationRisk} />
                    <RiskCard title="Overpriced" icon="🏷️" value={analysis.overpricedRisk} />
                    <RiskCard title="Impulse" icon="⚡" value={analysis.impulseRisk} />
                  </section>

                  <section className="score-explanation">
                    <h3>Neden bu skor?</h3>

                    {getScoreExplanation().map((item) => (
                      <div className="explanation-row" key={item.title}>
                        <strong>{item.title}</strong>
                        <p>{item.text}</p>
                      </div>
                    ))}
                  </section>

                  {analysis.isCoolDownSuggested && (
                    <div className="warning">
                      24 saatlik düşünme süreci önerildi.
                      <br />
                      {analysis.coolDownReason}
                    </div>
                  )}

                  <section className="recommendation">
                    <h3>AI Önerisi</h3>

                    {parsedRecommendation.karar ||
                    parsedRecommendation.sebep ||
                    parsedRecommendation.oneri ? (
                      <div className="recommendation-cards">
                        {parsedRecommendation.karar && (
                          <div className="recommendation-item">
                            <span>Karar</span>
                            <strong>{parsedRecommendation.karar}</strong>
                          </div>
                        )}

                        {parsedRecommendation.sebep && (
                          <div className="recommendation-item">
                            <span>Sebep</span>
                            <p>{parsedRecommendation.sebep}</p>
                          </div>
                        )}

                        {parsedRecommendation.oneri && (
                          <div className="recommendation-item">
                            <span>Öneri</span>
                            <p>{parsedRecommendation.oneri}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p>{parsedRecommendation.raw}</p>
                    )}
                  </section>
                </>
              )}
            </section>
          </section>
        </section>
      )}
{activePage === "cooldown" && (
  <section className="page-section cooldown-page mc-cooldown-page">
    <section className="mc-cooldown-hero">
      <div className="mc-cooldown-hero-left">
        <span className="mc-eyebrow">AI Cooldown Protection</span>
        <h1>Kilitlenmiş Karar Alanı</h1>
        <p>
          Yüksek riskli alışverişler <strong>24 saatlik</strong> düşünme sürecine alınır.
          MindCart AI, acele satın alma baskısını azaltır.
        </p>
      </div>

      <div className="mc-protection-badge">
        <span>Koruma Modu</span>
        <strong>Aktif</strong>
      </div>
    </section>

    <section className="mc-vault-layout">
      <div className="mc-cooldown-grid">
        {sampleCooldownCards.map((item, index) => {
          const price = Number(getCooldownPrice(item) || 0);
          const remaining = getRemainingTime(item.lockedUntil);

          return (
            <div className="mc-cooldown-card" key={item.id}>
              <div className="mc-card-top">
                <div className="mc-lock">🔒</div>
                <div className="mc-risk-pill">
                  {index === 0
                    ? "Yüksek Risk"
                    : index === 1
                    ? "Çok Yüksek Tutar"
                    : "Planlanmamış"}
                </div>
              </div>

              <div className="mc-product-main">
                <div className="mc-product-visual">
                  {getProductIcon(getCooldownName(item))}
                </div>

                <div>
                  <h2>{getCooldownName(item)}</h2>
                  <p>{getCooldownCategory(item)}</p>
                  <strong>{price.toLocaleString("tr-TR")} TL</strong>
                </div>
              </div>

              <div className="mc-reason-box">
                <span>Risk Nedeni</span>
                <p>{getCooldownReason(item)}</p>
              </div>

              <div className="mc-wait-box">
                <div className="mc-wait-head">
                  <span>Bekleme Süreci</span>
                  <strong>{remaining}</strong>
                </div>

                <div className="mc-progress">
                  <i style={{ width: index === 0 ? "72%" : index === 1 ? "54%" : "63%" }} />
                </div>
              </div>

              <div className="mc-status">🔐 24 saatlik düşünme sürecinde</div>

              <div className="mc-card-actions">
                <button className="primary full-button" onClick={() => setActivePage("history")}>
                  Analizi Gör
                </button>

                <button className="ghost-button" type="button">
                  🔔 Süresi Dolunca Hatırlat
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <aside className="panel mc-sidebar">
        <div className="mc-sidebar-top">
          <div className="mc-sidebar-icon">🛒</div>
          <div>
            <h2>Düşünme Sepeti Özeti</h2>
            <p>Bugünkü koruma durumu</p>
          </div>
        </div>

        <div className="mc-sidebar-metric primary">
          <span>Bugün Korunan Harcama</span>
          <strong>{(protectedAmount || 114997).toLocaleString("tr-TR")} TL</strong>
          <small>{cooldownItems.length || 3} alışveriş</small>
        </div>

        <div className="mc-sidebar-metric">
          <div className="mc-metric-line">
            <span>Aktif Cooldown</span>
            <strong>{cooldownItems.length || 3}</strong>
          </div>
          <small>24 saatlik süreçte</small>
        </div>

        <div className="mc-sidebar-metric">
          <div className="mc-metric-line">
            <span>Karar Kalitesi Koruması</span>
            <strong>92%</strong>
          </div>
          <small>Bu ay</small>
        </div>

        <div className="mc-sidebar-note">
          MindCart AI, gereksiz harcamaları azaltır ve daha bilinçli kararlar almanı sağlar.
        </div>
      </aside>
    </section>
  </section>
)}

      {activePage === "history" && (
        <section className="page-section mc-history-page-final">
          <section className="mc-history-hero-final">
            <p className="tag">Karar Geçmişim</p>
            <h1>Daha önce analiz ettiğin ürünlere tekrar dön.</h1>
            <p>
              MindCart AI, alışveriş kararlarını tek seferlik cevap olarak bırakmaz;
              ürün geçmişini, risk skorlarını ve karar önerilerini görünür hale getirir.
            </p>
          </section>

          <section className="mc-history-dashboard">
            <div className="mc-history-top">
              <div>
                <h2>Analiz Geçmişi</h2>
                <p>Önceki ürün kararlarını hızlıca karşılaştır.</p>
              </div>

              <div className="mc-history-tabs">
                <span>Tümü</span>
                <span>Yüksek Risk</span>
                <span>Karşılaştır</span>
                <span>Güvenli</span>
              </div>
            </div>

            {history.length === 0 && (
              <div className="empty-state mc-empty-state">
                <p>Henüz analiz yok. Demo ürünlerden biriyle hızlıca analiz başlatabilirsin.</p>
                <button className="primary" onClick={() => setActivePage("scan")}>
                  Yeni Analiz Yap
                </button>
              </div>
            )}

            {history.length > 0 && (
              <div className="mc-history-table">
                <div className="mc-history-table-head">
                  <span>Ürün</span>
                  <span>Fiyat</span>
                  <span>Score</span>
                  <span>Karar</span>
                  <span>Aksiyon</span>
                </div>

                {history.map((item, index) => {
                  const fallbackProducts = [
                    {
                      name: "Stradivarius Suni Süet Çanta",
                      category: "Fashion",
                      price: 1500,
                    },
                    {
                      name: "Cilt Bakım Serumu",
                      category: "Cosmetic / Beauty",
                      price: 899,
                    },
                    {
                      name: "Wireless Mouse",
                      category: "Electronics",
                      price: 650,
                    },
                    {
                      name: "Gaming Keyboard",
                      category: "Electronics",
                      price: 4250,
                    },
                  ];

                  const fallback = fallbackProducts[index % fallbackProducts.length];

                  const name = item.productName || item.product?.name || fallback.name;
                  const category = item.productCategory || item.product?.category || fallback.category;
                  const price =
                    Number(item.productPrice || item.product?.price || item.price || 0) || fallback.price;
                  const score =
                    Number(item.decisionScore || item.score || 0) || [57, 54, 67, 42][index % 4];
                  const decision = getShortDecision(score);

                  return (
                    <div className="mc-history-table-row" key={item.id || index}>
                      <div className="mc-history-product-final">
                        <div className="mc-history-product-icon">{getProductIcon(name)}</div>

                        <div>
                          <h3>{name}</h3>
                          <p>{category}</p>
                        </div>
                      </div>

                      <div className="mc-history-cell-final">
                        <span>Fiyat</span>
                        <strong>{price.toLocaleString("tr-TR")} TL</strong>
                      </div>

                      <div className="mc-history-cell-final">
                        <span>Score</span>
                        <strong className="mc-score-badge-final">{score}/100</strong>
                      </div>

                      <div className="mc-history-cell-final">
                        <span>Karar</span>
                        <strong className="mc-decision-badge-final">{decision}</strong>
                      </div>

                      <button
                        type="button"
                        className="mc-history-open-btn"
                        onClick={() => openHistoryItem(item)}
                      >
                        Analizi Aç
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      )}

      {activePage === "chat" && (
        <section className="page-section mc-chat-page-final">
          <section className="mc-chat-hero">
            <p className="tag">MindCart Chat Assistant</p>
            <h1>AI DESTEKLİ ALIŞVERİŞ ASİSTANI</h1>
            <p>
              Ürün, bütçe ve satın alma kararların hakkında MindCart AI ile konuş.
              Gereksiz harcamaları, manipülasyon risklerini ve alternatifleri birlikte değerlendir.
            </p>
          </section>

          <section className="mc-chat-layout">
            <form className="mc-chat-card-final" onSubmit={handleChatSubmit}>
              <textarea
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                placeholder="Örnek: Bütçem 2000 TL, 1500 TL'lik çanta almak mantıklı mı? Alternatiflere bakmalı mıyım?"
              />

              <button className="primary full-button" type="submit" disabled={chatLoading}>
                {chatLoading ? "MindCart düşünüyor..." : "MindCart'a Sor"}
              </button>

              {chatResponse && (
                <div className="mc-chat-response-final">
                  {cleanMarkdown(chatResponse)}
                </div>
              )}
            </form>

            <aside className="mc-chat-side">
              <h2>Ne sorabilirsin?</h2>
              <p>
                MindCart AI sadece “al / alma” demez. Bütçe etkisini, risk sinyallerini
                ve daha mantıklı alternatifleri birlikte değerlendirir.
              </p>

              <div className="mc-chat-suggestions">
                <button type="button" onClick={() => setChatPrompt("Bu ürün bütçeme göre mantıklı mı?")}>
                  Bu ürün bütçeme göre mantıklı mı?
                </button>

                <button type="button" onClick={() => setChatPrompt("Bu ürün dürtüsel alışveriş olabilir mi?")}>
                  Bu ürün dürtüsel alışveriş olabilir mi?
                </button>

                <button type="button" onClick={() => setChatPrompt("Bu ürünü almadan önce neyle karşılaştırmalıyım?")}>
                  Almadan önce neyle karşılaştırmalıyım?
                </button>

                <button type="button" onClick={() => setChatPrompt("Bu ürün için 24 saat beklemek mantıklı mı?")}>
                  24 saat beklemek mantıklı mı?
                </button>
              </div>
            </aside>
          </section>
        </section>
      )}

    </main>
  );
}

function RiskCard({ title, icon, value }) {
  const level = value <= 40 ? "Düşük Risk" : value <= 70 ? "Orta Risk" : "Yüksek Risk";
  const className = value <= 40 ? "low" : value <= 70 ? "medium" : "high";

  return (
    <div className={`risk-card ${className}`}>
      <span>
        {icon} {title}
      </span>
      <strong>
        {value}<small>/100</small>
      </strong>
      <em>{level}</em>
      <div className="risk-bar">
        <i style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function getProductIcon(productName) {
  const name = String(productName || "").toLowerCase();

  if (name.includes("sony") || name.includes("kulak")) return "🎧";
  if (name.includes("iphone") || name.includes("telefon")) return "📱";
  if (name.includes("canon") || name.includes("kamera")) return "📷";
  if (name.includes("çanta") || name.includes("canta")) return "👜";
  if (name.includes("serum") || name.includes("cilt")) return "🧴";
  if (name.includes("mouse")) return "🖱️";
  if (name.includes("klavye") || name.includes("keyboard")) return "⌨️";
  return "🛍️";
}

export default App;
