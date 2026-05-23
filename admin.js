const adminState = {
  data: loadStoreData()
};

const adminElements = {
  brandMark: document.getElementById("adminBrandMark"),
  brandName: document.getElementById("adminBrandName"),
  brandForm: document.getElementById("brandForm"),
  saveAllButton: document.getElementById("saveAllButton"),
  productEditorList: document.getElementById("productEditorList"),
  productEditorTemplate: document.getElementById("productEditorTemplate"),
  newProductButton: document.getElementById("newProductButton"),
  exportButton: document.getElementById("exportButton"),
  importInput: document.getElementById("importInput"),
  resetButton: document.getElementById("resetButton")
};

function syncAdminHeader() {
  const { brand } = adminState.data;
  applyBrandTheme(brand);
  adminElements.brandMark.textContent = brand.logoText || brand.name.charAt(0);
  adminElements.brandName.textContent = brand.name;
}

function fillBrandForm() {
  const { brand } = adminState.data;
  Object.entries(brand).forEach(([key, value]) => {
    const field = adminElements.brandForm.elements.namedItem(key);
    if (field) {
      field.value = value;
    }
  });
}

function readBrandForm() {
  const formData = new FormData(adminElements.brandForm);
  return {
    name: String(formData.get("name") || "").trim() || defaultStoreData.brand.name,
    logoText: String(formData.get("logoText") || "").trim().slice(0, 2) || "C",
    whatsapp: String(formData.get("whatsapp") || "").trim(),
    headline: String(formData.get("headline") || "").trim() || defaultStoreData.brand.headline,
    tagline: String(formData.get("tagline") || "").trim() || defaultStoreData.brand.tagline,
    description: String(formData.get("description") || "").trim() || defaultStoreData.brand.description,
    primaryColor: String(formData.get("primaryColor") || defaultStoreData.brand.primaryColor),
    accentColor: String(formData.get("accentColor") || defaultStoreData.brand.accentColor)
  };
}

function renderProductEditors() {
  adminElements.productEditorList.innerHTML = "";

  adminState.data.products.forEach((product) => {
    const fragment = adminElements.productEditorTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".editor-card");
    const title = fragment.querySelector(".editor-product-title");
    const previewImage = fragment.querySelector(".editor-preview-image");
    const removeButton = fragment.querySelector(".remove-editor-product");

    card.dataset.productId = product.id;
    title.textContent = product.name || "Nuevo producto";
    previewImage.src = product.image || FALLBACK_IMAGE;
    previewImage.alt = product.name || "Producto";

    ["name", "category", "price", "description", "image", "active"].forEach((key) => {
      const field = fragment.querySelector(`[name="${key}"]`);
      if (field) {
        field.value = key === "active" ? String(product.active !== false) : product[key] ?? "";
      }
    });

    fragment.querySelector('[name="name"]').addEventListener("input", (event) => {
      title.textContent = event.target.value.trim() || "Nuevo producto";
    });

    fragment.querySelector('[name="image"]').addEventListener("input", (event) => {
      previewImage.src = event.target.value.trim() || FALLBACK_IMAGE;
    });

    fragment.querySelector('[name="imageFile"]').addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const dataUrl = await fileToDataUrl(file);
      fragment.querySelector('[name="image"]').value = dataUrl;
      previewImage.src = dataUrl;
    });

    removeButton.addEventListener("click", () => {
      adminState.data.products = adminState.data.products.filter((item) => item.id !== product.id);
      renderProductEditors();
    });

    adminElements.productEditorList.appendChild(fragment);
  });
}

function collectProductsFromEditors() {
  return Array.from(adminElements.productEditorList.querySelectorAll(".editor-card")).map((card) => {
    const getValue = (name) => card.querySelector(`[name="${name}"]`)?.value ?? "";
    return {
      id: card.dataset.productId || crypto.randomUUID(),
      name: String(getValue("name")).trim() || "Producto sin nombre",
      category: String(getValue("category")).trim() || "General",
      price: Number(getValue("price")) || 0,
      description: String(getValue("description")).trim(),
      image: String(getValue("image")).trim() || FALLBACK_IMAGE,
      active: getValue("active") === "true"
    };
  });
}

function saveAll() {
  adminState.data = saveStoreData({
    brand: readBrandForm(),
    products: collectProductsFromEditors()
  });
  syncAdminHeader();
  fillBrandForm();
  renderProductEditors();
  alert("Cambios guardados.");
}

function addNewProduct() {
  adminState.data.products.unshift({
    id: crypto.randomUUID(),
    name: "Nuevo producto",
    category: "General",
    price: 0,
    description: "",
    image: FALLBACK_IMAGE,
    active: true
  });
  renderProductEditors();
}

function exportCatalog() {
  const blob = new Blob([JSON.stringify({
    brand: readBrandForm(),
    products: collectProductsFromEditors()
  }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "catalogo-digital.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function importCatalog(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    adminState.data = normalizeStoreData(JSON.parse(text));
    fillBrandForm();
    syncAdminHeader();
    renderProductEditors();
    saveStoreData(adminState.data);
    alert("Catalogo importado correctamente.");
  } catch (error) {
    console.error(error);
    alert("No se pudo importar el archivo JSON.");
  } finally {
    event.target.value = "";
  }
}

function restoreDemo() {
  adminState.data = resetStoreData();
  fillBrandForm();
  syncAdminHeader();
  renderProductEditors();
  alert("Se restauraron los datos demo.");
}

function initAdmin() {
  syncAdminHeader();
  fillBrandForm();
  renderProductEditors();

  adminElements.saveAllButton.addEventListener("click", saveAll);
  adminElements.newProductButton.addEventListener("click", addNewProduct);
  adminElements.exportButton.addEventListener("click", exportCatalog);
  adminElements.importInput.addEventListener("change", importCatalog);
  adminElements.resetButton.addEventListener("click", restoreDemo);
  adminElements.brandForm.addEventListener("input", () => {
    const previewBrand = readBrandForm();
    applyBrandTheme(previewBrand);
    adminElements.brandMark.textContent = previewBrand.logoText || previewBrand.name.charAt(0);
    adminElements.brandName.textContent = previewBrand.name;
  });
}

initAdmin();
