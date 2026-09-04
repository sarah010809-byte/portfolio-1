// ===== 언어 전환 (Kr / En) =====
const btnKo = document.getElementById("btn-ko");
const btnEn = document.getElementById("btn-en");

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

// 마지막에 선택한 언어 기억
setLang(localStorage.getItem("lang") || "ko");

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
