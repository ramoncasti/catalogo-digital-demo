const STORAGE_KEY = "catalogo-digital-demo";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80";

const defaultStoreData = {
  brand: {
    name: "La Pasta Fit",
    logoText: "LF",
    whatsapp: "595981000000",
    headline: "Tu catalogo digital para vender por WhatsApp.",
    tagline: "Tu logo, tus colores y tu catalogo actualizado por vos mismo.",
    description:
      "Mostrá tus productos, dejá que tus clientes armen el pedido y recibilo directo por WhatsApp sin depender de terceros.",
    primaryColor: "#ff6b35",
    accentColor: "#14323f"
  },
  products: [
    {
      id: crypto.randomUUID(),
      name: "Ravioles Caseros",
      category: "Pastas",
      price: 25000,
      description: "Rellenos suaves, listos para cocinar y vender con una foto potente.",
      image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80",
      active: true
    },
    {
      id: crypto.randomUUID(),
      name: "Combo Saludable",
      category: "Combos",
      price: 38000,
      description: "Ideal para destacar promos semanales o productos estrella.",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
      active: true
    },
    {
      id: crypto.randomUUID(),
      name: "Salsa Artesanal",
      category: "Salsas",
      price: 18000,
      description: "Cada item puede llevar descripcion, precio, foto y categoria.",
      image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
      active: true
    }
  ]
};

function loadStoreData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStoreData));
      return structuredClone(defaultStoreData);
    }
    const parsed = JSON.parse(raw);
    return normalizeStoreData(parsed);
  } catch (error) {
    console.error("No se pudo leer el catalogo:", error);
    return structuredClone(defaultStoreData);
  }
}

function normalizeStoreData(input) {
  const safeBrand = { ...defaultStoreData.brand, ...(input?.brand || {}) };
  const safeProducts = Array.isArray(input?.products) ? input.products : defaultStoreData.products;

  return {
    brand: safeBrand,
    products: safeProducts.map((product) => ({
      id: product.id || crypto.randomUUID(),
      name: product.name || "Producto sin nombre",
      category: product.category || "General",
      price: Number(product.price) || 0,
      description: product.description || "",
      image: product.image || FALLBACK_IMAGE,
      active: product.active !== false
    }))
  };
}

function saveStoreData(data) {
  const normalized = normalizeStoreData(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  applyBrandTheme(normalized.brand);
  return normalized;
}

function resetStoreData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStoreData));
  applyBrandTheme(defaultStoreData.brand);
  return structuredClone(defaultStoreData);
}

function applyBrandTheme(brand) {
  document.documentElement.style.setProperty("--primary", brand.primaryColor || defaultStoreData.brand.primaryColor);
  document.documentElement.style.setProperty("--accent", brand.accentColor || defaultStoreData.brand.accentColor);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function sanitizePhoneNumber(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
