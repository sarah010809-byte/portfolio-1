/**
 * 관리자 페이지 비밀번호 로그인용 Cloudflare Worker
 *
 * 동작: /admin 에서 "Login" 클릭 → 이 서버의 비밀번호 입력 창 →
 *       비밀번호가 맞으면 GitHub 저장소 수정 권한(토큰)을 관리자 화면에 전달
 *
 * 필요한 환경변수 (Cloudflare 대시보드 → Worker → Settings → Variables):
 *   ADMIN_PASSWORD : 관리자 비밀번호
 *   GITHUB_TOKEN   : portfolio-1 저장소 쓰기 권한이 있는 GitHub Fine-grained 토큰
 */

const PAGE_STYLE = `
  <style>
    body { font-family: -apple-system, "Malgun Gothic", sans-serif; background: #111;
           display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .box { background: #fff; padding: 40px 36px; border-radius: 8px; width: 280px; text-align: center; }
    h1 { font-size: 15px; letter-spacing: 2px; margin: 0 0 20px; }
    input { width: 100%; box-sizing: border-box; padding: 10px 12px; font-size: 14px;
            border: 1px solid #ccc; border-radius: 4px; margin-bottom: 12px; }
    button { width: 100%; padding: 10px; font-size: 14px; background: #111; color: #fff;
             border: none; border-radius: 4px; cursor: pointer; }
    .err { color: #c0392b; font-size: 12px; margin: 0 0 10px; }
  </style>`;

function formPage(error) {
  return `<!doctype html><html><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">${PAGE_STYLE}</head>
    <body><form class="box" method="POST">
      <h1>AN SE EUN — ADMIN</h1>
      ${error ? `<p class="err">${error}</p>` : ""}
      <input type="password" name="password" placeholder="비밀번호" autofocus autocomplete="current-password">
      <button type="submit">로그인</button>
    </form></body></html>`;
}

function successPage(payloadJson) {
  // Decap CMS 인증 팝업 규약: opener 에게 "authorizing:github" 를 보내고,
  // 응답이 오면 그 origin 으로 성공 메시지를 돌려준다.
  return `<!doctype html><html><head><meta charset="utf-8">${PAGE_STYLE}</head>
    <body><div class="box"><h1>로그인 완료</h1><p style="font-size:12px;color:#888">잠시만요…</p></div>
    <script>
      (function () {
        var payload = ${JSON.stringify(payloadJson)};
        function receive(e) {
          window.opener.postMessage("authorization:github:success:" + payload, e.origin);
          window.removeEventListener("message", receive);
        }
        window.addEventListener("message", receive, false);
        window.opener.postMessage("authorizing:github", "*");
      })();
    </script></body></html>`;
}

function html(body) {
  return new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/auth") {
      if (request.method === "POST") {
        const form = await request.formData();
        if (env.ADMIN_PASSWORD && form.get("password") === env.ADMIN_PASSWORD) {
          const payload = JSON.stringify({ token: env.GITHUB_TOKEN, provider: "github" });
          return html(successPage(payload));
        }
        return html(formPage("비밀번호가 올바르지 않습니다."));
      }
      return html(formPage(""));
    }
    return new Response("An Se Eun admin auth server");
  },
};
