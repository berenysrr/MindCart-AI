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

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

  return (
    <main className="page">
      <section className="hero">
        <p className="tag">MindCart AI</p>
        <h1>Bu ürün gerçekten iyi mi, yoksa sadece sana mı satılıyor?</h1>
        <p>
          Sahte yorum, fake indirim, manipülatif açıklama ve dürtüsel alışveriş
          risklerini analiz eden AI destekli alışveriş karar koruma sistemi.
        </p>
      </section>

      <section className="layout">
        <form className="card form" onSubmit={handleSubmit}>
          <h2>Ürün Analizi</h2>

          <p className="form-hint">
            Hızlı analiz için ürün adı/linki, fiyat ve bütçe yeterlidir.
            Daha güçlü analiz için açıklama ve yorum ekleyebilirsin.
          </p>

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
                <p>{getDecisionLabel(analysis.decisionScore)}</p>
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

              {analysis.isCoolDownSuggested && (
                <div className="warning">
                  24 saatlik düşünme sepeti önerildi.
                  <br />
                  {analysis.coolDownReason}
                </div>
              )}

              <div className="recommendation">
                <h3>AI Önerisi</h3>
                <p>{analysis.finalRecommendation}</p>
              </div>
            </>
          )}
        </section>
      </section>

      <section className="layout">
        <section className="card">
          <h2>24 Saatlik Düşünme Sepeti</h2>

          {cooldownItems.length === 0 && <p>Aktif ürün yok.</p>}

          {cooldownItems.map((item) => (
            <div className="list-item" key={item.id}>
              <strong>{item.productName}</strong>
              <span>
                {item.productPrice} TL · {item.productCategory}
              </span>
              <p>{item.reason}</p>
              <small>
                Kilit bitişi: {new Date(item.lockedUntil).toLocaleString()}
              </small>
            </div>
          ))}
        </section>

        <section className="card">
          <h2>Son Analizler</h2>

          {history.length === 0 && <p>Henüz analiz yok.</p>}

          {history.slice(0, 5).map((item) => (
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
    </main>
  );
}

export default App;