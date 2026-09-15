/* 동적 카테고리 선택 위젯:
   관리자에서 편집하는 카테고리 목록(data/*.json)을 그대로 선택지로 보여준다.
   → 카테고리를 추가/수정하면 선택지와 사이트 탭에 자동 반영 */
(function () {
  var cache = {};
  function load(src) {
    if (!cache[src]) {
      cache[src] = fetch("../" + src + "?t=" + Date.now()).then(function (r) { return r.json(); });
    }
    return cache[src];
  }
  var Control = createClass({
    getInitialState: function () { return { opts: [] }; },
    componentDidMount: function () {
      var f = this.props.field, self = this;
      load(f.get("source")).then(function (j) {
        self.setState({ opts: j[f.get("list_key")] || [] });
      }).catch(function () {});
    },
    render: function () {
      var self = this;
      var value = this.props.value || "";
      var options = [h("option", { key: "_", value: "" }, "— 선택 —")].concat(
        this.state.opts.map(function (o, i) {
          return h("option", { key: i, value: o.key }, o.label || o.key);
        })
      );
      return h("select", {
        id: this.props.forID,
        value: value,
        style: { width: "100%", padding: "10px 12px", fontSize: "14px",
                 border: "2px solid #dfdfe3", borderRadius: "5px", background: "#fff" },
        onChange: function (e) { self.props.onChange(e.target.value); },
      }, options);
    },
  });
  CMS.registerWidget("dyncat", Control);
})();

/* 좌측 카테고리 클릭 → 중간 목록 화면 없이 항상 바로 편집 화면으로 이동
   (각 카테고리에 파일이 하나뿐이라 목록 화면이 불필요)
   — 해시만 바꾸면(location.replace) Decap 내부 라우터가 못 따라가는 경우가 있어
     쿼릭 사이드바 전환과 동일하게 해시를 정해놓고 완전히 새로고침한다 */
(function () {
  var SINGLE = { works: "works", exhibitions: "exhibitions", projects: "projects", writings: "writings", artist: "artist" };
  function autoEnter() {
    var m = location.hash.match(/^#\/collections\/([a-z]+)$/);
    if (m && SINGLE[m[1]]) {
      location.hash = "#/collections/" + m[1] + "/entries/" + SINGLE[m[1]];
      location.reload();
    }
  }
  window.addEventListener("hashchange", autoEnter);
  setTimeout(autoEnter, 300);
})();

/* 편집 화면 상단에 항상 보이는 3단 내비게이션 바
   1줄: 컬렉션(Works·Exhibitions…)          + 오른쪽 '시리즈 추가' 등
   2줄: 그 컬렉션의 분류 목록(시리즈·구분…)  + 오른쪽 '이름 수정 / 삭제'
   3줄: 선택한 분류 안의 항목(작품·전시…)    + 오른쪽 '작품 추가' 등
   → 접힌 화살표를 여러 단계 펼치지 않고 원하는 곳으로 바로 이동한다 */
(function () {
  // l1 = 컬렉션 안의 분류, l2 = 분류 안의 항목 (About 은 분류 구조가 없어 1줄만 표시)
  var COLS = [
    { key: "works", label: "Works", l1: "시리즈", l2: "작품" },
    { key: "exhibitions", label: "Exhibitions", l1: "구분", l2: "전시" },
    { key: "projects", label: "Projects", l1: "종류", l2: "프로젝트" },
    { key: "writings", label: "Writings", l1: "분류", l2: "글" },
    { key: "artist", label: "About" },
  ];
  var STEP = 260; // React 가 다시 그릴 시간
  var sel = { l1: null, l2: null }; // 현재 선택한 분류·항목 (목록에서의 순서)

  var bar = document.createElement("nav");
  bar.id = "quick-top";
  bar.innerHTML =
    '<div class="qt-row" data-row="col"></div>' +
    '<div class="qt-row" data-row="l1"></div>' +
    '<div class="qt-row" data-row="l2"></div>';
  var rows = {
    col: bar.querySelector('[data-row="col"]'),
    l1: bar.querySelector('[data-row="l1"]'),
    l2: bar.querySelector('[data-row="l2"]'),
  };

  function currentCol() {
    var m = location.hash.match(/^#\/collections\/([a-z]+)\/entries\//);
    if (!m) return null;
    for (var i = 0; i < COLS.length; i++) if (COLS[i].key === m[1]) return COLS[i];
    return null;
  }
  function pane() { return document.querySelector('div[class*="ControlPaneContainer"]'); }
  function isItem(el) { return el && /SortableListItem/.test(String(el.className)); }
  // 목록 항목: 최상위(분류) / 특정 분류의 바로 아래 항목
  function topItems() {
    var p = pane();
    if (!p) return [];
    return [].slice.call(p.querySelectorAll('div[class*="SortableListItem"]')).filter(function (el) {
      return !el.parentElement.closest('div[class*="SortableListItem"]');
    });
  }
  function childItems(parent) {
    if (!parent) return [];
    return [].slice.call(parent.querySelectorAll('div[class*="SortableListItem"]')).filter(function (el) {
      return el.parentElement.closest('div[class*="SortableListItem"]') === parent;
    });
  }
  // 요약 줄(NestedObjectLabel)은 접혔을 때만 보이고 펼치면 숨겨진다 (항목 자체는 항상 있음)
  function summaryEl(item) {
    return [].slice.call(item.children).find(function (c) {
      return /NestedObjectLabel/.test(String(c.className));
    });
  }
  function isCollapsed(item) {
    var s = summaryEl(item);
    return !!s && getComputedStyle(s).display !== "none";
  }
  function labelOf(item) {
    var s = summaryEl(item);
    var text = s ? s.textContent.trim() : "";
    // 갓 추가해 내용이 비면 요약이 "—" 나 "No title" 처럼 나온다 → 알아보기 쉬운 이름으로
    if (text && !/^[—–\-\s]*$/.test(text) && !/^No\s/i.test(text)) return text;
    var input = item.querySelector('input[type="text"], input:not([type])');
    return (input && input.value.trim()) || "새 항목";
  }
  function toggle(item) {
    var b = item.querySelector('div[class*="ListItemTopBar"] button');
    if (b) b.click();
  }
  function setOpen(item, open) {
    if (item && isCollapsed(item) === open) toggle(item);
  }
  // 목록의 '~ 추가' 버튼 — 목록 헤더 줄의 마지막 버튼
  function addButtonIn(scope) {
    var top = scope.querySelector('div[class*="TopBarContainer"]');
    if (!top) return null;
    var btns = top.querySelectorAll("button");
    return btns.length ? btns[btns.length - 1] : null;
  }

  /* 분류(l1)·항목(l2)을 펼쳐 보여준다. 선택하지 않은 형제는 접어서 화면을 단순하게 유지 */
  function open(l1, l2) {
    var items = topItems();
    if (l1 == null || !items[l1]) return;
    items.forEach(function (it, i) { setOpen(it, i === l1); });
    setTimeout(function () {
      var parent = topItems()[l1];
      if (!parent) return;
      if (l2 == null) { parent.scrollIntoView({ block: "start", behavior: "smooth" }); render(); return; }
      var kids = childItems(parent);
      kids.forEach(function (k, i) { setOpen(k, i === l2); });
      setTimeout(function () {
        var p2 = topItems()[l1];
        var target = p2 ? childItems(p2)[l2] : null;
        (target || parent).scrollIntoView({ block: "start", behavior: "smooth" });
        render();
      }, STEP);
    }, STEP);
  }

  function addL1() {
    var p = pane();
    var btn = p && addButtonIn(p);
    if (!btn) return;
    btn.click();
    setTimeout(function () {
      var items = topItems();
      sel = { l1: items.length - 1, l2: null };
      open(sel.l1, null);
    }, STEP);
  }
  function addL2() {
    if (sel.l1 == null) return;
    var parent = topItems()[sel.l1];
    if (!parent) return;
    setOpen(parent, true);
    setTimeout(function () {
      var p2 = topItems()[sel.l1];
      // 분류 안의 첫 번째 목록이 곧 그 분류의 항목 목록(이 시리즈의 작품 등)
      var btn = p2 && addButtonIn(p2);
      if (!btn) return;
      btn.click();
      setTimeout(function () {
        var kids = childItems(topItems()[sel.l1]);
        sel.l2 = kids.length - 1;
        open(sel.l1, sel.l2);
      }, STEP);
    }, STEP);
  }
  function renameL1() {
    if (sel.l1 == null) return;
    open(sel.l1, null);
    setTimeout(function () {
      var parent = topItems()[sel.l1];
      var input = parent && parent.querySelector('input[type="text"], input:not([type])');
      if (input) input.focus();
    }, STEP * 2);
  }
  function deleteL1() {
    if (sel.l1 == null) return;
    var parent = topItems()[sel.l1];
    if (!parent) return;
    var btns = parent.querySelectorAll('div[class*="ListItemTopBar"] button');
    if (btns.length) btns[btns.length - 1].click(); // 삭제 확인창은 아래 스크립트가 띄운다
    sel = { l1: null, l2: null };
    setTimeout(render, STEP);
  }

  function btn(text, cls) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = text;
    if (cls) b.className = cls;
    return b;
  }
  function fillRow(row, items, onPick, selected, actions) {
    row.innerHTML = "";
    var list = document.createElement("div");
    list.className = "qt-list";
    items.forEach(function (label, i) {
      var b = btn(label);
      if (i === selected) b.classList.add("on");
      b.addEventListener("click", function () { onPick(i); });
      list.appendChild(b);
    });
    if (!items.length) {
      var empty = document.createElement("span");
      empty.className = "qt-empty";
      empty.textContent = "아직 없습니다";
      list.appendChild(empty);
    }
    row.appendChild(list);
    if (actions && actions.length) {
      var act = document.createElement("div");
      act.className = "qt-actions";
      actions.forEach(function (a) {
        var b = btn(a.text, a.cls);
        b.addEventListener("click", a.onClick);
        act.appendChild(b);
      });
      row.appendChild(act);
    }
  }

  // 바 높이(줄 수)에 맞춰 본문 여백·스크롤 위치를 자동으로 맞춘다
  function syncHeight() {
    var h = bar.style.display === "none" ? 0 : Math.round(bar.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--qt-h", h + "px");
  }

  var lastKey = "";
  function render() {
    if (!bar.isConnected) document.body.appendChild(bar);
    var col = currentCol();
    bar.style.display = col ? "block" : "none";
    document.body.classList.toggle("has-quick-top", !!col);
    if (!col) { lastKey = ""; syncHeight(); return; }

    // 1줄: 컬렉션
    rows.col.innerHTML = "";
    var colList = document.createElement("div");
    colList.className = "qt-list";
    COLS.forEach(function (c) {
      var a = document.createElement("a");
      a.textContent = c.label;
      a.href = "#/collections/" + c.key + "/entries/" + c.key;
      if (c.key === col.key) a.className = "on";
      a.addEventListener("click", function (e) {
        e.preventDefault();
        // 편집 화면끼리 곧장 전환하면 이전 내용이 남는 문제 → 전환 시 화면을 새로 불러옴
        if (location.hash !== a.getAttribute("href")) {
          location.hash = a.getAttribute("href");
          location.reload();
        }
      });
      colList.appendChild(a);
    });
    rows.col.appendChild(colList);
    if (col.l1) {
      var act = document.createElement("div");
      act.className = "qt-actions";
      var add = btn("+ " + col.l1 + " 추가", "qt-add");
      add.addEventListener("click", addL1);
      act.appendChild(add);
      rows.col.appendChild(act);
    }

    if (!col.l1) { rows.l1.style.display = "none"; rows.l2.style.display = "none"; syncHeight(); return; }

    // 2줄: 분류
    rows.l1.style.display = "flex";
    var items = topItems();
    if (sel.l1 != null && !items[sel.l1]) sel = { l1: null, l2: null };
    fillRow(rows.l1, items.map(labelOf), function (i) {
      sel = { l1: i, l2: null };
      open(i, null);
    }, sel.l1, sel.l1 == null ? [] : [
      { text: "이름 수정", onClick: renameL1 },
      { text: "삭제", cls: "qt-danger", onClick: deleteL1 },
    ]);

    // 3줄: 선택한 분류 안의 항목
    if (sel.l1 == null || !col.l2) { rows.l2.style.display = "none"; syncHeight(); return; }
    rows.l2.style.display = "flex";
    var kids = childItems(items[sel.l1]);
    if (sel.l2 != null && !kids[sel.l2]) sel.l2 = null;
    fillRow(rows.l2, kids.map(labelOf), function (i) {
      sel.l2 = i;
      open(sel.l1, i);
    }, sel.l2, [{ text: "+ " + col.l2 + " 추가", cls: "qt-add", onClick: addL2 }]);
    syncHeight();
  }

  /* 내용이 바뀌었을 때만 다시 그린다 (입력 중 버튼이 계속 새로 그려지지 않게) */
  function tick() {
    var col = currentCol();
    var key = "";
    if (col) {
      var items = topItems();
      key = col.key + "|" + sel.l1 + "|" + sel.l2 + "|" + items.map(labelOf).join("~") + "|" +
        (sel.l1 != null && items[sel.l1] ? childItems(items[sel.l1]).map(labelOf).join("~") : "");
    }
    if (key !== lastKey) { lastKey = key; render(); }
  }
  window.addEventListener("hashchange", function () { sel = { l1: null, l2: null }; lastKey = ""; tick(); });
  setInterval(tick, 700); // 초기 로드·내부 라우팅 대비
})();

/* 목록 항목(x) 삭제 전 확인창
   목록 항목 상단 바(ListItemTopBar)에는 버튼이 둘뿐 — 펼침/접기(첫 번째), 삭제(마지막).
   버튼 클래스 이름이 매번 해시라 안정적으로 잡을 수 없어, "그 줄의 마지막 버튼"이라는
   구조로 삭제 버튼을 식별한다. */
(function () {
  document.addEventListener("click", function (e) {
    var bar = e.target.closest('div[class*="ListItemTopBar"]');
    if (!bar) return;
    var btn = e.target.closest("button");
    if (!btn) return;
    var buttons = bar.querySelectorAll("button");
    if (!buttons.length || buttons[buttons.length - 1] !== btn) return;
    if (!window.confirm("이 항목을 삭제하시겠습니까?")) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }, true);
})();
