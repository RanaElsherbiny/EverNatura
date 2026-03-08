// Smooth scroll
function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  // Offset-aware scrolling (works better with sticky header)
  const header = document.querySelector('.header');
  const headerH = header ? header.offsetHeight : 0;
  const rect = el.getBoundingClientRect();
  const absoluteTop = rect.top + window.pageYOffset;
  const target = absoluteTop - (headerH + 8);
  window.scrollTo({ top: target, behavior: 'smooth' });
}


// ===== Modal =====
const modal = document.getElementById('modal');
const media = document.getElementById('modal-media');
const title = document.getElementById('modal-title');
const text = document.getElementById('modal-text');
let modalProduct = null;

function openModal(id, name, img, desc, price) {
  title.textContent = name;
  text.textContent = `${desc} — USD ${price}`;
  media.style.backgroundImage = `url('${img}')`;

  const cleanId = String(id).toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-');

  modalProduct = {
    id: cleanId,
    name,
    price: Number(price),
    img: img.split('?')[0],
  };

  modal.classList.add('open');
}

function closeModal() {
  modal.classList.remove('open');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ===== Toast =====
const toast = document.getElementById('toast');
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ===== Cart Elements =====
const cartCountEl = document.getElementById('cartCount');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const cartDrawer = document.getElementById('cartDrawer');

// ===== Load Cart from localStorage =====
let cart = JSON.parse(localStorage.getItem('evernatura_cart') || '[]');

function saveCart() {
  localStorage.setItem('evernatura_cart', JSON.stringify(cart));
}

function toggleCart() {
  cartDrawer?.classList.toggle('open');
}

// ===== Helpers =====
function toNumber(n) {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  return Number.isFinite(v) ? v : 0;
}

function formatUSD(n) {
  return `$${(Math.round(toNumber(n) * 100) / 100).toFixed(2)}`;
}

function buildKey(item) {
  return String(item.id).toLowerCase().trim();
}

function cartTotal() {
  return cart.reduce((sum, p) => sum + toNumber(p.price) * p.qty, 0);
}

// ===== Cart Logic =====
function addToCart(item) {
  if (!item || !item.id) return;

  const normalizedId = String(item.id).toLowerCase().trim().replace(/[^a-z0-9-]+/g, '');
  const normalized = {
    id: normalizedId,
    name: item.name || 'Item',
    price: toNumber(item.price),
    img: item.img || '',
    variant: item.variant || '',
  };

  const key = buildKey(normalized);

  const existing = cart.find(p => p.key === key);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...normalized, key, qty: 1 });
  }

  updateCartUI();
  showToast(`${normalized.name} added to cart`);
}

function removeFromCart(key) {
  cart = cart.filter(p => p.key !== key);
  updateCartUI();
}

function changeQty(key, delta) {
  const item = cart.find(p => p.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(p => p.key !== key);
  }
  updateCartUI();
}

function clearCart() {
  cart = [];
  updateCartUI();
}

// ===== Update Cart UI =====
function updateCartUI() {
  saveCart();

  cartCountEl.textContent = cart.reduce((sum, p) => sum + p.qty, 0);

  cartItemsEl.innerHTML = '';
  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="muted">Your cart is empty.</p>';
  } else {
    cart.forEach(p => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.dataset.key = p.key;

      row.innerHTML = `
        <div class="cart-thumb" style="background-image:url('${p.img}')"></div>
        <div>
          <div class="cart-title">${p.name}${p.variant ? ` — ${p.variant}` : ''}</div>
          <div class="cart-meta">${formatUSD(p.price)} · Qty ${p.qty}</div>
          <div class="qty-row">
            <button class="qty-btn" aria-label="Decrease quantity" onclick="changeQty('${p.key}', -1)">−</button>
            <button class="qty-btn" aria-label="Increase quantity" onclick="changeQty('${p.key}', 1)">+</button>
            <button class="remove-btn" onclick="removeFromCart('${p.key}')">Remove</button>
          </div>
        </div>
        <div style="font-weight:700;color:var(--cream);">${formatUSD(p.price * p.qty)}</div>
      `;
      cartItemsEl.appendChild(row);
    });
  }

  cartTotalEl.textContent = formatUSD(cartTotal());
}

// ===== Checkout =====
function checkoutCart() {
  if (cart.length === 0) {
    showToast('Cart is empty');
    return;
  }

  const summary = cart
    .map(p => `${p.name}${p.variant ? ` — ${p.variant}` : ''} × ${p.qty} — ${formatUSD(p.price * p.qty)}`)
    .join('\n');

  alert(
    'Checkout summary:\n\n' +
    summary +
    '\n\nTotal: ' + formatUSD(cartTotal()) +
    '\n\n(Integrate payment here)'
  );
}

// ===== Initialize UI =====
updateCartUI();



// ===== Responsive Menu Toggle =====
document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.querySelector('.menu-toggle');
  const menuEl  = document.getElementById('primary-menu');

  // Toggle the menu open/closed
  if (menuBtn && menuEl) {
    menuBtn.addEventListener('click', () => {
      const open = menuEl.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });

    // Close the menu when clicking a link
    menuEl.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (menuEl.classList.contains('open')) {
          menuEl.classList.remove('open');
          menuBtn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // If cart opens, close the menu to avoid overlap
  const cartBtn = document.querySelector('.cart-icon');
  if (cartBtn && menuEl && menuBtn) {
    cartBtn.addEventListener('click', () => {
      if (menuEl.classList.contains('open')) {
        menuEl.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Close menu with Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuEl?.classList.contains('open')) {
      menuEl.classList.remove('open');
      menuBtn?.setAttribute('aria-expanded', 'false');
    }
  });
});

// Contact form 
function submitContact(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  showToast(`Thanks, ${name}. We’ll reach you at ${email}.`);
  e.target.reset();
}
