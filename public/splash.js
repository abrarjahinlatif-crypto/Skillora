// Skillora welcome screen. Self-contained: no changes to app.js needed.
// Add to public/index.html, as the FIRST script inside <head>:
//   <script src="/splash.js"></script>
(function () {
  var css = "\
#sk-splash{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;\
background:radial-gradient(900px 500px at 80% 0,rgba(122,60,255,.45),transparent 60%),#060919;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;\
transition:opacity .6s ease,visibility .6s ease}\
#sk-splash.sk-hide{opacity:0;visibility:hidden}\
#sk-splash .sk-tree{font-size:72px;animation:sk-grow 1.6s ease-in-out infinite alternate}\
#sk-splash h1{margin:0;font-size:30px;letter-spacing:7px;font-weight:800}\
#sk-splash p{margin:0;opacity:.85;font-size:15px;text-align:center;padding:0 24px}\
#sk-splash .sk-bar{width:220px;height:6px;border-radius:99px;background:rgba(255,255,255,.2);overflow:hidden}\
#sk-splash .sk-bar i{display:block;height:100%;width:40%;border-radius:99px;background:linear-gradient(90deg,#7a3cff,#22d3ee);animation:sk-slide 1.1s ease-in-out infinite}\
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
    '<div class="sk-tree"><svg width=\'84\' height=\'84\' xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\' role=\'img\' aria-label=\'Skillora\'><defs><linearGradient id=\'sgS\' x1=\'0\' y1=\'0\' x2=\'1\' y2=\'1\'><stop offset=\'0\' stop-color=\'#b24bff\'/><stop offset=\'.55\' stop-color=\'#5a6bff\'/><stop offset=\'1\' stop-color=\'#22d3ee\'/></linearGradient></defs><path d=\'M50 14H25L14 25L25 32H39L50 43L39 54H12\' fill=\'none\' stroke=\'url(#sgS)\' stroke-width=\'9\' stroke-linejoin=\'miter\' stroke-miterlimit=\'4\'/><path d=\'M50 14H25L14 25\' fill=\'none\' stroke=\'#fff\' stroke-opacity=\'.22\' stroke-width=\'3\' stroke-linejoin=\'miter\' transform=\'translate(0 -2)\'/><path fill=\'#7fe8ff\' d=\'M54 2l2 5.6L61.6 9.6l-5.6 2L54 17.2l-2-5.6L46.4 9.6l5.6-2z\'/></svg></div><h1>SKILLORA</h1>' +
    "<p>Learn today. Build tomorrow. Free AI roadmaps, videos, practice and a leaderboard.</p>" +
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