/* ============================================================
 * 公告中心 - 数据与交互逻辑
 * 前台 index.html 与后台 admin.html 共享 localStorage 数据
 * ============================================================ */

const STORAGE_KEY = "sw_announcements";
const FEEDBACK_KEY = "sw_feedback_votes"; // 记录本设备已投票的公告

/* ---------- 数据层 ---------- */

// 读取全部公告
function getAnnouncements() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("读取公告失败", e);
  }
  // 首次访问写入示例数据
  const seed = [
    {
      id: genId(),
      title: "至 sw 全体用户",
      source: "守卫守卫",
      content:
        "文件安全由我 Guard\n面板新增功能：\n文件上传与文件保护\n使用方法：\n添加 3849750902 为好友\n（需要上传文件时，把文件直接发给他）\n（仅支持部分文件格式，不支持 json）\n当面板被删除时，我们会将建筑文件全部发送至您的 QQ",
      date: "2026-10-23 22:06:35",
      pinned: true,
      supports: 273,
      opposes: 76,
    },
    {
      id: genId(),
      title: "至 sw 全体用户",
      source: "守卫守卫",
      content:
        "看上去 sw 将统一价格\n我们的用户又有福利可享了\n从今日起 sw 的 NE 与 NB 还有 FA\n天卡每天可领取一张\n领取时间为 0 点到晚上 23 点\nhttps://sw.nearkai.top/\n领取",
      date: "2026-10-12 19:46:05",
      pinned: true,
      supports: 10,
      opposes: 0,
    },
    {
      id: genId(),
      title: "至 sw 全体用户",
      source: "守卫守卫",
      content:
        "我们优化了面板的数据存储方式\n现在不会出现卡顿情况了",
      date: "2026-10-22 08:53:15",
      pinned: false,
      supports: 0,
      opposes: 0,
    },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

// 保存公告
function saveAnnouncements(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// 新增公告
function addAnnouncement(data) {
  const list = getAnnouncements();
  const item = {
    id: genId(),
    title: data.title || "未命名公告",
    source: data.source || "管理员",
    content: data.content || "",
    date: formatNow(),
    pinned: !!data.pinned,
    supports: 0,
    opposes: 0,
  };
  list.unshift(item);
  saveAnnouncements(list);
  return item;
}

// 删除公告
function deleteAnnouncement(id) {
  let list = getAnnouncements();
  list = list.filter((a) => a.id !== id);
  saveAnnouncements(list);
}

// 投票反馈
function vote(id, type) {
  const list = getAnnouncements();
  const item = list.find((a) => a.id === id);
  if (!item) return null;
  const votes = getVotes();
  const prev = votes[id];
  if (prev === type) {
    // 取消投票
    item[type] = Math.max(0, item[type] - 1);
    delete votes[id];
  } else {
    if (prev) item[prev] = Math.max(0, item[prev] - 1);
    item[type] = (item[type] || 0) + 1;
    votes[id] = type;
  }
  saveAnnouncements(list);
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(votes));
  return item;
}

function getVotes() {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY)) || {};
  } catch (e) {
    return {};
  }
}

/* ---------- 工具 ---------- */

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatNow() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
    d.getHours()
  )}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// 将文本中的 URL 转成链接
function linkify(text) {
  const escaped = escapeHtml(text);
  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener">$1</a>'
  );
}

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2000);
}

/* ---------- 前台渲染 ---------- */

function renderPublicPage() {
  const list = getAnnouncements();
  const votes = getVotes();

  // 排序：置顶在前，再按日期倒序
  const sorted = [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.date || "").localeCompare(a.date || "");
  });

  // 统计
  const totalSupports = list.reduce((s, a) => s + (a.supports || 0), 0);
  const totalOpposes = list.reduce((s, a) => s + (a.opposes || 0), 0);
  document.getElementById("statCount").textContent = list.length;
  document.getElementById("statSupport").textContent = totalSupports;
  document.getElementById("statOppose").textContent = totalOpposes;

  // 列表
  const container = document.getElementById("announcementList");
  const empty = document.getElementById("emptyState");

  if (sorted.length === 0) {
    container.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  container.innerHTML = sorted
    .map((a) => {
      const total = (a.supports || 0) + (a.opposes || 0);
      const ratio = total > 0 ? (a.supports / total) * 100 : 0;
      const myVote = votes[a.id];
      const sourceInitial = (a.source || "管").charAt(0);
      return `
      <article class="announcement-card ${a.pinned ? "pinned" : ""}">
        ${
          a.pinned
            ? '<span class="pinned-badge">📌 置顶</span>'
            : ""
        }
        <h3 class="announcement-title">${escapeHtml(a.title)}</h3>
        <div class="meta">
          <span>来源：</span>
          <span class="avatar">${escapeHtml(sourceInitial)}</span>
          <strong>${escapeHtml(a.source)}</strong>
        </div>
        <div class="meta">
          <span>日期：</span>
          <strong>${escapeHtml(a.date)}</strong>
        </div>
        <div class="divider"></div>
        <div class="announcement-content">${linkify(a.content)}</div>
        <div class="feedback-bar">
          <button class="feedback-btn support ${
            myVote === "supports" ? "active" : ""
          }" data-id="${a.id}" data-vote="supports">
            👍 支持 (${a.supports || 0})
          </button>
          <button class="feedback-btn oppose ${
            myVote === "opposes" ? "active" : ""
          }" data-id="${a.id}" data-vote="opposes">
            👎 反对 (${a.opposes || 0})
          </button>
        </div>
        ${
          total > 0
            ? `<div class="progress-bar"><div class="progress-fill" style="width:${ratio}%"></div></div>`
            : ""
        }
      </article>`;
    })
    .join("");

  // 绑定投票
  container.querySelectorAll(".feedback-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const type = btn.dataset.vote;
      vote(id, type);
      renderPublicPage();
    });
  });
}

/* ---------- 后台渲染 ---------- */

function renderAdminPage() {
  renderAdminList();
}

function renderAdminList() {
  const list = getAnnouncements();
  const container = document.getElementById("adminList");
  const empty = document.getElementById("adminEmpty");

  if (list.length === 0) {
    container.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  container.innerHTML = list
    .map((a) => {
      return `
      <div class="admin-list-item">
        <div class="admin-list-info">
          <div class="admin-list-title">
            ${a.pinned ? '<span class="tag-pill">置顶</span>' : ""}
            ${escapeHtml(a.title)}
          </div>
          <div class="admin-list-meta">
            ${escapeHtml(a.source)} · ${escapeHtml(a.date)} · 👍 ${a.supports || 0} / 👎 ${a.opposes || 0}
          </div>
        </div>
        <button class="btn btn-danger" data-delete="${a.id}">删除</button>
      </div>`;
    })
    .join("");

  container.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.delete;
      if (confirm("确定删除这条公告吗？")) {
        deleteAnnouncement(id);
        renderAdminList();
        showToast("已删除");
      }
    });
  });
}

// 发布公告表单
function bindAdminForm() {
  const form = document.getElementById("announcementForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = form.title.value.trim();
    const source = form.source.value.trim() || "管理员";
    const content = form.content.value.trim();
    const pinned = form.pinned.checked;

    if (!title) {
      showToast("请填写标题");
      return;
    }
    if (!content) {
      showToast("请填写内容");
      return;
    }

    addAnnouncement({ title, source, content, pinned });
    form.reset();
    renderAdminList();
    showToast("发布成功");
  });
}

/* ---------- 后台鉴权 ---------- */

const ADMIN_PASSWORD = "hpnb666";
const AUTH_KEY = "sw_admin_auth";

function isAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

function initAdminAuth() {
  const loginView = document.getElementById("loginView");
  const adminView = document.getElementById("adminView");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!loginView) return; // 非后台页面

  function showAdmin() {
    loginView.hidden = true;
    adminView.hidden = false;
    bindAdminForm();
    renderAdminPage();
  }

  if (isAuthed()) {
    showAdmin();
    return;
  }

  // 移动端：输入框聚焦时滚动整个登录卡到可见区域，确保按钮不被键盘遮挡
  const pwdInput = loginForm.password;
  const loginCard = document.querySelector(".login-card");
  pwdInput.addEventListener("focus", () => {
    setTimeout(() => {
      if (loginCard) {
        loginCard.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        pwdInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      window.scrollTo({ top: Math.max(0, window.scrollY - 20), behavior: "smooth" });
    }, 350);
  });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const pwd = pwdInput.value.trim();
    if (pwd === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "1");
      loginError.textContent = "";
      showAdmin();
    } else {
      loginError.textContent = "密码错误，请重试";
      pwdInput.value = "";
      pwdInput.focus();
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sessionStorage.removeItem(AUTH_KEY);
      location.reload();
    });
  }
}
