import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "catalogo-digital-universal-store";
const STORE_URL = "/store.json";

const fallbackImage =
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80";

const defaultData = {
  store: {
    id: "lapastefit",
    slug: "lapastefit",
    name: "La Pasta Fit",
    logoText: "LF",
    logoUrl: "",
    headline: "Tu catalogo digital para vender por WhatsApp",
    tagline: "Tu logo, tus colores y tu catalogo actualizado por vos mismo.",
    description:
      "Mostrá tus productos, dejá que tus clientes armen el pedido y recibilo directo por WhatsApp sin depender de terceros.",
    whatsapp: "595981000000",
    currency: "PYG",
    locale: "es-PY",
    theme: {
      primaryColor: "#ff7a45",
      accentColor: "#15313d",
      backgroundColor: "#fcfaf6"
    }
  },
  categories: [
    { id: "pastas", slug: "pastas", name: "Pastas", order: 1, active: true },
    { id: "combos", slug: "combos", name: "Combos", order: 2, active: true },
    { id: "salsas", slug: "salsas", name: "Salsas", order: 3, active: true }
  ],
  products: [
    {
      id: "prod_001",
      slug: "ravioles-caseros",
      name: "Ravioles Caseros",
      description: "Rellenos suaves, listos para cocinar y vender con una foto potente.",
      price: 25000,
      compareAtPrice: 30000,
      currency: "PYG",
      imageUrl:
        "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80",
      gallery: [],
      categoryId: "pastas",
      sku: "RAV-001",
      stock: 12,
      active: true,
      featured: true,
      tags: ["casero", "saludable"],
      order: 1
    },
    {
      id: "prod_002",
      slug: "combo-saludable",
      name: "Combo Saludable",
      description: "Ideal para destacar promos semanales o productos estrella.",
      price: 38000,
      compareAtPrice: 0,
      currency: "PYG",
      imageUrl:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
      gallery: [],
      categoryId: "combos",
      sku: "COM-001",
      stock: 8,
      active: true,
      featured: true,
      tags: ["promo"],
      order: 2
    },
    {
      id: "prod_003",
      slug: "salsa-artesanal",
      name: "Salsa Artesanal",
      description: "Cada item puede llevar descripcion, precio, foto y categoria.",
      price: 18000,
      compareAtPrice: 0,
      currency: "PYG",
      imageUrl:
        "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80",
      gallery: [],
      categoryId: "salsas",
      sku: "SAL-001",
      stock: 20,
      active: true,
      featured: false,
      tags: [],
      order: 3
    }
  ]
};

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "general";
}

function ensureCategories(inputCategories, products) {
  const base = Array.isArray(inputCategories) ? [...inputCategories] : [];
  const existingIds = new Set(base.map((category) => category.id));

  products.forEach((product) => {
    const categoryId = product.categoryId || "general";
    if (!existingIds.has(categoryId)) {
      base.push({
        id: categoryId,
        slug: categoryId,
        name: categoryId === "general" ? "General" : categoryId,
        order: base.length + 1,
        active: true
      });
      existingIds.add(categoryId);
    }
  });

  return base;
}

function normalizeData(input) {
  const normalizedProducts = Array.isArray(input?.products)
    ? input.products.map((product, index) => ({
        id: product.id || `prod_${index + 1}`,
        slug: product.slug || slugify(product.name),
        name: product.name || "Producto sin nombre",
        description: product.description || "",
        price: Number(product.price) || 0,
        compareAtPrice: Number(product.compareAtPrice) || 0,
        currency: product.currency || input?.store?.currency || defaultData.store.currency,
        imageUrl: product.imageUrl || product.image || fallbackImage,
        gallery: Array.isArray(product.gallery) ? product.gallery : [],
        categoryId: product.categoryId || slugify(product.category || "general"),
        sku: product.sku || "",
        stock: Number(product.stock) || 0,
        active: product.active !== false,
        featured: Boolean(product.featured),
        tags: Array.isArray(product.tags) ? product.tags : [],
        order: Number(product.order) || index + 1
      }))
    : defaultData.products;

  const normalizedCategories = ensureCategories(input?.categories, normalizedProducts)
    .map((category, index) => ({
      id: category.id || slugify(category.name),
      slug: category.slug || slugify(category.name),
      name: category.name || "General",
      order: Number(category.order) || index + 1,
      active: category.active !== false
    }))
    .sort((a, b) => a.order - b.order);

  return {
    store: {
      ...defaultData.store,
      ...(input?.store || {}),
      theme: {
        ...defaultData.store.theme,
        ...(input?.store?.theme || {})
      }
    },
    categories: normalizedCategories,
    products: normalizedProducts.sort((a, b) => a.order - b.order)
  };
}

function saveData(data) {
  const normalized = normalizeData(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function formatCurrency(value, currency = "PYG", locale = "es-PY") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value || 0);
}

function sanitizePhone(value) {
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

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [view, setView] = useState(() => (window.location.hash === "#admin" ? "admin" : "store"));
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = normalizeData(JSON.parse(saved));
          if (!cancelled) {
            setData(parsed);
            setLoading(false);
          }
          return;
        }

        const response = await fetch(STORE_URL);
        if (!response.ok) {
          throw new Error("No se pudo cargar store.json");
        }

        const json = await response.json();
        const normalized = normalizeData(json);
        if (!cancelled) {
          setData(normalized);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        }
      } catch (fetchError) {
        if (!cancelled) {
          setData(normalizeData(defaultData));
          setError("No se pudo leer store.json. Se cargó la demo local.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setView(window.location.hash === "#admin" ? "admin" : "store");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!data) return;
    document.documentElement.style.setProperty("--brand-primary", data.store.theme.primaryColor);
    document.documentElement.style.setProperty("--brand-accent", data.store.theme.accentColor);
    document.title = `${data.store.name} | Catalogo Digital`;
  }, [data]);

  const categoryMap = useMemo(() => {
    if (!data) return new Map();
    return new Map(data.categories.map((category) => [category.id, category]));
  }, [data]);

  const activeProducts = useMemo(() => {
    if (!data) return [];
    return data.products.filter((product) => product.active);
  }, [data]);

  const visibleCategories = useMemo(() => {
    if (!data) return [];
    return data.categories.filter((category) => category.active);
  }, [data]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return activeProducts;
    return activeProducts.filter((product) => product.categoryId === selectedCategory);
  }, [activeProducts, selectedCategory]);

  const cartItems = useMemo(() => {
    if (!data) return [];
    const productMap = new Map(data.products.map((product) => [product.id, product]));
    return cart
      .map((item) => {
        const product = productMap.get(item.productId);
        if (!product) return null;
        return {
          ...item,
          product,
          total: product.price * item.quantity
        };
      })
      .filter(Boolean);
  }, [cart, data]);

  const totals = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => {
        acc.items += item.quantity;
        acc.amount += item.total;
        return acc;
      },
      { items: 0, amount: 0 }
    );
  }, [cartItems]);

  function updateData(nextData) {
    setData(saveData(nextData));
  }

  function addToCart(productId, quantity) {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...current, { productId, quantity }];
    });
    setCartOpen(true);
  }

  function updateCartItem(productId, delta) {
    setCart((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeCartItem(productId) {
    setCart((current) => current.filter((item) => item.productId !== productId));
  }

  function exportJson() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "store-universal.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(file) {
    if (!file) return;
    const text = await file.text();
    updateData(normalizeData(JSON.parse(text)));
  }

  function resetDemo() {
    updateData(defaultData);
  }

  function openWhatsAppOrder() {
    if (!data) return;
    if (cartItems.length === 0) {
      alert("Tu carrito esta vacio.");
      return;
    }
    const phone = sanitizePhone(data.store.whatsapp);
    if (!phone) {
      alert("Primero configurá un numero de WhatsApp en el CMS.");
      return;
    }
    const lines = [
      `Hola ${data.store.name}, quiero hacer este pedido:`,
      "",
      ...cartItems.map(
        (item) =>
          `- ${item.quantity} x ${item.product.name} (${formatCurrency(item.total, item.product.currency, data.store.locale)})`
      ),
      "",
      `Total: ${formatCurrency(totals.amount, data.store.currency, data.store.locale)}`
    ];
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#fcfaf6_0%,#f6efe5_100%)] text-slate-700">
        <p className="text-sm font-medium">Cargando catálogo...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#fcfaf6_0%,#f6efe5_100%)] text-slate-700">
        <p className="text-sm font-medium">No se pudo cargar la tienda.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,122,69,0.18),transparent_28%),linear-gradient(180deg,#fcfaf6_0%,#f6efe5_100%)] text-slate-900">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_85%_20%,rgba(21,49,61,0.12),transparent_20%),radial-gradient(circle_at_20%_10%,rgba(255,122,69,0.18),transparent_28%)]" />
      <div className="mx-auto w-full max-w-[1180px] px-3 py-4 sm:px-4">
        <Header
          store={data.store}
          view={view}
          onStore={() => {
            window.location.hash = "";
            setView("store");
          }}
          onAdmin={() => {
            window.location.hash = "#admin";
            setView("admin");
          }}
          onOpenCart={() => setCartOpen(true)}
        />

        {error ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        ) : null}

        {view === "store" ? (
          <Storefront
            store={data.store}
            categories={visibleCategories}
            categoryMap={categoryMap}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            products={filteredProducts}
            onAddToCart={addToCart}
          />
        ) : (
          <AdminPanel
            data={data}
            onChange={updateData}
            onExport={exportJson}
            onImport={importJson}
            onReset={resetDemo}
          />
        )}
      </div>

      <CartDrawer
        open={cartOpen}
        items={cartItems}
        total={totals.amount}
        store={data.store}
        onClose={() => setCartOpen(false)}
        onIncrease={(productId) => updateCartItem(productId, 1)}
        onDecrease={(productId) => updateCartItem(productId, -1)}
        onRemove={removeCartItem}
        onCheckout={openWhatsAppOrder}
      />

      {view === "store" ? (
        <FloatingCartButton
          count={totals.items}
          total={totals.amount}
          currency={data.store.currency}
          locale={data.store.locale}
          onClick={() => setCartOpen(true)}
        />
      ) : null}
    </div>
  );
}

function Header({ store, view, onStore, onAdmin }) {
  return (
    <header className="mb-4 flex flex-col gap-3 rounded-[24px] border border-white/70 bg-white/70 px-3 py-3 shadow-[0_18px_50px_rgba(21,49,61,0.12)] backdrop-blur sm:mb-5 sm:px-4 sm:py-4 md:flex-row md:items-center md:justify-between md:px-6">
      <button type="button" onClick={onStore} className="flex min-w-0 items-start gap-3 text-left sm:items-center">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--brand-primary),color-mix(in_srgb,var(--brand-primary)_40%,white))] text-base font-extrabold text-white sm:h-12 sm:w-12 sm:text-lg">
          {store.logoText || store.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Catalogo digital</p>
          <h1 className="truncate text-[15px] font-semibold sm:text-lg">{store.name}</h1>
        </div>
      </button>

      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-row sm:flex-wrap md:grid-cols-none">
        <button
          type="button"
          onClick={onStore}
          className={`rounded-full px-4 py-3 text-sm font-semibold transition ${view === "store" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"}`}
        >
          Ver tienda
        </button>
        <button
          type="button"
          onClick={onAdmin}
          className={`rounded-full px-4 py-3 text-sm font-semibold transition ${view === "admin" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"}`}
        >
          Abrir CMS
        </button>
      </div>
    </header>
  );
}

function Storefront({
  store,
  categories,
  categoryMap,
  selectedCategory,
  onCategoryChange,
  products,
  onAddToCart
}) {
  return (
    <main className="space-y-5 pb-10">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/70 bg-white/78 p-5 shadow-[0_18px_50px_rgba(21,49,61,0.12)] backdrop-blur sm:p-6 md:rounded-[32px] md:p-8">
          <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">Tu tienda online autogestionable</p>
          <h2 className="max-w-[10ch] text-[2.35rem] font-extrabold leading-[0.95] sm:max-w-[12ch] sm:text-5xl md:text-6xl">
            {store.headline}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            {store.description}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:flex sm:flex-row">
            <a
              href="#catalogo"
              className="rounded-full bg-[var(--brand-primary)] px-5 py-3 text-center font-semibold text-white shadow-[0_14px_28px_rgba(255,122,69,0.25)]"
            >
              Ver catalogo
            </a>
            <a
              href="#admin"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-center font-semibold text-slate-800"
            >
              Configurar mi tienda
            </a>
          </div>
        </div>

        <aside className="rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(21,49,61,0.92),rgba(30,58,71,0.88))] p-5 text-white shadow-[0_18px_50px_rgba(21,49,61,0.16)] sm:p-6 md:rounded-[32px] md:p-8">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Tu marca</p>
          <h3 className="mt-1 text-2xl font-bold sm:text-3xl">{store.name}</h3>
          <p className="mt-3 text-sm leading-6 text-white/72 sm:leading-7">{store.tagline}</p>
          <ul className="mt-6 space-y-3 text-sm text-white/88">
            <li>Logo y colores propios</li>
            <li>Carrito con pedido directo a WhatsApp</li>
            <li>Fuente de datos compatible con cualquier CMS</li>
          </ul>
        </aside>
      </section>

      <section id="catalogo" className="rounded-[28px] border border-white/70 bg-white/74 p-4 shadow-[0_18px_50px_rgba(21,49,61,0.12)] backdrop-blur sm:p-5 md:rounded-[32px] md:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Catalogo</p>
            <h3 className="mt-1 text-xl font-bold sm:text-2xl md:text-3xl">Productos listos para vender</h3>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => onCategoryChange("all")}
              className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${selectedCategory === "all" ? "bg-[var(--brand-accent)] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${selectedCategory === category.id ? "bg-[var(--brand-accent)] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-14 text-center">
            <h4 className="text-lg font-semibold">No hay productos en esta categoría</h4>
            <p className="mt-2 text-sm text-slate-500">Probá otra categoría o cargá productos desde tu CMS.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={categoryMap.get(product.categoryId)?.name || "General"}
                locale={store.locale}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ProductCard({ product, categoryName, locale, onAddToCart }) {
  return (
    <article className="overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-[0_18px_40px_rgba(21,49,61,0.10)] sm:rounded-[26px]">
      <div className="aspect-[16/10] overflow-hidden bg-slate-100 sm:aspect-[16/11]">
        <img src={product.imageUrl || fallbackImage} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div className="grid gap-3 p-4 sm:p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{categoryName}</span>
          <strong className="text-base text-[var(--brand-accent)]">
            {formatCurrency(product.price, product.currency, locale)}
          </strong>
        </div>
        <h4 className="text-lg font-bold sm:text-xl">{product.name}</h4>
        <p className="text-sm leading-6 text-slate-600">{product.description}</p>
        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Disponible
          </span>
          <button
            type="button"
            onClick={() => onAddToCart(product.id, 1)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-[0_14px_28px_rgba(5,150,105,0.20)] transition hover:bg-emerald-700 sm:w-auto"
          >
            <span className="text-lg leading-none">+</span>
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}

function FloatingCartButton({ count, total, currency, locale, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-4 right-4 z-30 flex items-center gap-3 rounded-full bg-emerald-600 px-4 py-3 text-white shadow-[0_18px_40px_rgba(5,150,105,0.28)] transition hover:bg-emerald-700 md:bottom-6 md:right-6"
      aria-label="Abrir carrito"
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-white/14 text-xl">
        🛒
      </span>
      <span className="flex flex-col items-start text-left">
        <span className="text-sm font-bold leading-none">
          {count > 0 ? `${count} producto${count === 1 ? "" : "s"}` : "Carrito"}
        </span>
        <span className="text-xs text-white/80">
          {count > 0 ? formatCurrency(total, currency, locale) : "Ver pedido"}
        </span>
      </span>
    </button>
  );
}

function CartDrawer({
  open,
  items,
  total,
  store,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/40 transition ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed bottom-0 right-0 z-40 flex h-[85vh] w-full max-w-md flex-col rounded-t-[28px] border border-white/70 bg-white/95 p-4 shadow-[0_-18px_50px_rgba(21,49,61,0.15)] backdrop-blur transition md:top-4 md:right-4 md:h-[calc(100vh-2rem)] md:rounded-[28px] ${open ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-[110%] md:translate-y-0"}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Tu pedido</p>
            <h3 className="text-xl font-bold">Carrito</h3>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700">
            x
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto py-3">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center rounded-[22px] border border-dashed border-slate-200 px-5 text-center">
              <div>
                <h4 className="text-lg font-semibold">Tu carrito está vacío</h4>
                <p className="mt-2 text-sm text-slate-500">Agregá productos para enviar el pedido por WhatsApp.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="grid grid-cols-[56px_1fr] gap-3 border-b border-slate-100 pb-3 sm:grid-cols-[64px_1fr]">
                  <img src={item.product.imageUrl || fallbackImage} alt={item.product.name} className="h-14 w-14 rounded-2xl object-cover sm:h-16 sm:w-16" />
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-semibold">{item.product.name}</h4>
                      <button type="button" onClick={() => onRemove(item.productId)} className="text-sm font-semibold text-red-700">
                        Quitar
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatCurrency(item.product.price, item.product.currency, store.locale)} x {item.quantity} ={" "}
                      {formatCurrency(item.total, item.product.currency, store.locale)}
                    </p>
                    <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-50">
                      <button type="button" onClick={() => onDecrease(item.productId)} className="h-8 w-8 text-slate-700">-</button>
                      <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button type="button" onClick={() => onIncrease(item.productId)} className="h-8 w-8 text-slate-700">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-slate-500">Total</span>
            <strong className="text-lg text-[var(--brand-accent)]">
              {formatCurrency(total, store.currency, store.locale)}
            </strong>
          </div>
          <button
            type="button"
            onClick={onCheckout}
            className="w-full rounded-full bg-[var(--brand-primary)] px-5 py-3 font-semibold text-white shadow-[0_14px_28px_rgba(255,122,69,0.22)]"
          >
            Enviar pedido por WhatsApp
          </button>
          <p className="mt-3 text-xs leading-6 text-slate-500">
            {store.whatsapp
              ? `Los pedidos se enviarán al WhatsApp ${store.whatsapp}.`
              : "Configurá tu número de WhatsApp desde el CMS."}
          </p>
        </div>
      </aside>
    </>
  );
}

function AdminPanel({ data, onChange, onExport, onImport, onReset }) {
  const [draft, setDraft] = useState(data);

  useEffect(() => {
    setDraft(data);
  }, [data]);

  function updateStore(field, value) {
    setDraft((current) => ({
      ...current,
      store: {
        ...current.store,
        [field]: value
      }
    }));
  }

  function updateTheme(field, value) {
    setDraft((current) => ({
      ...current,
      store: {
        ...current.store,
        theme: {
          ...current.store.theme,
          [field]: value
        }
      }
    }));
  }

  function updateCategory(categoryId, field, value) {
    setDraft((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId ? { ...category, [field]: value } : category
      )
    }));
  }

  function addCategory() {
    const id = `cat_${crypto.randomUUID().slice(0, 8)}`;
    setDraft((current) => ({
      ...current,
      categories: [
        ...current.categories,
        { id, slug: id, name: "Nueva categoría", order: current.categories.length + 1, active: true }
      ]
    }));
  }

  function removeCategory(categoryId) {
    setDraft((current) => ({
      ...current,
      categories: current.categories.filter((category) => category.id !== categoryId),
      products: current.products.map((product) =>
        product.categoryId === categoryId ? { ...product, categoryId: "general" } : product
      )
    }));
  }

  function updateProduct(productId, field, value) {
    setDraft((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === productId ? { ...product, [field]: value } : product
      )
    }));
  }

  async function handleProductFile(productId, file) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    updateProduct(productId, "imageUrl", dataUrl);
  }

  function addProduct() {
    setDraft((current) => ({
      ...current,
      products: [
        {
          id: `prod_${crypto.randomUUID().slice(0, 8)}`,
          slug: "nuevo-producto",
          name: "Nuevo producto",
          description: "",
          price: 0,
          compareAtPrice: 0,
          currency: current.store.currency,
          imageUrl: fallbackImage,
          gallery: [],
          categoryId: current.categories[0]?.id || "general",
          sku: "",
          stock: 0,
          active: true,
          featured: false,
          tags: [],
          order: current.products.length + 1
        },
        ...current.products
      ]
    }));
  }

  function removeProduct(productId) {
    setDraft((current) => ({
      ...current,
      products: current.products.filter((product) => product.id !== productId)
    }));
  }

  return (
    <main className="grid gap-5 pb-10">
      <section className="rounded-[28px] border border-white/70 bg-white/78 p-4 shadow-[0_18px_50px_rgba(21,49,61,0.12)] backdrop-blur sm:p-5 md:rounded-[32px] md:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Panel de administracion</p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl md:text-3xl">Modelo universal de tienda</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-row">
            <button type="button" onClick={() => onChange(draft)} className="rounded-full bg-[var(--brand-primary)] px-5 py-3 font-semibold text-white">
              Guardar cambios
            </button>
            <button type="button" onClick={onExport} className="rounded-full border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-800">
              Exportar JSON
            </button>
            <label className="rounded-full border border-slate-200 bg-white px-5 py-3 text-center font-semibold text-slate-800">
              Importar JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(event) => onImport(event.target.files?.[0])}
              />
            </label>
            <button type="button" onClick={onReset} className="rounded-full border border-red-200 bg-red-50 px-5 py-3 font-semibold text-red-700">
              Restaurar mock
            </button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-5">
            <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4 sm:rounded-[26px]">
              <p className="text-sm font-semibold text-slate-900">Store</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Nombre del negocio">
                  <input value={draft.store.name} onChange={(event) => updateStore("name", event.target.value)} className="input" />
                </Field>
                <Field label="Texto del logo">
                  <input value={draft.store.logoText} maxLength={2} onChange={(event) => updateStore("logoText", event.target.value)} className="input" />
                </Field>
                <Field label="Slug">
                  <input value={draft.store.slug} onChange={(event) => updateStore("slug", event.target.value)} className="input" />
                </Field>
                <Field label="WhatsApp">
                  <input value={draft.store.whatsapp} onChange={(event) => updateStore("whatsapp", event.target.value)} className="input" />
                </Field>
                <Field label="Moneda">
                  <input value={draft.store.currency} onChange={(event) => updateStore("currency", event.target.value)} className="input" />
                </Field>
                <Field label="Locale">
                  <input value={draft.store.locale} onChange={(event) => updateStore("locale", event.target.value)} className="input" />
                </Field>
                <Field label="Titulo principal" span>
                  <input value={draft.store.headline} onChange={(event) => updateStore("headline", event.target.value)} className="input" />
                </Field>
                <Field label="Mensaje corto" span>
                  <textarea value={draft.store.tagline} onChange={(event) => updateStore("tagline", event.target.value)} rows="3" className="input" />
                </Field>
                <Field label="Descripcion" span>
                  <textarea value={draft.store.description} onChange={(event) => updateStore("description", event.target.value)} rows="4" className="input" />
                </Field>
                <Field label="Color primario">
                  <input type="color" value={draft.store.theme.primaryColor} onChange={(event) => updateTheme("primaryColor", event.target.value)} className="color-input" />
                </Field>
                <Field label="Color acento">
                  <input type="color" value={draft.store.theme.accentColor} onChange={(event) => updateTheme("accentColor", event.target.value)} className="color-input" />
                </Field>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4 sm:rounded-[26px]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Categorias</p>
                <button type="button" onClick={addCategory} className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                  Nueva categoria
                </button>
              </div>
              <div className="space-y-3">
                {draft.categories.map((category) => (
                  <div key={category.id} className="rounded-[18px] border border-white bg-white p-4 shadow-sm sm:rounded-[20px]">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <strong className="text-sm">{category.name}</strong>
                      <button type="button" onClick={() => removeCategory(category.id)} className="text-sm font-semibold text-red-700">
                        Eliminar
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Nombre">
                        <input value={category.name} onChange={(event) => updateCategory(category.id, "name", event.target.value)} className="input" />
                      </Field>
                      <Field label="Slug">
                        <input value={category.slug} onChange={(event) => updateCategory(category.id, "slug", event.target.value)} className="input" />
                      </Field>
                      <Field label="Order">
                        <input type="number" value={category.order} onChange={(event) => updateCategory(category.id, "order", Number(event.target.value))} className="input" />
                      </Field>
                      <Field label="Activo">
                        <select value={category.active ? "true" : "false"} onChange={(event) => updateCategory(category.id, "active", event.target.value === "true")} className="input">
                          <option value="true">Si</option>
                          <option value="false">No</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4 sm:rounded-[26px]">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-900">Productos</p>
              <button type="button" onClick={addProduct} className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                Nuevo producto
              </button>
            </div>
            <div className="space-y-4">
              {draft.products.map((product) => (
                <article key={product.id} className="rounded-[18px] border border-white bg-white p-4 shadow-sm sm:rounded-[22px]">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Producto</p>
                      <h3 className="text-lg font-semibold">{product.name || "Nuevo producto"}</h3>
                    </div>
                    <button type="button" onClick={() => removeProduct(product.id)} className="text-sm font-semibold text-red-700">
                      Eliminar
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nombre">
                      <input value={product.name} onChange={(event) => updateProduct(product.id, "name", event.target.value)} className="input" />
                    </Field>
                    <Field label="Slug">
                      <input value={product.slug} onChange={(event) => updateProduct(product.id, "slug", event.target.value)} className="input" />
                    </Field>
                    <Field label="Categoria">
                      <select value={product.categoryId} onChange={(event) => updateProduct(product.id, "categoryId", event.target.value)} className="input">
                        {draft.categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                        <option value="general">General</option>
                      </select>
                    </Field>
                    <Field label="Moneda">
                      <input value={product.currency} onChange={(event) => updateProduct(product.id, "currency", event.target.value)} className="input" />
                    </Field>
                    <Field label="Precio">
                      <input type="number" min="0" value={product.price} onChange={(event) => updateProduct(product.id, "price", Number(event.target.value))} className="input" />
                    </Field>
                    <Field label="Precio anterior">
                      <input type="number" min="0" value={product.compareAtPrice} onChange={(event) => updateProduct(product.id, "compareAtPrice", Number(event.target.value))} className="input" />
                    </Field>
                    <Field label="Stock">
                      <input type="number" min="0" value={product.stock} onChange={(event) => updateProduct(product.id, "stock", Number(event.target.value))} className="input" />
                    </Field>
                    <Field label="Activo">
                      <select value={product.active ? "true" : "false"} onChange={(event) => updateProduct(product.id, "active", event.target.value === "true")} className="input">
                        <option value="true">Si</option>
                        <option value="false">No</option>
                      </select>
                    </Field>
                    <Field label="Descripcion" span>
                      <textarea value={product.description} onChange={(event) => updateProduct(product.id, "description", event.target.value)} rows="3" className="input" />
                    </Field>
                    <Field label="URL de imagen" span>
                      <input value={product.imageUrl} onChange={(event) => updateProduct(product.id, "imageUrl", event.target.value)} className="input" />
                    </Field>
                    <Field label="O subir imagen" span>
                      <input type="file" accept="image/*" onChange={(event) => handleProductFile(product.id, event.target.files?.[0])} className="input file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
                    </Field>
                  </div>
                  <div className="mt-4 aspect-[16/6] overflow-hidden rounded-[18px] bg-slate-100">
                    <img src={product.imageUrl || fallbackImage} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, span = false, children }) {
  return (
    <label className={`grid gap-2 text-sm font-medium text-slate-700 ${span ? "sm:col-span-2" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export default App;
