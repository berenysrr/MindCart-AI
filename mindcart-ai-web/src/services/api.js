const API_BASE_URL = "http://localhost:5222/api";

export async function analyzeProduct(productData) {
  const response = await fetch(`${API_BASE_URL}/product-analysis/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    throw new Error("Product analysis failed");
  }

  return response.json();
}

export async function getAnalysisHistory() {
  const response = await fetch(`${API_BASE_URL}/product-analysis/history`);

  if (!response.ok) {
    throw new Error("Could not fetch analysis history");
  }

  return response.json();
}

export async function getCooldownItems() {
  const response = await fetch(`${API_BASE_URL}/cooldown/active`);

  if (!response.ok) {
    throw new Error("Could not fetch cooldown items");
  }

  return response.json();
}