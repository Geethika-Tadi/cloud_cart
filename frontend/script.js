// ════════════════════════════════════════════
// API CONFIG  (backend PHP files, same server)
// ════════════════════════════════════════════
const API = {
  products: 'products.php',
  cart:     'cart.php',
  wishlist: 'wishlist.php',
  login:    'login.php',
  register: 'register.php',
  logout:   'logout.php',
  orders:   'orders.php',
  checkout: 'checkout.php',
};

async function apiGet(url){
  try{
    const res = await fetch(url, {credentials:'same-origin'});
    const data = await res.json().catch(()=>({success:false,error:'Bad response from server'}));
    return {ok: res.ok && data.success, status: res.status, data};
  }catch(e){
    return {ok:false, status:0, data:{success:false, error:'Network error'}};
  }
}
async function apiPost(url, body){
  try{
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      credentials: 'same-origin',
      body: JSON.stringify(body||{})
    });
    const data = await res.json().catch(()=>({success:false,error:'Bad response from server'}));
    return {ok: res.ok && data.success, status: res.status, data};
  }catch(e){
    return {ok:false, status:0, data:{success:false, error:'Network error'}};
  }
}
// If a call fails because the session expired, bounce back to the login screen
function handleAuthError(data){
  if(data && data.error === 'Please sign in first'){
    document.getElementById('authScreen').style.display='flex';
    showToast('Session expired, please sign in again','red');
    return true;
  }
  return false;
}

// ════════════════════════════════════════════
// DATA  (loaded from products.php)
// ════════════════════════════════════════════
let PRODUCTS = [];

function mapProduct(p){
  return {
    id: Number(p.id),
    name: p.name,
    cat: p.category,
    img: p.image_url,
    price: Number(p.price),
    old: p.old_price ? Number(p.old_price) : null,
    rating: Number(p.rating),
    rev: Number(p.review_count),
    badge: p.badge,
    desc: p.description
  };
}

async function loadProducts(){
  const {ok, data} = await apiGet(API.products);
  if(ok){
    PRODUCTS = data.products.map(mapProduct);
  } else {
    PRODUCTS = [];
    showToast('Could not load products from server','red');
  }
}

// ════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════
let cart    = [];
let wished  = new Set();

function mapCartItem(it){
  return { id:Number(it.product_id), name:it.name, price:Number(it.price), img:it.image_url, qty:Number(it.quantity) };
}
async function loadCartFromServer(){
  const {ok, data} = await apiGet(API.cart);
  cart = ok ? data.items.map(mapCartItem) : [];
  renderCart(); refreshBadges();
}
async function loadWishlistFromServer(){
  const {ok, data} = await apiGet(API.wishlist);
  wished = ok ? new Set(data.items.map(p=>Number(p.id))) : new Set();
  refreshBadges();
}
let cat     = 'All';
let activeProdId = null;
let modalQty     = 1;

// ════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════
function stars(r){ return '★'.repeat(Math.floor(r)) + (r%1>=.5?'½':''); }
function fmtPrice(p){ return '₹' + p.toLocaleString('en-IN'); }
function saveCart(){ localStorage.setItem('qc_cart', JSON.stringify(cart)); }
function saveWish(){ localStorage.setItem('qc_wish', JSON.stringify([...wished])); }

function showToast(msg, type=''){
  const box = document.getElementById('toastBox');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(()=>{ t.style.animation='tOut .22s ease forwards'; setTimeout(()=>t.remove(), 230); }, 2200);
}

// ════════════════════════════════════════════
// BADGES
// ════════════════════════════════════════════
function refreshBadges(){
  const cartN = cart.reduce((s,c)=>s+c.qty,0);
  const cb = document.getElementById('cartBadge');
  const wb = document.getElementById('wishBadge');
  if(cb){ cb.textContent = cartN; cb.classList.remove('pop'); void cb.offsetWidth; if(cartN>0)cb.classList.add('pop'); }
  if(wb) wb.textContent = wished.size;
}

// ════════════════════════════════════════════
// PRODUCT GRID
// ════════════════════════════════════════════
function setCat(c, btn){
  cat = c;
  document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  filterProducts();
}

function filterProducts(){
  const q    = (document.getElementById('searchInput')?.value||'').toLowerCase();
  const sort = document.getElementById('sortSel')?.value || 'default';
  let list = PRODUCTS.filter(p =>
    (cat==='All'||p.cat===cat) &&
    (p.name.toLowerCase().includes(q)||p.cat.toLowerCase().includes(q))
  );
  if(sort==='asc')    list.sort((a,b)=>a.price-b.price);
  if(sort==='desc')   list.sort((a,b)=>b.price-a.price);
  if(sort==='rating') list.sort((a,b)=>b.rating-a.rating);
  renderGrid(list);
}

function renderGrid(list){
  const grid = document.getElementById('grid');
  const info = document.getElementById('resultInfo');
  if(info) info.innerHTML = `Showing <strong>${list.length}</strong> result${list.length!==1?'s':''} ${cat!=='All'?'in <strong>'+cat+'</strong>':''}`;
  if(!grid) return;
  if(!list.length){
    grid.innerHTML = `<div class="no-results"><div class="icon">🔍</div><h3>No results found</h3><p>Try a different search or category.</p></div>`;
    return;
  }
  grid.innerHTML = list.map((p,i)=>{
    const inCart = cart.some(c=>c.id===p.id);
    const isWish = wished.has(p.id);
    const disc   = p.old ? Math.round((1-p.price/p.old)*100) : 0;
    return `
    <div class="card" style="animation-delay:${i*.04}s" onclick="openProd(${p.id})">
      <div class="card-img">
        <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="fallback" style="display:none">🛍️</div>
        ${p.badge?`<div class="badge ${p.badge.toLowerCase()}">${p.badge}</div>`:''}
      </div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-stars">${stars(p.rating)} <span class="rev">(${p.rev.toLocaleString()})</span></div>
        <div class="card-prime">✈️ Prime FREE Delivery</div>
        <div class="card-price">
          <span class="price-sym">₹</span><span class="price-main">${p.price.toLocaleString()}</span>
          ${p.old?`<span class="price-old">₹${p.old.toLocaleString()}</span><span class="price-disc">-${disc}%</span>`:''}
        </div>
        <div class="card-actions">
          <button class="add-btn ${inCart?'added':''}" onclick="event.stopPropagation();quickAdd(${p.id},this)">${inCart?'✓ Added':'+ Add to Cart'}</button>
          <button class="wish-btn" onclick="event.stopPropagation();toggleWish(${p.id},this)">${isWish?'❤️':'🤍'}</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════════
// WISHLIST
// ════════════════════════════════════════════
async function toggleWish(id, btn){
  const action = wished.has(id) ? 'remove' : 'add';
  const {ok, data} = await apiPost(API.wishlist, {action, product_id:id});
  if(!ok){ if(!handleAuthError(data)) showToast((data&&data.error)||'Could not update wishlist','red'); return; }
  if(action==='remove'){ wished.delete(id); if(btn)btn.textContent='🤍'; showToast('Removed from wishlist','red'); }
  else              { wished.add(id);    if(btn)btn.textContent='❤️'; showToast('Saved to wishlist ❤️'); }
  saveWish(); refreshBadges();
}

function renderWishlist(){
  const body = document.getElementById('wishBody');
  const foot = document.getElementById('wishFoot');
  if(!body) return;
  if(!wished.size){
    body.innerHTML = `<div class="sb-empty"><div class="icon">❤️</div><p>Your wishlist is empty!<br>Tap 🤍 on any product to save it.</p></div>`;
    if(foot) foot.style.display='none'; return;
  }
  if(foot) foot.style.display='';
  const list = PRODUCTS.filter(p=>wished.has(p.id));
  body.innerHTML = list.map(p=>{
    const inCart = cart.some(c=>c.id===p.id);
    return `
    <div class="ci" style="background:#fff;">
      <img class="ci-img" src="${p.img}" alt="${p.name}" onerror="this.style.display='none'">
      <div class="ci-info">
        <div class="ci-name">${p.name}</div>
        <div class="ci-price">${fmtPrice(p.price)}</div>
        <button onclick="wishToCart(${p.id})" style="margin-top:6px;background:${inCart?'var(--green)':'var(--orange)'};border:none;border-radius:50px;padding:5px 13px;font-size:.72rem;font-weight:700;color:${inCart?'#fff':'var(--navy)'};cursor:pointer;font-family:'Nunito',sans-serif;">${inCart?'✓ In Cart':'+ Add to Cart'}</button>
      </div>
      <button class="ci-del" onclick="removeWish(${p.id})">🗑</button>
    </div>`;
  }).join('');
}

async function wishToCart(id){
  const p = PRODUCTS.find(x=>x.id===id);
  const ok = await addToCart(p,1);
  if(!ok) return;
  renderWishlist(); showToast(`${p.name.split(' ')[0]} added to cart!`,'green');
}
async function addAllToCart(){
  const ids = [...wished];
  for(const id of ids){
    const p = PRODUCTS.find(x=>x.id===id);
    if(p) await addToCart(p,1);
  }
  showToast('All wishlist items added to cart! 🛒','green'); renderWishlist();
}
async function removeWish(id){
  const {ok, data} = await apiPost(API.wishlist, {action:'remove', product_id:id});
  if(!ok){ if(!handleAuthError(data)) showToast((data&&data.error)||'Could not update wishlist','red'); return; }
  wished.delete(id); saveWish(); refreshBadges(); renderWishlist(); filterProducts();
  showToast('Removed from wishlist','red');
}
async function clearWishlist(){
  const ids = [...wished];
  for(const id of ids){ await apiPost(API.wishlist, {action:'remove', product_id:id}); }
  wished.clear(); saveWish(); refreshBadges(); renderWishlist(); filterProducts();
  showToast('Wishlist cleared','red');
}

// ════════════════════════════════════════════
// CART
// ════════════════════════════════════════════
async function quickAdd(id, btn){
  const p = PRODUCTS.find(x=>x.id===id);
  const ok = await addToCart(p,1);
  if(!ok) return;
  if(btn){ btn.textContent='✓ Added'; btn.classList.add('added'); }
  showToast('Added to cart!','green');
}

async function addToCart(p, n){
  const {ok, data} = await apiPost(API.cart, {action:'add', product_id:p.id, quantity:n});
  if(!ok){ if(!handleAuthError(data)) showToast((data&&data.error)||'Could not add to cart','red'); return false; }
  const i = cart.findIndex(c=>c.id===p.id);
  if(i>-1) cart[i].qty += n;
  else cart.push({id:p.id, name:p.name, price:p.price, img:p.img, qty:n});
  saveCart(); renderCart(); refreshBadges();
  return true;
}

async function removeFromCart(id){
  const {ok, data} = await apiPost(API.cart, {action:'remove', product_id:id});
  if(!ok){ if(!handleAuthError(data)) showToast((data&&data.error)||'Could not remove item','red'); return; }
  cart = cart.filter(c=>c.id!==id);
  saveCart(); renderCart(); refreshBadges(); filterProducts();
  showToast('Removed from cart','red');
}

async function changeCartQty(id, d){
  const i = cart.findIndex(c=>c.id===id);
  if(i<0) return;
  const newQty = Math.max(1, cart[i].qty+d);
  const {ok, data} = await apiPost(API.cart, {action:'update', product_id:id, quantity:newQty});
  if(!ok){ if(!handleAuthError(data)) showToast((data&&data.error)||'Could not update quantity','red'); return; }
  cart[i].qty = newQty;
  saveCart(); renderCart(); refreshBadges();
}

async function clearCart(){
  const {ok, data} = await apiPost(API.cart, {action:'clear'});
  if(!ok){ if(!handleAuthError(data)) showToast((data&&data.error)||'Could not clear cart','red'); return; }
  cart=[]; saveCart(); renderCart(); refreshBadges(); filterProducts();
  showToast('Cart cleared','red');
}

function renderCart(){
  const body = document.getElementById('cartBody');
  const foot = document.getElementById('cartFoot');
  if(!body) return;
  if(!cart.length){
    body.innerHTML=`<div class="sb-empty"><div class="icon">🛒</div><p>Your cart is empty!<br>Start adding some products.</p></div>`;
    if(foot) foot.style.display='none'; return;
  }
  if(foot) foot.style.display='';
  body.innerHTML = cart.map(item=>`
    <div class="ci">
      <img class="ci-img" src="${item.img}" alt="${item.name}" onerror="this.style.display='none'">
      <div class="ci-info">
        <div class="ci-name">${item.name}</div>
        <div class="ci-price">${fmtPrice(item.price*item.qty)}</div>
        <div class="ci-qty-ctrl">
          <button class="ci-q-btn" onclick="changeCartQty(${item.id},-1)">−</button>
          <span class="ci-q-num">${item.qty}</span>
          <button class="ci-q-btn" onclick="changeCartQty(${item.id},+1)">+</button>
        </div>
      </div>
      <button class="ci-del" onclick="removeFromCart(${item.id})">🗑</button>
    </div>`).join('');
  const total = cart.reduce((s,c)=>s+c.price*c.qty,0);
  const sub = document.getElementById('cartSub');
  const tot = document.getElementById('cartTotal');
  if(sub) sub.textContent = fmtPrice(total);
  if(tot) tot.textContent = fmtPrice(total);
}

// ════════════════════════════════════════════
// PRODUCT MODAL
// ════════════════════════════════════════════
function openProd(id){
  const p = PRODUCTS.find(x=>x.id===id);
  activeProdId=id; modalQty=1;
  const disc = p.old ? Math.round((1-p.price/p.old)*100) : 0;
  document.getElementById('pmImg').innerHTML =
    `<img src="${p.img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">
     ${p.badge?`<div class="badge ${p.badge.toLowerCase()}" style="position:absolute;top:12px;left:12px">${p.badge}</div>`:''}`;
  document.getElementById('pmCat').textContent   = p.cat;
  document.getElementById('pmName').textContent  = p.name;
  document.getElementById('pmStars').textContent = stars(p.rating)+' '+p.rating;
  document.getElementById('pmRevs').textContent  = p.rev.toLocaleString()+' customer reviews';
  document.getElementById('pmDesc').textContent  = p.desc;
  document.getElementById('pmPrice').textContent = fmtPrice(p.price);
  document.getElementById('pmOld').textContent   = p.old ? fmtPrice(p.old) : '';
  document.getElementById('pmSave').textContent  = p.old ? `You save: ${fmtPrice(p.old-p.price)} (${disc}% off)` : '';
  document.getElementById('qtyNum').textContent  = 1;
  const inCart = cart.some(c=>c.id===id);
  const btn = document.getElementById('pmAddBtn');
  btn.textContent = inCart ? '✓ Added to Cart' : '🛒 Add to Cart';
  btn.className   = 'pm-add' + (inCart?' added':'');
  document.getElementById('prodOverlay').classList.add('show');
  document.body.style.overflow='hidden';
}

function changeQty(d){ modalQty=Math.max(1,modalQty+d); document.getElementById('qtyNum').textContent=modalQty; }

async function addFromModal(){
  const p = PRODUCTS.find(x=>x.id===activeProdId);
  const ok = await addToCart(p, modalQty);
  if(!ok) return;
  const btn = document.getElementById('pmAddBtn');
  btn.textContent='✓ Added to Cart'; btn.classList.add('added');
  showToast(`${modalQty>1?modalQty+'× ':''}Added to cart!`,'green');
  filterProducts();
}

async function buyNow(){
  const p = PRODUCTS.find(x=>x.id===activeProdId);
  const ok = await addToCart(p, modalQty);
  if(!ok) return;
  closeProd();
  setTimeout(doCheckout, 200);
}

function closeProd(){
  document.getElementById('prodOverlay').classList.remove('show');
  document.body.style.overflow='';
}

// ════════════════════════════════════════════
// SIDEBARS
// ════════════════════════════════════════════
const SIDEBAR_IDS = ['sideCart','sideWish','sideOrders','sideSettings'];

function openSidebar(which){
  closeAllSidebars();
  const map = {cart:'sideCart', wish:'sideWish', orders:'sideOrders', settings:'sideSettings'};
  const el  = document.getElementById(map[which]);
  if(!el) return;
  el.classList.add('open');
  document.getElementById('sbBg').classList.add('show');
  document.body.style.overflow='hidden';
  if(which==='wish')     renderWishlist();
  if(which==='orders')   renderOrders();
  if(which==='settings') loadProfile();
}

function closeAllSidebars(){
  SIDEBAR_IDS.forEach(id=>{ const el=document.getElementById(id); if(el) el.classList.remove('open'); });
  const bg = document.getElementById('sbBg');
  if(bg) bg.classList.remove('show');
  document.body.style.overflow='';
}

// ════════════════════════════════════════════
// CHECKOUT
// ════════════════════════════════════════════
async function doCheckout(){
  if(!cart.length){ showToast('Your cart is empty!','red'); return; }
  closeAllSidebars();
  const u = JSON.parse(localStorage.getItem('qc_user')||'{}');
  const {ok, data} = await apiPost(API.checkout, {
    payment_method: 'COD',
    address: u.address || '',
    city: '',
    pincode: '',
    phone: u.phone || ''
  });
  if(!ok){ if(!handleAuthError(data)) showToast((data&&data.error)||'Could not place order','red'); return; }
  cart=[]; saveCart(); renderCart(); refreshBadges(); filterProducts();
  document.getElementById('successOverlay').classList.add('show');
  document.body.style.overflow='hidden';
}

function closeSuccess(){
  document.getElementById('successOverlay').classList.remove('show');
  document.body.style.overflow='';
}

// ════════════════════════════════════════════
// ORDERS
// ════════════════════════════════════════════
async function renderOrders(){
  const body = document.getElementById('ordersBody');
  if(!body) return;
  body.innerHTML = `<div class="sb-empty"><p>Loading orders…</p></div>`;
  const {ok, data} = await apiGet(API.orders);
  const empty = `<div class="sb-empty"><div class="icon">📦</div><p style="font-weight:600;font-size:.95rem;color:#333;margin-bottom:6px;">No orders yet!</p><p style="font-size:.82rem;">Once you place an order,<br>it will show up here.</p></div>`;
  if(!ok || !data.orders || !data.orders.length){ body.innerHTML = empty; return; }

  const all = data.orders.map(o=>({
    id: '#QC-'+o.id,
    date: new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),
    status: o.status || 'Processing',
    items: o.items.slice(0,3).map(it=>({img:it.image_url, name:it.name})),
    extra: Math.max(0, o.items.length-3),
    total: fmtPrice(Number(o.total_amount))
  }));

  const scMap  = {Delivered:'s-delivered', Shipped:'s-shipped', Processing:'s-processing', Placed:'s-processing'};
  const iconMap= {Delivered:'✅', Shipped:'🚚', Processing:'⏳', Placed:'⏳'};
  body.innerHTML = all.map(o=>`
    <div class="order-card">
      <div class="order-top">
        <div><div class="order-id">${o.id}</div><div class="order-date">${o.date}</div></div>
        <span class="order-status ${scMap[o.status]||'s-processing'}">${iconMap[o.status]||'⏳'} ${o.status}</span>
      </div>
      <div class="order-thumbs">
        ${o.items.map(it=>`<img class="order-thumb" src="${it.img}" alt="" onerror="this.style.display='none'">`).join('')}
        ${o.extra>0?`<div class="order-thumb-more">+${o.extra}</div>`:''}
      </div>
      <div class="order-foot">
        <div class="order-total">${o.total}</div>
        <div class="order-btns">
          ${o.status==='Delivered'?`<button class="o-btn" onclick="showToast('Return requested!','green')">↩ Return</button>`:''}
          <button class="o-btn pri" onclick="showToast('Tracking info coming soon!','green')">Track</button>
        </div>
      </div>
    </div>`).join('');
}

// ════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════
function loadProfile(){
  const u = JSON.parse(localStorage.getItem('qc_user')||'{}');
  const n=document.getElementById('stName'), e=document.getElementById('stEmail'), p=document.getElementById('stPhone');
  if(n) n.value=u.name||'';
  if(e) e.value=u.email||'';
  if(p) p.value=u.phone||'';
}

function saveProfile(){
  const u = JSON.parse(localStorage.getItem('qc_user')||'{}');
  const n=document.getElementById('stName'), e=document.getElementById('stEmail'), p=document.getElementById('stPhone');
  if(n&&n.value.trim()) u.name  = n.value.trim();
  if(e&&e.value.trim()) u.email = e.value.trim();
  if(p) u.phone = p.value.trim();
  localStorage.setItem('qc_user', JSON.stringify(u));
  applyUser(u);
  showToast('Profile saved! ✅','green');
}

// ════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════
function switchTab(tab){
  document.getElementById('tabLogin').classList.toggle('active',  tab==='login');
  document.getElementById('tabSignup').classList.toggle('active', tab==='signup');
  document.getElementById('panelLogin').classList.toggle('active',  tab==='login');
  document.getElementById('panelSignup').classList.toggle('active', tab==='signup');
  document.getElementById('authHead').textContent = tab==='login' ? 'Welcome back 👋' : 'Create your account 🎉';
  document.getElementById('authSub').textContent  = tab==='login' ? 'Sign in to your QuickCart account to continue shopping.' : 'Join millions of happy shoppers on QuickCart.';
  clearErrs();
}

function clearErrs(){
  document.querySelectorAll('.ferr').forEach(e=>e.classList.remove('show'));
  document.querySelectorAll('.field input').forEach(i=>i.classList.remove('err'));
}
function showErr(errId, inputId){
  const e=document.getElementById(errId), i=document.getElementById(inputId);
  if(e) e.classList.add('show');
  if(i) i.classList.add('err');
}
// Gmail hint — shows warning in real-time while typing
function hintGmail(inputId, errId){
  const val = document.getElementById(inputId)?.value||'';
  const err = document.getElementById(errId);
  if(!err) return;
  if(val.length === 0){ err.classList.remove('show'); return; }
  if(!val.endsWith('@gmail.com') && val.includes('@')){
    err.textContent = 'Only @gmail.com addresses are accepted.';
    err.classList.add('show');
    document.getElementById(inputId).classList.add('err');
  } else {
    err.classList.remove('show');
    document.getElementById(inputId).classList.remove('err');
  }
}
function validEmail(e){ return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(e); }

async function doLogin(){
  clearErrs();
  const email = document.getElementById('lEmail').value.trim();
  const pass  = document.getElementById('lPass').value;
  let ok=true;
  if(!validEmail(email)){ showErr('lEmailErr','lEmail'); ok=false; }
  if(pass.length<6)     { showErr('lPassErr','lPass');   ok=false; }
  if(!ok) return;
  const res = await apiPost(API.login, {email, password: pass});
  if(!res.ok){
    document.getElementById('lPassErr').textContent = res.data.error || 'Incorrect email or password.';
    showErr('lPassErr','lPass');
    return;
  }
  await loginSuccess(res.data.user);
}

async function doSignup(){
  clearErrs();
  const name  = document.getElementById('sName').value.trim();
  const email = document.getElementById('sEmail').value.trim();
  const pass  = document.getElementById('sPass').value;
  const pass2 = document.getElementById('sPass2').value;
  let ok=true;
  if(!name)            { showErr('sNameErr','sName');   ok=false; }
  if(!validEmail(email)){ showErr('sEmailErr','sEmail'); ok=false; }
  if(pass.length<6)    { showErr('sPassErr','sPass');   ok=false; }
  if(pass!==pass2)     { showErr('sPass2Err','sPass2'); ok=false; }
  if(!ok) return;
  const res = await apiPost(API.register, {name, email, password: pass});
  if(!res.ok){
    document.getElementById('sEmailErr').textContent = res.data.error || 'Could not create account.';
    showErr('sEmailErr','sEmail');
    return;
  }
  await loginSuccess(res.data.user);
}

function socialLogin(provider){
  showToast(provider+' sign-in is not available in this demo. Please use email.','red');
}

async function loginSuccess(user){
  localStorage.setItem('qc_user', JSON.stringify(user));
  applyUser(user);
  await Promise.all([loadCartFromServer(), loadWishlistFromServer()]);
  filterProducts();
  showToast(`Welcome, ${user.name.split(' ')[0]}! 👋`,'green');
}

function applyUser(user){
  document.getElementById('authScreen').style.display='none';
  const initial = user.name.charAt(0).toUpperCase();
  const av  = document.getElementById('userAv');
  const dav = document.getElementById('dropAv');
  const un  = document.getElementById('userName');
  const dn  = document.getElementById('dropName');
  const de  = document.getElementById('dropEmail');
  if(av)  av.textContent   = initial;
  if(dav) dav.textContent  = initial;
  if(un)  un.textContent   = user.name.split(' ')[0];
  if(dn)  dn.textContent   = user.name;
  if(de)  de.textContent   = user.email;
}

async function doLogout(){
  await apiPost(API.logout, {});
  localStorage.removeItem('qc_user');
  cart=[]; wished.clear();
  renderCart(); refreshBadges(); filterProducts();
  document.getElementById('authScreen').style.display='flex';
  document.getElementById('lEmail').value='';
  document.getElementById('lPass').value='';
  closeDrop(); closeAllSidebars();
}

function toggleEye(id, btn){
  const inp=document.getElementById(id);
  const show=inp.type==='password';
  inp.type=show?'text':'password';
  btn.textContent=show?'🙈':'👁️';
}

function checkStr(val){
  let sc=0;
  if(val.length>=6)          sc++;
  if(val.length>=10)         sc++;
  if(/[A-Z]/.test(val))      sc++;
  if(/[0-9]/.test(val))      sc++;
  if(/[^A-Za-z0-9]/.test(val)) sc++;
  const cols=['#eee','#e63946','#e63946','#ff9900','#ff9900','#007600'];
  const lbls=['Enter a password','Weak 😟','Weak 😟','Fair 😐','Good 👍','Strong 💪'];
  for(let i=1;i<=5;i++) document.getElementById('s'+i).style.background = i<=sc ? cols[sc] : '#eee';
  const lbl=document.getElementById('strLbl');
  if(lbl){ lbl.textContent=val?lbls[sc]:'Enter a password'; lbl.style.color=cols[sc]==='#eee'?'#aaa':cols[sc]; }
}

// ════════════════════════════════════════════
// DROPDOWN
// ════════════════════════════════════════════
function closeDrop(){ document.getElementById('userDrop').classList.remove('open'); }

// ════════════════════════════════════════════
// BOOT — runs after DOM ready
// ════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function(){
  // Restore dark mode
  if(localStorage.getItem('qc_dark')==='1'){
    document.body.classList.add('dark');
    const btn = document.getElementById('darkToggle');
    if(btn) btn.innerHTML = '☀️ Light';
  }

  // Load product catalog from the server
  await loadProducts();

  // Restore session — verify it's still valid on the server, not just in localStorage
  const saved = localStorage.getItem('qc_user');
  if(saved){
    const user = JSON.parse(saved);
    const cartCheck = await apiGet(API.cart);
    if(cartCheck.ok){
      applyUser(user);
      cart = cartCheck.data.items.map(mapCartItem);
      const wishCheck = await apiGet(API.wishlist);
      if(wishCheck.ok) wished = new Set(wishCheck.data.items.map(p=>Number(p.id)));
    } else {
      localStorage.removeItem('qc_user');
    }
  }

  // Initial render
  filterProducts();
  renderCart();
  refreshBadges();

  // User dropdown toggle
  document.getElementById('userBtn').addEventListener('click', function(e){
    e.stopPropagation();
    document.getElementById('userDrop').classList.toggle('open');
  });

  // Close dropdown on outside click
  document.addEventListener('click', function(e){
    const wrap = document.querySelector('.user-wrap');
    if(wrap && !wrap.contains(e.target)) closeDrop();
  });

  // Enter key on login
  document.getElementById('lEmail').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
  document.getElementById('lPass').addEventListener('keydown',  e=>{ if(e.key==='Enter') doLogin(); });

  // Enter key on signup
  document.getElementById('sPass2').addEventListener('keydown', e=>{ if(e.key==='Enter') doSignup(); });
});
// ════════════════════════════════════════════
// PAGE NAVIGATION
// ════════════════════════════════════════════
function openPage(name){
  const id = 'page'+name.charAt(0).toUpperCase()+name.slice(1);
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.add('show');
  document.body.style.overflow='hidden';
  if(name==='search')  initSearch();
  if(name==='payment') initPayment();
}
function closePage(name){
  const id = 'page'+name.charAt(0).toUpperCase()+name.slice(1);
  const el = document.getElementById(id);
  if(el) el.classList.remove('show');
  document.body.style.overflow='';
}

// ════════════════════════════════════════════
// SEARCH PAGE
// ════════════════════════════════════════════
let searchCat = 'All';

function initSearch(){
  document.getElementById('bigSearch').value='';
  searchCat='All';
  document.querySelectorAll('.sf-btn').forEach((b,i)=>b.classList.toggle('active',i===0));
  doSearch();
}

function setSearchCat(c, btn){
  searchCat = c;
  document.querySelectorAll('.sf-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  doSearch();
}

function doSearch(){
  const q = (document.getElementById('bigSearch')?.value||'').toLowerCase();
  const list = PRODUCTS.filter(p=>
    (searchCat==='All'||p.cat===searchCat) &&
    (p.name.toLowerCase().includes(q)||p.cat.toLowerCase().includes(q))
  );
  const info = document.getElementById('searchInfo');
  if(info) info.innerHTML = q
    ? `Found <strong>${list.length}</strong> result${list.length!==1?'s':''} for "<strong>${q}</strong>"`
    : `Showing all <strong>${list.length}</strong> products`;
  const grid = document.getElementById('searchGrid');
  if(!grid) return;
  if(!list.length){
    grid.innerHTML=`<div class="no-results" style="grid-column:1/-1"><div class="icon">🔍</div><h3>No products found</h3><p>Try a different keyword or category.</p></div>`;
    return;
  }
  grid.innerHTML = list.map((p,i)=>{
    const disc = p.old ? Math.round((1-p.price/p.old)*100) : 0;
    const inCart = cart.some(c=>c.id===p.id);
    return `
    <div class="card" style="animation-delay:${i*.04}s" onclick="closePage('search');setTimeout(()=>openProd(${p.id}),200)">
      <div class="card-img">
        <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="fallback" style="display:none">🛍️</div>
        ${p.badge?`<div class="badge ${p.badge.toLowerCase()}">${p.badge}</div>`:''}
      </div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-stars">${stars(p.rating)} <span class="rev">(${p.rev.toLocaleString()})</span></div>
        <div class="card-price">
          <span class="price-sym">₹</span><span class="price-main">${p.price.toLocaleString()}</span>
          ${p.old?`<span class="price-old">₹${p.old.toLocaleString()}</span><span class="price-disc">-${disc}%</span>`:''}
        </div>
        <div class="card-actions">
          <button class="add-btn ${inCart?'added':''}" onclick="event.stopPropagation();quickAdd(${p.id},this)">${inCart?'✓ Added':'+ Add to Cart'}</button>
          <button class="wish-btn" onclick="event.stopPropagation();toggleWish(${p.id},this)">${wished.has(p.id)?'❤️':'🤍'}</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════════
// PAYMENT PAGE
// ════════════════════════════════════════════
let activePayMethod = 'Card';

function initPayment(){
  if(!cart.length){ showToast('Your cart is empty! Add products first.','red'); closePage('payment'); return; }
  const items  = document.getElementById('osSummaryItems');
  const sub    = document.getElementById('osSubtotal');
  const total  = document.getElementById('osTotal');
  const disc   = document.getElementById('osDiscount');
  if(!items) return;
  const tot = cart.reduce((s,c)=>s+c.price*c.qty,0);
  const discAmt = Math.round(tot * 0.05);
  items.innerHTML = cart.map(c=>`
    <div class="os-item">
      <img class="os-img" src="${c.img}" alt="${c.name}" onerror="this.style.display='none'">
      <div class="os-name">${c.name} ×${c.qty}</div>
      <div class="os-price">${fmtPrice(c.price*c.qty)}</div>
    </div>`).join('');
  if(sub)   sub.textContent   = fmtPrice(tot);
  if(disc)  disc.textContent  = '-'+fmtPrice(discAmt);
  if(total) total.textContent = fmtPrice(tot - discAmt);
  // Pre-fill name from profile
  const u = JSON.parse(localStorage.getItem('qc_user')||'{}');
  const fn = document.getElementById('payFName');
  if(fn && u.name) fn.value = u.name.split(' ')[0]||'';
  const ph = document.getElementById('payPhone');
  if(ph && u.phone) ph.value = u.phone;
}

function selectPayMethod(el){
  document.querySelectorAll('.pay-method').forEach(m=>m.classList.remove('active'));
  el.classList.add('active');
  activePayMethod = el.textContent.trim();
  document.getElementById('cardFields').style.display = activePayMethod==='Card'?'':'none';
  document.getElementById('upiFields').style.display  = activePayMethod==='UPI'?'':'none';
  document.getElementById('netFields').style.display  = activePayMethod.includes('Banking')?'':'none';
  document.getElementById('codFields').style.display  = activePayMethod==='COD'?'':'none';
}

function fmtCard(el){
  let v = el.value.replace(/\D/g,'').substring(0,16);
  el.value = v.replace(/(.{4})/g,'$1  ').trim();
}
function fmtExp(el){
  let v = el.value.replace(/\D/g,'');
  if(v.length>=2) v = v.substring(0,2)+' / '+v.substring(2,4);
  el.value = v;
}

async function placeOrder(){
  const fn = document.getElementById('payFName')?.value.trim();
  const addr= document.getElementById('payAddr')?.value.trim();
  if(!fn||!addr){ showToast('Please fill delivery address','red'); return; }
  if(activePayMethod==='Card'){
    const cn = document.getElementById('payCard')?.value.replace(/\s/g,'');
    if(!cn||cn.length<16){ showToast('Enter a valid card number','red'); return; }
  }
  const city  = document.getElementById('payCity')?.value.trim()  || '';
  const phone = document.getElementById('payPhone')?.value.trim() || '';
  const {ok, data} = await apiPost(API.checkout, {
    payment_method: activePayMethod,
    address: addr,
    city, pincode: '', phone
  });
  if(!ok){ if(!handleAuthError(data)) showToast((data&&data.error)||'Could not place order','red'); return; }
  cart=[]; saveCart(); renderCart(); refreshBadges(); filterProducts();
  closePage('payment');
  document.getElementById('successOverlay').classList.add('show');
}

// ════════════════════════════════════════════
// ADMIN DASHBOARD
// ════════════════════════════════════════════





// ════════════════════════════════════════════
// DARK MODE
// ════════════════════════════════════════════
function toggleDark(){
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('qc_dark', isDark ? '1' : '0');
  const btn = document.getElementById('darkToggle');
  if(btn) btn.innerHTML = isDark ? '☀️ Light' : '🌙 Dark';
}
