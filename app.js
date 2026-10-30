/* ========== 茶包小铺 · 交互逻辑 ==========
   纯前端实现：商品渲染、详情弹窗、购物车（localStorage）、
   模拟结算与模拟支付。无任何真实支付或后端请求。 */
(function () {
  'use strict';

  /* ---------- 商品数据（模拟） ---------- */
  var PRODUCTS = [
    {
      id: 'classic',
      name: '经典花果茶礼盒',
      price: 39.9,
      unit: '盒',
      spec: '20包/盒',
      selling: '红茶基底搭配苹果干与橙皮，酸甜清爽，下午茶百搭款。',
      ingredients: '红茶、苹果干、橙皮、玫瑰茄、食用香精（模拟配料）',
      shelfLife: '18个月',
      storage: '阴凉干燥处，避免阳光直射',
      brew: '取1包，注入约200ml的85℃热水，冲泡3-5分钟即可',
      origin: '模拟产地：福建',
      stock: 86,
      emoji: '🍊',
      coverClass: 'cover-1'
    },
    {
      id: 'berry',
      name: '低糖莓果茶礼盒',
      price: 49.9,
      unit: '盒',
      spec: '20包/盒',
      selling: '低糖配方，莓果香气浓郁，控糖期也能放心喝。',
      ingredients: '乌龙茶、草莓干、蓝莓干、玫瑰茄、甜菊叶（模拟配料）',
      shelfLife: '18个月',
      storage: '阴凉干燥处，避免阳光直射',
      brew: '取1包，注入约200ml的85℃热水，冲泡3-5分钟即可',
      origin: '模拟产地：云南',
      stock: 12,
      emoji: '🫐',
      coverClass: 'cover-2'
    },
    {
      id: 'office',
      name: '办公室分享装',
      price: 89.9,
      unit: '箱',
      spec: '60包/箱（3种口味）',
      selling: '整箱混合装，一次集齐三种口味，适合团队分享与企业团购。',
      ingredients: '红茶、乌龙茶、苹果干、橙皮、莓果干、玫瑰茄（模拟配料）',
      shelfLife: '18个月',
      storage: '阴凉干燥处，避免阳光直射',
      brew: '取1包，注入约200ml的85℃热水，冲泡3-5分钟即可',
      origin: '模拟产地：福建/云南',
      stock: 45,
      emoji: '🎁',
      coverClass: 'cover-3'
    }
  ];

  var CART_KEY = 'teabag-shop-cart-v1';

  /* ---------- 工具函数 ---------- */
  function $(sel) { return document.querySelector(sel); }
  function fmt(n) { return '¥' + n.toFixed(1); }
  function getProduct(id) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].id === id) return PRODUCTS[i];
    }
    return null;
  }

  /* ---------- Toast 轻提示 ---------- */
  var toastTimer = null;
  function showToast(msg) {
    var toast = $('#toast');
    toast.textContent = msg;
    toast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 1800);
  }

  /* ---------- 弹窗 / 抽屉 ---------- */
  function openModal(id) {
    $('#' + id).hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id) {
    $('#' + id).hidden = true;
    if ($('#cartDrawer').hidden && $('#detailModal').hidden &&
        $('#checkoutModal').hidden && $('#successModal').hidden) {
      document.body.style.overflow = '';
    }
  }

  document.addEventListener('click', function (e) {
    var closer = e.target.closest('[data-close]');
    if (closer) closeModal(closer.getAttribute('data-close'));
    // 点击遮罩空白处关闭
    if (e.target.classList.contains('modal-mask') || e.target.classList.contains('drawer-mask')) {
      closeModal(e.target.id);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      ['detailModal', 'cartDrawer', 'checkoutModal', 'successModal'].forEach(closeModal);
    }
  });

  /* ---------- 移动端导航 ---------- */
  var navToggle = $('#navToggle');
  var navLinks = $('#navLinks');
  navToggle.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });
  navLinks.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- 渲染商品列表 ---------- */
  function stockLabel(stock) {
    if (stock <= 0) return '<span class="stock-low">暂时缺货</span>';
    if (stock < 20) return '<span class="stock-low">现货紧张（剩 ' + stock + ' 件）</span>';
    return '<span class="stock-in">现货充足（' + stock + ' 件）</span>';
  }

  function renderProducts() {
    var grid = $('#productGrid');
    grid.innerHTML = PRODUCTS.map(function (p) {
      return (
        '<article class="product-card">' +
          '<div class="product-cover ' + p.coverClass + '">' +
            '<span aria-hidden="true">' + p.emoji + '</span>' +
            '<span class="cover-spec">' + p.spec + '</span>' +
          '</div>' +
          '<div class="product-body">' +
            '<h3 class="product-name">' + p.name + '</h3>' +
            '<p class="product-price"><span class="price-num">' + fmt(p.price) + '</span> ' +
              '<span class="price-unit">/ ' + p.unit + '</span></p>' +
            '<p class="product-selling">' + p.selling + '</p>' +
            '<p class="product-stock">' + stockLabel(p.stock) + '</p>' +
            '<div class="product-actions">' +
              '<button class="btn btn-ghost" data-action="detail" data-id="' + p.id + '">查看详情</button>' +
              '<button class="btn btn-primary" data-action="add" data-id="' + p.id + '">加入购物车</button>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  /* ---------- 商品详情弹窗 ---------- */
  function openDetail(id) {
    var p = getProduct(id);
    if (!p) return;
    $('#detailBody').innerHTML =
      '<div class="detail-cover ' + p.coverClass + '"><span aria-hidden="true">' + p.emoji + '</span></div>' +
      '<p class="detail-name">' + p.name + '</p>' +
      '<p class="detail-price">' + fmt(p.price) + ' / ' + p.unit + '</p>' +
      '<p class="detail-row"><b>规格：</b>' + p.spec + '</p>' +
      '<p class="detail-row"><b>卖点：</b>' + p.selling + '</p>' +
      '<p class="detail-row"><b>配料表：</b>' + p.ingredients + '</p>' +
      '<p class="detail-row"><b>保质期：</b>' + p.shelfLife + '</p>' +
      '<p class="detail-row"><b>储存条件：</b>' + p.storage + '</p>' +
      '<p class="detail-row"><b>冲泡方法：</b>' + p.brew + '</p>' +
      '<p class="detail-row"><b>产地：</b>' + p.origin + '</p>' +
      '<p class="detail-row"><b>库存：</b>' + stockLabel(p.stock) + '</p>' +
      '<div class="detail-actions">' +
        '<button class="btn btn-primary btn-block" data-action="add" data-id="' + p.id + '">加入购物车</button>' +
      '</div>';
    openModal('detailModal');
  }

  /* ---------- 购物车（localStorage） ---------- */
  function loadCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var cart = raw ? JSON.parse(raw) : [];
      return Array.isArray(cart) ? cart : [];
    } catch (e) {
      return [];
    }
  }
  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) { /* 私密模式等场景下静默失败 */ }
  }

  function cartCount(cart) {
    return cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }
  function cartTotal(cart) {
    return cart.reduce(function (sum, item) {
      var p = getProduct(item.id);
      return p ? sum + p.price * item.qty : sum;
    }, 0);
  }

  function addToCart(id) {
    var p = getProduct(id);
    if (!p) return;
    var cart = loadCart();
    var found = null;
    cart.forEach(function (item) { if (item.id === id) found = item; });
    if (found) {
      found.qty += 1;
    } else {
      cart.push({ id: id, qty: 1 });
    }
    saveCart(cart);
    updateBadge();
    renderCart();
    showToast('已加入购物车 🛒');
  }

  function changeQty(id, delta) {
    var cart = loadCart();
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id) {
        cart[i].qty += delta;
        if (cart[i].qty <= 0) cart.splice(i, 1); // 数量减到 0 自动移除
        break;
      }
    }
    saveCart(cart);
    updateBadge();
    renderCart();
  }

  function removeItem(id) {
    var cart = loadCart().filter(function (item) { return item.id !== id; });
    saveCart(cart);
    updateBadge();
    renderCart();
  }

  function updateBadge() {
    var badge = $('#cartBadge');
    var n = cartCount(loadCart());
    badge.textContent = n;
    badge.classList.toggle('is-zero', n === 0);
  }

  /* ---------- 渲染购物车抽屉 ---------- */
  var FREE_SHIP = 99;

  function renderCart() {
    var cart = loadCart();
    var body = $('#cartItems');
    var foot = $('#cartFoot');

    if (cart.length === 0) {
      body.innerHTML =
        '<div class="cart-empty">' +
          '<span class="empty-icon">🫖</span>' +
          '<p>购物车还是空的，去挑一盒茶包吧～</p>' +
        '</div>';
      foot.innerHTML = '';
      return;
    }

    body.innerHTML = cart.map(function (item) {
      var p = getProduct(item.id);
      if (!p) return '';
      return (
        '<div class="cart-item">' +
          '<div class="cart-item-cover ' + p.coverClass + '">' + p.emoji + '</div>' +
          '<div class="cart-item-info">' +
            '<p class="cart-item-name">' + p.name + '</p>' +
            '<p class="cart-item-price">单价 ' + fmt(p.price) + ' / ' + p.unit + '</p>' +
            '<div class="qty-ctrl">' +
              '<button class="qty-btn" data-action="dec" data-id="' + p.id + '" aria-label="减少数量">−</button>' +
              '<span class="qty-num">' + item.qty + '</span>' +
              '<button class="qty-btn" data-action="inc" data-id="' + p.id + '" aria-label="增加数量">＋</button>' +
            '</div>' +
          '</div>' +
          '<div class="cart-item-right">' +
            '<span class="cart-item-sub">' + fmt(p.price * item.qty) + '</span>' +
            '<button class="cart-item-del" data-action="remove" data-id="' + p.id + '">删除</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    var total = cartTotal(cart);
    var shipTip = total >= FREE_SHIP
      ? '<p class="ship-tip ok">🎉 已满 ' + FREE_SHIP + ' 元，享受模拟包邮</p>'
      : '<p class="ship-tip">再买 ' + fmt(FREE_SHIP - total) + ' 即可享满 ' + FREE_SHIP + ' 元模拟包邮</p>';

    foot.innerHTML =
      '<div class="cart-total-row"><span>商品合计</span><b>' + fmt(total) + '</b></div>' +
      shipTip +
      '<button class="btn btn-primary btn-block" id="checkoutBtn">去结算</button>';

    $('#checkoutBtn').addEventListener('click', function () {
      closeModal('cartDrawer');
      $('#formError').hidden = true;
      openModal('checkoutModal');
    });
  }

  /* ---------- 全局点击代理（商品卡片 / 购物车按钮） ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    switch (btn.getAttribute('data-action')) {
      case 'add': addToCart(id); break;
      case 'detail': openDetail(id); break;
      case 'inc': changeQty(id, 1); break;
      case 'dec': changeQty(id, -1); break;
      case 'remove': removeItem(id); break;
    }
  });

  /* ---------- 顶部购物车按钮 ---------- */
  $('#cartBtn').addEventListener('click', function () {
    renderCart();
    openModal('cartDrawer');
  });

  /* ---------- 模拟结算 ---------- */
  $('#checkoutForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#coName').value.trim();
    var phone = $('#coPhone').value.trim();
    var addr = $('#coAddr').value.trim();
    var err = $('#formError');

    if (!name || !phone || !addr) {
      err.textContent = '请完整填写姓名、电话和地址后再提交。';
      err.hidden = false;
      return;
    }
    if (!/^1\d{10}$/.test(phone) && !/^[\d\-+ ]{5,20}$/.test(phone)) {
      err.textContent = '电话格式好像不太对，请检查一下。';
      err.hidden = false;
      return;
    }
    err.hidden = true;

    // 模拟支付成功：清空购物车，关闭结算弹窗，弹出成功提示
    saveCart([]);
    updateBadge();
    renderCart();
    closeModal('checkoutModal');
    openModal('successModal');
    $('#checkoutForm').reset();
  });

  /* ---------- 初始化 ---------- */
  renderProducts();
  updateBadge();
  renderCart();
})();
