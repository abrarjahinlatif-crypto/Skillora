// Skillora welcome screen. Self-contained: no changes to app.js needed.
// Add to public/index.html, as the FIRST script inside <head>:
//   <script src="/splash.js"></script>
(function () {
  var css = "\
#sk-splash{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;\
background:linear-gradient(135deg,#1b1340,#3b2a8c 55%,#ff8a5c);color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;\
transition:opacity .6s ease,visibility .6s ease}\
#sk-splash.sk-hide{opacity:0;visibility:hidden}\
#sk-splash .sk-tree{font-size:72px;animation:sk-grow 1.6s ease-in-out infinite alternate}\
#sk-splash h1{margin:0;font-size:38px;letter-spacing:.5px}\
#sk-splash p{margin:0;opacity:.85;font-size:15px;text-align:center;padding:0 24px}\
#sk-splash .sk-bar{width:220px;height:6px;border-radius:99px;background:rgba(255,255,255,.2);overflow:hidden}\
#sk-splash .sk-bar i{display:block;height:100%;width:40%;border-radius:99px;background:#fff;animation:sk-slide 1.1s ease-in-out infinite}\
#sk-splash small{opacity:.7;font-size:12px}\
@keyframes sk-grow{from{transform:scale(.85) rotate(-4deg)}to{transform:scale(1.08) rotate(4deg)}}\
@keyframes sk-slide{0%{margin-left:-40%}100%{margin-left:100%}}\
@media (prefers-reduced-motion:reduce){#sk-splash *{animation:none!important}}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var box = document.createElement("div");
  box.id = "sk-splash";
  box.setAttribute("role", "status");
  box.innerHTML =
    '<div class="sk-tree">🌳</div><h1>Skillora</h1>' +
    "<p>Your free, AI-made learning roadmap. Learn a skill step by step, earn points and climb the leaderboard.</p>" +
    '<div class="sk-bar"><i></i></div><small>Getting things ready…</small>';

  function mount() {
    if (document.body) document.body.appendChild(box);
    else document.addEventListener("DOMContentLoaded", mount);
  }
  mount();

  var started = Date.now();

  function hide() {
    var wait = Math.max(0, 1200 - (Date.now() - started)); // show at least 1.2s
    setTimeout(function () {
      box.classList.add("sk-hide");
      setTimeout(function () { box.remove(); }, 700);
    }, wait);
  }

  if (document.readyState === "complete") hide();
  else window.addEventListener("load", hide);

  setTimeout(hide, 8000); // never trap the user
})();
