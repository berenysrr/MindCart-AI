import { useEffect, useState } from "react";
import "./App.css";
import {
  analyzeProduct,
  getAnalysisHistory,
  getCooldownItems,
} from "./services/api";

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

  async function loadLists() {
    try {
      const historyData = await getAnalysisHistory();
      const cooldownData = await getCooldownItems();

      setHistory(historyData);
      setCooldownItems(cooldownData);
    } catch (error) {
      console.error("Liste verileri alınamadı:", error);
    }
  }

  useEffect(() => {
    loadLists();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function fillRiskyProduct() {
    setShowAdvanced(true);
    setAnalysis(null);
    setFormData({
      productName: "Limited Edition RGB Gaming Keyboard",
      price: 4250,
      category: "Electronics",
      productUrl: "https://example.com/gaming-keyboard",
      description:
        "Sadece bugün geçerli dev indirim! Stoklar tükeniyor, kaçırırsan üzülürsün. Fenomenlerin tercihi!",
      reviewsText: "Ürün harika, hayatımı değiştirdi. Herkes hemen almalı!",
      monthlyBudget: 12000,
    });
  }

  function fillSafeProduct() {
    setShowAdvanced(true);
    setAnalysis(null);
    setFormData({
      productName: "Basic Wireless Mouse",
      price: 450,
      category: "Electronics",
      productUrl: "https://example.com/wireless-mouse",
      description:
        "Kablosuz mouse, 2.4 GHz bağlantı, 12 ay pil ömrü, ergonomik tasarım.",
      reviewsText:
        "Pil ömrü iyi. Günlük kullanım için yeterli. Malzeme kalitesi fiyatına göre normal.",
      monthlyBudget: 12000,
    });
  }

  function extractPriceFromText(text) {
    const normalized = text
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

        if (!Number.isNaN(value)) {
          return value;
        }
      }
    }

    return null;
  }

  function removeCommonUrlNoise(text) {
    return text
      .replace(/https?:\/\//g, " ")
      .replace(/www\./g, " ")
      .replace(/trendyol\.com/g, " ")
      .replace(/amazon\.com/g, " ")
      .replace(/hepsiburada\.com/g, " ")
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
      .replace(/Cilt/g, "Cilt")
      .replace(/Serumu/g, "Serumu")
      .replace(/Ortopedik/g, "Ortopedik")
      .replace(/Boyun/g, "Boyun")
      .replace(/Klavye/g, "Klavye");
  }

  function formatProductNameFromLink(input) {
    const cleaned = removeCommonUrlNoise(input.toLowerCase());

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
    const lowerInput = input.toLowerCase();
    const productName = formatProductNameFromLink(input);
    const detectedPrice = extractPriceFromText(input);

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
      lowerInput.includes("yastik") ||
      lowerInput.includes("yastık") ||
      lowerInput.includes("pillow") ||
      lowerInput.includes("nevresim") ||
      lowerInput.includes("battaniye") ||
      lowerInput.includes("yorgan")
    ) {
      return {
        productName,
        price: detectedPrice || 799,
        category: "Home / Sleep",
        productUrl: input,
        description:
          "Ev ve uyku konforu için tasarlanmış ürün. Ergonomik kullanım, rahatlık ve uzun süreli destek vadeder.",
        reviewsText:
          "Rahat olduğunu söyleyen kullanıcılar var. Bazı yorumlarda ilk kullanımda koku olduğu ama sonra geçtiği belirtilmiş. Fiyatına göre makul bulunmuş.",
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
      lowerInput.includes("stradivarius") ||
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
          "Görünüşü güzel. Kalıbı biraz dar diyenler var. Bazı kullanıcılar fiyatını yüksek bulmuş.",
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
          "İçeriği faydalı bulan kullanıcılar var. Bazıları fiyatını uygun, bazıları ise içerik kalitesine göre değerlendirilmesi gerektiğini söylüyor.",
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

  function simulateProductFetch() {
    if (!productLink.trim()) {
      alert("Lütfen bir ürün linki, ürün adı veya ürün adı + fiyat gir.");
      return;
    }

    setFetchingProduct(true);
    setAnalysis(null);

    setTimeout(() => {
      setShowAdvanced(true);

      const demoProduct = createDemoProductFromInput(productLink);
      setFormData(demoProduct);

      setFetchingProduct(false);
    }, 1200);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        category: formData.category || "General",
        description:
          formData.description ||
          "Ürün açıklaması girilmedi. Analizi ürün adı, fiyat ve bütçe üzerinden yap.",
        reviewsText:
          formData.reviewsText ||
          "Yorum verisi girilmedi. Sahte yorum riskini sınırlı veriyle değerlendir.",
        price: Number(formData.price),
        monthlyBudget: Number(formData.monthlyBudget),
      };

      const result = await analyzeProduct(payload);
      setAnalysis(result);
      await loadLists();
    } catch (error) {
      alert("Analiz sırasında hata oluştu. Backend çalışıyor mu kontrol et.");
      console.error("Analiz hatası:", error);
    } finally {
      setLoading(false);
    }
  }

  function getDecisionLabel(score) {
    if (score < 45) return "Riskli — 24 saat bekle";
    if (score < 70) return "Dikkatli karşılaştır";
    return "Mantıklı görünüyor";
  }

  function parseRecommendation(text) {
    if (!text) {
      return {
        karar: "",
        sebep: "",
        oneri: "",
        raw: "",
      };
    }

    const kararMatch = text.match(/Karar:\s*(.*?)(?=Sebep:|Öneri:|$)/is);
    const sebepMatch = text.match(/Sebep:\s*(.*?)(?=Öneri:|$)/is);
    const oneriMatch = text.match(/Öneri:\s*(.*)$/is);

    return {
      karar: kararMatch?.[1]?.trim() || "",
      sebep: sebepMatch?.[1]?.trim() || "",
      oneri: oneriMatch?.[1]?.trim() || "",
      raw: text,
    };
  }

  function openHistoryItem(item) {
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function detectRiskSignals() {
    const combinedText =
      `${formData.description} ${formData.reviewsText}`.toLowerCase();

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
    ];

    return signals.filter((signal) => combinedText.includes(signal));
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
      const response = await fetch("http://localhost:5222/api/chat/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatPrompt),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();
      setChatResponse(data.response);
    } catch (error) {
      alert("MindCart Asistan yanıt veremedi. Backend çalışıyor mu kontrol et.");
      console.error("Chat hatası:", error);
    } finally {
      setChatLoading(false);
    }
  }

  const protectedAmount = cooldownItems.reduce(
    (total, item) => total + Number(item.productPrice || 0),
    0
  );

  const averageScore =
    history.length > 0
      ? Math.round(
          history.reduce((total, item) => total + item.decisionScore, 0) /
            history.length
        )
      : 0;

  const riskSignals = detectRiskSignals();

  return (
    <main className="page">
      <nav className="navbar">
  <div className="brand-block">
    <div className="brand">MindCart AI</div>
    <span>AI Shopping Decision Guard</span>
  </div>

  <div className="agent-badge">
    <span className="pulse-dot"></span>
    AI Agent Active
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
          Ürünü Tara
        </button>

        <button
          type="button"
          className={activePage === "cooldown" ? "active-nav" : ""}
          onClick={() => setActivePage("cooldown")}
        >
          Düşünme Sepeti
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
          MindCart’a Sor
        </button>
      </nav>

      {activePage === "center" && (
        <section className="center-page">
          <section className="hero">
            <p className="tag">AI Alışveriş Karar Merkezi</p>
            <h1>Bu ürün gerçekten iyi mi, yoksa sadece sana mı satılıyor?</h1>
            <p>
              MindCart AI; sahte yorum, fake indirim, manipülatif kampanya dili
              ve dürtüsel alışveriş risklerini analiz eden AI destekli alışveriş
              karar koruma merkezidir.
            </p>
          </section>
          <section className="scan-terminal">
  <div className="terminal-header">
    <span className="terminal-dot red"></span>
    <span className="terminal-dot yellow"></span>
    <span className="terminal-dot green"></span>
    <strong>Live Product Scan</strong>
  </div>

  <div className="terminal-body">
    <p>
      <span>&gt;</span> trendyol cilt bakım serumu 899
    </p>
    <p>
      <span>AI</span> product data prepared...
    </p>
    <p>
      <span>AI</span> manipulation signal detected: “sınırlı stok”
    </p>
    <p>
      <span>AI</span> budget impact calculated...
    </p>
    <p className="terminal-success">
      <span>✓</span> cooldown recommendation ready
    </p>
  </div>
</section>

          <section className="stats-grid">
            <div className="card stat-card">
              <span>Toplam Analiz</span>
              <strong>{history.length}</strong>
            </div>

            <div className="card stat-card">
              <span>Düşünme Sepetindeki Ürün</span>
              <strong>{cooldownItems.length}</strong>
            </div>

            <div className="card stat-card">
              <span>Korunan Riskli Harcama</span>
              <strong>{protectedAmount.toLocaleString("tr-TR")} TL</strong>
            </div>

            <div className="card stat-card">
              <span>Ortalama MindCart Score</span>
              <strong>{averageScore}/100</strong>
            </div>
          </section>

          <section className="card highlight-card">
            <h2>MindCart AI ne yapar?</h2>
            <p>
              MindCart AI sadece analiz yapmaz; yüksek riskli alışverişlerde
              kullanıcıyı 24 saatlik düşünme sürecine yönlendirir. Amaç
              alışverişi engellemek değil, karar kalitesini artırmaktır.
            </p>

            <div className="feature-grid">
  <div>
    <strong>Review Shield</strong>
    <span>Sahte, abartılı ve tekrar eden yorum sinyallerini yakalar.</span>
  </div>

  <div>
    <strong>Manipulation Radar</strong>
    <span>“Sadece bugün”, “sınırlı stok” ve influencer baskısını analiz eder.</span>
  </div>

  <div>
    <strong>Budget Guard</strong>
    <span>Ürün fiyatının kullanıcının bütçesine etkisini ölçer.</span>
  </div>

  <div>
    <strong>Cooldown Agent</strong>
    <span>Riskli alışverişleri 24 saatlik düşünme sürecine yönlendirir.</span>
  </div>
</div>

            <button className="primary" onClick={() => setActivePage("scan")}>
              Ürün Analiz Et
            </button>
          </section>
        </section>
      )}

      {activePage === "scan" && (
        <section className="page-section">
          <section className="hero small-hero">
            <p className="tag">Ürünü Tara</p>
            <h1>Satın almadan önce MindCart AI ile kontrol et.</h1>
            <p>
              Hızlı analiz için ürün adı/linki, fiyat ve bütçe yeterlidir.
              Daha güçlü analiz için açıklama ve yorum ekleyebilirsin.
            </p>
          </section>

          <section className="layout">
            <form className="card form" onSubmit={handleSubmit}>
              <h2>Ürün Analizi</h2>

              <div className="link-fetch-card">
                <h3>Linkten Ürün Verisi Hazırla</h3>
                <p>
                  MVP’de link analizi akıllı demo simülasyonu ile çalışır.
                  Ürünleşme aşamasında e-ticaret API veya browser extension ile
                  otomatik veri çekimi yapılacaktır.
                </p>

                <div className="link-row">
                  <input
                    placeholder="Ürün linki veya ürün adı + fiyat yaz. Örn: trendyol çanta 1500"
                    value={productLink}
                    onChange={(e) => setProductLink(e.target.value)}
                  />
                  <button type="button" onClick={simulateProductFetch}>
                    {fetchingProduct
                      ? "Veriler hazırlanıyor..."
                      : "Ürün Verilerini Getir"}
                  </button>
                </div>
              </div>

              <div className="demo-buttons">
                <button type="button" onClick={fillRiskyProduct}>
                  Riskli Ürün Örneği
                </button>
                <button type="button" onClick={fillSafeProduct}>
                  Güvenli Ürün Örneği
                </button>
              </div>

              <input
                name="productName"
                placeholder="Ürün adı veya link"
                value={formData.productName}
                onChange={handleChange}
                required
              />

              <input
                name="price"
                placeholder="Fiyat"
                type="number"
                value={formData.price}
                onChange={handleChange}
                required
              />

              <input
                name="monthlyBudget"
                placeholder="Aylık bütçe"
                type="number"
                value={formData.monthlyBudget}
                onChange={handleChange}
              />

              <button
                type="button"
                className="secondary"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced
                  ? "Detaylı alanları gizle"
                  : "Detaylı analiz için açıklama ve yorum ekle"}
              </button>

              {showAdvanced && (
                <div className="advanced-fields">
                  <input
                    name="category"
                    placeholder="Kategori — opsiyonel"
                    value={formData.category}
                    onChange={handleChange}
                  />

                  <input
                    name="productUrl"
                    placeholder="Ürün linki — opsiyonel"
                    value={formData.productUrl}
                    onChange={handleChange}
                  />

                  <textarea
                    name="description"
                    placeholder="Opsiyonel: Ürün açıklaması veya kampanya metni"
                    value={formData.description}
                    onChange={handleChange}
                  />

                  <textarea
                    name="reviewsText"
                    placeholder="Opsiyonel: Örnek kullanıcı yorumları"
                    value={formData.reviewsText}
                    onChange={handleChange}
                  />
                </div>
              )}

              <button className="primary" type="submit" disabled={loading}>
                {loading
                  ? "MindCart AI analiz ediyor..."
                  : "Analyze with MindCart AI"}
              </button>
            </form>

            <section className="card result">
              <h2>Analiz Sonucu</h2>

              {!analysis && <p>Henüz analiz yapılmadı.</p>}

              {analysis && (
                <>
                  <div className="score">
                    <span>MindCart Score</span>
                    <strong>{analysis.decisionScore}/100</strong>

                    <div className="decision-badge">
                      Karar: {getDecisionLabel(analysis.decisionScore)}
                    </div>

                    <p>
                      MindCart AI sadece analiz yapmaz; yüksek riskli
                      alışverişlerde kullanıcıyı 24 saatlik düşünme sürecine
                      yönlendirir.
                    </p>
                  </div>

                  <div className="grid">
                    <div>
                      <span>Fake Review Risk</span>
                      <strong>{analysis.fakeReviewRisk}%</strong>
                    </div>
                    <div>
                      <span>Manipulation Risk</span>
                      <strong>{analysis.manipulationRisk}%</strong>
                    </div>
                    <div>
                      <span>Overpriced Risk</span>
                      <strong>{analysis.overpricedRisk}%</strong>
                    </div>
                    <div>
                      <span>Impulse Risk</span>
                      <strong>{analysis.impulseRisk}%</strong>
                    </div>
                  </div>

                  {riskSignals.length > 0 && (
                    <div className="risk-signals">
                      <h3>Tespit Edilen Risk Sinyalleri</h3>
                      <div className="signal-list">
                        {riskSignals.map((signal) => (
                          <span key={signal}>#{signal}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.isCoolDownSuggested && (
                    <div className="warning">
                      24 saatlik düşünme sepeti önerildi.
                      <br />
                      {analysis.coolDownReason}
                    </div>
                  )}

                  <div className="recommendation">
                    <h3>AI Önerisi</h3>

                    {(() => {
                      const parsed = parseRecommendation(
                        analysis.finalRecommendation
                      );

                      if (!parsed.karar && !parsed.sebep && !parsed.oneri) {
                        return <p>{analysis.finalRecommendation}</p>;
                      }

                      return (
                        <div className="recommendation-cards">
                          {parsed.karar && (
                            <div className="recommendation-item">
                              <span>Karar</span>
                              <strong>{parsed.karar}</strong>
                            </div>
                          )}

                          {parsed.sebep && (
                            <div className="recommendation-item">
                              <span>Sebep</span>
                              <p>{parsed.sebep}</p>
                            </div>
                          )}

                          {parsed.oneri && (
                            <div className="recommendation-item">
                              <span>Öneri</span>
                              <p>{parsed.oneri}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </section>
          </section>
        </section>
      )}

      {activePage === "cooldown" && (
        <section className="page-section">
          <section className="hero small-hero">
            <p className="tag">Kilitlenmiş Karar Alanı</p>
            <h1>Acele alışverişleri 24 saat beklet.</h1>
            <p>
              MindCart AI alışverişi engellemez; manipülatif veya dürtüsel risk
              gördüğünde kullanıcıyı daha sağlıklı karar vermesi için düşünme
              sürecine yönlendirir.
            </p>
          </section>

          <section className="vault-summary">
            <div className="card stat-card">
              <span>Aktif Kilitli Ürün</span>
              <strong>{cooldownItems.length}</strong>
            </div>

            <div className="card stat-card">
              <span>Korunan Riskli Harcama</span>
              <strong>{protectedAmount.toLocaleString("tr-TR")} TL</strong>
            </div>

            <div className="card stat-card">
              <span>Karar Modu</span>
              <strong>24 Saat</strong>
            </div>
          </section>

          <section className="cooldown-grid">
            {cooldownItems.length === 0 && (
              <div className="card empty-state">
                <h2>Düşünme sepeti şu an boş</h2>
                <p>
                  Riskli bir ürün analiz edildiğinde burada kilitlenmiş karar
                  kartı olarak görünecek.
                </p>
                <button className="primary" onClick={() => setActivePage("scan")}>
                  Ürün Tara
                </button>
              </div>
            )}

            {cooldownItems.map((item) => (
              <div className="cooldown-card" key={item.id}>
                <div className="lock-icon">🔒</div>

                <div>
                  <span className="cooldown-status">
                    24 saatlik düşünme sürecinde
                  </span>
                  <h2>{item.productName}</h2>
                  <p className="cooldown-price">
                    {item.productPrice} TL · {item.productCategory}
                  </p>
                </div>

                <div className="cooldown-reason">
                  <span>Risk Sebebi</span>
                  <p>{item.reason}</p>
                </div>

                <div className="cooldown-time">
                  <span>Kilit Bitiş Süresi</span>
                  <strong>
                    {new Date(item.lockedUntil).toLocaleString()}
                  </strong>
                </div>
              </div>
            ))}
          </section>
        </section>
      )}

      {activePage === "history" && (
        <section className="page-section">
          <section className="hero small-hero">
            <p className="tag">Karar Geçmişim</p>
            <h1>Daha önce analiz ettiğin ürünlere tekrar dön.</h1>
            <p>
              MindCart AI, alışveriş kararlarını tek seferlik cevap olarak
              bırakmaz; karar geçmişini saklar.
            </p>
          </section>

          <section className="card">
            <h2>Analiz Geçmişi</h2>

            {history.length === 0 && <p>Henüz analiz yok.</p>}

            {history.map((item) => (
              <div className="list-item" key={item.id}>
                <strong>{item.productName}</strong>
                <span>
                  {item.productPrice} TL · Score: {item.decisionScore}/100
                </span>
                <small>{new Date(item.createdAt).toLocaleString()}</small>

                <button
                  type="button"
                  className="small-button"
                  onClick={() => openHistoryItem(item)}
                >
                  Analizi Aç
                </button>
              </div>
            ))}
          </section>
        </section>
      )}

      {activePage === "chat" && (
        <section className="page-section">
          <section className="hero small-hero">
            <p className="tag">MindCart’a Sor</p>
            <h1>Alışveriş kararını MindCart Asistan ile konuş.</h1>
            <p>
              Bütçe, ürün fiyatı veya satın alma zamanı hakkında kısa ve pratik
              tavsiye al.
            </p>
          </section>

          <section className="card chat-card">
            <form onSubmit={handleChatSubmit} className="form">
              <textarea
                placeholder="Örnek: Bütçem 5000 TL, bu klavyeyi şimdi almalıyım mı?"
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
              />

              <button className="primary" type="submit" disabled={chatLoading}>
                {chatLoading ? "MindCart düşünüyor..." : "MindCart’a Sor"}
              </button>
            </form>

            {chatResponse && (
              <div className="recommendation">
                <h3>MindCart Yanıtı</h3>
                <p>{chatResponse}</p>
              </div>
            )}
          </section>
        </section>
      )}
    </main>
  );
}

export default App;