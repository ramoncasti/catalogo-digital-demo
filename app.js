const storeState = {
  data: loadStoreData(),
  cart: [],
  selectedCategory: "Todos"
};

const elements = {
  brandName: document.getElementById("brandName"),
  brandMark: document.getElementById("brandMark"),
  heroBusinessName: document.getElementById("heroBusinessName"),
  heroTitle: document.getElementById("heroTitle"),
  heroTag: document.getElementById("heroTag"),
  heroDescription: document.getElementById("heroDescription"),
  heroMessage: document.getElementById("heroMessage"),
  productsGrid: document.getElementById("productsGrid"),
  categoryFilters: document.getElementById("categoryFilters"),
  productCardTemplate: document.getElementById("productCardTemplate"),
  cartItemTemplate: document.getElementById("cartItemTemplate"),
  cartButton: document.getElementById("cartButton"),
  cartCount: document.getElementById("cartCount"),
  cartDrawer: document.getElementById("cartDrawer"),
  closeCart: document.getElementById("closeCart"),
  overlay: document.getElementById("overlay"),
  cartItems: document.getElementById("cartItems"),
  subtotalAmount: document.getElementById("subtotalAmount"),
  totalAmount: document.getElementById("totalAmount"),
  checkoutButton: document.getElementById("checkoutButton"),
  emptyState: document.getElementById("emptyState"),
  whatsappNote: document.getElementById("whatsappNote")
};

function syncBrand() {
  const { brand } = storeState.data;
  applyBrandTheme(brand);
  document.title = `${brand.name} | Catalogo Digital`;
  elements.brandName.textContent = brand.name;
  elements.brandMark.textContent = brand.logoText || brand.name.charAt(0);
  elements.heroBusinessName.textContent = brand.name;
  elements.heroTitle.textContent = brand.headline;
  elements.heroTag.textContent = "Tu tienda online autogestionable";
  elements.heroDescription.textContent = brand.description;
  elements.heroMessage.textContent = brand.tagline;
  elements.whatsappNote.textContent = brand.whatsapp
    ? `Los pedidos se enviaran al WhatsApp ${brand.whatsapp}.`
    : "Configurá tu numero de WhatsApp desde el CMS.";
}

function getActiveProducts() {
  return storeState.data.products.filter((product) => product.active);
}

function getFilteredProducts() {
  const products = getActiveProducts();
  if (storeState.selectedCategory === "Todos") {
    return products;
  }
  return products.filter((product) => product.category === storeState.selectedCategory);
}

function renderFilters() {
  const categories = ["Todos", ...new Set(getActiveProducts().map((product) => product.category))];
  elements.categoryFilters.innerHTML = "";

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip${category === storeState.selectedCategory ? " active" : ""}`;
    button.textContent = category;
    button.addEventListener("click", () => {
      storeState.selectedCategory = category;
      renderFilters();
      renderProducts();
    });
    elements.categoryFilters.appendChild(button);
  });
}

function renderProducts() {
  const products = getFilteredProducts();
  elements.productsGrid.innerHTML = "";
  elements.emptyState.classList.toggle("hidden", products.length > 0);

  products.forEach((product) => {
    const fragment = elements.productCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".product-card");
    const image = fragment.querySelector(".product-image");
    const category = fragment.querySelector(".product-category");
    const price = fragment.querySelector(".product-price");
    const name = fragment.querySelector(".product-name");
    const description = fragment.querySelector(".product-description");
    const addButton = fragment.querySelector(".add-to-cart");
    const qtyValue = fragment.querySelector(".qty-value");
    const qtyButtons = fragment.querySelectorAll(".qty-stepper button");

    let quantity = 1;

    image.src = product.image || FALLBACK_IMAGE;
    image.alt = product.name;
    category.textContent = product.category;
    price.textContent = formatCurrency(product.price);
    name.textContent = product.name;
    description.textContent = product.description;

    qtyButtons.forEach((button) => {
      button.addEventListener("click", () => {
        quantity = button.dataset.action === "increase" ? quantity + 1 : Math.max(1, quantity - 1);
        qtyValue.textContent = String(quantity);
      });
    });

    addButton.addEventListener("click", () => {
      addToCart(product.id, quantity);
      card.animate(
        [
          { transform: "translateY(0px)" },
          { transform: "translateY(-4px)" },
          { transform: "translateY(0px)" }
        ],
        { duration: 240, easing: "ease-out" }
      );
    });

    elements.productsGrid.appendChild(fragment);
  });
}

function addToCart(productId, quantity) {
  const existing = storeState.cart.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    storeState.cart.push({ productId, quantity });
  }
  renderCart();
  openCart();
}

function changeCartQuantity(productId, delta) {
  const item = storeState.cart.find((entry) => entry.productId === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    storeState.cart = storeState.cart.filter((entry) => entry.productId !== productId);
  }
  renderCart();
}

function removeCartItem(productId) {
  storeState.cart = storeState.cart.filter((entry) => entry.productId !== productId);
  renderCart();
}

function renderCart() {
  elements.cartItems.innerHTML = "";
  const productsById = new Map(storeState.data.products.map((product) => [product.id, product]));
  let subtotal = 0;
  let itemsCount = 0;

  storeState.cart.forEach((item) => {
    const product = productsById.get(item.productId);
    if (!product) return;

    subtotal += product.price * item.quantity;
    itemsCount += item.quantity;

    const fragment = elements.cartItemTemplate.content.cloneNode(true);
    const image = fragment.querySelector(".cart-item-image");
    const name = fragment.querySelector(".cart-item-name");
    const meta = fragment.querySelector(".cart-item-meta");
    const qtyValue = fragment.querySelector(".qty-value");
    const qtyButtons = fragment.querySelectorAll(".qty-stepper button");
    const removeButton = fragment.querySelector(".remove-item");

    image.src = product.image || FALLBACK_IMAGE;
    image.alt = product.name;
    name.textContent = product.name;
    meta.textContent = `${formatCurrency(product.price)} x ${item.quantity} = ${formatCurrency(product.price * item.quantity)}`;
    qtyValue.textContent = String(item.quantity);

    qtyButtons.forEach((button) => {
      button.addEventListener("click", () => {
        changeCartQuantity(item.productId, button.dataset.action === "increase" ? 1 : -1);
      });
    });

    removeButton.addEventListener("click", () => removeCartItem(item.productId));
    elements.cartItems.appendChild(fragment);
  });

  elements.cartCount.textContent = String(itemsCount);
  elements.subtotalAmount.textContent = formatCurrency(subtotal);
  elements.totalAmount.textContent = formatCurrency(subtotal);
}

function buildWhatsAppMessage() {
  const productsById = new Map(storeState.data.products.map((product) => [product.id, product]));
  const lines = [
    `Hola ${storeState.data.brand.name}, quiero hacer este pedido:`,
    ""
  ];

  storeState.cart.forEach((item) => {
    const product = productsById.get(item.productId);
    if (!product) return;
    lines.push(`- ${item.quantity} x ${product.name} (${formatCurrency(product.price * item.quantity)})`);
  });

  lines.push("");
  lines.push(`Total: ${elements.totalAmount.textContent}`);
  return encodeURIComponent(lines.join("\n"));
}

function checkoutByWhatsApp() {
  if (storeState.cart.length === 0) {
    alert("Tu carrito esta vacio.");
    return;
  }

  const whatsapp = sanitizePhoneNumber(storeState.data.brand.whatsapp);
  if (!whatsapp) {
    alert("Primero configurá un numero de WhatsApp en el CMS.");
    return;
  }

  const message = buildWhatsAppMessage();
  const url = `https://wa.me/${whatsapp}?text=${message}`;
  window.open(url, "_blank");
}

function openCart() {
  elements.cartDrawer.classList.add("open");
  elements.cartDrawer.setAttribute("aria-hidden", "false");
  elements.overlay.classList.remove("hidden");
}

function closeCart() {
  elements.cartDrawer.classList.remove("open");
  elements.cartDrawer.setAttribute("aria-hidden", "true");
  elements.overlay.classList.add("hidden");
}

function initStorefront() {
  syncBrand();
  renderFilters();
  renderProducts();
  renderCart();

  elements.cartButton.addEventListener("click", openCart);
  elements.closeCart.addEventListener("click", closeCart);
  elements.overlay.addEventListener("click", closeCart);
  elements.checkoutButton.addEventListener("click", checkoutByWhatsApp);

  window.addEventListener("storage", () => {
    storeState.data = loadStoreData();
    syncBrand();
    renderFilters();
    renderProducts();
    renderCart();
  });
}

initStorefront();
