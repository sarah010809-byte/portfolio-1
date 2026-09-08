// ===== 상단/푸터 메뉴 (모든 페이지 공통 — 여기만 고치면 전체 반영) =====
const NAV_ITEMS = [
  { href: "works.html", label: "Works", match: ["works.html", "work.html"],
    sub: [
      { href: "works.html?view=years", label: "By Years" },
      { href: "works.html?view=series", label: "By Series" },
    ] },
  { href: "exhibitions.html", label: "Exhibitions", match: ["exhibitions.html", "exhibition.html"] },
  { href: "projects.html", label: "Projects", match: ["projects.html", "project.html"] },
  { href: "writings.html", label: "Writings", match: ["writings.html", "writing.html"] },
  { href: "about.html", label: "About", match: ["about.html"] },
];

function currentPage() {
  return location.pathname.split("/").pop() || "index.html";
}

function buildNav() {
  const page = currentPage();
  const nav = document.getElementById("nav");
  if (nav) {
    nav.innerHTML = NAV_ITEMS.map((it) => {
      const cur = it.match.includes(page) ? " current" : "";
      if (it.sub) {
        return `<div class="nav-item has-sub">
          <a href="${it.href}" class="${cur.trim()}">${it.label}<span class="nav-caret">▾</span></a>
          <div class="sub-nav">${it.sub.map((s) => `<a href="${s.href}">${s.label}</a>`).join("")}</div>
        </div>`;
      }
      return `<div class="nav-item"><a href="${it.href}" class="${cur.trim()}">${it.label}</a></div>`;
    }).join("");
  }
  const fnav = document.getElementById("footer-nav");
  if (fnav) {
    fnav.innerHTML = NAV_ITEMS.map((it) => `<a href="${it.href}">${it.label}</a>`).join("");
  }
}
buildNav();

// Works 메뉴: 클릭하면 드롭다운이 열리고, 드롭다운 안의 항목을 눌러야 이동
// (마우스를 올려도 열림 — hover는 보조)
document.querySelectorAll(".nav-item.has-sub").forEach((item) => {
  const link = item.querySelector("a");
  item.addEventListener("mouseenter", () => item.classList.add("open"));
  item.addEventListener("mouseleave", () => item.classList.remove("open"));
  link.addEventListener("click", (e) => {
    e.preventDefault();
    item.classList.toggle("open");
  });
});
document.addEventListener("click", (e) => {
  document.querySelectorAll(".nav-item.has-sub.open").forEach((item) => {
    if (!item.contains(e.target)) item.classList.remove("open");
  });
});

// ===== 언어 전환 (Kr / En) =====
const btnKo = document.getElementById("btn-ko");
const btnEn = document.getElementById("btn-en");

function currentLang() {
  return localStorage.getItem("lang") || "ko";
}

function setLang(lang, animate) {
  const apply = () => {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-ko]").forEach((el) => {
      el.textContent = el.dataset[lang];
    });
    btnKo.classList.toggle("active", lang === "ko");
    btnEn.classList.toggle("active", lang === "en");
    localStorage.setItem("lang", lang);
  };
  const m = document.querySelector("main");
  if (animate && m) {
    m.style.transition = "opacity 0.18s ease";
    m.style.opacity = "0";
    setTimeout(() => { apply(); m.style.opacity = "1"; }, 180);
  } else {
    apply();
  }
}

btnKo.addEventListener("click", () => setLang("ko", true));
btnEn.addEventListener("click", () => setLang("en", true));

// ===== 스크롤 시 헤더 전환 (투명 → 흰 바) — 메인 페이지에만 적용 =====
const header = document.querySelector(".site-header");
const hasHero = document.querySelector(".hero") !== null;

if (hasHero) {
  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
    // 스크롤할수록 대표작 이미지가 계속 확대되면서 서서히 어두워짐 (영역 크기는 그대로)
    const bg = document.querySelector(".hero-bg");
    if (bg) {
      const p = Math.min(window.scrollY / window.innerHeight, 1);
      bg.style.transform = `scale(${1 + p * 0.18})`;
      bg.style.filter = `brightness(${1 - p * 0.45})`;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// ===== TOP 버튼 (검정 푸터 바로 위 흰 영역, 클릭 시 맨 위로) =====
(function () {
  const footer = document.querySelector(".site-footer");
  if (!footer) return;
  const wrap = document.createElement("div");
  wrap.className = "to-top-wrap";
  const btn = document.createElement("button");
  btn.className = "to-top";
  btn.innerHTML = 'TOP <span class="to-top-arrow">↑</span>';
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  wrap.appendChild(btn);
  footer.parentNode.insertBefore(wrap, footer);
})();

// ===== 모바일 메뉴 (우측 슬라이드 + 햄버거 ↔ X) =====
const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

const navDim = document.createElement("div");
navDim.className = "nav-dim";
document.body.appendChild(navDim);

function setMenu(open) {
  nav.classList.toggle("open", open);
  menuBtn.classList.toggle("open", open);
  navDim.classList.toggle("show", open);
  document.body.style.overflow = open ? "hidden" : "";
}

menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
navDim.addEventListener("click", () => setMenu(false));
// (메뉴 링크를 누르면 페이지가 바로 이동하므로 닫힘 애니메이션은 생략)

// ===== 데이터 파일에서 콘텐츠 불러오기 =====
// (관리자 페이지 /admin 에서 data/*.json 을 수정하면 사이트에 자동 반영)

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function thumbHTML(work, label) {
  if (work.image) {
    return `<div class="thumb"><img src="${esc(work.image)}" alt="${esc(work.title_ko)}" loading="lazy"></div>`;
  }
  return `<div class="thumb placeholder"><span>${esc(label)}</span></div>`;
}

function cardHTML(work, label, linkTo) {
  const cap = work.caption_ko
    ? `<span data-ko=", ${esc(work.caption_ko)}" data-en=", ${esc(work.caption_en)}">, ${esc(work.caption_ko)}</span>`
    : "";
  const inner = `
    ${thumbHTML(work, label)}
    <figcaption>
      <strong data-ko="${esc(work.title_ko)}" data-en="${esc(work.title_en)}">${esc(work.title_ko)}</strong>${cap}
    </figcaption>`;
  return `<figure class="card">${linkTo ? `<a href="${linkTo}">${inner}</a>` : inner}</figure>`;
}

async function loadJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ===== 메인 전시 섹션: 스크롤 고정 + 가로 이동 인터랙션 =====
function setupExhScroll() {
  const section = document.getElementById("exh-scroll");
  const track = document.getElementById("home-exh");
  if (!section || !track) return;
  const sticky = section.querySelector(".exh-sticky");
  let overflow = 0;

  function measure() {
    if (window.innerWidth <= 768) {
      section.style.height = "";
      section.style.marginTop = "";
      section.style.marginBottom = "";
      track.style.transform = "";
      overflow = 0;
      return;
    }
    const cs = getComputedStyle(sticky);
    const visible = sticky.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    overflow = Math.max(0, track.scrollWidth - visible);
    // 가로로 이동해야 할 거리만큼 세로 스크롤 구간을 늘림 (1px 스크롤 = 1px 이동)
    section.style.height = (window.innerHeight + overflow) + "px";
    // 고정 화면 위·아래의 빈 공간만큼 이웃 섹션을 끌어당겨, 진입·해제 시 간격이 96px이 되게 함
    const stickyTop = sticky.getBoundingClientRect().top;
    const contentTop = sticky.firstElementChild.getBoundingClientRect().top - stickyTop;
    const contentBottom = sticky.lastElementChild.getBoundingClientRect().bottom - stickyTop;
    const slackTop = contentTop - 48;
    const slackBottom = window.innerHeight - contentBottom - 48;
    section.style.marginTop = slackTop > 0 ? `-${Math.round(slackTop)}px` : "";
    section.style.marginBottom = slackBottom > 0 ? `-${Math.round(slackBottom)}px` : "";
  }

  function onScroll() {
    if (overflow <= 0) return;
    const rect = section.getBoundingClientRect();
    const px = Math.min(Math.max(-rect.top, 0), overflow);
    track.style.transform = `translateX(${-px}px)`;
  }

  measure();
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { measure(); onScroll(); });
  // 이미지 로드 후 폭이 달라질 수 있어 재측정
  window.addEventListener("load", () => { measure(); onScroll(); });
}

// 작품 목록을 연도 내림차순으로 정렬 (원본 인덱스 유지)
function sortedWorks(data) {
  return (data.works || [])
    .map((w, idx) => ({ ...w, idx }))
    .sort((a, b) => String(b.year).localeCompare(String(a.year)));
}

// 작품의 시리즈 이름 (없으면 '기타'로 묶음)
function seriesKey(w) {
  return w.series_en || w.series_ko || "Other";
}

// ===== 상세 슬라이드쇼 (자동 재생 + 화살표 + 썸네일) =====
const SLIDE_INTERVAL = 7000; // 이미지당 유지 시간 (7초 — 여유있게)

// 메인 이미지 + 아래 화살표·썸네일 스트립 마크업 생성
function sliderHTML(id, images, alt) {
  // 이미지가 2장 이상이면 스테이지 높이를 고정해 전환 시 레이아웃이 흔들리지 않게 함
  return `<div class="slider${images.length > 1 ? " multi" : ""}" id="${id}">
    <div class="slides">${images.map((src, k) =>
      `<div class="slide${k === 0 ? " active" : ""}"><img src="${esc(src)}" alt="${esc(alt)}"></div>`).join("")}</div>
    <div class="slider-controls">
      <button class="slider-prev" aria-label="previous image">←</button>
      <div class="slider-thumbs">${images.map((src, k) =>
        `<button class="slider-thumb${k === 0 ? " active" : ""}" aria-label="image ${k + 1}"><img src="${esc(src)}" alt=""></button>`).join("")}</div>
      <button class="slider-next" aria-label="next image">→</button>
    </div>
  </div>`;
}

// 모바일: 스테이지 높이를 대표(첫) 이미지 비율에 맞춰 고정 — 디테일컷 비율이 달라도 안 흔들림
function sizeStageForMobile(root) {
  if (!window.matchMedia("(max-width: 768px)").matches) return;
  const stage = root.querySelector(".slides");
  const first = root.querySelector(".slide img");
  if (!stage || !first) return;
  const apply = () => {
    if (first.naturalWidth) {
      // 대표 이미지 비율을 따르되, 작품명이 첫 화면에 함께 보이도록 화면 높이의 52%를 넘지 않게
      const h = stage.clientWidth * first.naturalHeight / first.naturalWidth;
      stage.style.height = `${Math.min(h, window.innerHeight * 0.62)}px`;
    }
  };
  if (first.complete) apply();
  else first.addEventListener("load", apply);
  window.addEventListener("resize", apply);
}

function initSlider(root) {
  sizeStageForMobile(root);
  const slides = [...root.querySelectorAll(".slide")];
  const prevBtn = root.querySelector(".slider-prev");
  const nextBtn = root.querySelector(".slider-next");
  const thumbs = [...root.querySelectorAll(".slider-thumb")];
  if (slides.length < 2) {
    root.querySelector(".slider-controls")?.remove();
    return;
  }
  let i = 0, timer = null;

  const show = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("active", k === i));
    thumbs.forEach((t, k) => t.classList.toggle("active", k === i));
  };
  const restart = () => {
    clearInterval(timer);
    timer = setInterval(() => show(i + 1), SLIDE_INTERVAL);
  };
  prevBtn.addEventListener("click", () => { show(i - 1); restart(); });
  nextBtn.addEventListener("click", () => { show(i + 1); restart(); });

  // 모바일: 이미지 스와이프로 이전/다음
  let touchX = null, touchY = null;
  const stage = root.querySelector(".slides");
  stage.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) { touchX = null; return; }
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    touchX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      show(i + (dx < 0 ? 1 : -1));
      restart();
    }
  }, { passive: true });
  thumbs.forEach((t, k) => t.addEventListener("click", () => { show(k); restart(); }));
  // 마우스를 올리면 잠시 멈춤
  root.addEventListener("mouseenter", () => clearInterval(timer));
  root.addEventListener("mouseleave", restart);
  show(0);
  restart();
}

async function renderDynamic() {
  // ===== 메인 페이지: 풀스크린 대표작 1점 =====
  const hero = document.getElementById("hero");
  if (hero) {
    const data = await loadJSON("data/works.json");
    if (data) {
      const list = sortedWorks(data);
      const feat = list.find((w) => w.featured && w.image) || list.find((w) => w.image);
      if (feat) {
        // 배경을 별도 레이어에 넣어 스크롤 시 살짝 확대되는 효과 적용
        const bg = document.createElement("div");
        bg.className = "hero-bg";
        bg.style.background = `url("${feat.image}") center / cover no-repeat`;
        hero.prepend(bg);
      }
    }
  }

  // ===== 메인 페이지: 최근 작품 6점 미리보기 =====
  const homeWorks = document.getElementById("home-works");
  if (homeWorks) {
    const data = await loadJSON("data/works.json");
    if (data) {
      const picks = sortedWorks(data).slice(0, 6);
      homeWorks.innerHTML = `<div class="grid">${picks.map((w) =>
        cardHTML({ ...w, caption_ko: w.year, caption_en: w.year },
          w.title_en, `work.html?i=${w.idx}`)
      ).join("")}</div>`;
    }
  }

  // ===== 메인 페이지: 전시 미리보기 (최근 전시 크게 + 이전 2개 좌우) =====
  const homeExh = document.getElementById("home-exh");
  if (homeExh) {
    const data = await loadJSON("data/exhibitions.json");
    if (data) {
      const ex = data.exhibitions || [];
      const exhCard = (e, big, idx) => `
        <a class="home-exh-card" href="exhibition.html?i=${idx}">
          <div class="exh-thumb${big ? " big" : ""}">${
            e.image
              ? `<img src="${esc(e.image)}" alt="${esc(e.title_ko)}" loading="lazy">`
              : `<div class="placeholder"><span>${esc(e.title_en)}</span></div>`
          }</div>
          <p class="home-cat">Exhibitions</p>
          <h3 data-ko="${esc(e.title_ko)}" data-en="${esc(e.title_en)}">${esc(e.title_ko)}</h3>
          <p class="exh-venue" data-ko="${esc(e.venue_ko)}" data-en="${esc(e.venue_en)}">${esc(e.venue_ko)}</p>
          ${big && (e.desc_ko || e.desc_en)
            ? `<p class="home-excerpt" data-ko="${esc(e.desc_ko)}" data-en="${esc(e.desc_en)}">${esc(e.desc_ko)}</p>` : ""}
          <p class="exh-date">${esc(e.date)}</p>
        </a>`;
      // 첫(최신) 전시는 크게, 과거 전시들은 트랙 오른쪽으로 이어붙임 (최대 4개)
      homeExh.innerHTML = ex.slice(0, 4).map((e, i) => exhCard(e, false, i)).join("");
      setupExhScroll();
    }
  }

  // ===== 메인 페이지: 프로젝트 미리보기 (최근 3개) =====
  const homeProjects = document.getElementById("home-projects");
  if (homeProjects) {
    const data = await loadJSON("data/projects.json");
    if (data) {
      const picks = (data.projects || []).map((p, idx) => ({ ...p, idx })).slice(0, 3);
      homeProjects.innerHTML = `<div class="home-card-row">${picks.map((p) => `
        <a class="home-exh-card" href="project.html?i=${p.idx}">
          <div class="exh-thumb">${
            p.image
              ? `<img src="${esc(p.image)}" alt="${esc(p.title_ko)}" loading="lazy">`
              : `<div class="placeholder"><span>${esc(p.title_en)}</span></div>`
          }</div>
          <p class="home-cat">${p.category === "curatorial" ? "Curatorial Project" : "Collaboration"}</p>
          <h3 data-ko="${esc(p.title_ko)}" data-en="${esc(p.title_en)}">${esc(p.title_ko)}</h3>
          ${(p.desc_ko || p.desc_en)
            ? `<p class="home-excerpt" data-ko="${esc(p.desc_ko)}" data-en="${esc(p.desc_en)}">${esc(p.desc_ko)}</p>` : ""}
          <p class="exh-date">${esc(p.year)}</p>
        </a>`).join("")}</div>`;
    }
  }

  // ===== 메인 페이지: 최근 글 미리보기 (4개) =====
  const homeWritings = document.getElementById("home-writings");
  if (homeWritings) {
    const data = await loadJSON("data/writings.json");
    if (data) {
      const CAT_LABELS = { artist: ["작가의 글", "Artist's Writings"], criticism: ["비평", "Criticism"],
        interview: ["인터뷰", "Interview"], article: ["기사", "Article"], etc: ["기타", "Etc."] };
      const picks = (data.writings || []).map((t, idx) => ({ ...t, idx }))
        .sort((a, b) => String(b.year).localeCompare(String(a.year)))
        .slice(0, 3);
      homeWritings.innerHTML = `<div class="home-card-row">${picks.map((t) => {
        const cat = CAT_LABELS[t.category] || CAT_LABELS.etc;
        return `
        <a class="home-exh-card home-writing-card" href="writing.html?i=${t.idx}">
          <div class="exh-thumb">${
            t.image
              ? `<img src="${esc(t.image)}" alt="${esc(t.title_ko)}" loading="lazy">`
              : `<div class="placeholder"><span>${esc(t.title_en)}</span></div>`
          }</div>
          <p class="home-cat" data-ko="${esc(cat[0])}" data-en="${esc(cat[1])}">${esc(cat[0])}</p>
          <h3 data-ko="${esc(t.title_ko)}" data-en="${esc(t.title_en)}">${esc(t.title_ko)}</h3>
          ${(t.body_ko || t.body_en)
            ? `<p class="home-excerpt" data-ko="${esc(t.body_ko)}" data-en="${esc(t.body_en)}">${esc(t.body_ko)}</p>` : ""}
          <p class="exh-date">${esc(t.year)}</p>
        </a>`;
      }).join("")}</div>`;
    }
  }

  // ===== Works 페이지: By Years / By Series 전환 + 그룹별 그리드 =====
  const worksContent = document.getElementById("works-content");
  const seriesNav = document.getElementById("series-nav");
  if (worksContent && seriesNav) {
    const data = await loadJSON("data/works.json");
    if (data) {
      const list = sortedWorks(data);
      const params = new URLSearchParams(location.search);
      const view = params.get("view") === "series" ? "series" : "years";

      // 보기 방식 토글 (By Years / By Series)
      const viewToggle = document.getElementById("view-toggle");
      if (viewToggle) {
        viewToggle.innerHTML = `
          <a href="works.html?view=years"${view === "years" ? ' class="on"' : ""}>By Years</a>
          <a href="works.html?view=series"${view === "series" ? ' class="on"' : ""}>By Series</a>`;
      }

      let groups; // [{ key, label_ko, label_en, items }]
      if (view === "years") {
        const years = [...new Set(list.map((w) => w.year))];
        groups = years.map((y) => ({
          key: y, label_ko: y, label_en: y,
          items: list.filter((w) => w.year === y),
        }));
      } else {
        const keys = [...new Set(list.map(seriesKey))];
        groups = keys.map((k) => {
          const items = list.filter((w) => seriesKey(w) === k);
          return {
            key: k,
            label_ko: items[0].series_ko || items[0].series_en || "기타",
            label_en: items[0].series_en || items[0].series_ko || "Other",
            items,
          };
        });
      }

      // 사이드바: 그룹 필터
      const selParam = params.get("g");
      const selected = groups.some((g) => g.key === selParam) ? selParam : null;
      const base = `works.html?view=${view}`;
      seriesNav.innerHTML =
        `<li><a href="${base}"${selected ? "" : ' class="current-year"'}>All</a></li>` +
        groups.map((g) =>
          `<li><a href="${base}&g=${encodeURIComponent(g.key)}"${g.key === selected ? ' class="current-year"' : ""}
             data-ko="${esc(g.label_ko)}" data-en="${esc(g.label_en)}">${esc(g.label_ko)}</a></li>`
        ).join("");

      const shown = selected ? groups.filter((g) => g.key === selected) : groups;
      worksContent.innerHTML = shown.map((g) => `
        <section class="series">
          <div class="series-head"><h2 data-ko="${esc(g.label_ko)}" data-en="${esc(g.label_en)}">${esc(g.label_ko)}</h2></div>
          <div class="grid">${g.items.map((w) =>
            cardHTML({ ...w, caption_ko: view === "series" ? w.year : "", caption_en: view === "series" ? w.year : "" },
              w.title_en, `work.html?i=${w.idx}`)
          ).join("")}</div>
        </section>`).join("");
    }
  }

  // ===== 작품 상세 페이지 (이미지 여러 장 → 자동 슬라이드) =====
  const workDetail = document.getElementById("work-detail");
  if (workDetail) {
    const data = await loadJSON("data/works.json");
    if (data) {
      const list = sortedWorks(data);
      const params = new URLSearchParams(location.search);
      const reqIdx = parseInt(params.get("i") || "0", 10) || 0;
      let pos = list.findIndex((w) => w.idx === reqIdx);
      if (pos < 0) pos = 0;
      const w = list[pos];

      // 대표 이미지 + 추가 이미지(디테일 컷)를 하나의 슬라이드쇼로
      const images = [w.image, ...(w.images || []).map((o) => (typeof o === "string" ? o : o.image))].filter(Boolean);
      const imageArea = images.length
        ? sliderHTML("work-slider", images, w.title_ko)
        : `<div class="placeholder detail-placeholder"><span>${esc(w.title_en)}</span></div>`;

      const related = (w.related_ko || w.related_en) ? `
        <h3 data-ko="관련 전시" data-en="Related Exhibition">관련 전시</h3>
        <p class="side-related" data-ko="${esc(w.related_ko)}" data-en="${esc(w.related_en)}">${esc(w.related_ko)}</p>` : "";

      const desc = (w.desc_ko || w.desc_en)
        ? `<p class="work-desc" data-ko="${esc(w.desc_ko)}" data-en="${esc(w.desc_en)}">${esc(w.desc_ko)}</p>`
        : "";

      // 시리즈 이름을 누르면 해당 시리즈만 모아 보는 페이지로 이동
      const seriesLine = (w.series_ko || w.series_en)
        ? `<p class="side-series"><a href="works.html?view=series&g=${encodeURIComponent(seriesKey(w))}"
             data-ko="${esc(w.series_ko || w.series_en)}" data-en="${esc(w.series_en || w.series_ko)}">${esc(w.series_ko || w.series_en)}</a></p>`
        : "";

      // 이전/다음과 순번은 같은 연도 안에서만
      const yearList = list.filter((o) => o.year === w.year);
      const yPos = yearList.findIndex((o) => o.idx === w.idx);
      const link = (p) => `work.html?i=${yearList[p].idx}`;
      // 화살표는 이미지 슬라이드 전용 — 작품 이동은 텍스트 링크로 구분
      const prev = yPos > 0
        ? `<a href="${link(yPos - 1)}" data-ko="이전 작품" data-en="Prev Work">이전 작품</a>` : `<span></span>`;
      const next = yPos < yearList.length - 1
        ? `<a href="${link(yPos + 1)}" data-ko="다음 작품" data-en="Next Work">다음 작품</a>` : `<span></span>`;

      const sameYear = yearList.filter((o) => o.idx !== w.idx);
      const others = sameYear.length ? `
        <section class="other-works">
          <h2 data-ko="${esc(w.year)}년의 다른 작품" data-en="More works from ${esc(w.year)}">${esc(w.year)}년의 다른 작품</h2>
          <div class="grid">${sameYear.map((o) =>
            cardHTML({ ...o, caption_ko: "", caption_en: "" }, o.title_en, `work.html?i=${o.idx}`)
          ).join("")}</div>
        </section>` : "";

      workDetail.innerHTML = `
        <p class="back-link detail-back"><a href="works.html" data-ko="← 작품 목록" data-en="← All Works">← 작품 목록</a></p>
        <div class="work-top">
          <div class="work-image">${imageArea}</div>
          <aside class="work-side">
            <h1 data-ko="${esc(w.title_ko)}" data-en="${esc(w.title_en)}">${esc(w.title_ko)}</h1>
            <p class="side-caption"
               data-ko="${esc(w.year)}${w.medium_ko ? `, ${esc(w.medium_ko)}` : ""}"
               data-en="${esc(w.year)}${w.medium_en ? `, ${esc(w.medium_en)}` : ""}">${esc(w.year)}</p>
            ${seriesLine}
            ${desc}
            ${related}
          </aside>
        </div>
        <div class="work-nav">${prev}${next}</div>
        ${others}`;

      const slider = document.getElementById("work-slider");
      if (slider) initSlider(slider);

      document.title = `${w.title_ko} — An Se Eun`;
    }
  }

  // ===== Exhibitions 페이지: 대표이미지 + 우측 정보 =====
  const exhList = document.getElementById("exh-list");
  if (exhList) {
    const data = await loadJSON("data/exhibitions.json");
    if (data) {
      const all = (data.exhibitions || []).map((e, idx) => ({ ...e, idx }));

      // 전체 / 개인전 / 그룹전 토글 (기본: 전체, 목록 순서 = 최신순)
      const typeParam = new URLSearchParams(location.search).get("type");
      const selType = ["solo", "group"].includes(typeParam) ? typeParam : null;
      const toggle = document.getElementById("exh-view-toggle");
      if (toggle) {
        toggle.innerHTML = `
          <a href="exhibitions.html"${selType ? "" : ' class="on"'} data-ko="전체" data-en="All">전체</a>
          <a href="exhibitions.html?type=solo"${selType === "solo" ? ' class="on"' : ""} data-ko="개인전" data-en="Solo">개인전</a>
          <a href="exhibitions.html?type=group"${selType === "group" ? ' class="on"' : ""} data-ko="그룹전" data-en="Group">그룹전</a>`;
      }

      const shown = selType ? all.filter((e) => e.type === selType) : all;
      exhList.innerHTML = shown.map((e) => `
        <a class="exh-item" href="exhibition.html?i=${e.idx}">
          <div class="exh-image">${
            e.image
              ? `<img src="${esc(e.image)}" alt="${esc(e.title_ko)}" loading="lazy">`
              : `<div class="placeholder exh-placeholder"><span>${esc(e.title_en)}</span></div>`
          }</div>
          <div class="exh-info">
            <h2 data-ko="${esc(e.title_ko)}" data-en="${esc(e.title_en)}">${esc(e.title_ko)}</h2>
            <p class="exh-date">${esc(e.date)}</p>
            <p class="exh-venue" data-ko="${esc(e.venue_ko)}" data-en="${esc(e.venue_en)}">${esc(e.venue_ko)}</p>
            <p class="exh-desc" data-ko="${esc(e.desc_ko)}" data-en="${esc(e.desc_en)}">${esc(e.desc_ko)}</p>
          </div>
        </a>`).join("");
    }
  }

  // ===== 전시 상세 페이지 (설치 전경 등 추가 이미지도 표시) =====
  const exhDetail = document.getElementById("exh-detail");
  if (exhDetail) {
    const data = await loadJSON("data/exhibitions.json");
    if (data) {
      const ex = data.exhibitions || [];
      const i = Math.min(Math.max(0, parseInt(new URLSearchParams(location.search).get("i") || "0", 10) || 0), ex.length - 1);
      const e = ex[i];
      if (e) {
        const extra = (e.images || []).map((o) => (typeof o === "string" ? o : o.image)).filter(Boolean);
        const extraHTML = extra.map((src) =>
          `<div class="exh-detail-image"><img src="${esc(src)}" alt="${esc(e.title_ko)}" loading="lazy"></div>`).join("");
        const prev = i > 0
          ? `<a href="exhibition.html?i=${i - 1}" data-ko="이전 전시" data-en="Prev Exhibition">이전 전시</a>` : `<span></span>`;
        const next = i < ex.length - 1
          ? `<a href="exhibition.html?i=${i + 1}" data-ko="다음 전시" data-en="Next Exhibition">다음 전시</a>` : `<span></span>`;
        exhDetail.innerHTML = `
          <p class="back-link detail-back"><a href="exhibitions.html" data-ko="← 전시 목록" data-en="← All Exhibitions">← 전시 목록</a></p>
          <article class="exh-detail">
            <div class="exh-detail-image">${
              e.image
                ? `<img src="${esc(e.image)}" alt="${esc(e.title_ko)}">`
                : `<div class="placeholder exh-placeholder"><span>${esc(e.title_en)}</span></div>`
            }</div>
            <h1 data-ko="${esc(e.title_ko)}" data-en="${esc(e.title_en)}">${esc(e.title_ko)}</h1>
            <p class="exh-date">${esc(e.date)}</p>
            <p class="exh-venue" data-ko="${esc(e.venue_ko)}" data-en="${esc(e.venue_en)}">${esc(e.venue_ko)}</p>
            <p class="exh-detail-desc" data-ko="${esc(e.desc_ko)}" data-en="${esc(e.desc_en)}">${esc(e.desc_ko)}</p>
            ${extraHTML}
          </article>
          <div class="work-nav">${prev}${next}</div>`;
        document.title = `${e.title_ko} — An Se Eun`;
      }
    }
  }

  // ===== Projects 페이지: Collaboration / Curatorial Project =====
  const projectsContent = document.getElementById("projects-content");
  if (projectsContent) {
    const data = await loadJSON("data/projects.json");
    if (data) {
      const all = (data.projects || []).map((p, idx) => ({ ...p, idx }));
      const cats = [
        { key: "collaboration", label: "Collaboration" },
        { key: "curatorial", label: "Curatorial Project" },
      ];
      projectsContent.innerHTML = cats.map((c) => {
        const items = all.filter((p) => p.category === c.key);
        if (!items.length) return "";
        return `
          <section class="series">
            <div class="series-head"><h2>${c.label}</h2></div>
            <div class="grid">${items.map((p) => `
              <figure class="card"><a href="project.html?i=${p.idx}">
                ${thumbHTML(p, p.title_en)}
                <figcaption>
                  <strong data-ko="${esc(p.title_ko)}" data-en="${esc(p.title_en)}">${esc(p.title_ko)}</strong><span>, ${esc(p.year)}</span>
                </figcaption>
              </a></figure>`).join("")}</div>
          </section>`;
      }).join("");
    }
  }

  // ===== Project 상세 페이지 =====
  const projectDetail = document.getElementById("project-detail");
  if (projectDetail) {
    const data = await loadJSON("data/projects.json");
    if (data) {
      const all = data.projects || [];
      const i = Math.min(Math.max(0, parseInt(new URLSearchParams(location.search).get("i") || "0", 10) || 0), all.length - 1);
      const p = all[i];
      if (p) {
        // 대표 이미지 + 추가 이미지를 하나의 슬라이드쇼로 (썸네일 클릭 전환)
        const pImages = [p.image, ...(p.images || []).map((o) => (typeof o === "string" ? o : o.image))].filter(Boolean);
        const pImageArea = pImages.length
          ? sliderHTML("project-slider", pImages, p.title_ko)
          : `<div class="placeholder exh-placeholder"><span>${esc(p.title_en)}</span></div>`;
        // 다른 프로젝트 (현재 것 제외)
        const otherProjects = all
          .map((o, idx) => ({ ...o, idx }))
          .filter((o) => o.idx !== i);
        const othersHTML = otherProjects.length ? `
          <section class="other-works">
            <h2 data-ko="다른 프로젝트" data-en="More Projects">다른 프로젝트</h2>
            <div class="grid">${otherProjects.map((o) => `
              <figure class="card"><a href="project.html?i=${o.idx}">
                ${thumbHTML(o, o.title_en)}
                <figcaption>
                  <strong data-ko="${esc(o.title_ko)}" data-en="${esc(o.title_en)}">${esc(o.title_ko)}</strong><span>, ${esc(o.year)}</span>
                </figcaption>
              </a></figure>`).join("")}</div>
          </section>` : "";

        projectDetail.innerHTML = `
          <p class="back-link detail-back"><a href="projects.html" data-ko="← 프로젝트 목록" data-en="← All Projects">← 프로젝트 목록</a></p>
          <article class="exh-detail">
            <h1 data-ko="${esc(p.title_ko)}" data-en="${esc(p.title_en)}">${esc(p.title_ko)}</h1>
            <p class="exh-date">${esc(p.year)}${p.category === "curatorial" ? " · Curatorial Project" : " · Collaboration"}</p>
            <p class="exh-venue" data-ko="${esc(p.venue_ko)}" data-en="${esc(p.venue_en)}">${esc(p.venue_ko)}</p>
            <p class="exh-detail-desc" data-ko="${esc(p.desc_ko)}" data-en="${esc(p.desc_en)}">${esc(p.desc_ko)}</p>
            <div class="exh-detail-image project-image-below">${pImageArea}</div>
          </article>
          ${othersHTML}`;
        const pSlider = document.getElementById("project-slider");
        if (pSlider) initSlider(pSlider);
        document.title = `${p.title_ko} — An Se Eun`;
      }
    }
  }

  // ===== Writings 페이지: 카테고리별 글 목록 =====
  const WRITING_CATS = [
    { key: "artist", ko: "작가의 글", en: "Artist's Writings" },
    { key: "criticism", ko: "비평", en: "Criticism" },
    { key: "interview", ko: "인터뷰", en: "Interview" },
    { key: "article", ko: "기사", en: "Article" },
    { key: "etc", ko: "기타", en: "Etc." },
  ];
  const writingsContent = document.getElementById("writings-content");
  if (writingsContent) {
    const data = await loadJSON("data/writings.json");
    if (data) {
      const all = (data.writings || []).map((t, idx) => ({ ...t, idx }));
      writingsContent.innerHTML = WRITING_CATS.map((c) => {
        const items = all.filter((t) => t.category === c.key);
        if (!items.length) return "";
        return `
          <section class="series writing-section">
            <div class="series-head"><h2 data-ko="${esc(c.ko)}" data-en="${esc(c.en)}">${esc(c.ko)}</h2></div>
            <ul class="writing-list">${items.map((t) => `
              <li><a href="writing.html?i=${t.idx}">
                <span class="year">${esc(t.year)}</span>
                <span class="writing-title" data-ko="${esc(t.title_ko)}" data-en="${esc(t.title_en)}">${esc(t.title_ko)}</span>
                ${t.author_ko || t.author_en
                  ? `<span class="writing-author" data-ko="${esc(t.author_ko)}" data-en="${esc(t.author_en)}">${esc(t.author_ko)}</span>` : ""}
              </a></li>`).join("")}</ul>
          </section>`;
      }).join("");
    }
  }

  // ===== Writing 상세 페이지 (본문 한/영) =====
  const writingDetail = document.getElementById("writing-detail");
  if (writingDetail) {
    const data = await loadJSON("data/writings.json");
    if (data) {
      const all = data.writings || [];
      const i = Math.min(Math.max(0, parseInt(new URLSearchParams(location.search).get("i") || "0", 10) || 0), all.length - 1);
      const t = all[i];
      if (t) {
        const cat = WRITING_CATS.find((c) => c.key === t.category);
        writingDetail.innerHTML = `
          <p class="back-link detail-back"><a href="writings.html" data-ko="← 글 목록" data-en="← All Writings">← 글 목록</a></p>
          <article class="writing-detail">
            ${cat ? `<p class="exh-date" data-ko="${esc(cat.ko)}" data-en="${esc(cat.en)}">${esc(cat.ko)}</p>` : ""}
            ${t.image ? `<div class="exh-detail-image"><img src="${esc(t.image)}" alt="${esc(t.title_ko)}"></div>` : ""}
            <h1 data-ko="${esc(t.title_ko)}" data-en="${esc(t.title_en)}">${esc(t.title_ko)}</h1>
            <p class="writing-meta">
              ${t.author_ko || t.author_en ? `<span data-ko="${esc(t.author_ko)}" data-en="${esc(t.author_en)}">${esc(t.author_ko)}</span> · ` : ""}${esc(t.year)}${t.source_ko || t.source_en ? ` · <span data-ko="${esc(t.source_ko)}" data-en="${esc(t.source_en)}">${esc(t.source_ko)}</span>` : ""}
            </p>
            <div class="writing-body" data-ko="${esc(t.body_ko)}" data-en="${esc(t.body_en)}">${esc(t.body_ko)}</div>
            ${t.link ? `<p class="writing-link"><a href="${esc(t.link)}" target="_blank" rel="noopener" data-ko="원문 보기 →" data-en="Read original →">원문 보기 →</a></p>` : ""}
          </article>`;
        document.title = `${t.title_ko} — An Se Eun`;
      }
    }
  }

  // ===== About 페이지 (프로필 + 작가노트 + C.V. 한/영 + 연락처) =====
  const aboutContent = document.getElementById("about-content");
  if (aboutContent) {
    const a = await loadJSON("data/artist.json");
    if (a) {
      const cvList = (items) => `<ul class="cv-list">${(items || []).map((it) =>
        `<li><span class="year">${esc(it.year)}</span><span data-ko="${esc(it.text_ko)}" data-en="${esc(it.text_en)}">${esc(it.text_ko)}</span></li>`
      ).join("")}</ul>`;

      const cvSection = (label_ko, label_en, items) => (items || []).length
        ? `<h3 data-ko="${esc(label_ko)}" data-en="${esc(label_en)}">${esc(label_ko)}</h3>${cvList(items)}`
        : "";

      aboutContent.innerHTML = `
        <div class="artist-top">
          <div class="artist-photo">
            ${a.profile_image
              ? `<img class="profile" src="${esc(a.profile_image)}" alt="Profile">`
              : `<div class="profile placeholder"><span data-ko="프로필 사진" data-en="Profile Photo">프로필 사진</span></div>`}
            <div class="artist-icons">
              <a href="mailto:${esc(a.email)}" class="icon-circle" aria-label="Email">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
                </svg>
              </a>
              <a href="${esc(a.instagram)}" target="_blank" rel="noopener" class="icon-circle" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/>
                  <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none"/>
                </svg>
              </a>
            </div>
          </div>
          <div class="artist-main">
            <h2 data-ko="작가 노트" data-en="Artist Statement">작가 노트</h2>
            <p class="statement" data-ko="${esc(a.statement_ko)}" data-en="${esc(a.statement_en)}">${esc(a.statement_ko)}</p>
          </div>
        </div>
        <section class="artist-section artist-cv">
          <h2>C.V.</h2>
          ${cvSection("학력", "Education", a.education)}
          ${cvSection("개인전", "Solo Exhibitions", a.solo)}
          ${cvSection("단체전", "Group Exhibitions", a.group)}
          ${cvSection("수상 및 레지던시", "Awards & Residencies", a.awards)}
        </section>
        <section class="artist-section">
          <h2>Contact</h2>
          <p class="contact-line">Email — <a href="mailto:${esc(a.email)}">${esc(a.email)}</a></p>
          <p class="contact-line">Instagram — <a href="${esc(a.instagram)}" target="_blank" rel="noopener">${esc(a.instagram_handle)}</a></p>
        </section>`;
    }
  }
}

// 푸터 인스타그램 링크 (artist.json 의 주소를 모든 페이지에 반영)
async function initFooter() {
  const insta = document.getElementById("footer-insta");
  if (insta) {
    const a = await loadJSON("data/artist.json");
    if (a && a.instagram) insta.href = a.instagram;
  }
}
initFooter();

// ===== 꾹 누르면 부분 확대 (루페) — 데스크탑 전용 =====
const LOUPE_SIZE = 240;   // 루페 박스 크기 (px)
const LOUPE_SCALE = 2.5;  // 확대 배율
const LOUPE_DELAY = 250;  // 길게 누름 판정 시간 (ms)

const loupe = document.createElement("div");
loupe.className = "loupe";
document.body.appendChild(loupe);

let loupeTimer = null, loupeActive = false, loupeImg = null, loupeSuppressClick = false;

function loupeUpdate(e) {
  const r = loupeImg.getBoundingClientRect();
  const x = Math.min(Math.max(e.clientX, r.left), r.right);
  const y = Math.min(Math.max(e.clientY, r.top), r.bottom);
  loupe.style.left = `${x - LOUPE_SIZE / 2}px`;
  loupe.style.top = `${y - LOUPE_SIZE / 2}px`;
  loupe.style.backgroundSize = `${r.width * LOUPE_SCALE}px ${r.height * LOUPE_SCALE}px`;
  loupe.style.backgroundPosition =
    `${-((x - r.left) * LOUPE_SCALE - LOUPE_SIZE / 2)}px ${-((y - r.top) * LOUPE_SCALE - LOUPE_SIZE / 2)}px`;
}

document.addEventListener("mousedown", (e) => {
  if (e.button !== 0 || !window.matchMedia("(hover: hover)").matches) return;
  const img = e.target.closest(".slider .slide img");
  if (!img) return;
  e.preventDefault(); // 이미지 기본 드래그 방지
  loupeTimer = setTimeout(() => {
    loupeActive = true;
    loupeImg = img;
    loupe.style.backgroundImage = `url("${img.src}")`;
    loupeUpdate(e);
    loupe.classList.add("show");
    document.body.classList.add("loupe-on"); // 루페 사용 중엔 커서 숨김
  }, LOUPE_DELAY);
});
document.addEventListener("mousemove", (e) => {
  if (loupeActive) loupeUpdate(e);
});
document.addEventListener("mouseup", () => {
  clearTimeout(loupeTimer);
  if (loupeActive) {
    loupeActive = false;
    loupe.classList.remove("show");
    document.body.classList.remove("loupe-on");
    loupeSuppressClick = true; // 루페를 쓴 길게 누름은 클릭(확대 뷰어 열기)으로 치지 않음
  }
});
document.addEventListener("click", (e) => {
  if (loupeSuppressClick) {
    loupeSuppressClick = false;
    e.stopPropagation();
    e.preventDefault();
  }
}, true);

// ===== 이미지 확대 뷰어 (라이트박스) =====
// 이미지 클릭 → 확대. 좌우 화살표로 넘기기, 아무 곳이나 클릭하거나 Esc 로 닫기
const lightbox = document.createElement("div");
lightbox.className = "lightbox";
lightbox.innerHTML = `
  <div class="lb-zoom-btns">
    <button class="lb-zoom-in" aria-label="zoom in">+</button>
    <button class="lb-zoom-out" aria-label="zoom out">−</button>
  </div>
  <button class="lb-close" aria-label="close">×</button>
  <button class="lb-arrow lb-prev" aria-label="previous image">←</button>
  <img alt="">
  <button class="lb-arrow lb-next" aria-label="next image">→</button>
  <div class="lb-thumbs"></div>`;
document.body.appendChild(lightbox);
const lightboxImg = lightbox.querySelector("img");
const lbPrev = lightbox.querySelector(".lb-prev");
const lbNext = lightbox.querySelector(".lb-next");
const lbThumbs = lightbox.querySelector(".lb-thumbs");

// 현재 열려 있는 이미지 목록/위치 + 원래 슬라이더 (닫았을 때 같은 이미지가 보이도록 동기화)
const lbState = { imgs: [], i: 0, slider: null };

function lbShow(n) {
  lbState.i = (n + lbState.imgs.length) % lbState.imgs.length;
  lightboxImg.src = lbState.imgs[lbState.i];
  lbResetZoom();
  [...lbThumbs.children].forEach((t, k) => t.classList.toggle("active", k === lbState.i));
  // 아래 뷰어의 썸네일도 같은 이미지로 맞춤
  const thumbs = lbState.slider?.querySelectorAll(".slider-thumb");
  if (thumbs && thumbs[lbState.i]) thumbs[lbState.i].click();
}

// 휠 확대·드래그 이동 상태
const lbZoom = { z: 1, tx: 0, ty: 0, dragging: false, moved: false, sx: 0, sy: 0 };

function lbApplyZoom() {
  lightboxImg.style.transform = `translate(${lbZoom.tx}px, ${lbZoom.ty}px) scale(${lbZoom.z})`;
  lightboxImg.style.cursor = lbZoom.z > 1 ? "grab" : "";
}

function lbResetZoom() {
  lbZoom.z = 1; lbZoom.tx = 0; lbZoom.ty = 0;
  lbApplyZoom();
}

function closeLightbox() {
  lightbox.classList.remove("show");
  document.body.style.overflow = "";
  lbResetZoom();
}

document.addEventListener("click", (e) => {
  const img = e.target.closest(".slider .slide img");
  if (img) {
    const slider = img.closest(".slider");
    lbState.slider = slider;
    lbState.imgs = [...slider.querySelectorAll(".slide img")].map((el) => el.src);
    lbState.i = lbState.imgs.indexOf(img.src);
    if (lbState.i < 0) lbState.i = 0;
    lightboxImg.src = lbState.imgs[lbState.i];
    lightbox.classList.toggle("has-arrows", lbState.imgs.length > 1);
    lbThumbs.innerHTML = lbState.imgs.length > 1
      ? lbState.imgs.map((src, k) =>
          `<button class="lb-thumb${k === lbState.i ? " active" : ""}" aria-label="image ${k + 1}"><img src="${src}" alt=""></button>`).join("")
      : "";
    [...lbThumbs.children].forEach((t, k) =>
      t.addEventListener("click", (ev) => { ev.stopPropagation(); lbShow(k); }));
    lightbox.classList.add("show");
    document.body.style.overflow = "hidden";
  }
});
lbPrev.addEventListener("click", (e) => { e.stopPropagation(); lbShow(lbState.i - 1); });
lbNext.addEventListener("click", (e) => { e.stopPropagation(); lbShow(lbState.i + 1); });
lightbox.querySelector(".lb-close").addEventListener("click", (e) => { e.stopPropagation(); closeLightbox(); });

// + / − 버튼으로 단계 확대·축소 (화면 중앙 기준)
function lbZoomStep(factor) {
  const prev = lbZoom.z;
  lbZoom.z = Math.min(4, Math.max(1, lbZoom.z * factor));
  const k = lbZoom.z / prev;
  lbZoom.tx *= k; lbZoom.ty *= k;
  if (lbZoom.z === 1) { lbZoom.tx = 0; lbZoom.ty = 0; }
  lbApplyZoom();
}
lightbox.querySelector(".lb-zoom-in").addEventListener("click", (e) => { e.stopPropagation(); lbZoomStep(1.4); });
lightbox.querySelector(".lb-zoom-out").addEventListener("click", (e) => { e.stopPropagation(); lbZoomStep(1 / 1.4); });

// 마우스 휠로 확대/축소 (1배 ~ 4배)
lightbox.addEventListener("wheel", (e) => {
  if (!lightbox.classList.contains("show")) return;
  e.preventDefault();
  const prev = lbZoom.z;
  lbZoom.z = Math.min(4, Math.max(1, lbZoom.z * (e.deltaY < 0 ? 1.12 : 0.89)));
  if (lbZoom.z === 1) { lbZoom.tx = 0; lbZoom.ty = 0; }
  else {
    // 커서 위치를 중심으로 확대되는 느낌이 나도록 이동값 보정
    const r = lightboxImg.getBoundingClientRect();
    const cx = e.clientX - (r.left + r.width / 2);
    const cy = e.clientY - (r.top + r.height / 2);
    const k = lbZoom.z / prev - 1;
    lbZoom.tx -= cx * k;
    lbZoom.ty -= cy * k;
  }
  lbApplyZoom();
}, { passive: false });

// 확대 상태에서 이미지 드래그로 이동
lightboxImg.addEventListener("mousedown", (e) => {
  e.preventDefault();
  lbZoom.dragging = true; lbZoom.moved = false;
  lbZoom.sx = e.clientX - lbZoom.tx; lbZoom.sy = e.clientY - lbZoom.ty;
  lightboxImg.style.cursor = "grabbing";
  lightboxImg.style.transition = "none"; // 드래그 중엔 즉시 따라오게
});
document.addEventListener("mousemove", (e) => {
  if (!lbZoom.dragging) return;
  lbZoom.moved = true;
  lbZoom.tx = e.clientX - lbZoom.sx;
  lbZoom.ty = e.clientY - lbZoom.sy;
  lightboxImg.style.transform = `translate(${lbZoom.tx}px, ${lbZoom.ty}px) scale(${lbZoom.z})`;
});
document.addEventListener("mouseup", () => {
  if (!lbZoom.dragging) return;
  lbZoom.dragging = false;
  lightboxImg.style.cursor = "grab";
  lightboxImg.style.transition = "";
});

// 모바일: 좌우 스와이프로 이전/다음 이미지
let lbTouchX = null, lbTouchY = null;
lightbox.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) { lbTouchX = null; return; }
  lbTouchX = e.touches[0].clientX;
  lbTouchY = e.touches[0].clientY;
}, { passive: true });
lightbox.addEventListener("touchend", (e) => {
  if (lbTouchX === null || lbState.imgs.length < 2) return;
  const dx = e.changedTouches[0].clientX - lbTouchX;
  const dy = e.changedTouches[0].clientY - lbTouchY;
  lbTouchX = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    lbShow(lbState.i + (dx < 0 ? 1 : -1));
  }
}, { passive: true });

// 화살표·X 외에는 어디를 눌러도 닫힘 (드래그 직후나 확대 상태의 이미지 클릭은 예외)
lightbox.addEventListener("click", (e) => {
  if (lbZoom.moved) { lbZoom.moved = false; return; }
  if (e.target === lightboxImg && lbZoom.z > 1) return;
  closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("show")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft" && lbState.imgs.length > 1) lbShow(lbState.i - 1);
  if (e.key === "ArrowRight" && lbState.imgs.length > 1) lbShow(lbState.i + 1);
});

renderDynamic().then(() => {
  setLang(currentLang());
  if (location.hash) {
    document.querySelector(location.hash)?.scrollIntoView();
  }

});
