/**
 * ============================================================================
 * SEMANGKAX4 ACTIVATION DASHBOARD - JAVASCRIPT APP LOGIC
 * ============================================================================
 */

// Default Google Apps Script Web App URL from user
const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbwVS42ynWbnJCEwfCSTxyWZRTRPzQhYq24UI7RqFJ3s3MQjCzjvGfNvMsOvpngwV3US/exec";
const STORAGE_KEY_API = "semangkax4_api_url";

// State
let apiUrl = localStorage.getItem(STORAGE_KEY_API) || DEFAULT_API_URL;
let allItems = [];
let currentFilter = "all";
let currentSearch = "";
let isOnline = false;

// DOM Elements
const btnRefresh = document.getElementById("btnRefresh");
const connectionPill = document.getElementById("connectionPill");
const noticeBanner = document.getElementById("noticeBanner");
const noticeTitle = document.getElementById("noticeTitle");
const noticeDesc = document.getElementById("noticeDesc");
const btnNoticeAction = document.getElementById("btnNoticeAction");

// Stats Elements
const statTotal = document.getElementById("statTotal");
const statUsed = document.getElementById("statUsed");
const statAvailable = document.getElementById("statAvailable");
const statDisabled = document.getElementById("statDisabled");

// Containers
const recentContainer = document.getElementById("recentContainer");
const keysContainer = document.getElementById("keysContainer");
const searchInput = document.getElementById("searchInput");
const btnClearSearch = document.getElementById("btnClearSearch");

// Count Pills
const countAll = document.getElementById("countAll");
const countAvailable = document.getElementById("countAvailable");
const countUsed = document.getElementById("countUsed");
const countDisabled = document.getElementById("countDisabled");

// Forms
const formSingle = document.getElementById("formSingle");
const formBatch = document.getElementById("formBatch");
const inputCustomCode = document.getElementById("inputCustomCode");
const btnRandomSingle = document.getElementById("btnRandomSingle");
const inputSingleName = document.getElementById("inputSingleName");
const btnSubmitSingle = document.getElementById("btnSubmitSingle");

const inputPrefix = document.getElementById("inputPrefix");
const inputBatchCount = document.getElementById("inputBatchCount");
const inputBatchNote = document.getElementById("inputBatchNote");
const btnSubmitBatch = document.getElementById("btnSubmitBatch");

// Settings
const inputApiUrl = document.getElementById("inputApiUrl");
const btnSaveApi = document.getElementById("btnSaveApi");
const btnTestApi = document.getElementById("btnTestApi");
const btnViewScript = document.getElementById("btnViewScript");

// Modal
const scriptModal = document.getElementById("scriptModal");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCopyScript = document.getElementById("btnCopyScript");
const scriptCodeBlock = document.getElementById("scriptCodeBlock");

// Bottom Nav
const navItems = document.querySelectorAll(".bottom-nav .nav-item");

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  inputApiUrl.value = apiUrl;
  generateRandomSingle();
  setupNavigation();
  setupEventListeners();
  loadData();
});

// ============================================================================
// TAB NAVIGATION (TikTok & IG Style)
// ============================================================================
function setupNavigation() {
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const target = item.dataset.target;
      switchTab(target);
    });
  });
}

function switchTab(tabId) {
  // Update nav buttons
  navItems.forEach(item => {
    if (item.dataset.target === tabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Update page visibility
  document.querySelectorAll(".tab-page").forEach(page => {
    if (page.id === `tab-${tabId}`) {
      page.classList.add("active");
    } else {
      page.classList.remove("active");
    }
  });

  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================================
// API COMMUNICATION (Google Apps Script Fetch with Redirect Handling)
// ============================================================================
async function callApi(params = {}) {
  let url = apiUrl;
  const queryParts = [];
  for (const [key, val] of Object.entries(params)) {
    queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
  }
  const fullUrl = url + (url.includes("?") ? "&" : "?") + queryParts.join("&");

  const response = await fetch(fullUrl, {
    method: "GET",
    redirect: "follow",
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// ============================================================================
// DATA LOADING & RENDERING
// ============================================================================
async function loadData() {
  setLoadingState(true);
  try {
    const res = await callApi({ action: "list" });

    if (res.status === "success") {
      setOnline(true);
      hideNotice();
      allItems = res.data || [];
      updateStats(res.stats || calculateStats(allItems));
      renderRecent(allItems);
      renderKeysList(allItems);
    } else {
      setOnline(false);
      showNotice(
        "Perlu Pembaruan Skrip Server",
        res.message || "Server Apps Script belum mendukung aksi 'list'. Klik untuk menyalin skrip v2.",
        () => openScriptModal()
      );
    }
  } catch (err) {
    setOnline(false);
    console.error("Fetch Error:", err);
    showNotice(
      "Gagal Terhubung ke Google Apps Script",
      "Periksa koneksi internet Anda atau pastikan URL Apps Script sudah dideploy dengan akses 'Siapa Saja (Anyone)'.",
      () => switchTab("settings")
    );
  } finally {
    setLoadingState(false);
  }
}

function calculateStats(items) {
  let total = items.length;
  let used = 0;
  let available = 0;
  let disabled = 0;

  items.forEach(item => {
    const st = (item.status || "AKTIF").toUpperCase();
    if (st === "NONAKTIF") {
      disabled++;
    } else if (item.deviceId && item.deviceId.trim() !== "") {
      used++;
    } else {
      available++;
    }
  });

  return { total, used, available, disabled };
}

function updateStats(stats) {
  statTotal.textContent = stats.total || 0;
  statUsed.textContent = stats.used || 0;
  statAvailable.textContent = stats.available || 0;
  statDisabled.textContent = stats.disabled || 0;

  countAll.textContent = stats.total || 0;
  countUsed.textContent = stats.used || 0;
  countAvailable.textContent = stats.available || 0;
  countDisabled.textContent = stats.disabled || 0;
}

function renderRecent(items) {
  // Filter only items with deviceId, sort by date if available
  const usedList = items.filter(x => x.deviceId && x.deviceId.trim() !== "");
  recentContainer.innerHTML = "";

  if (usedList.length === 0) {
    recentContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="bi bi-phone"></i></div>
        <h4>Belum Ada HP Terdaftar</h4>
        <p>Kode yang sudah diaktivasi siswa di aplikasi akan otomatis muncul di sini.</p>
      </div>
    `;
    return;
  }

  // Display top 3 recent
  usedList.slice(-3).reverse().forEach(item => {
    recentContainer.appendChild(createKeyCardElement(item));
  });
}

function renderKeysList(items) {
  keysContainer.innerHTML = "";

  // Apply Search
  let filtered = items.filter(item => {
    const q = currentSearch.toLowerCase();
    const codeMatch = (item.code || "").toLowerCase().includes(q);
    const nameMatch = (item.name || "").toLowerCase().includes(q);
    const devMatch = (item.deviceId || "").toLowerCase().includes(q);
    const modelMatch = (item.deviceModel || "").toLowerCase().includes(q);
    return codeMatch || nameMatch || devMatch || modelMatch;
  });

  // Apply Pill Filter
  if (currentFilter === "available") {
    filtered = filtered.filter(x => (x.status || "AKTIF").toUpperCase() !== "NONAKTIF" && (!x.deviceId || x.deviceId.trim() === ""));
  } else if (currentFilter === "used") {
    filtered = filtered.filter(x => (x.status || "AKTIF").toUpperCase() !== "NONAKTIF" && (x.deviceId && x.deviceId.trim() !== ""));
  } else if (currentFilter === "disabled") {
    filtered = filtered.filter(x => (x.status || "AKTIF").toUpperCase() === "NONAKTIF");
  }

  if (filtered.length === 0) {
    keysContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="bi bi-search"></i></div>
        <h4>Tidak Ada Kode Ditemukan</h4>
        <p>Coba gunakan kata kunci pencarian lain atau buat kode aktivasi baru.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    keysContainer.appendChild(createKeyCardElement(item));
  });
}

function createKeyCardElement(item) {
  const card = document.createElement("div");
  card.className = "key-card";

  const isUsed = item.deviceId && item.deviceId.trim() !== "";
  const isDisabled = (item.status || "AKTIF").toUpperCase() === "NONAKTIF";

  let statusBadgeClass = "aktif";
  let statusBadgeText = "Siap Pakai";

  if (isDisabled) {
    statusBadgeClass = "nonaktif";
    statusBadgeText = "Nonaktif";
  } else if (isUsed) {
    statusBadgeClass = "terpakai";
    statusBadgeText = "Terpakai";
  }

  card.innerHTML = `
    <div class="key-card-header">
      <div class="key-code-wrap">
        <span class="key-code">${escapeHtml(item.code)}</span>
      </div>
      <span class="badge-status ${statusBadgeClass}">${statusBadgeText}</span>
    </div>

    <div class="key-user-name">
      <i class="bi bi-person-fill"></i>
      <span>${escapeHtml(item.name || "Tanpa Catatan")}</span>
    </div>

    <div class="key-meta-box">
      <div class="key-meta-row">
        <span class="meta-label"><i class="bi bi-phone"></i> ID HP Terdaftar:</span>
        <span class="meta-val ${isUsed ? 'highlight' : ''}">${escapeHtml(item.deviceId || "— Belum Ada —")}</span>
      </div>
      <div class="key-meta-row">
        <span class="meta-label"><i class="bi bi-cpu"></i> Tipe Perangkat:</span>
        <span class="meta-val">${escapeHtml(item.deviceModel || "—")}</span>
      </div>
      <div class="key-meta-row">
        <span class="meta-label"><i class="bi bi-calendar3"></i> Tgl Aktivasi:</span>
        <span class="meta-val">${escapeHtml(item.date || "—")}</span>
      </div>
    </div>

    <div class="card-actions">
      <button class="btn-action btn-copy" onclick="copyCode('${escapeHtml(item.code)}')">
        <i class="bi bi-clipboard"></i> Salin
      </button>

      <button class="btn-action btn-wa" onclick="shareToWhatsApp('${escapeHtml(item.code)}', '${escapeHtml(item.name)}')">
        <i class="bi bi-whatsapp"></i> Kirim WA
      </button>

      ${isUsed ? `
        <button class="btn-action btn-reset" onclick="resetDevice('${escapeHtml(item.code)}')">
          <i class="bi bi-arrow-repeat"></i> Ganti HP
        </button>
      ` : ''}

      <button class="btn-action" onclick="toggleStatus('${escapeHtml(item.code)}')">
        ${isDisabled ? '<i class="bi bi-check2-circle text-green"></i> Aktifkan' : '<i class="bi bi-slash-circle text-rose"></i> Nonaktif'}
      </button>

      <button class="btn-action btn-danger" onclick="deleteCode('${escapeHtml(item.code)}')">
        <i class="bi bi-trash3-fill"></i> Hapus
      </button>
    </div>
  `;

  return card;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

// 1. Create Single Code
formSingle.addEventListener("submit", async (e) => {
  e.preventDefault();
  const code = inputCustomCode.value.trim().toUpperCase();
  const name = inputSingleName.value.trim();

  if (!code) {
    showToast("Kode tidak boleh kosong", "error");
    return;
  }

  btnSubmitSingle.disabled = true;
  btnSubmitSingle.textContent = "Menyimpan ke Sheet...";

  try {
    const res = await callApi({ action: "add", code, name });
    if (res.status === "success") {
      showToast(`✅ Kode ${code} berhasil dibuat!`, "success");
      inputSingleName.value = "";
      generateRandomSingle();
      loadData();
      switchTab("keys");
    } else {
      showToast(res.message || "Gagal membuat kode", "error");
    }
  } catch (err) {
    showToast("Error koneksi ke server", "error");
  } finally {
    btnSubmitSingle.disabled = false;
    btnSubmitSingle.textContent = "Tambahkan ke Spreadsheet";
  }
});

// 2. Batch Generator
formBatch.addEventListener("submit", async (e) => {
  e.preventDefault();
  const prefix = inputPrefix.value.trim().toUpperCase();
  const count = parseInt(inputBatchCount.value, 10) || 5;
  const note = inputBatchNote.value.trim();

  if (count < 1 || count > 50) {
    showToast("Jumlah kode 1 - 50", "error");
    return;
  }

  btnSubmitBatch.disabled = true;
  btnSubmitBatch.textContent = `Membuat ${count} kode...`;

  let successCount = 0;
  for (let i = 1; i <= count; i++) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `${prefix}${randomSuffix}`;
    const name = note ? `${note} #${i}` : `Siswa #${i}`;

    try {
      const res = await callApi({ action: "add", code, name });
      if (res.status === "success") successCount++;
    } catch (e) {
      // continue
    }
  }

  btnSubmitBatch.disabled = false;
  btnSubmitBatch.textContent = "Generate Sekarang";
  showToast(`✅ Berhasil membuat ${successCount} kode massal!`, "success");
  loadData();
  switchTab("keys");
});

// 3. Reset Device ID (Ganti HP)
async function resetDevice(code) {
  if (!confirm(`Reset perangkat untuk kode '${code}'?\n\nID HP siswa akan dihapus dan kode ini bisa dipakai di HP yang baru.`)) {
    return;
  }

  showToast(`Mereset HP untuk ${code}...`);
  try {
    const res = await callApi({ action: "reset_device", code });
    if (res.status === "success") {
      showToast(`✅ Perangkat direset! Kode siap dipakai di HP baru.`, "success");
      loadData();
    } else {
      showToast(res.message || "Gagal mereset perangkat", "error");
    }
  } catch (err) {
    showToast("Error koneksi saat mereset", "error");
  }
}

// 4. Toggle Status (Aktif / Nonaktif)
async function toggleStatus(code) {
  showToast(`Mengubah status ${code}...`);
  try {
    const res = await callApi({ action: "toggle_status", code });
    if (res.status === "success") {
      showToast(res.message || `Status berhasil diubah`, "success");
      loadData();
    } else {
      showToast(res.message || "Gagal mengubah status", "error");
    }
  } catch (err) {
    showToast("Error koneksi saat mengubah status", "error");
  }
}

// 5. Delete Code
async function deleteCode(code) {
  if (!confirm(`Hapus kode aktivasi '${code}' dari Google Sheet?`)) {
    return;
  }

  showToast(`Menghapus ${code}...`);
  try {
    const res = await callApi({ action: "delete", code });
    if (res.status === "success") {
      showToast(`✅ Kode ${code} berhasil dihapus!`, "success");
      loadData();
    } else {
      showToast(res.message || "Gagal menghapus kode", "error");
    }
  } catch (err) {
    showToast("Error koneksi saat menghapus", "error");
  }
}

// ============================================================================
// HELPER ACTIONS & UI EVENTS
// ============================================================================
function setupEventListeners() {
  // Refresh button
  btnRefresh.addEventListener("click", () => {
    btnRefresh.classList.add("spinning");
    loadData().finally(() => {
      btnRefresh.classList.remove("spinning");
    });
  });

  // Search input
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value.trim();
    btnClearSearch.classList.toggle("hidden", currentSearch === "");
    renderKeysList(allItems);
  });

  btnClearSearch.addEventListener("click", () => {
    searchInput.value = "";
    currentSearch = "";
    btnClearSearch.classList.add("hidden");
    renderKeysList(allItems);
  });

  // Filter pills
  document.querySelectorAll(".pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentFilter = pill.dataset.filter;
      renderKeysList(allItems);
    });
  });

  // Mode Selector (Single / Batch)
  document.querySelectorAll(".segment-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".segment-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.dataset.mode;
      if (mode === "single") {
        formSingle.classList.remove("hidden");
        formBatch.classList.add("hidden");
      } else {
        formSingle.classList.add("hidden");
        formBatch.classList.remove("hidden");
      }
    });
  });

  // Random Single Button
  btnRandomSingle.addEventListener("click", generateRandomSingle);

  // Settings Save
  btnSaveApi.addEventListener("click", () => {
    const newUrl = inputApiUrl.value.trim();
    if (!newUrl) {
      showToast("URL tidak boleh kosong", "error");
      return;
    }
    apiUrl = newUrl;
    localStorage.setItem(STORAGE_KEY_API, apiUrl);
    showToast("✅ URL API berhasil disimpan!", "success");
    loadData();
  });

  // Settings Test Ping
  btnTestApi.addEventListener("click", async () => {
    btnTestApi.disabled = true;
    btnTestApi.textContent = "Menguji...";
    try {
      const res = await callApi({ action: "list" });
      if (res.status === "success") {
        showToast("✅ Koneksi ke Google Apps Script berhasil!", "success");
      } else {
        showToast(`⚠️ Server merespons: ${res.message || 'Perlu update skrip'}`, "error");
      }
    } catch (e) {
      showToast("❌ Gagal terhubung ke URL tersebut.", "error");
    } finally {
      btnTestApi.disabled = false;
      btnTestApi.textContent = "Tes Ping Koneksi";
    }
  });

  // Script Modal
  btnViewScript.addEventListener("click", openScriptModal);
  btnCloseModal.addEventListener("click", closeScriptModal);
  scriptModal.addEventListener("click", (e) => {
    if (e.target === scriptModal) closeScriptModal();
  });

  btnCopyScript.addEventListener("click", () => {
    const code = scriptCodeBlock.textContent;
    navigator.clipboard.writeText(code).then(() => {
      showToast("📋 Kode Apps Script disalin ke clipboard!", "success");
      closeScriptModal();
    });
  });
}

function generateRandomSingle() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const nums = "23456789";
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += (i % 2 === 0) ? letters[Math.floor(Math.random() * letters.length)] : nums[Math.floor(Math.random() * nums.length)];
  }
  inputCustomCode.value = `SX4${random}`;
}

function copyCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    showToast(`📋 Kode ${code} disalin ke clipboard!`, "success");
  });
}

function shareToWhatsApp(code, name) {
  const targetName = name && name !== "-" ? `Halo ${name}` : "Halo";
  const msg = `${targetName}, berikut kode aktivasi untuk aplikasi ujian SoalPintar Anda:\n\n🔑 Kode: *${code}*\n\nSilakan buka aplikasi ujian dan masukkan kode tersebut untuk mengaktifkan HP Anda.`;
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

function openShareSheet() {
  const available = allItems.filter(x => (x.status || "AKTIF").toUpperCase() !== "NONAKTIF" && (!x.deviceId || x.deviceId.trim() === ""));
  if (available.length === 0) {
    showToast("Belum ada kode siap pakai. Buat kode terlebih dahulu!", "error");
    switchTab("create");
    return;
  }
  const first = available[0];
  shareToWhatsApp(first.code, first.name);
}

// Notice Helpers
function showNotice(title, desc, actionFn) {
  noticeTitle.textContent = title;
  noticeDesc.textContent = desc;
  noticeBanner.classList.remove("hidden");
  btnNoticeAction.onclick = actionFn;
}

function hideNotice() {
  noticeBanner.classList.add("hidden");
}

function setOnline(online) {
  isOnline = online;
  if (online) {
    connectionPill.classList.remove("offline");
    connectionPill.classList.add("online");
    connectionPill.querySelector(".text").textContent = "Tersambung";
  } else {
    connectionPill.classList.remove("online");
    connectionPill.classList.add("offline");
    connectionPill.querySelector(".text").textContent = "Terputus";
  }
}

function setLoadingState(loading) {
  if (loading) {
    statTotal.textContent = "…";
    statUsed.textContent = "…";
    statAvailable.textContent = "…";
    statDisabled.textContent = "…";
  }
}

// Modal Helpers
function openScriptModal() {
  scriptCodeBlock.textContent = `// Salin isi dari file GoogleAppsScript_v2.gs di folder dashboard`;
  // Fetch actual gs content from local if available
  fetch("GoogleAppsScript_v2.gs")
    .then(r => r.text())
    .then(t => { scriptCodeBlock.textContent = t; })
    .catch(() => {});
  scriptModal.classList.remove("hidden");
}

function closeScriptModal() {
  scriptModal.classList.add("hidden");
}

// Toast Notification
function showToast(message, type = "default") {
  const toastContainer = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let iconHtml = '<i class="bi bi-info-circle-fill"></i>';
  if (type === "success") {
    iconHtml = '<i class="bi bi-check-circle-fill" style="color: var(--accent-green);"></i>';
  } else if (type === "error") {
    iconHtml = '<i class="bi bi-exclamation-triangle-fill" style="color: var(--accent-rose);"></i>';
  }

  // Strip leading unicode emoji if present
  const cleanMsg = message.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, '');

  toast.innerHTML = `${iconHtml} <span>${escapeHtml(cleanMsg)}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-out");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
