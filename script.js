// ===== 언어 전환 (Kr / En) =====
const btnKo = document.getElementById("btn-ko");
const btnEn = document.getElementById("btn-en");

function currentLang() {
  return localStorage.getItem("lang") || "ko";
}

function setLang(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-ko]").forEach((el) => {
    el.textContent = el.dataset[lang];
  });
  btnKo.classList.toggle("active", lang === "ko");
  btnEn.classList.toggle("active", lang === "en");
  localStorage.setItem("lang", lang);
}

btnKo.addEventListener("click", () => setLang("ko"));
btnEn.addEventListener("click", () => setLang("en"));

// ===== 스크롤 시 헤더 전환 (투명 → 흰 바) — 메인 페이지에만 적용 =====
const header = document.querySelector(".site-header");
const hasHero = document.querySelector(".hero") !== null;

if (hasHero) {
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll);
  onScroll();
}

// ===== 모바일 메뉴 =====
const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

menuBtn.addEventListener("click", () => nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => nav.classList.remove("open"))
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
  const inner = `
    ${thumbHTML(work, label)}
    <figcaption>
      <strong data-ko="${esc(work.title_ko)}" data-en="${esc(work.title_en)}">${esc(work.title_ko)}</strong>
      <span data-ko="${esc(work.caption_ko)}" data-en="${esc(work.caption_en)}">${esc(work.caption_ko)}</span>
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

async function renderDynamic() {
  // 메인 페이지: 시리즈 대표작 미리보기
  const homeWorks = document.getElementById("home-works");
  if (homeWorks) {
    const data = await loadJSON("data/works.json");
    if (data) {
      homeWorks.innerHTML = data.series.slice(0, 3).map((s) => {
        const first = s.works[0] || {};
        const rep = { ...first, title_ko: s.title_ko, title_en: s.title_en, caption_ko: s.meta_ko, caption_en: s.meta_en };
        return cardHTML(rep, s.title_ko, `works.html#${s.id}`);
      }).join("");
    }
  }

  // 메인 페이지: 전시 미리보기 (최근 2개)
  const homeExh = document.getElementById("home-exh");
  if (homeExh) {
    const data = await loadJSON("data/exhibitions.json");
    if (data) {
      const all = [...(data.solo || []), ...(data.group || [])]
        .sort((a, b) => b.year.localeCompare(a.year)).slice(0, 3);
      homeExh.innerHTML = all.map(exhItemHTML).join("");
    }
  }

  // Works 페이지: 사이드바 + 시리즈별 그리드
  const worksContent = document.getElementById("works-content");
  const seriesNav = document.getElementById("series-nav");
  if (worksContent && seriesNav) {
    const data = await loadJSON("data/works.json");
    if (data) {
      seriesNav.innerHTML = data.series.map((s) =>
        `<li><a href="#${esc(s.id)}" data-ko="${esc(s.title_ko)}" data-en="${esc(s.title_en)}">${esc(s.title_ko)}</a></li>`
      ).join("");
      worksContent.innerHTML = data.series.map((s) => `
        <section id="${esc(s.id)}" class="series">
          <div class="series-head">
            <h2 data-ko="${esc(s.title_ko)}" data-en="${esc(s.title_en)}">${esc(s.title_ko)}</h2>
            <span class="series-meta" data-ko="${esc(s.meta_ko)}" data-en="${esc(s.meta_en)}">${esc(s.meta_ko)}</span>
          </div>
          <div class="grid">${s.works.map((w, i) =>
            cardHTML(w, `${s.title_en} ${i + 1}`, `work.html?series=${encodeURIComponent(s.id)}&i=${i}`)
          ).join("")}</div>
        </section>`).join("");
    }
  }

  // 작품 상세 페이지
  const workDetail = document.getElementById("work-detail");
  if (workDetail) {
    const data = await loadJSON("data/works.json");
    if (data) {
      const params = new URLSearchParams(location.search);
      const sIdx = Math.max(0, data.series.findIndex((s) => s.id === params.get("series")));
      const series = data.series[sIdx];
      const i = Math.min(Math.max(0, parseInt(params.get("i") || "0", 10) || 0), series.works.length - 1);
      const w = series.works[i];

      const titleEl = document.getElementById("detail-series-title");
      titleEl.dataset.ko = series.title_ko;
      titleEl.dataset.en = series.title_en;

      const link = (idx) => `work.html?series=${encodeURIComponent(series.id)}&i=${idx}`;
      const prev = i > 0
        ? `<a href="${link(i - 1)}" data-ko="← 이전" data-en="← Prev">← 이전</a>` : `<span></span>`;
      const next = i < series.works.length - 1
        ? `<a href="${link(i + 1)}" data-ko="다음 →" data-en="Next →">다음 →</a>` : `<span></span>`;

      workDetail.innerHTML = `
        <div class="work-image">${
          w.image
            ? `<img src="${esc(w.image)}" alt="${esc(w.title_ko)}">`
            : `<div class="placeholder detail-placeholder"><span>${esc(w.title_en)}</span></div>`
        }</div>
        <div class="work-info">
          <h2 data-ko="${esc(w.title_ko)}" data-en="${esc(w.title_en)}">${esc(w.title_ko)}</h2>
          <p class="work-caption" data-ko="${esc(w.caption_ko)}" data-en="${esc(w.caption_en)}">${esc(w.caption_ko)}</p>
        </div>
        <div class="work-nav">${prev}<span class="work-count">${i + 1} / ${series.works.length}</span>${next}</div>`;

      document.title = `${w.title_ko} — My Portfolio`;
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
        <section class="artist-section">
          <h2 data-ko="작가 노트" data-en="Artist Statement">작가 노트</h2>
          <p data-ko="${esc(a.statement_ko)}" data-en="${esc(a.statement_en)}">${esc(a.statement_ko)}</p>
        </section>
        <section class="artist-section">
          <h2>C.V.</h2>
          <h3 data-ko="학력" data-en="Education">학력</h3>${cvList(a.education)}
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

renderDynamic().then(() => {
  setLang(currentLang());
  // 데이터 렌더 후 앵커(#series-a 등)로 이동 보정
  if (location.hash) {
    document.querySelector(location.hash)?.scrollIntoView();
  }
});
