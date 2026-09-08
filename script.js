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
          <a href="${it.href}" class="${cur.trim()}">${it.label}</a>
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
    const mobileMenu = window.matchMedia("(max-width: 768px)").matches;
    if (mobileMenu) return; // 모바일 메뉴에선 하위 항목이 항상 보이므로 그대로 이동
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
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll);
  onScroll();
}

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
nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => setMenu(false))
);

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

function initSlider(root) {
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
        hero.style.background = `url("${feat.image}") center / cover no-repeat`;
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
      const first = ex[0] ? `<div class="home-exh-feature">${exhCard(ex[0], true, 0)}</div>` : "";
      const rest = ex.length > 1
        ? `<div class="home-exh-row">${ex.slice(1, 4).map((e, i) => exhCard(e, false, i + 1)).join("")}</div>`
        : "";
      homeExh.innerHTML = first + rest;
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

      const seriesLine = (w.series_ko || w.series_en)
        ? `<p class="side-series" data-ko="${esc(w.series_ko || w.series_en)}" data-en="${esc(w.series_en || w.series_ko)}">${esc(w.series_ko || w.series_en)}</p>`
        : "";

      // 이전/다음과 순번은 같은 연도 안에서만
      const yearList = list.filter((o) => o.year === w.year);
      const yPos = yearList.findIndex((o) => o.idx === w.idx);
      const link = (p) => `work.html?i=${yearList[p].idx}`;
      const prev = yPos > 0
        ? `<a href="${link(yPos - 1)}" data-ko="← 이전" data-en="← Prev">← 이전</a>` : `<span></span>`;
      const next = yPos < yearList.length - 1
        ? `<a href="${link(yPos + 1)}" data-ko="다음 →" data-en="Next →">다음 →</a>` : `<span></span>`;

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
        <div class="work-nav">${prev}<span class="work-count">${yPos + 1} / ${yearList.length}</span>${next}</div>
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
          ? `<a href="exhibition.html?i=${i - 1}" data-ko="← 이전 전시" data-en="← Prev">← 이전 전시</a>` : `<span></span>`;
        const next = i < ex.length - 1
          ? `<a href="exhibition.html?i=${i + 1}" data-ko="다음 전시 →" data-en="Next →">다음 전시 →</a>` : `<span></span>`;
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
          <div class="work-nav">${prev}<span class="work-count">${i + 1} / ${ex.length}</span>${next}</div>`;
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
            <div class="exh-detail-image">${pImageArea}</div>
            <h1 data-ko="${esc(p.title_ko)}" data-en="${esc(p.title_en)}">${esc(p.title_ko)}</h1>
            <p class="exh-date">${esc(p.year)}${p.category === "curatorial" ? " · Curatorial Project" : " · Collaboration"}</p>
            <p class="exh-venue" data-ko="${esc(p.venue_ko)}" data-en="${esc(p.venue_en)}">${esc(p.venue_ko)}</p>
            <p class="exh-detail-desc" data-ko="${esc(p.desc_ko)}" data-en="${esc(p.desc_en)}">${esc(p.desc_ko)}</p>
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

// ===== 이미지 확대 뷰어 (라이트박스) =====
// 이미지 클릭 → 확대. 좌우 화살표로 넘기기, 아무 곳이나 클릭하거나 Esc 로 닫기
const lightbox = document.createElement("div");
lightbox.className = "lightbox";
lightbox.innerHTML = `
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
  [...lbThumbs.children].forEach((t, k) => t.classList.toggle("active", k === lbState.i));
  // 아래 뷰어의 썸네일도 같은 이미지로 맞춤
  const thumbs = lbState.slider?.querySelectorAll(".slider-thumb");
  if (thumbs && thumbs[lbState.i]) thumbs[lbState.i].click();
}

function closeLightbox() {
  lightbox.classList.remove("show");
  document.body.style.overflow = "";
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
// 화살표 외에는 어디를 눌러도 닫힘 (이미지 포함 — 커서가 축소 아이콘이므로)
lightbox.addEventListener("click", () => closeLightbox());
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
