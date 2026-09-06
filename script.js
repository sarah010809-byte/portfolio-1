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
    // 언어 전환 시 짧은 페이드
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

// ===== 데이터 파일에서 작품/전시 불러오기 =====
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

function exhItemHTML(item) {
  return `<li>
    <span class="year">${esc(item.year)}</span>
    <span data-ko="${esc(item.text_ko)}" data-en="${esc(item.text_en)}">${esc(item.text_ko)}</span>
  </li>`;
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

async function renderDynamic() {
  // 메인 페이지: 연도별로 3개씩 미리보기 (최신 연도부터)
  const homeWorks = document.getElementById("home-works");
  if (homeWorks) {
    const data = await loadJSON("data/works.json");
    if (data) {
      const list = sortedWorks(data);
      const years = [...new Set(list.map((w) => w.year))];
      // 연도별 3개씩을 하나의 그리드로 (PC: 3열 = 연도당 한 줄, 모바일: 2열 연속)
      const picks = years.flatMap((y) => list.filter((w) => w.year === y).slice(0, 3));
      homeWorks.innerHTML = `<div class="grid">${picks.map((w) =>
        cardHTML({ ...w, caption_ko: w.year, caption_en: w.year },
          w.title_en, `work.html?i=${w.idx}`)
      ).join("")}</div>`;
    }
  }

  // 메인 페이지: 전시 미리보기 (최근 전시 크게 + 이전 2개 좌우)
  const homeExh = document.getElementById("home-exh");
  if (homeExh) {
    const data = await loadJSON("data/exhibitions.json");
    if (data) {
      const ex = data.exhibitions || [];
      const exhCard = (e, big) => `
        <a class="home-exh-card" href="exhibitions.html">
          <div class="exh-thumb${big ? " big" : ""}">${
            e.image
              ? `<img src="${esc(e.image)}" alt="${esc(e.title_ko)}" loading="lazy">`
              : `<div class="placeholder"><span>${esc(e.title_en)}</span></div>`
          }</div>
          <h3 data-ko="${esc(e.title_ko)}" data-en="${esc(e.title_en)}">${esc(e.title_ko)}</h3>
          <p class="exh-date">${esc(e.date)}</p>
          <p class="exh-venue" data-ko="${esc(e.venue_ko)}" data-en="${esc(e.venue_en)}">${esc(e.venue_ko)}</p>
        </a>`;
      const first = ex[0] ? `<div class="home-exh-feature">${exhCard(ex[0], true)}</div>` : "";
      const pair = ex.length > 1
        ? `<div class="home-exh-pair">${ex.slice(1, 3).map((e) => exhCard(e, false)).join("")}</div>`
        : "";
      homeExh.innerHTML = first + pair;
    }
  }

  // Exhibitions 페이지: 대표이미지 + 우측 정보
  const exhList = document.getElementById("exh-list");
  if (exhList) {
    const data = await loadJSON("data/exhibitions.json");
    if (data) {
      exhList.innerHTML = (data.exhibitions || []).map((e) => `
        <article class="exh-item">
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
        </article>`).join("");
    }
  }

  // Works 페이지: 사이드바(연도) + 연도별 그리드
  const worksContent = document.getElementById("works-content");
  const seriesNav = document.getElementById("series-nav");
  if (worksContent && seriesNav) {
    const data = await loadJSON("data/works.json");
    if (data) {
      const list = sortedWorks(data);
      const years = [...new Set(list.map((w) => w.year))];

      // 연도를 누르면 해당 연도만 모아 보는 페이지로 이동 (works.html?year=2026)
      const yearParam = new URLSearchParams(location.search).get("year");
      const selected = years.includes(yearParam) ? yearParam : null;

      seriesNav.innerHTML =
        `<li><a href="works.html"${selected ? "" : ' class="current-year"'}>All</a></li>` +
        years.map((y) =>
          `<li><a href="works.html?year=${esc(y)}"${y === selected ? ' class="current-year"' : ""}>${esc(y)}</a></li>`
        ).join("");

      const shownYears = selected ? [selected] : years;
      worksContent.innerHTML = shownYears.map((y) => `
        <section id="y-${esc(y)}" class="series">
          <div class="series-head"><h2>${esc(y)}</h2></div>
          <div class="grid">${list.filter((w) => w.year === y).map((w) =>
            cardHTML({ ...w, caption_ko: "", caption_en: "" },
              w.title_en, `work.html?i=${w.idx}`)
          ).join("")}</div>
        </section>`).join("");
    }
  }

  // 작품 상세 페이지
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

      const related = (w.related_ko || w.related_en) ? `
        <h3 data-ko="관련 전시" data-en="Related Exhibition">관련 전시</h3>
        <p class="side-related" data-ko="${esc(w.related_ko)}" data-en="${esc(w.related_en)}">${esc(w.related_ko)}</p>` : "";

      // 상세 설명 (우측 패널의 작품명 아래에 표시)
      const desc = (w.desc_ko || w.desc_en)
        ? `<p class="work-desc" data-ko="${esc(w.desc_ko)}" data-en="${esc(w.desc_en)}">${esc(w.desc_ko)}</p>`
        : "";

      // 이전/다음과 순번은 같은 연도 안에서만
      const yearList = list.filter((o) => o.year === w.year);
      const yPos = yearList.findIndex((o) => o.idx === w.idx);
      const link = (p) => `work.html?i=${yearList[p].idx}`;
      const prev = yPos > 0
        ? `<a href="${link(yPos - 1)}" data-ko="← 이전" data-en="← Prev">← 이전</a>` : `<span></span>`;
      const next = yPos < yearList.length - 1
        ? `<a href="${link(yPos + 1)}" data-ko="다음 →" data-en="Next →">다음 →</a>` : `<span></span>`;

      // 같은 연도의 다른 작품 (연도 표기는 생략)
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
          <div class="work-image">${
            w.image
              ? `<img src="${esc(w.image)}" alt="${esc(w.title_ko)}">`
              : `<div class="placeholder detail-placeholder"><span>${esc(w.title_en)}</span></div>`
          }</div>
          <aside class="work-side">
            <h1 data-ko="${esc(w.title_ko)}" data-en="${esc(w.title_en)}">${esc(w.title_ko)}</h1>
            <p class="side-caption"
               data-ko="${esc(w.year)}${w.medium_ko ? `, ${esc(w.medium_ko)}` : ""}"
               data-en="${esc(w.year)}${w.medium_en ? `, ${esc(w.medium_en)}` : ""}">${esc(w.year)}</p>
            ${related}
            ${desc}
          </aside>
        </div>
        <div class="work-nav">${prev}<span class="work-count">${yPos + 1} / ${yearList.length}</span>${next}</div>
        ${others}`;

      document.title = `${w.title_ko} — An Se Eun`;
    }
  }

  // Artist 페이지
  const artistContent = document.getElementById("artist-content");
  if (artistContent) {
    const a = await loadJSON("data/artist.json");
    if (a) {
      const cvList = (items) => `<ul class="cv-list">${(items || []).map((it) =>
        `<li><span class="year">${esc(it.year)}</span><span data-ko="${esc(it.text_ko)}" data-en="${esc(it.text_en)}">${esc(it.text_ko)}</span></li>`
      ).join("")}</ul>`;

      artistContent.innerHTML = `
        <div class="artist-top">
          <div class="artist-photo">
            ${a.profile_image
              ? `<img class="profile" src="${esc(a.profile_image)}" alt="Profile">`
              : `<div class="profile placeholder"><span data-ko="프로필 사진" data-en="Profile Photo">프로필 사진</span></div>`}
            <div class="artist-icons">
              <a href="contact.html" class="icon-circle" aria-label="Contact">
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
          <h3 data-ko="개인전" data-en="Solo Exhibitions">개인전</h3>${cvList(a.solo)}
          <h3 data-ko="단체전" data-en="Group Exhibitions">단체전</h3>${cvList(a.group)}
        </section>`;
    }
  }

  // Contact 페이지 (이메일/인스타는 artist.json 공용)
  const contactContent = document.getElementById("contact-content");
  if (contactContent) {
    const a = await loadJSON("data/artist.json");
    if (a) {
      contactContent.innerHTML = `
        <p class="contact-line">Email — <a href="mailto:${esc(a.email)}">${esc(a.email)}</a></p>
        <p class="contact-line">Instagram — <a href="${esc(a.instagram)}" target="_blank" rel="noopener">${esc(a.instagram_handle)}</a></p>`;
    }
  }

  // Exhibitions 페이지
  const soloList = document.getElementById("solo-list");
  const groupList = document.getElementById("group-list");
  if (soloList && groupList) {
    const data = await loadJSON("data/exhibitions.json");
    if (data) {
      soloList.innerHTML = (data.solo || []).map(exhItemHTML).join("");
      groupList.innerHTML = (data.group || []).map(exhItemHTML).join("");
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

renderDynamic().then(() => {
  setLang(currentLang());
  // 데이터 렌더 후 앵커(#series-a 등)로 이동 보정
  if (location.hash) {
    document.querySelector(location.hash)?.scrollIntoView();
  }
});
