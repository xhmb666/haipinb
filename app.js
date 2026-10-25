/* ============================================================
 * 公告中心 - 数据与交互逻辑
 * 前台 index.html 与后台 admin.html 共享 localStorage 数据
 * ============================================================ */

const STORAGE_KEY = "sw_announcements";
const FEEDBACK_KEY = "sw_feedback_votes"; // 记录本设备已投票的公告

/* ---------- 粒子网格背景 ---------- */
function initParticleBackground() {
  // 插入画布和第三光斑
  const canvas = document.createElement("canvas");
  canvas.className = "bg-canvas";
  const orb = document.createElement("div");
  orb.className = "bg-orb";
  document.body.prepend(orb, canvas);

  const ctx = canvas.getContext("2d");
  let particles = [];
  let w, h;
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  // 粒子数量根据屏幕大小
  const count = Math.min(80, Math.floor((w * h) / 18000));
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 1,
    });
  }

  document.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  document.addEventListener("mouseleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // 连线
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.strokeStyle = `rgba(129, 140, 248, ${0.15 * (1 - dist / 120)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
      // 鼠标连线
      const mdx = particles[i].x - mouse.x;
      const mdy = particles[i].y - mouse.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < 150) {
        ctx.strokeStyle = `rgba(236, 72, 153, ${0.3 * (1 - mdist / 150)})`;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }

    // 粒子
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* ---------- 图形验证码 ---------- */
let currentCaptcha = "";

function generateCaptcha(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  currentCaptcha = code;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // 背景
  ctx.fillStyle = "rgba(15, 12, 41, 0.6)";
  ctx.fillRect(0, 0, w, h);

  // 干扰线
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.lineTo(Math.random() * w, Math.random() * h);
    ctx.stroke();
  }

  // 干扰点
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.6)`;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // 文字
  for (let i = 0; i < code.length; i++) {
    ctx.font = `bold ${20 + Math.random() * 6}px Arial`;
    ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 70%)`;
    ctx.save();
    const x = 18 + i * 26;
    const y = 30 + Math.random() * 8;
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.5);
    ctx.fillText(code[i], 0, 0);
    ctx.restore();
  }
}

function verifyCaptcha(input) {
  return input.trim().toUpperCase() === currentCaptcha;
}

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

// 管理员直接修改支持/反对票数
function updateAnnouncementVotes(id, supports, opposes) {
  const list = getAnnouncements();
  const item = list.find((a) => a.id === id);
  if (!item) return;
  item.supports = Math.max(0, supports);
  item.opposes = Math.max(0, opposes);
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
      const sup = a.supports || 0;
      const opp = a.opposes || 0;
      const total = sup + opp;
      const supRate = total > 0 ? ((sup / total) * 100).toFixed(1) : "0.0";
      const oppRate = total > 0 ? ((opp / total) * 100).toFixed(1) : "0.0";
      return `
      <div class="admin-list-item">
        <div class="admin-list-info">
          <div class="admin-list-title">
            ${a.pinned ? '<span class="tag-pill">置顶</span>' : ""}
            ${escapeHtml(a.title)}
          </div>
          <div class="admin-list-meta">
            ${escapeHtml(a.source)} · ${escapeHtml(a.date)}
          </div>
          <div class="admin-rate">
            <span class="rate-box support">👍 支持 ${sup} <em>${supRate}%</em></span>
            <span class="rate-box oppose">👎 反对 ${opp} <em>${oppRate}%</em></span>
            <span class="rate-total">共 ${total} 票</span>
          </div>
          ${
            total > 0
              ? `<div class="rate-bar"><div class="rate-fill" style="width:${supRate}%"></div></div>`
              : ""
          }
          <div class="vote-edit" data-vote-edit="${a.id}" hidden>
            <div class="vote-edit-row">
              <label>👍 支持</label>
              <input type="number" min="0" value="${sup}" data-sup-input="${a.id}" />
            </div>
            <div class="vote-edit-row">
              <label>👎 反对</label>
              <input type="number" min="0" value="${opp}" data-opp-input="${a.id}" />
            </div>
            <div class="vote-edit-actions">
              <button class="btn btn-primary" data-save-vote="${a.id}">保存</button>
              <button class="btn" data-cancel-vote="${a.id}">取消</button>
            </div>
          </div>
        </div>
        <div class="admin-list-actions">
          <button class="btn btn-edit" data-edit-vote="${a.id}">改票</button>
          <button class="btn btn-danger" data-delete="${a.id}">删除</button>
        </div>
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

  // 改票 - 显示编辑区
  container.querySelectorAll("[data-edit-vote]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.editVote;
      const editBox = container.querySelector(`[data-vote-edit="${id}"]`);
      if (editBox) editBox.hidden = !editBox.hidden;
    });
  });

  // 改票 - 取消
  container.querySelectorAll("[data-cancel-vote]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.cancelVote;
      const editBox = container.querySelector(`[data-vote-edit="${id}"]`);
      if (editBox) editBox.hidden = true;
    });
  });

  // 改票 - 保存
  container.querySelectorAll("[data-save-vote]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.saveVote;
      const supInput = container.querySelector(`[data-sup-input="${id}"]`);
      const oppInput = container.querySelector(`[data-opp-input="${id}"]`);
      if (!supInput || !oppInput) return;
      const sup = Math.max(0, parseInt(supInput.value, 10) || 0);
      const opp = Math.max(0, parseInt(oppInput.value, 10) || 0);
      updateAnnouncementVotes(id, sup, opp);
      renderAdminList();
      showToast("票数已更新");
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
    // 清理 URL 上的 auth 参数，避免刷新时重复处理
    history.replaceState(null, "", location.pathname + location.hash);
    bindAdminForm();
    renderAdminPage();
  }

  // 方式一：网址参数一键登录  admin.html?auth=hpnb666
  const urlParams = new URLSearchParams(location.search);
  const urlAuth = urlParams.get("auth");
  if (urlAuth && urlAuth.trim().toLowerCase() === ADMIN_PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, "1");
    showAdmin();
    return;
  }

  if (isAuthed()) {
    showAdmin();
    return;
  }

  // 方式二：表单登录
  const pwdInput = loginForm.password;
  const captchaInput = loginForm.captcha;
  const loginCard = document.querySelector(".login-card");

  // 生成验证码
  const captchaCanvas = document.getElementById("captchaCanvas");
  if (captchaCanvas) {
    generateCaptcha("captchaCanvas");
    captchaCanvas.addEventListener("click", () => generateCaptcha("captchaCanvas"));
  }

  // 显示/隐藏密码
  const togglePwd = document.getElementById("togglePwd");
  if (togglePwd) {
    togglePwd.addEventListener("change", () => {
      pwdInput.type = togglePwd.checked ? "text" : "password";
    });
  }

  // 输入框聚焦时滚动整个登录卡到可见区域
  pwdInput.addEventListener("focus", () => {
    setTimeout(() => {
      if (loginCard) {
        loginCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      window.scrollTo({ top: Math.max(0, window.scrollY - 20), behavior: "smooth" });
    }, 350);
  });

  function doLogin(rawPwd, rawCaptcha) {
    // 校验验证码
    if (captchaInput && !verifyCaptcha(rawCaptcha || "")) {
      loginError.textContent = "验证码错误";
      if (captchaCanvas) generateCaptcha("captchaCanvas");
      captchaInput.value = "";
      captchaInput.focus();
      return false;
    }
    const pwd = (rawPwd || "").trim().toLowerCase();
    if (pwd === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "1");
      loginError.textContent = "";
      showAdmin();
      return true;
    }
    loginError.textContent = "密码错误，请重试";
    pwdInput.value = "";
    if (captchaCanvas) generateCaptcha("captchaCanvas");
    captchaInput.value = "";
    pwdInput.focus();
    return false;
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    doLogin(pwdInput.value, captchaInput ? captchaInput.value : "");
  });

  // 一键登录：直接写入认证状态并刷新，最可靠
  const quickLogin = document.getElementById("quickLogin");
  if (quickLogin) {
    quickLogin.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      sessionStorage.setItem(AUTH_KEY, "1");
      location.reload();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.clear();
      // 跳转到无参数的后台地址
      location.replace("admin.html");
    });
  }
}
