/**
 * BALANCE BITE & PUCHUU - SHARED APPLICATION ENGINE
 * Handles cross-page routing, unified cart state, and culinary recommendations.
 */

(function () {
  'use strict';

  const CART_CURRENCY_VERSION = 'inr-under-500-v2';
  const formatINR = value => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2
  }).format(Number(value) || 0);

  // --- 1. UNIFIED CART SYSTEM ---
  const DEFAULT_CART = [
    {
      id: 'bowl-quinoa-chicken',
      name: 'Warm Quinoa & Roasted Chicken',
      price: 390,
      quantity: 1,
      image: 'Ingredients_filling_wooden_bowl_8cbfab86_1080p_frames/frame_190.jpg',
      vessel: 'Handcrafted Coconut Shell Bowl',
      details: 'Steamed Andean Quinoa, Seared Pastured Chicken, Charred Broccoli, Diced Hass Avocado, Toasted Sesame Seeds',
      macros: '580 kcal • 42g Protein • 38g Carbs • 22g Fats'
    },
    {
      id: 'bowl-green-goddess',
      name: 'Green Goddess Avocado Bowl',
      price: 380,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      vessel: 'Compostable Plant Bowl',
      details: 'Organic Tuscan Kale, Ripe Hass Avocado Fan, Steam-Poached Edamame, Shaved Cucumbers, Herb Goddess Drizzle',
      macros: '490 kcal • 18g Protein • 32g Carbs • 31g Fats'
    },
    {
      id: 'bowl-salmon-teriyaki',
      name: 'Teriyaki Glazed Wild Salmon',
      price: 450,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      vessel: 'Handcrafted Coconut Shell Bowl',
      details: 'Wild Alaskan Sockeye, Forbidden Black Rice, Charred Baby Bok Choy, Rainbow Radish, Nori Strips',
      macros: '610 kcal • 38g Protein • 44g Carbs • 20g Fats'
    }
  ];

  function getCart() {
    try {
      const stored = localStorage.getItem('nourish_cart');
      if (stored) {
        const cart = JSON.parse(stored);
        if (localStorage.getItem('nourish_cart_currency_version') !== CART_CURRENCY_VERSION) {
          const currentMenuPrices = {
            'Warm Quinoa & Roasted Chicken': 390,
            'Signature Quinoa & Chicken Bowl': 390,
            'Green Goddess Avocado Bowl': 380,
            'Teriyaki Glazed Wild Salmon': 450,
            'Mediterranean Falafel Tahini': 350,
            'Organic Kombucha': 100,
            'Extra Avocado Smash': 60,
            'Raw Seed Energy Bites': 90,
            'Sparkling Hibiscus Berry Cooler': 120
          };
          cart.forEach(item => {
            const existing = Number(item.price) || 390;
            item.price = currentMenuPrices[item.name] || Math.min(490, existing);
          });
          localStorage.setItem('nourish_cart', JSON.stringify(cart));
          localStorage.setItem('nourish_cart_currency_version', CART_CURRENCY_VERSION);
        }
        return cart.map(item => ({ ...item, price: Math.min(490, Number(item.price) || 390) }));
      }
    } catch (e) {}
    return DEFAULT_CART;
  }

  function saveCart(cart) {
    try {
      localStorage.setItem('nourish_cart', JSON.stringify(cart));
      localStorage.setItem('nourish_cart_currency_version', CART_CURRENCY_VERSION);
    } catch (e) {}
    updateCartUI();
  }

  function addToCart(item) {
    const cart = getCart();
    const existingIndex = cart.findIndex(i => i.name === item.name);
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += (item.quantity || 1);
    } else {
      cart.push({
        id: 'item-' + Date.now(),
        name: item.name,
        price: Math.min(490, Number(item.price) || 390),
        quantity: item.quantity || 1,
        image: item.image || 'Ingredients_filling_wooden_bowl_8cbfab86_1080p_frames/frame_190.jpg',
        vessel: item.vessel || 'Handcrafted Coconut Shell Bowl',
        details: item.details || 'Custom nutrient-dense wholesome bowl tailored to your vitality.',
        macros: item.macros || '540 kcal • 36g Protein'
      });
    }
    saveCart(cart);
    showToast(`Added "${item.name}" to your bag! 🥗`);
  }

  window.handleQuickAdd = function (name, price) {
    addToCart({
      name: name,
      price: Math.min(490, Number(price) || 390),
      image: 'Ingredients_filling_wooden_bowl_8cbfab86_1080p_frames/frame_190.jpg'
    });
  };

  window.handleCustomBowlAdd = function () {
    const priceEl = document.getElementById('total-price') || document.getElementById('display-price');
    const priceText = priceEl ? priceEl.textContent.replace(/[₹,]/g, '').trim() : '390';
    const price = parseFloat(priceText) || 390;

    addToCart({
      name: 'Custom Chef Crafted Bowl',
      price: price,
      image: 'Ingredients_filling_wooden_bowl_8cbfab86_1080p_frames/frame_190.jpg',
      vessel: 'Handcrafted Coconut Shell Bowl',
      details: 'Custom selected bases, premium proteins, fresh greens, and artisanal dressings.',
      macros: 'Custom Macro Fuel'
    });

    setTimeout(() => {
      window.location.href = 'checkout.html';
    }, 500);
  };

  window.handlePlaceOrder = function () {
    const btn = window.event ? window.event.currentTarget : null;
    if (btn) {
      btn.innerHTML = `<span class="material-symbols-outlined text-[20px] animate-spin">autorenew</span> Saving Demo Order...`;
    }
    setTimeout(() => {
      saveCart([]);
      showToast("Demo order saved on this device. No payment was processed.");
      if (btn) {
        btn.innerHTML = `<span class="material-symbols-outlined text-[20px]">check_circle</span> Demo Order Saved`;
        btn.style.background = '#10b981';
      }
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2200);
    }, 1000);
  };

  function updateCartUI() {
    const cart = getCart();
    const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartSubtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);
    const remainingForFreeDelivery = Math.max(0, 499 - cartSubtotal);
    const progressLabel = document.getElementById('free-delivery-progress-label');
    const progressText = document.querySelector('#free-delivery-progress-label')?.parentElement?.querySelector('.font-label-md');
    const progressBar = document.getElementById('free-delivery-progress-bar');
    if (progressLabel) progressLabel.textContent = remainingForFreeDelivery ? `${formatINR(remainingForFreeDelivery)} to free delivery` : 'Free delivery unlocked';
    if (progressText) progressText.textContent = `${Math.min(100, Math.round(cartSubtotal / 499 * 100))}% reached`;
    if (progressBar) progressBar.style.width = `${Math.min(100, cartSubtotal / 499 * 100)}%`;
    const itemCount = document.getElementById('checkout-item-count');
    if (itemCount) itemCount.textContent = `${totalCount} ${totalCount === 1 ? 'item' : 'items'}`;
    const subtotalCount = document.getElementById('checkout-subtotal-count');
    if (subtotalCount) subtotalCount.textContent = totalCount;

    // Update cart badge in header
    document.querySelectorAll('[data-path="cart"] .rounded-full, .cart-badge-count').forEach(badge => {
      badge.textContent = totalCount;
      badge.style.display = totalCount > 0 ? 'flex' : 'none';
    });

    // If on checkout page, render cart list
    const cartContainer = document.getElementById('checkout-items-list');
    if (cartContainer) {
      renderCheckoutItems(cartContainer, cart);
    }
  }

  function renderCheckoutItems(container, cart) {
    if (cart.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center text-on-surface-variant flex flex-col items-center gap-4">
          <span class="material-symbols-outlined text-5xl opacity-40">local_mall</span>
          <p class="font-headline-sm text-on-surface">Your bag is currently empty.</p>
          <a href="index.html#menu" class="bg-primary text-on-primary font-bold px-6 py-2.5 rounded-full text-sm">
            Browse Seasonal Bowls &rarr;
          </a>
        </div>
      `;
      updateCheckoutTotals(0);
      return;
    }

    let subtotal = 0;
    container.innerHTML = cart.map((item, idx) => {
      const linePrice = item.price * item.quantity;
      subtotal += linePrice;
      return `
        <div class="flex items-center gap-4 py-4 border-b border-surface-container-high last:border-0">
          <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-xl object-cover bg-surface-container" onerror="this.src='Ingredients_filling_wooden_bowl_8cbfab86_1080p_frames/frame_190.jpg'" />
          <div class="flex-1 min-w-0">
            <h4 class="font-headline-sm text-sm font-bold text-on-surface truncate">${item.name}</h4>
            <p class="text-xs text-on-surface-variant line-clamp-1">${item.details}</p>
            <span class="text-xs text-primary font-semibold">${item.vessel}</span>
          </div>
          <div class="flex items-center gap-2">
            <button class="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-highest transition-colors" onclick="window.updateCartItemQty(${idx}, -1)">-</button>
            <span class="font-bold text-sm w-5 text-center">${item.quantity}</span>
            <button class="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-highest transition-colors" onclick="window.updateCartItemQty(${idx}, 1)">+</button>
          </div>
          <div class="text-right min-w-[70px]">
            <span class="font-bold text-sm text-on-surface block">${formatINR(linePrice)}</span>
            <button class="text-xs text-error hover:underline" onclick="window.removeCartItem(${idx})">Remove</button>
          </div>
        </div>
      `;
    }).join('');

    updateCheckoutTotals(subtotal);
  }

  function getGSTSettings() {
    const service = document.getElementById('gst-service-type')?.value || 'restaurant';
    const supply = document.getElementById('gst-supply-type')?.value || 'intra-state';
    return {
      service,
      supply,
      rate: service === 'catering' ? 0.18 : 0.05,
      serviceLabel: service === 'catering' ? 'Specified premises / outdoor catering' : 'Restaurant service'
    };
  }

  function calculateCheckoutTotals(subtotal) {
    const delivery = subtotal === 0 || subtotal >= 499 ? 0 : 90;
    const discount = Math.round(subtotal * (window.balanceBiteDiscount || 0));
    const gstSettings = getGSTSettings();
    const taxableValue = subtotal - discount + delivery;
    const tax = Math.round(taxableValue * gstSettings.rate * 100) / 100;
    const cgst = gstSettings.supply === 'intra-state' ? Math.round(tax / 2 * 100) / 100 : 0;
    const sgst = gstSettings.supply === 'intra-state' ? tax - cgst : 0;
    const igst = gstSettings.supply === 'inter-state' ? tax : 0;
    return { subtotal, discount, delivery, taxableValue, tax, cgst, sgst, igst, total: subtotal - discount + delivery + tax, ...gstSettings };
  }

  function updateCheckoutTotals(subtotal) {
    const totals = calculateCheckoutTotals(subtotal);

    const subtotalEl = document.getElementById('checkout-subtotal');
    const taxEl = document.getElementById('checkout-tax');
    const deliveryEl = document.getElementById('checkout-delivery');
    const totalEl = document.getElementById('checkout-total');

    if (subtotalEl) subtotalEl.textContent = formatINR(totals.subtotal);
    const discountEl = document.getElementById('checkout-discount');
    const discountRow = document.getElementById('checkout-discount-row');
    if (discountEl) discountEl.textContent = `−${formatINR(totals.discount)}`;
    if (discountRow) discountRow.classList.toggle('hidden', totals.discount === 0);
    if (taxEl) taxEl.textContent = formatINR(totals.tax);
    if (deliveryEl) deliveryEl.textContent = totals.delivery === 0 ? 'FREE' : formatINR(totals.delivery);
    if (totalEl) totalEl.textContent = formatINR(totals.total);

    const cgstRow = document.getElementById('checkout-cgst-row');
    const sgstRow = document.getElementById('checkout-sgst-row');
    const igstRow = document.getElementById('checkout-igst-row');
    const taxLabel = document.getElementById('gst-total-label');
    const ratePercent = (totals.rate * 100).toString();
    const halfRate = (totals.rate * 50).toString();
    if (taxLabel) taxLabel.textContent = `GST estimate (${ratePercent}%)`;
    if (cgstRow) cgstRow.classList.toggle('hidden', totals.supply !== 'intra-state');
    if (sgstRow) sgstRow.classList.toggle('hidden', totals.supply !== 'intra-state');
    if (igstRow) igstRow.classList.toggle('hidden', totals.supply !== 'inter-state');
    const cgstLabel = document.getElementById('checkout-cgst-label');
    const sgstLabel = document.getElementById('checkout-sgst-label');
    const igstLabel = document.getElementById('checkout-igst-label');
    if (cgstLabel) cgstLabel.textContent = `CGST (${halfRate}%)`;
    if (sgstLabel) sgstLabel.textContent = `SGST (${halfRate}%)`;
    if (igstLabel) igstLabel.textContent = `IGST (${ratePercent}%)`;
    const cgstAmount = document.getElementById('checkout-cgst');
    const sgstAmount = document.getElementById('checkout-sgst');
    const igstAmount = document.getElementById('checkout-igst');
    if (cgstAmount) cgstAmount.textContent = formatINR(totals.cgst);
    if (sgstAmount) sgstAmount.textContent = formatINR(totals.sgst);
    if (igstAmount) igstAmount.textContent = formatINR(totals.igst);
    const payTotal = document.getElementById('checkout-pay-total');
    if (payTotal) payTotal.textContent = formatINR(totals.total);
  }

  window.generateGSTBill = function () {
    const cart = getCart();
    if (!cart.length) {
      showToast('Add items to your bag before generating a bill.');
      return;
    }
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totals = calculateCheckoutTotals(subtotal);
    const billWindow = window.open('', '_blank');
    if (!billWindow) {
      showToast('Allow pop-ups to open your printable bill.');
      return;
    }
    const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const money = value => formatINR(value);
    const rows = cart.map(item => `
      <tr>
        <td>${escapeHtml(item.name)}<small>${escapeHtml(item.details || '')}</small></td>
        <td>${item.quantity}</td>
        <td>${money(item.price)}</td>
        <td>${money(item.price * item.quantity)}</td>
      </tr>`).join('');
    const taxRows = totals.supply === 'intra-state'
      ? `<tr><td>CGST (${(totals.rate * 50).toString()}%)</td><td colspan="2"></td><td>${money(totals.cgst)}</td></tr><tr><td>SGST (${(totals.rate * 50).toString()}%)</td><td colspan="2"></td><td>${money(totals.sgst)}</td></tr>`
      : `<tr><td>IGST (${(totals.rate * 100).toString()}%)</td><td colspan="2"></td><td>${money(totals.igst)}</td></tr>`;
    const date = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
    billWindow.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Balance Bite — Bill Preview</title><style>
      *{box-sizing:border-box}body{font:14px/1.5 Arial,sans-serif;color:#1b1c1a;margin:0;padding:32px;background:#f5f3f0}.bill{max-width:760px;margin:auto;background:#fff;padding:36px;border-radius:12px}.top{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #204e2b;padding-bottom:18px}.brand{font-size:25px;font-weight:700;color:#204e2b}.muted{color:#626b63;font-size:12px}h1{font-size:20px;margin:22px 0 4px}table{width:100%;border-collapse:collapse;margin:22px 0}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #e4e2df}th:last-child,td:last-child{text-align:right}td:nth-child(2),td:nth-child(3){text-align:right}small{display:block;color:#626b63;margin-top:3px}.totals{width:min(340px,100%);margin-left:auto}.totals p{display:flex;justify-content:space-between;margin:8px 0}.grand{font-size:18px;font-weight:700;border-top:2px solid #204e2b;padding-top:12px}.notice{margin-top:24px;padding:12px;background:#fff4df;border-radius:8px;color:#573d0a;font-size:12px}.print{display:block;margin:20px auto 0;padding:11px 18px;border:0;border-radius:24px;background:#204e2b;color:white;font-weight:700;cursor:pointer}@media print{body{padding:0;background:white}.bill{max-width:none;border-radius:0}.print{display:none}}
      </style></head><body><main class="bill"><div class="top"><div><div class="brand">Balance Bite</div><div class="muted">Restaurant bill preview</div></div><div class="muted">Reference: BB-PREVIEW-${Date.now()}<br>Generated: ${escapeHtml(date)}</div></div><h1>Order bill preview</h1><div class="muted">Service category: ${escapeHtml(totals.serviceLabel)} (${(totals.rate * 100).toString()}% GST)<br>Tax treatment: ${totals.supply === 'intra-state' ? 'Intra-state supply' : 'Inter-state supply'}</div><table><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><p><span>Item subtotal</span><span>${money(totals.subtotal)}</span></p>${totals.discount ? `<p><span>Promo discount</span><span>−${money(totals.discount)}</span></p>` : ''}<p><span>Delivery</span><span>${money(totals.delivery)}</span></p><p><span>Taxable value (estimated)</span><span>${money(totals.taxableValue)}</span></p>${taxRows}<p><span>Total GST</span><span>${money(totals.tax)}</span></p><p class="grand"><span>Total</span><span>${money(totals.total)}</span></p></div><div class="notice"><strong>Estimate only — not a statutory GST tax invoice.</strong><br>Merchant legal name, address, GSTIN and state details are not configured. Menu prices are introductory demonstration amounts; use the applicable valuation and transaction details for statutory billing. Standard restaurant service is shown at 5% without input tax credit by default; specified-premises restaurant service and outdoor catering can attract 18% in applicable cases. Confirm the actual classification and invoice particulars before issuing a legal invoice.</div><button class="print" onclick="window.print()">Print / Save as PDF</button></main></body></html>`);
    billWindow.document.close();
  };

  window.updateCartItemQty = function (index, delta) {
    const cart = getCart();
    if (cart[index]) {
      cart[index].quantity += delta;
      if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
      }
      saveCart(cart);
    }
  };

  window.removeCartItem = function (index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
  };

  window.applyPromoCode = function () {
    const input = document.getElementById('promo-code');
    const code = input?.value.trim().toUpperCase();
    if (code !== 'BALANCE10') { showToast('Enter a valid promo code.'); return; }
    window.balanceBiteDiscount = 0.10;
    updateCartUI();
    showToast('BALANCE10 applied: 10% off your items.');
  };

  window.addCheckoutAddon = function (name, price, image) {
    addToCart({ name, price, image });
  };

  window.changeDeliveryAddress = function () {
    const previous = localStorage.getItem('balance_bite_delivery_address') || '';
    const address = window.prompt('Enter your delivery address:', previous);
    if (address === null) return;
    const cleanAddress = address.trim();
    if (!cleanAddress) { showToast('Please enter a delivery address.'); return; }
    localStorage.setItem('balance_bite_delivery_address', cleanAddress);
    const title = document.getElementById('checkout-address-title');
    const detail = document.getElementById('checkout-address-detail');
    if (title) title.textContent = 'Delivery address';
    if (detail) detail.textContent = cleanAddress;
  };

  window.joinNewsletter = function (button) {
    const input = button?.parentElement?.querySelector('input[type="email"]');
    if (!input || !input.reportValidity()) return;
    const emails = JSON.parse(localStorage.getItem('balance_bite_newsletter') || '[]');
    if (!emails.includes(input.value.trim())) emails.push(input.value.trim());
    localStorage.setItem('balance_bite_newsletter', JSON.stringify(emails));
    input.value = '';
    showToast('Email saved on this device. Newsletter signup service is not connected yet.');
  };

  window.toggleVesselDetails = function () {
    const details = document.getElementById('vessel-details');
    if (!details) return;
    details.hidden = !details.hidden;
    const button = document.getElementById('vessel-details-toggle');
    if (button) button.textContent = details.hidden ? 'Learn More' : 'Show Less';
  };

  function initMobileNavigation() {
    const toggle = document.querySelector('.mobile-nav-toggle');
    const panel = document.querySelector('.mobile-nav-panel');
    if (!toggle || !panel) return;
    const setOpen = open => {
      panel.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      const icon = toggle.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = open ? 'close' : 'menu';
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    panel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') setOpen(false); });
    document.addEventListener('click', event => { if (!panel.contains(event.target) && !toggle.contains(event.target)) setOpen(false); });
  }

  function initMenuSearch() {
    const search = document.querySelector('input[placeholder="Search bowls, proteins..."]');
    if (!search) return;
    const filterCards = () => {
      const query = search.value.trim().toLowerCase();
      const cards = [...document.querySelectorAll('#bowls-grid .bowl-card')];
      cards.forEach(card => { card.style.display = !query || card.textContent.toLowerCase().includes(query) ? 'flex' : 'none'; });
    };
    search.addEventListener('input', filterCards);
    search.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      const menu = document.getElementById('menu');
      if (menu) menu.scrollIntoView({ behavior: 'smooth' });
      else window.location.href = `index.html?q=${encodeURIComponent(search.value.trim())}#menu`;
    });
    const query = new URLSearchParams(window.location.search).get('q');
    if (query) { search.value = query; filterCards(); }
  }

  function initPaymentChoices() {
    document.querySelectorAll('[data-payment-choice]').forEach(choice => {
      const choose = () => {
        document.querySelectorAll('[data-payment-choice]').forEach(option => {
          option.setAttribute('aria-checked', String(option === choice));
          option.classList.toggle('bg-surface-container-low', option === choice);
          option.classList.toggle('bg-surface-container-lowest', option !== choice);
        });
      };
      choice.addEventListener('click', choose);
      choice.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); } });
    });
  }

  // Toast Notification
  function showToast(message) {
    let toast = document.getElementById('nourish-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'nourish-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 9999;
        background: #204e2b;
        color: #fff;
        padding: 12px 20px;
        border-radius: 9999px;
        font-family: system-ui, sans-serif;
        font-size: 0.88rem;
        font-weight: 600;
        box-shadow: 0 10px 25px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        gap: 8px;
        transform: translateY(100px);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s;
      `;
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<span style="font-size: 1.1rem;">✨</span> ${message}`;
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
    }, 3200);
  }

  // --- 2. CROSS-PAGE NAVIGATION LINKS ---
  function initRouting() {
    const currentPath = window.location.pathname.toLowerCase();

    document.querySelectorAll('[data-path]').forEach(el => {
      const pathType = el.getAttribute('data-path');

      // Set actual href for native SEO and previewing
      if (pathType === 'home') el.setAttribute('href', 'index.html');
      else if (pathType === 'menu-and-bowls') el.setAttribute('href', 'index.html#menu');
      else if (pathType === 'build-your-own') el.setAttribute('href', 'build-your-own.html');
      else if (pathType === 'cart') el.setAttribute('href', 'checkout.html');
      else if (pathType === 'our-philosophy') el.setAttribute('href', 'index.html#philosophy');
      else if (pathType === 'catering') el.setAttribute('href', 'index.html#catering');

      // Intercept click for smooth client transition
      el.addEventListener('click', (e) => {
        if (pathType === 'home') {
          if (currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/')) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else if (pathType === 'menu-and-bowls') {
          if (currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/')) {
            e.preventDefault();
            const target = document.getElementById('menu') || document.querySelector('#bowls-grid');
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    // Make signature bowl cards on home link to bowl-details.html
    document.querySelectorAll('.bowl-card').forEach(card => {
      const heading = card.querySelector('h3');
      if (heading && heading.textContent.includes('Warm Quinoa')) {
        heading.style.cursor = 'pointer';
        heading.addEventListener('click', () => {
          window.location.href = 'bowl-details.html';
        });
        const img = card.querySelector('img');
        if (img) {
          img.style.cursor = 'pointer';
          img.addEventListener('click', () => {
            window.location.href = 'bowl-details.html';
          });
        }
      }
    });
  }

  // --- 3. AI NUTRITION & BOWL SOMMELIER ---
  function initGeminiAI() {
    // Inject Floating AI Pill
    const trigger = document.createElement('div');
    trigger.id = 'gemini-ai-trigger';
    trigger.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9998;
      background: linear-gradient(135deg, #204e2b 0%, #386641 100%);
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 9999px;
      box-shadow: 0 10px 30px rgba(32, 78, 43, 0.35), 0 0 15px rgba(160, 211, 165, 0.4);
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-family: system-ui, sans-serif;
      font-size: 0.9rem;
      font-weight: 700;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: transform 0.2s, box-shadow 0.2s;
    `;
    trigger.innerHTML = `
      <span style="font-size: 1.25rem;">✨</span>
      <span>Ask Chef Gemini AI</span>
      <span style="background: rgba(255,255,255,0.2); font-size: 0.7rem; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em;">AI Sommelier</span>
    `;
    trigger.addEventListener('mouseenter', () => {
      trigger.style.transform = 'translateY(-2px) scale(1.02)';
      trigger.style.boxShadow = '0 14px 36px rgba(32, 78, 43, 0.45)';
    });
    trigger.addEventListener('mouseleave', () => {
      trigger.style.transform = 'translateY(0) scale(1)';
      trigger.style.boxShadow = '0 10px 30px rgba(32, 78, 43, 0.35)';
    });

    // Inject AI Modal Drawer
    const drawer = document.createElement('div');
    drawer.id = 'gemini-ai-drawer';
    drawer.style.cssText = `
      position: fixed;
      bottom: 84px;
      right: 24px;
      width: 440px;
      max-width: calc(100vw - 48px);
      max-height: 620px;
      background: #ffffff;
      color: #1b1c1a;
      border-radius: 24px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.08);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      transform: translateY(20px) scale(0.95);
      opacity: 0;
      visibility: hidden;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s, visibility 0.3s;
    `;

    drawer.innerHTML = `
      <div style="background: linear-gradient(135deg, #204e2b 0%, #386641 100%); color: #fff; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">✨</div>
          <div>
            <div style="font-weight: 700; font-size: 1rem; letter-spacing: -0.01em;">Chef Gemini AI Sommelier</div>
            <div style="font-size: 0.74rem; opacity: 0.85;">Nutrition Advisor & Custom Bowl Designer</div>
          </div>
        </div>
        <button id="gemini-close-btn" style="background: rgba(255,255,255,0.15); border: none; color: #fff; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem;">&times;</button>
      </div>

      <div id="gemini-messages" style="flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; max-height: 400px; background: #faf9f6;">
        <div style="background: #ffffff; padding: 12px 16px; border-radius: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); font-size: 0.88rem; line-height: 1.5; color: #333;">
          <strong>Hello! I'm Chef Gemini.</strong><br/>
          Tell me your dietary goals, calorie targets, workout routine, or food preferences, and I'll architect your ideal nourishment bowl.
        </div>
        
        <div style="font-size: 0.76rem; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px;">Quick Suggestions:</div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <button class="ai-prompt-btn" style="text-align: left; background: #ffffff; border: 1px solid #e4e2df; padding: 8px 12px; border-radius: 12px; font-size: 0.82rem; cursor: pointer; transition: background 0.2s;" data-prompt="Design a 45g+ protein post-workout bowl with quinoa and charred chicken under 600 kcal.">
            ⚡ High-Protein Post-Workout Bowl (>45g Pro)
          </button>
          <button class="ai-prompt-btn" style="text-align: left; background: #ffffff; border: 1px solid #e4e2df; padding: 8px 12px; border-radius: 12px; font-size: 0.82rem; cursor: pointer; transition: background 0.2s;" data-prompt="Suggest a 100% plant-based vegan bowl rich in healthy fats and prebiotic fiber.">
            🥑 Plant-Based Keto & Fiber Superbowl
          </button>
          <button class="ai-prompt-btn" style="text-align: left; background: #ffffff; border: 1px solid #e4e2df; padding: 8px 12px; border-radius: 12px; font-size: 0.82rem; cursor: pointer; transition: background 0.2s;" data-prompt="What dressing and greens pair best with toasted sesame seeds and avocado?">
            🌿 Dressing & Texture Pairing Advice
          </button>
        </div>
      </div>

      <div style="padding: 12px 16px; background: #ffffff; border-top: 1px solid #e4e2df; display: flex; gap: 8px;">
        <input id="gemini-input" type="text" placeholder="Ask about macros, diet, or recipes..." style="flex: 1; padding: 10px 14px; border: 1px solid #c1c9be; border-radius: 9999px; font-size: 0.88rem; outline: none;" />
        <button id="gemini-send-btn" style="background: #204e2b; color: #fff; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; shrink: 0;">&rarr;</button>
      </div>
    `;

    document.body.appendChild(trigger);
    document.body.appendChild(drawer);

    let isOpen = false;
    function toggleDrawer(open) {
      isOpen = open !== undefined ? open : !isOpen;
      if (isOpen) {
        drawer.style.visibility = 'visible';
        drawer.style.opacity = '1';
        drawer.style.transform = 'translateY(0) scale(1)';
        document.getElementById('gemini-input').focus();
      } else {
        drawer.style.opacity = '0';
        drawer.style.transform = 'translateY(20px) scale(0.95)';
        setTimeout(() => {
          if (!isOpen) drawer.style.visibility = 'hidden';
        }, 300);
      }
    }

    trigger.addEventListener('click', () => toggleDrawer());
    document.getElementById('gemini-close-btn').addEventListener('click', () => toggleDrawer(false));

    // Handle Prompts
    drawer.querySelectorAll('.ai-prompt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-prompt');
        sendUserMessage(text);
      });
    });

    const input = document.getElementById('gemini-input');
    const sendBtn = document.getElementById('gemini-send-btn');

    sendBtn.addEventListener('click', () => {
      const q = input.value.trim();
      if (q) sendUserMessage(q);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        if (q) sendUserMessage(q);
      }
    });

    async function sendUserMessage(text) {
      input.value = '';
      const messagesContainer = document.getElementById('gemini-messages');

      // User Message bubble
      const userBubble = document.createElement('div');
      userBubble.style.cssText = `
        background: #204e2b;
        color: #fff;
        padding: 10px 14px;
        border-radius: 16px 16px 4px 16px;
        align-self: flex-end;
        max-width: 85%;
        font-size: 0.88rem;
        line-height: 1.4;
      `;
      userBubble.textContent = text;
      messagesContainer.appendChild(userBubble);

      // Loading bubble
      const loadingBubble = document.createElement('div');
      loadingBubble.style.cssText = `
        background: #ffffff;
        color: #666;
        padding: 10px 14px;
        border-radius: 16px 16px 16px 4px;
        align-self: flex-start;
        max-width: 85%;
        font-size: 0.85rem;
        box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      loadingBubble.innerHTML = `<span class="animate-spin" style="display:inline-block;">✨</span> Creating your bowl recommendation...`;
      messagesContainer.appendChild(loadingBubble);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      try {
        // Keep recommendations available on static hosting without exposing API credentials.
        const responseText = generateSmartCulinaryFallback(text);

        loadingBubble.remove();

        const aiBubble = document.createElement('div');
        aiBubble.style.cssText = `
          background: #ffffff;
          color: #1b1c1a;
          padding: 14px 16px;
          border-radius: 16px 16px 16px 4px;
          align-self: flex-start;
          max-width: 90%;
          font-size: 0.88rem;
          line-height: 1.5;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border-left: 3px solid #204e2b;
        `;

        // Format markdown bolding nicely
        const formattedHtml = responseText
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n\n/g, '<br/><br/>')
          .replace(/\n/g, '<br/>');

        aiBubble.innerHTML = `
          ${formattedHtml}
          <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #eee; display: flex; gap: 8px;">
            <a href="build-your-own.html" style="background: #204e2b; color: #fff; text-decoration: none; font-size: 0.78rem; font-weight: 700; padding: 6px 14px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
              Build in Customizer &rarr;
            </a>
            <button onclick="window.handleQuickAdd('Chef Gemini Signature Custom Bowl', 490)" style="background: #f5f3f0; border: 1px solid #c1c9be; color: #204e2b; font-size: 0.78rem; font-weight: 700; padding: 6px 14px; border-radius: 9999px; cursor: pointer;">
              + Add to Bag (₹490)
            </button>
          </div>
        `;
        messagesContainer.appendChild(aiBubble);
      } catch (err) {
        loadingBubble.remove();
        const errBubble = document.createElement('div');
        errBubble.style.cssText = `background: #ffdad6; color: #93000a; padding: 10px 14px; border-radius: 12px; font-size: 0.84rem;`;
        errBubble.textContent = "Chef Gemini is in the kitchen preparing fresh batches. Please try again in a moment!";
        messagesContainer.appendChild(errBubble);
      }

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function generateSmartCulinaryFallback(query) {
      const q = query.toLowerCase();
      if (q.includes('protein') || q.includes('workout') || q.includes('gym')) {
        return `**The Power Surge Quinoa Bowl**\n\n• **Base:** Steamed Andean Tri-Color Quinoa & Baby Spinach\n• **Protein:** Double Sliced Charred Pastured Chicken (46g protein)\n• **Veggies:** Crisp Steam-Poached Broccoli Crowns & Roasted Peppers\n• **Healthy Fats:** Cubed Haas Avocado & Toasted Sesame Seeds\n• **Dressing:** Lemon-Garlic Herb Tahini Drizzle\n\n**Nutritional Profile:** 590 kcal • 48g Protein • 42g Carbs • 22g Fats\n\n*Chef Tip: Quinoa provides complete plant BCAAs that work synergistically with free-range chicken for optimal muscle recovery.*`;
      } else if (q.includes('plant') || q.includes('vegan') || q.includes('keto')) {
        return `**The Green Goddess Vitality Bowl**\n\n• **Base:** Massaged Tuscan Kale & Cauliflower Rice Pearls\n• **Protein:** Sprouted Chickpea Herb Falafels & Hemp Hearts\n• **Veggies:** Shaved Japanese Cucumbers & Edamame\n• **Healthy Fats:** Half Sliced Haas Avocado Fan\n• **Dressing:** Cold-Pressed Ramp Goddess Herb Vinaigrette\n\n**Nutritional Profile:** 480 kcal • 22g Protein • 26g Carbs • 34g Healthy Fats\n\n*Chef Tip: High in oleic monounsaturated fatty acids and prebiotic plant fibers for clean, steady all-day focus.*`;
      } else {
        return `**The Signature Nourish Harmony Bowl**\n\n• **Base:** Fluffy Ancient Quinoa Pearls\n• **Protein:** Flame-Seared Rosemary Herb Chicken Breast\n• **Veggies:** Bright Emerald Broccoli Crowns\n• **Fats & Crunch:** Cubed Ripe Hass Avocado & Toasted White Sesame Rain\n• **Dressing:** Citrus Miso Tamari Emulsion\n\n**Nutritional Profile:** 580 kcal • 42g Complete Protein • 38g Complex Carbs • 22g Clean Fats\n\n*Chef Tip: The gentle nutty sweetness of warm quinoa complements the rich buttery texture of fresh avocado.*`;
      }
    }
  }

  // --- INITIALIZE ---
  document.addEventListener('DOMContentLoaded', () => {
    initRouting();
    initMobileNavigation();
    initMenuSearch();
    initPaymentChoices();
    const savedAddress = localStorage.getItem('balance_bite_delivery_address');
    if (savedAddress) {
      const title = document.getElementById('checkout-address-title');
      const detail = document.getElementById('checkout-address-detail');
      if (title) title.textContent = 'Delivery address';
      if (detail) detail.textContent = savedAddress;
    }
    ['gst-service-type', 'gst-supply-type'].forEach(id => {
      const control = document.getElementById(id);
      if (control) control.addEventListener('change', updateCartUI);
    });
    updateCartUI();
    initGeminiAI();
  });

})();
