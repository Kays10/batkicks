const productGrid = document.getElementById("product-grid");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.getElementById("main-nav");
const featuredBrand = document.getElementById("featured-brand");
const featuredName = document.getElementById("featured-name");
const featuredSize = document.getElementById("featured-size");
const totalProducts = document.getElementById("total-products");
let revealObserver;

let products = [];

const money = (value) =>
  `R ${Number(value || 0).toLocaleString("en-ZA")}`;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function whatsappUrl(message) {
  return `https://wa.me/27653399071?text=${encodeURIComponent(message)}`;
}

function assetUrl(filename) {
  return `assets/${encodeURIComponent(String(filename || "").trim())}`;
}

function makePlaceholder(label = "BatKicks") {
  const safe = String(label).replace(/&/g, "&amp;");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="50%" stop-color="#111827"/>
          <stop offset="100%" stop-color="#080b10"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)"/>
      <circle cx="600" cy="420" r="180" fill="none" stroke="#8bb8ff" stroke-width="3"/>
      <circle cx="600" cy="420" r="265" fill="none" stroke="#f09ad8" stroke-width="2"/>
      <text x="600" y="470" text-anchor="middle" fill="#f8fafc" font-size="62" font-family="Arial, sans-serif" font-weight="700">${safe}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function setProductImage(img, filename, label) {
  if (!img) return;
  const url = assetUrl(filename);
  img.alt = label || "BatKicks product";
  img.style.objectFit = "cover";
  img.onerror = () => {
    img.onerror = null;
    img.src = makePlaceholder(label || "BatKicks");
  };
  img.src = url;
}

function updateFeaturedProduct(product) {
  if (!product) return;
  featuredBrand.textContent = product.brand;
  featuredName.textContent = product.product_name;
  featuredSize.textContent = product.size ? `Size ${product.size}` : "One size";
}

function renderProducts(filter = "all") {
  if (!productGrid) {
    console.log('productGrid is null');
    return;
  }

  const visibleProducts =
    filter === "all"
      ? products
      : products.filter((product) => product.brand === filter);

  productGrid.innerHTML = visibleProducts.map((product, index) => {
    const productName = escapeHtml(product.product_name);
    const brand = escapeHtml(product.brand);
    const description = escapeHtml(product.source);
    const sizeLabel = product.size ? `Size ${product.size}` : "One size";
    const message = `Hi Batkicks, I'm interested in ${product.product_name} (Size ${product.size}) listed at ${money(product.price)}. Is it available?`;

    return `
    <article class="product-card reveal" style="--reveal-delay: ${Math.min(index % 3, 2) * 80}ms">
      <div class="product-image-wrap">
        <img alt="${productName}" loading="lazy" decoding="async" />
      </div>
      <div class="product-meta">
        <div class="meta-top">
          <span class="brand-pill">${brand}</span>
          <span class="size-tag">${sizeLabel}</span>
        </div>
        <h3>${productName}</h3>
        <p class="product-description">${description}</p>
        <div class="product-footer">
          <strong class="product-price">${money(product.price)}</strong>
          <a class="product-enquiry primary-button" href="${whatsappUrl(message)}" target="_blank" rel="noopener noreferrer" aria-label="Enquire about ${productName} on WhatsApp">Enquire on WhatsApp</a>
        </div>
      </div>
    </article>
  `;
  }).join("");

  const cards = productGrid.querySelectorAll(".product-card");
  cards.forEach((card, index) => {
    const img = card.querySelector("img");
    const product = visibleProducts[index];
    if (product) setProductImage(img, product.filename, product.product_name);
  });

  observeRevealItems(productGrid);
}

function closeMobileMenu() {
  if (!menuToggle || !mainNav) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  mainNav.classList.remove("is-open");
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation menu" : "Close navigation menu");
    mainNav.classList.toggle("is-open", !isExpanded);
  });

  mainNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMobileMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMobileMenu();
  });
}

function observeRevealItems(root = document) {
  const items = root.querySelectorAll(".reveal:not(.visible)");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("visible"));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
    );
  }

  items.forEach((item) => revealObserver.observe(item));
}

async function loadProducts() {
  try {
    const response = await fetch(`products.txt?v=${Date.now()}`);
    const text = await response.text();

    products = text
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|");
        const [filename, product_name, brand, size, price, ...rest] = parts;
        return {
          filename: String(filename || "").trim(),
          product_name: String(product_name || "").trim(),
          brand: String(brand || "").trim(),
          size: Number(size || 0),
          price: Number(price || 0),
          source: rest.join("|").trim(),
        };
      })
      .filter((product) => product.filename && product.product_name);

    if (totalProducts) {
      totalProducts.textContent = String(products.length);
    }
    renderProducts();

    if (products.length) {
      updateFeaturedProduct(products[0]);
    }
  } catch (error) {
    console.error("Product load failed:", error);
    if (totalProducts) totalProducts.textContent = "0";
    if (productGrid) productGrid.innerHTML = `<p>Error loading products</p>`;
  }
}

// Filter UI removed; all products shown by default
document.documentElement.classList.add("has-motion");
observeRevealItems();
loadProducts();