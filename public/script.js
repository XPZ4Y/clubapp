// Hyperlocal Event App - Main Script
// Handles event feed rendering, modals, authentication, maps, and interactions.

document.addEventListener('DOMContentLoaded', () => {
  // Constants
  const APP_CONSTANTS = {
    DEFAULT_VIEW: [12.935, 77.624],
    DEFAULT_ZOOM: 14,
    DETAIL_ZOOM: 15,
    MAP_ATTRIBUTION: '© OpenStreetMap',
    TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    MAX_ZOOM: 19,
    TOAST_DURATION: 2200,
    PASSWORD_MIN_LENGTH: 6,
    EVENT_ID_PREFIX: 'e',
    EVENT_DISTANCE_MIN: 200,
    EVENT_DISTANCE_MAX: 1500,
    LAT_JITTER: 0.01,
    SVG_VIEWBOX: '0 0 100 70',
    SVG_RECT_FILL: '#F0FAFF',
    SVG_PATH_STROKE: '#d9f0ff',
    SVG_PATH_WIDTH: 6,
    SVG_CIRCLE_RADIUS: 6,
    AVATAR_GRADIENT: 'linear-gradient(135deg, #ffd59a, #ff9aa2)',
    HOST_AVATAR_COLOR: '#071229',
    RESPONSIVE_BREAKPOINT: 980,
  };

  const CATEGORY_COLORS = {
    music: '#8B5CF6',
    fitness: '#10B981',
    sports: '#FB7185',
    tech: '#3B82F6',
    default: '#3B82F6',
  };

  // Mock Data
  let mockEvents = [
    {
      id: 'e1',
      title: 'Sunrise Run',
      tagline: '8km easy pace — all welcome',
      time: '2025-11-20T06:00:00Z',
      distance_m: 850,
      category: 'Fitness',
      rsvp: 6,
      host: { name: 'Sam', avatar: '' },
      lat: 12.935,
      lng: 77.624,
    },
    {
      id: 'e2',
      title: 'Acoustic Jam',
      tagline: 'Bring a guitar and a smile',
      time: '2025-11-20T19:00:00Z',
      distance_m: 1200,
      category: 'Music',
      rsvp: 3,
      host: { name: 'Maya', avatar: '' },
      lat: 12.934,
      lng: 77.629,
    },
    {
      id: 'e3',
      title: 'Weekend Python',
      tagline: 'Casual coding — beginners welcome',
      time: '2025-11-21T16:00:00Z',
      distance_m: 2200,
      category: 'Tech',
      rsvp: 10,
      host: { name: 'Rohit', avatar: '' },
      lat: 12.94,
      lng: 77.62,
    },
    {
      id: 'e4',
      title: 'Park Soccer',
      tagline: 'Pickup match — show up and play',
      time: '2025-11-19T17:30:00Z',
      distance_m: 600,
      category: 'Sports',
      rsvp: 12,
      host: { name: 'Asha', avatar: '' },
      lat: 12.931,
      lng: 77.63,
    },
  ];

  // Cached DOM Elements
  const elements = {
    feed: document.getElementById('mainFeed'),
    toast: document.getElementById('toast'),
    authModal: document.getElementById('authModal'),
    modalOverlay: document.getElementById('modalOverlay'),
    accountModal: document.getElementById('accountModal'),
    aboutModal: document.getElementById('aboutModal'),
    profileDrawer: document.getElementById('profileDrawer'),
    rightPanel: document.getElementById('rightPanel'),
    eventModal: document.getElementById('eventModal'),
    eventContent: document.getElementById('eventContent'),
    createSheet: document.getElementById('createSheet'),
    searchInput: document.getElementById('searchInput'),
    loginBtn: document.getElementById('loginBtn'),
    profileBtn: document.getElementById('profileBtn'),
    profileBtnBottom: document.getElementById('profileBtnBottom'),
    fab: document.getElementById('fab'),
    closeCreate: document.getElementById('closeCreate'),
    toStep2: document.getElementById('toStep2'),
    backTo1: document.getElementById('backTo1'),
    publishBtn: document.getElementById('publishBtn'),
    evTitle: document.getElementById('evTitle'),
    evTime: document.getElementById('evTime'),
    evPlace: document.getElementById('evPlace'),
    closeModal: document.getElementById('closeModal'),
    closeAuth: document.getElementById('closeAuth'),
    showRegister: document.getElementById('showRegister'),
    showLogin: document.getElementById('showLogin'),
    doLogin: document.getElementById('doLogin'),
    doRegister: document.getElementById('doRegister'),
    regName: document.getElementById('regName'),
    regEmail: document.getElementById('regEmail'),
    regPass: document.getElementById('regPass'),
    loginEmail: document.getElementById('loginEmail'),
    loginPass: document.getElementById('loginPass'),
    authTitle: document.getElementById('authTitle'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    closeProfile: document.getElementById('closeProfile'),
    closeAccount: document.getElementById('closeAccount'),
    closeAbout: document.getElementById('closeAbout'),
    homeBtn: document.getElementById('homeBtn'),
    searchBtn: document.getElementById('searchBtn'),
    inboxBtn: document.getElementById('inboxBtn'),
    menuBtn: document.getElementById('menuBtn'),
    chips: document.querySelectorAll('.chips button'),
  };

  // State
  let mapRight = null;
  let detailMap = null;
  let rightMarkers = [];
  let toastTimer = null;

  // Utility Functions
  const humanTime = (iso) => {
    const d = new Date(iso);
    const opts = { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' };
    return d.toLocaleString(undefined, opts);
  };

  const metersToString = (m) => {
    if (m < 1000) return `${m} m`;
    return `${(m / 1000).toFixed(1)} km`;
  };

  const createEl = (tag, cls = '', html = undefined) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };

  const getCategoryColor = (cat) => {
    const key = (cat || '').toLowerCase();
    return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
  };

  const smallMapSVG = (ev) => {
    const cx = 20 + (ev.distance_m % 60);
    const cy = 20 + ((Math.floor(ev.distance_m / 50)) % 30);
    return `
      <svg viewBox="${APP_CONSTANTS.SVG_VIEWBOX}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="100" height="70" rx="8" fill="${APP_CONSTANTS.SVG_RECT_FILL}"/>
        <path d="M8 50 Q30 30 52 50 T96 50" stroke="${APP_CONSTANTS.SVG_PATH_STROKE}" stroke-width="${APP_CONSTANTS.SVG_PATH_WIDTH}" fill="none" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${cy}" r="${APP_CONSTANTS.SVG_CIRCLE_RADIUS}" fill="${getCategoryColor(ev.category)}"/>
      </svg>
    `;
  };

  const getCurrentUser = () => JSON.parse(localStorage.getItem('hyperlocal_user') || 'null');

  const showToast = (msg, duration = APP_CONSTANTS.TOAST_DURATION) => {
    elements.toast.textContent = msg;
    elements.toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, duration);
  };

  const updateAuthUI = () => {
    const u = getCurrentUser();
    const p = elements.profileBtn;
    const lp = elements.loginBtn;
    if (u) {
      p.textContent = u.name[0].toUpperCase();
      lp.style.display = 'none';
    } else {
      p.textContent = '🙂';
      lp.style.display = 'inline-flex';
    }
  };

  // Map Functions
  const initRightMap = (list) => {
    try {
      mapRight = L.map('rightMap', { zoomControl: true }).setView(APP_CONSTANTS.DEFAULT_VIEW, APP_CONSTANTS.DEFAULT_ZOOM);
      L.tileLayer(APP_CONSTANTS.TILE_URL, { maxZoom: APP_CONSTANTS.MAX_ZOOM, attribution: APP_CONSTANTS.MAP_ATTRIBUTION }).addTo(mapRight);
      list.forEach((ev) => {
        const m = L.marker([ev.lat, ev.lng], { title: ev.title })
          .addTo(mapRight)
          .bindPopup(`<strong>${ev.title}</strong><br>${humanTime(ev.time)}`);
        m.evId = ev.id;
        m.on('click', () => openDetail(ev.id));
        rightMarkers.push(m);
      });
    } catch (e) {
      console.warn('Leaflet init failed', e);
    }
  };

  const refreshRightMarkers = (list) => {
    if (!mapRight) return;
    rightMarkers.forEach((m) => mapRight.removeLayer(m));
    rightMarkers = [];
    list.forEach((ev) => {
      const m = L.marker([ev.lat, ev.lng], { title: ev.title })
        .addTo(mapRight)
        .bindPopup(`<strong>${ev.title}</strong><br>${humanTime(ev.time)}`);
      m.on('click', () => openDetail(ev.id));
      rightMarkers.push(m);
    });
  };

  const initDetailMap = (ev) => {
    try {
      if (detailMap) {
        detailMap.remove();
        detailMap = null;
      }
      detailMap = L.map('detailMap', { zoomControl: true, attributionControl: false }).setView([ev.lat, ev.lng], APP_CONSTANTS.DETAIL_ZOOM);
      L.tileLayer(APP_CONSTANTS.TILE_URL, { maxZoom: APP_CONSTANTS.MAX_ZOOM }).addTo(detailMap);
      L.marker([ev.lat, ev.lng])
        .addTo(detailMap)
        .bindPopup(`<strong>${ev.title}</strong>`)
        .openPopup();
    } catch (e) {
      console.warn('detail map init failed', e);
    }
  };

  // Event Functions
  const joinEvent = (id, btn, ev) => {
    if (btn.disabled) return;
    const user = getCurrentUser();
    if (!user) {
      showToast('Please sign in to join — quick & secure 🔐');
      openAuth('login');
      return;
    }
    btn.disabled = true;
    btn.innerHTML = 'Joining...';
    ev.rsvp = (ev.rsvp || 0) + 1;
    showToast(`You're in — ${ev.rsvp} going 🎉`);
    setTimeout(() => {
      btn.innerHTML = 'Going ✓';
      btn.style.background = 'linear-gradient(90deg, var(--success), #34d399)';
      btn.disabled = true;
      renderFeed(mockEvents);
    }, 700);
  };

  const publishEvent = () => {
    const user = getCurrentUser();
    if (!user) {
      showToast('Please sign in to publish events.');
      openAuth('login');
      return;
    }
    const title = elements.evTitle.value.trim();
    const time = elements.evTime.value;
    const place = elements.evPlace.value || 'Nearby';
    if (!title || !time) {
      alert('Please add a title and time');
      return;
    }
    const id = `${APP_CONSTANTS.EVENT_ID_PREFIX}${Date.now() % 100000}`;
    const newEv = {
      id,
      title,
      tagline: place,
      time: new Date(time).toISOString(),
      distance_m: Math.floor(Math.random() * (APP_CONSTANTS.EVENT_DISTANCE_MAX - APP_CONSTANTS.EVENT_DISTANCE_MIN)) + APP_CONSTANTS.EVENT_DISTANCE_MIN,
      category: 'Community',
      rsvp: 1,
      host: { name: user.name, avatar: '' },
      lat: 12.935 + Math.random() * APP_CONSTANTS.LAT_JITTER,
      lng: 77.624 + Math.random() * APP_CONSTANTS.LAT_JITTER,
    };
    mockEvents.unshift(newEv);
    renderFeed(mockEvents);
    elements.createSheet.classList.remove('visible');
    elements.createSheet.setAttribute('aria-hidden', 'true');
    showToast('Event published — good luck! 🎉');
  };

  // Rendering Functions
  const renderFeed = (list) => {
    elements.feed.innerHTML = '';
    list.forEach((ev) => {
      const card = createEl('article', 'card');
      card.dataset.id = ev.id;
      card.tabIndex = 0;
      card.innerHTML = `
        <div class="avatar">${ev.host.name[0] || '?'}</div>
        <div class="content">
          <h3 class="title">${ev.title}</h3>
          <p class="tagline">${ev.tagline}</p>
          <div class="meta">${humanTime(ev.time)} · ${metersToString(ev.distance_m)}</div>
        </div>
        <div class="actions">
          <button class="btn-cta">Join</button>
          <button class="more" aria-label="more">›</button>
        </div>
        <div class="micro-map" title="Show location preview" role="button" tabindex="0" aria-label="map preview"></div>
      `;
      elements.feed.appendChild(card);
      const joinBtn = card.querySelector('.btn-cta');
      joinBtn.addEventListener('click', () => joinEvent(ev.id, joinBtn, ev));
      card.querySelector('.more').addEventListener('click', () => openDetail(ev.id));
      card.querySelector('.content').addEventListener('click', () => openDetail(ev.id));
      const microMap = card.querySelector('.micro-map');
      microMap.addEventListener('click', (e) => {
        e.stopPropagation();
        openMiniMap(ev);
      });
      microMap.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') openMiniMap(ev);
      });
      microMap.innerHTML = smallMapSVG(ev);
    });
    updateRightPanel(list);
  };

  const updateRightPanel = (list) => {
    const mini = document.getElementById('rightDetail');
    if (!mini) return;
    mini.innerHTML = '<div style="color:var(--muted)">Select an event to view details here.</div>';
    if (window.innerWidth >= APP_CONSTANTS.RESPONSIVE_BREAKPOINT) {
      elements.rightPanel.style.display = 'block';
      if (!mapRight) {
        setTimeout(() => initRightMap(list), 0);
      } else {
        refreshRightMarkers(list);
      }
    }
  };

  const openDetail = (id, opts = {}) => {
    const ev = mockEvents.find((x) => x.id === id);
    if (!ev) return;

    if (window.innerWidth >= APP_CONSTANTS.RESPONSIVE_BREAKPOINT) {
      const rd = document.getElementById('rightDetail');
      rd.innerHTML = `
        <strong style="font-size:18px">${ev.title}</strong>
        <div style="color:var(--muted); margin-top:6px">${humanTime(ev.time)} · ${metersToString(ev.distance_m)}</div>
        <div style="margin-top:8px; display:flex; gap:8px; align-items:center">
          <div style="width:46px;height:46px;border-radius:10px;background:${APP_CONSTANTS.AVATAR_GRADIENT};display:flex;align-items:center;justify-content:center;color:${APP_CONSTANTS.HOST_AVATAR_COLOR};font-weight:800">${ev.host.name[0]}</div>
          <div><strong>${ev.host.name}</strong><div style="font-size:13px;color:var(--muted)">Host</div></div>
        </div>
        <p style="color:var(--muted); margin-top:12px">${ev.tagline}</p>
        <div style="display:flex; gap:8px; margin-top:12px">
          <button id="detailJoinRight" class="btn-cta">Join</button>
          <button id="shareBtn" class="btn-cta">Share</button>
          <button id="aboutBtn" class="btn-ghost">About</button>
        </div>
      `;
      document.getElementById('detailJoinRight').addEventListener('click', () => joinEvent(id, document.getElementById('detailJoinRight'), ev));
      document.getElementById('shareBtn').addEventListener('click', () => showToast('Share (mock) — not implemented.'));
      document.getElementById('aboutBtn').addEventListener('click', () => openAbout());
      if (mapRight) {
        mapRight.setView([ev.lat, ev.lng], APP_CONSTANTS.DETAIL_ZOOM);
      }
      return;
    }

    elements.eventContent.innerHTML = `
      <h2 class="title">${ev.title} <span style="font-size:14px; color:var(--muted); font-weight:600"> · ${ev.category}</span></h2>
      <div class="meta">${humanTime(ev.time)} · ${metersToString(ev.distance_m)}</div>
      <div style="margin:8px 0; display:flex; gap:8px; align-items:center">
        <div class="small-avatar">${ev.host.name[0]}</div>
        <div><strong>${ev.host.name}</strong><div style="font-size:13px;color:var(--muted)">Host</div></div>
      </div>
      <p style="color:var(--muted); margin-top:8px">${ev.tagline}</p>
      <div id="detailMapContainer" style="margin-top:12px">
        <div id="detailMap" class="map-small" aria-hidden="true"></div>
      </div>
      <div style="margin-top:12px">
        <button id="detailJoin" class="btn-cta" style="width:100%">Join</button>
        <div style="display:flex; gap:8px; margin-top:8px">
          <button id="addCal" class="btn-cta" style="flex:1">Add to calendar</button>
          <button id="shareMobile" class="btn-ghost" style="flex:1">Share</button>
        </div>
      </div>
    `;
    document.getElementById('detailJoin').addEventListener('click', () => joinEvent(id, document.getElementById('detailJoin'), ev));
    document.getElementById('addCal').addEventListener('click', () => showToast('Add to calendar (mock).'));
    document.getElementById('shareMobile').addEventListener('click', () => showToast('Share (mock).'));
    elements.eventModal.classList.add('show');
    elements.eventModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => initDetailMap(ev), 420);
  };

  const openMiniMap = (ev) => openDetail(ev.id, { openMap: true });

  // Modal Functions
  const openAuth = (show = 'login') => {
    elements.modalOverlay.style.opacity = '1';
    elements.modalOverlay.style.pointerEvents = 'auto';
    elements.authModal.classList.add('centered', 'visible');
    elements.authModal.setAttribute('aria-hidden', 'false');
    if (show === 'login') {
      elements.authTitle.textContent = 'Log in';
      elements.loginForm.style.display = 'block';
      elements.registerForm.style.display = 'none';
    } else {
      elements.authTitle.textContent = 'Create account';
      elements.loginForm.style.display = 'none';
      elements.registerForm.style.display = 'block';
    }
  };

  const closeAuthModal = () => {
    elements.modalOverlay.style.opacity = '0';
    elements.modalOverlay.style.pointerEvents = 'none';
    elements.authModal.classList.remove('centered', 'visible');
    elements.authModal.setAttribute('aria-hidden', 'true');
  };

  const handleRegister = () => {
    const name = elements.regName.value.trim();
    const email = elements.regEmail.value.trim();
    const pass = elements.regPass.value;
    if (!name || !email || !pass || pass.length < APP_CONSTANTS.PASSWORD_MIN_LENGTH) {
      alert('Name, email and password (min 6 chars) required');
      return;
    }
    const user = { name, email, token: `tok-${Date.now()}` };
    localStorage.setItem('hyperlocal_user', JSON.stringify(user));
    closeAuthModal();
    updateAuthUI();
    showToast(`Welcome, ${name} 🎉`);
  };

  const handleLogin = () => {
    const email = elements.loginEmail.value.trim();
    const pass = elements.loginPass.value;
    if (!email || !pass) {
      alert('Enter email & password');
      return;
    }
    const user = { name: email.split('@')[0], email, token: `tok-${Date.now()}` };
    localStorage.setItem('hyperlocal_user', JSON.stringify(user));
    closeAuthModal();
    updateAuthUI();
    showToast(`Signed in — ${user.name}`);
  };

  const openProfile = () => {
    const u = getCurrentUser();
    const el = document.getElementById('profileContent');
    if (!u) {
      el.innerHTML = `
        <div style="color:var(--muted)">You are not signed in.</div>
        <div style="margin-top:12px">
          <button id="openAuthFromProfile" class="btn-cta">Sign in</button>
        </div>
      `;
      setTimeout(() => {
        const btn = document.getElementById('openAuthFromProfile');
        if (btn) btn.addEventListener('click', () => openAuth('login'));
      }, 50);
    } else {
      el.innerHTML = `
        <div style="display:flex; gap:12px; align-items:center">
          <div style="width:56px;height:56px;border-radius:12px;background:${APP_CONSTANTS.AVATAR_GRADIENT};display:flex;align-items:center;justify-content:center;font-weight:800">${u.name[0].toUpperCase()}</div>
          <div><strong>${u.name}</strong><div style="color:var(--muted)">${u.email}</div></div>
        </div>
        <div style="margin-top:12px">
          <button id="myEventsBtn" class="btn-cta" style="width:100%; margin-bottom:8px">My Events</button>
          <button id="accountBtn" class="btn-ghost" style="width:100%; margin-bottom:8px">Account</button>
          <button id="aboutBtn2" class="btn-ghost" style="width:100%; margin-bottom:8px">About</button>
          <button id="logoutBtn" class="select" style="width:100%">Log out</button>
        </div>
      `;
      setTimeout(() => {
        document.getElementById('logoutBtn').addEventListener('click', () => {
          localStorage.removeItem('hyperlocal_user');
          updateAuthUI();
          closeProfileDrawer();
          showToast('Signed out');
        });
        document.getElementById('myEventsBtn').addEventListener('click', () => {
          filterMyEvents();
          closeProfileDrawer();
        });
        document.getElementById('accountBtn').addEventListener('click', () => {
          openAccount();
          closeProfileDrawer();
        });
        document.getElementById('aboutBtn2').addEventListener('click', () => {
          openAbout();
          closeProfileDrawer();
        });
      }, 50);
    }
    elements.profileDrawer.classList.add('visible');
    elements.profileDrawer.setAttribute('aria-hidden', 'false');
  };

  const closeProfileDrawer = () => {
    elements.profileDrawer.classList.remove('visible');
    elements.profileDrawer.setAttribute('aria-hidden', 'true');
  };

  const filterMyEvents = () => {
    const u = getCurrentUser();
    if (!u) {
      showToast('Sign in to see your events');
      openAuth('login');
      return;
    }
    const mine = mockEvents.filter((e) => e.host && e.host.name === u.name);
    if (mine.length === 0) {
      showToast('You have no events yet');
      return;
    }
    renderFeed(mine);
  };

  const openAccount = () => {
    const u = getCurrentUser();
    const ac = document.getElementById('accountContent');
    if (!u) {
      ac.innerHTML = '<div style="color:var(--muted)">Sign in to see account details.</div>';
    } else {
      ac.innerHTML = `
        <div><strong>${u.name}</strong><div style="color:var(--muted)">${u.email}</div></div>
        <div style="margin-top:12px">
          <button id="editProfileBtn" class="btn-cta">Edit profile (mock)</button>
        </div>
      `;
      setTimeout(() => {
        document.getElementById('editProfileBtn').addEventListener('click', () => showToast('Edit profile (mock)'));
      }, 50);
    }
    elements.accountModal.classList.add('visible');
    elements.accountModal.setAttribute('aria-hidden', 'false');
    elements.modalOverlay.style.opacity = '1';
    elements.modalOverlay.style.pointerEvents = 'auto';
  };

  const openAbout = () => {
    elements.aboutModal.classList.add('visible');
    elements.aboutModal.setAttribute('aria-hidden', 'false');
    elements.modalOverlay.style.opacity = '1';
    elements.modalOverlay.style.pointerEvents = 'auto';
  };

  // Event Listeners Setup
  const setupEventListeners = () => {
    // Feed Interactions
    elements.feed.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const card = document.activeElement.closest('.card');
        if (card) openDetail(card.dataset.id);
      }
    });

    // Search
    elements.searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        renderFeed(mockEvents);
        return;
      }
      const filtered = mockEvents.filter(
        (ev) =>
          ev.title.toLowerCase().includes(q) ||
          ev.tagline.toLowerCase().includes(q) ||
          ev.category.toLowerCase().includes(q) ||
          ev.host.name.toLowerCase().includes(q)
      );
      renderFeed(filtered);
    });

    // Chips Filters
    elements.chips.forEach((btn) => {
      btn.addEventListener('click', () => {
        const f = btn.dataset.filter;
        let filtered = [...mockEvents];
        if (f === 'nearby') {
          filtered.sort((a, b) => a.distance_m - b.distance_m);
        } else if (f === 'now') {
          const now = Date.now();
          filtered.sort((a, b) => Math.abs(new Date(a.time) - now) - Math.abs(new Date(b.time) - now));
        } else {
          filtered = mockEvents.filter((e) => e.category.toLowerCase() === f);
        }
        renderFeed(filtered);
      });
    });

    // Auth
    elements.loginBtn.addEventListener('click', () => openAuth('login'));
    elements.closeAuth.addEventListener('click', closeAuthModal);
    elements.modalOverlay.addEventListener('click', closeAuthModal);
    elements.showRegister.addEventListener('click', () => openAuth('register'));
    elements.showLogin.addEventListener('click', () => openAuth('login'));
    elements.doRegister.addEventListener('click', handleRegister);
    elements.doLogin.addEventListener('click', handleLogin);

    // Profile
    elements.profileBtn.addEventListener('click', openProfile);
    elements.profileBtnBottom.addEventListener('click', openProfile);
    elements.closeProfile.addEventListener('click', closeProfileDrawer);

    // Modals Close
    elements.closeModal.addEventListener('click', () => {
      elements.eventModal.classList.remove('show');
      elements.eventModal.setAttribute('aria-hidden', 'true');
      if (detailMap) {
        detailMap.remove();
        detailMap = null;
      }
    });
    elements.closeAccount.addEventListener('click', () => {
      elements.accountModal.classList.remove('visible');
      elements.accountModal.setAttribute('aria-hidden', 'true');
      elements.modalOverlay.style.opacity = '0';
      elements.modalOverlay.style.pointerEvents = 'none';
    });
    elements.closeAbout.addEventListener('click', () => {
      elements.aboutModal.classList.remove('visible');
      elements.aboutModal.setAttribute('aria-hidden', 'true');
      elements.modalOverlay.style.opacity = '0';
      elements.modalOverlay.style.pointerEvents = 'none';
    });

    // Create Event Sheet
    elements.fab.addEventListener('click', () => {
      elements.createSheet.classList.add('visible');
      elements.createSheet.setAttribute('aria-hidden', 'false');
    });
    elements.closeCreate.addEventListener('click', () => {
      elements.createSheet.classList.remove('visible');
      elements.createSheet.setAttribute('aria-hidden', 'true');
    });
    elements.toStep2.addEventListener('click', () => {
      const t = elements.evTitle.value.trim();
      const time = elements.evTime.value;
      if (!t || !time) {
        alert('Please add a title and time');
        return;
      }
      document.getElementById('createStep1').style.display = 'none';
      document.getElementById('createStep2').style.display = 'block';
    });
    elements.backTo1.addEventListener('click', () => {
      document.getElementById('createStep1').style.display = 'block';
      document.getElementById('createStep2').style.display = 'none';
    });
    elements.publishBtn.addEventListener('click', publishEvent);

    // Navigation Buttons
    elements.homeBtn.addEventListener('click', () => renderFeed(mockEvents));
    elements.searchBtn.addEventListener('click', () => elements.searchInput.focus());
    elements.inboxBtn.addEventListener('click', () => showToast('Inbox (mock) — not implemented.'));
    elements.menuBtn.addEventListener('click', () => {
      showToast('Menu (mock) — open Account or About from profile.');
      openAuth('login');
    });
  };

  // Resize Handler
  const handleResize = () => {
    if (window.innerWidth < APP_CONSTANTS.RESPONSIVE_BREAKPOINT) {
      elements.rightPanel.style.display = 'none';
    } else {
      elements.rightPanel.style.display = 'block';
    }
  };

  // Initialization
  const init = () => {
    updateAuthUI();
    renderFeed(mockEvents);
    setupEventListeners();
    window.addEventListener('resize', handleResize);
    handleResize();
    if (window.innerWidth >= APP_CONSTANTS.RESPONSIVE_BREAKPOINT && mockEvents.length > 0) {
      setTimeout(() => openDetail(mockEvents[0].id), 800);
    }
  };

  init();
});