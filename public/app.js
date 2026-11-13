import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let user = null, auth = null, firebaseApp = null, currentRoadmap = null, currentSkillId = null;
let ambienceContext = null, ambienceSources = [], melodyTimer = null;
let progress = { skills: [], streak: 0, lastActive: null, theme: "sunrise", font: "modern", treeStyle: "blossom", sound: false };
let config = { dailyLimit: 10, authConfigured: false, aiConfigured: false };
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
const id = () => Math.random().toString(36).slice(2, 10);
const safe = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
function toast(msg) { const el=$("#toast"); el.textContent=msg; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2800); }
function showPage(name) { $$(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${name}`)); $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===name)); const titles={home:"Good evening, learner ✦",progress:"Your progress",skills:"Achieved skills",resources:"Learn from the best",settings:"Your space, your style",help:"How can we help?",leaderboard:"Leaderboard 🏆",profile:"My profile"}; $("#pageTitle").textContent=titles[name]||"Your learning journey"; if(name==="progress")renderProgress();if(name==="skills")renderSkills();if(name==="leaderboard")renderLeaderboard();if(name==="profile")renderProfile(); }
function getToken(){return user?.getIdToken();}
async function api(url, opts={}) { const headers={"Content-Type":"application/json",...(opts.headers||{})}; if(user)headers.Authorization=`Bearer ${await getToken()}`; const r=await fetch(url,{...opts,headers});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||"Something went wrong.");return data; }
async function saveProgress(){ if(user){try{await api("/api/progress",{method:"PUT",body:JSON.stringify(progress)});}catch(e){toast(e.message);}} else localStorage.setItem("skillora-preview",JSON.stringify(progress)); renderHome(); }
async function loadProgress(){ if(user){try{progress=await api("/api/progress");}catch{}}else{try{progress=JSON.parse(localStorage.getItem("skillora-preview"))||progress;}catch{}} progress.sound=progress.musicOff!==true;applyPrefs();renderHome();startMusicIfWanted(); }
function applyPrefs(){document.body.dataset.theme=progress.theme||"sunrise";document.body.dataset.font=progress.font||"modern";$$(".theme-choice").forEach(b=>b.classList.toggle("selected",b.dataset.theme===progress.theme));$("#fontSelect").value=progress.font||"modern";$("#treeStyle").value=progress.treeStyle||"blossom";$("#soundToggle").textContent=progress.sound?"On":"Off";}
function updateUsage(used=0){$("#quotaText").textContent=Math.max(0,(config.dailyLimit||10)-used);}
async function refreshUsage(){if(!user){updateUsage(0);return;}try{const d=await api("/api/usage");updateUsage(d.used);}catch{}}
function renderHome(){const skills=progress.skills||[];$("#skillCount").textContent=skills.length;$("#streakCount").textContent=`${progress.streak||0} day streak`;$("#streakBig").innerHTML=`${progress.streak||0} <i>days</i>`;const completed=skills.filter(s=>s.completed).length;let tree="🌱",caption="A little growth every day";if(completed>=10){tree=progress.treeStyle==="apples"?"🌳🍎":progress.treeStyle==="butterflies"?"🌳🦋":"🌳🌸";caption="A flourishing learning forest";}else if(completed>=1){tree=progress.treeStyle==="apples"?"🌳🍎":progress.treeStyle==="butterflies"?"🌳🦋":"🌳🌼";caption=`${completed} skill${completed===1?"":"s"} completed — keep growing`;}else if(skills.length){tree="🌿";caption="Your first milestone is in reach";}$("#treeEmoji").textContent=tree;$("#treeCaption").textContent=caption;const stage=$("#treeStage");stage.classList.toggle("tree-awakened",completed>0);stage.classList.toggle("tree-elder",completed>=10);stage.querySelector(".tree-companions")?.remove();if(completed>=10){const lastActive=progress.lastActive?Date.parse(`${progress.lastActive}T00:00:00Z`):NaN,todayMs=Date.parse(`${today()}T00:00:00Z`),inactiveDays=Number.isFinite(lastActive)?Math.max(0,Math.floor((todayMs-lastActive)/86400000)):4,count=Math.max(0,4-inactiveDays),creature=progress.treeStyle==="butterflies"?"🦋":"🐦",group=document.createElement("div");group.className=`tree-companions ${creature==="🦋"?"butterfly-companions":"bird-companions"}`;group.setAttribute("aria-label",`${count} tree companions`);group.innerHTML=Array.from({length:count},(_,i)=>`<span style="--i:${i}">${creature}</span>`).join("");stage.append(group);}const recent=skills.slice().reverse();$("#recentSkills").innerHTML=recent.length?recent.map(skillCard).join(""):`<div class="empty-card glass"><span>✧</span><b>Your first skill is waiting.</b><p>Create a roadmap and watch your learning tree grow.</p></div>`;$$("[data-skill]").forEach(el=>el.addEventListener("click",()=>openSkill(el.dataset.skill)));}
function skillCard(s){const pct=Math.round((s.completedLevels||0)/(s.roadmap?.levels?.length||1)*100);return `<article class="skill-card glass" data-skill="${safe(s.id)}"><div class="skill-symbol">✳</div><h4>${safe(s.title)}</h4><p>${safe(s.roadmap?.summary||"Your personalized learning journey.")}</p><div class="bar"><span style="width:${pct}%"></span></div><div class="skill-foot"><span>${s.completedLevels||0}/${s.roadmap?.levels?.length||0} levels</span><b>${pct}%</b></div></article>`;}
function renderSkills(){const arr=progress.skills||[];$("#skillsList").innerHTML=arr.length?arr.map(skillCard).join(""):`<div class="empty-card glass"><span>✧</span><b>No skills yet</b><p>Your learning achievements will appear here.</p></div>`;$$("[data-skill]").forEach(el=>el.addEventListener("click",()=>openSkill(el.dataset.skill)));}
function renderProgress(){const skills=progress.skills||[],completed=skills.filter(s=>s.completed).length,levels=skills.reduce((n,s)=>n+(s.completedLevels||0),0);$("#progressSummary").innerHTML=`<div class="summary-box glass"><small>SKILLS STARTED</small><b>${skills.length}</b></div><div class="summary-box glass"><small>LEVELS CLEARED</small><b>${levels}</b></div><div class="summary-box glass"><small>SKILLS MASTERED</small><b>${completed}</b></div>`;$("#progressList").innerHTML=skills.length?skills.map(s=>`<div class="progress-row glass"><div><b>${safe(s.title)}</b><small>${s.completedLevels||0} of ${s.roadmap.levels.length} levels completed</small></div><strong>${Math.round((s.completedLevels||0)/s.roadmap.levels.length*100)}%</strong></div>`).join(""):`<div class="empty-card glass"><b>Your journey starts with one subject.</b><p>Generate a roadmap to see your progress here.</p></div>`;}
function openSkill(skillId){const s=progress.skills.find(x=>x.id===skillId);if(!s)return;currentSkillId=skillId;currentRoadmap=s.roadmap;renderRoadmap(s);showPage("roadmap");}
function renderRoadmap(skill){const r=skill.roadmap;$("#roadmapContent").innerHTML=`<div class="roadmap-head glass"><div class="eyebrow">YOUR PERSONALIZED LEARNING PATH</div><h2>${safe(r.title||skill.title)}</h2><p>${safe(r.summary||"A step-by-step learning journey.")}</p><div class="roadmap-actions"><button class="primary-btn" id="exportPdf">Export PDF ↗</button><button class="outline-btn" id="studyTips">Study smarter ✦</button></div><p><b>Outcome:</b> ${safe(r.outcome||"Build confidence through practice.")} · <b>Estimated:</b> ${r.estimatedWeeks||"—"} weeks</p></div>${r.levels.map((l,i)=>`<div class="level-card glass"><div class="level-top"><span class="level-number">LEVEL ${String(i+1).padStart(2,"0")}</span><span class="muted">${skill.completedLevels>i?"✓ Completed":`${l.estimatedDays||"?"} days`}</span></div><h3>${safe(l.name)}</h3><p>${safe(l.description)}</p><div class="lesson-list">${(l.lessons||[]).map((lesson,j)=>`<div class="lesson-row"><div><b>${safe(lesson.title)}</b><small>Lesson ${j+1}${lesson.points?` · ${lesson.points} pts`:""}${skill.tasks?.[`${i}-${j}`]?.passed?" · ✓ done":""}</small></div><button data-lesson="${i}:${j}">Study lesson →</button></div>`).join("")}</div><div class="level-bottom"><small>${(l.lessons||[]).length} lessons · 10-question checkpoint</small><button data-quiz="${i}">${skill.completedLevels>i?"Review level":"Take level quiz →"}</button></div></div>`).join("")}`;
$("#exportPdf").onclick=()=>exportFlowchart(skill);$("#studyTips").onclick=()=>showTips(r);$$("[data-lesson]").forEach(b=>b.onclick=()=>openLesson(Number(b.dataset.lesson.split(":")[0]),Number(b.dataset.lesson.split(":")[1])));$$("[data-quiz]").forEach(b=>b.onclick=()=>openQuiz(Number(b.dataset.quiz)));}
function showModal(html){$("#modalBody").innerHTML=html;$("#modal").classList.remove("hidden");}function closeModal(){$("#modal").classList.add("hidden");$("#modalBody").innerHTML="";resumeMusicAfterVideo();}
function lessonText(text){return String(text||"").split(/\n{2,}/).map(p=>p.trim()).filter(Boolean).map(p=>`<p class="lesson-para">${safe(p).replace(/\n/g,"<br>")}</p>`).join("");}
function openLesson(li,ji){
	const skill=progress.skills.find(s=>s.id===currentSkillId),lesson=skill.roadmap.levels[li].lessons[ji],key=`${li}-${ji}`,saved=skill.tasks?.[key];
	const resources=(lesson.resources||[]).map(resource=>`<p><a href="${safe(resource.url)}" target="_blank" rel="noopener">${safe(resource.title)} ↗</a></p>`).join("");
	const previousReview=saved?.feedback?`<b>${saved.passed?"AI review · approved":"AI review · try again"}</b><p>${safe(saved.feedback)}</p><p>${safe(saved.nextStep||"")}</p>`:"";
	const keyPoints=(lesson.keyPoints||[]).length?`<div class="key-points"><b>KEY POINTS</b><ul>${lesson.keyPoints.map(k=>`<li>${safe(k)}</li>`).join("")}</ul></div>`:"";
	const pts=lesson.points&&skill.roadmap.id?`<span class="pts-badge">+${lesson.points} pts</span>`:"";
	showModal(`<div class="eyebrow">LEVEL ${li+1} · LESSON ${ji+1}${pts}</div><h2>${safe(lesson.title)}</h2><div class="lesson-body">${lessonText(lesson.explanation||"Read the lesson carefully, then try the activity below.")}</div>${keyPoints}<div class="lesson-videos"><h3>▶ Watch and learn</h3><p class="vid-sub">Free YouTube videos that match this lesson.</p><div id="lessonVideos"></div></div><div class="lesson-example"><b>Example / demonstration</b><br>${safe(lesson.example||"Try applying the idea to a small real-world example.").replace(/\n/g,"<br>")}</div><div class="task-box"><b>✦ Your practice task</b><p>${safe(lesson.quickTask||"Explain the key idea in your own words and give one example.")}</p><textarea id="taskAnswer" placeholder="Write your answer here. Be specific — explain your reasoning...">${safe(saved?.answer||"")}</textarea><div id="taskReview" class="${saved?.feedback?"lesson-example":""}">${previousReview}</div><button class="primary-btn" id="submitTask" style="margin-top:10px">Ask AI to review ↗</button><p class="muted">Your response is reviewed for understanding and relevance. You can revise and resubmit it.${pts?" Passing earns you points for the leaderboard.":""}</p></div>${resources?`<h3>Free resources</h3>${resources}`:""}`);
	loadLessonVideos(skill,lesson);
	$("#submitTask").onclick=async()=>{
		const answer=$("#taskAnswer").value.trim();
		if(answer.length<35){toast("Add a little more detail before requesting a review.");return;}
		const button=$("#submitTask");button.disabled=true;button.textContent="Reviewing your work...";
		try{
			const review=await api("/api/review",{method:"POST",body:JSON.stringify({subject:skill.title,lesson:lesson.title,task:lesson.quickTask||"Explain the key idea in your own words and give one example.",answer,roadmapId:skill.roadmap.id||"",levelIndex:li,lessonIndex:ji})});
			skill.tasks=skill.tasks||{};skill.tasks[key]={answer,passed:review.passed,feedback:review.feedback,nextStep:review.nextStep,reviewedAt:new Date().toISOString()};
			await saveProgress();
			$("#taskReview").className="lesson-example";
			$("#taskReview").innerHTML=`<b>${review.passed?"AI review · approved":"AI review · try again"}</b><p>${safe(review.feedback)}</p><p>${safe(review.nextStep)}</p>`;
			if(review.points){setPoints(review.points.total);}
			if(review.passed){button.textContent="Practice approved ✓";toast(review.points?.awarded>0?`Practice approved! +${review.points.awarded} points ⭐`:"Practice approved. The level quiz is now available.");}
			else{button.disabled=false;button.textContent="Revise and resubmit ↗";}
		}catch(e){button.disabled=false;button.textContent="Try review again ↗";toast(e.message);}
	};
}
// ---------- free YouTube videos for a lesson ----------
let unlockAudio=null,videoPlaying=false;
function pauseMusicForVideo(){videoPlaying=true;if(ambienceContext&&ambienceContext.state==="running")ambienceContext.suspend().catch(()=>{});}
function resumeMusicAfterVideo(){if(!videoPlaying)return;videoPlaying=false;if(progress.sound&&ambienceContext)ambienceContext.resume().catch(()=>{});}
function videoCardHtml(v){return `<div class="video-card" data-embed="${safe(v.embedUrl)}" data-title="${safe(v.title)}"><button type="button" class="video-thumb" aria-label="Play video: ${safe(v.title)}"><img src="${safe(v.thumbnail)}" alt="" loading="lazy"><span class="play">▶</span></button><div class="video-info"><b>${safe(v.title)}</b><small>${safe(v.channel)}</small><a href="${safe(v.url)}" target="_blank" rel="noopener">Open on YouTube ↗</a></div></div>`;}
async function loadLessonVideos(skill,lesson){
	const box=$("#lessonVideos");if(!box)return;
	const query=String(lesson.video?.query||`${lesson.title} ${skill.title} tutorial`).slice(0,120);
	const searchUrl=`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
	const fallback=`<div class="video-empty">Couldn't load videos right now. <a href="${safe(searchUrl)}" target="_blank" rel="noopener" style="color:var(--orange);font-weight:800">Search YouTube for this lesson ↗</a></div>`;
	if(!user){box.innerHTML=`<div class="video-empty">Sign in to see videos. <a href="${safe(searchUrl)}" target="_blank" rel="noopener" style="color:var(--orange);font-weight:800">Or search YouTube ↗</a></div>`;return;}
	box.innerHTML='<div class="video-loading">Finding free videos for this lesson…</div>';
	try{
		const d=await api(`/api/video?q=${encodeURIComponent(query)}`);
		if($("#lessonVideos")!==box)return; // lesson window was closed
		const vids=d.videos||[];
		if(!vids.length){box.innerHTML=fallback;return;}
		box.innerHTML=`<div class="video-grid">${vids.map(videoCardHtml).join("")}</div><a class="video-more" href="${safe(d.searchUrl||searchUrl)}" target="_blank" rel="noopener">More videos on YouTube ↗</a>`;
		box.querySelectorAll(".video-card").forEach(card=>{
			card.querySelector(".video-thumb").onclick=()=>{
				const frame=document.createElement("div");frame.className="video-frame";
				const iframe=document.createElement("iframe");
				iframe.src=`${card.dataset.embed}?autoplay=1&rel=0`;
				iframe.title=card.dataset.title||"Lesson video";
				iframe.allow="autoplay; encrypted-media; picture-in-picture; fullscreen";
				iframe.allowFullscreen=true;
				frame.append(iframe);
				card.querySelector(".video-thumb").replaceWith(frame);
				pauseMusicForVideo();
			};
		});
	}catch{ if($("#lessonVideos")===box)box.innerHTML=fallback; }
}
function openQuiz(li){const skill=progress.skills.find(s=>s.id===currentSkillId),level=skill.roadmap.levels[li],lessons=level.lessons||[],missing=lessons.findIndex((_,ji)=>!skill.tasks?.[`${li}-${ji}`]?.passed);if(missing>=0){showModal(`<div class="eyebrow">LEVEL ${li+1} PRACTICE</div><h2>Complete your lesson work first</h2><p>Each practice task needs an AI review approval before this checkpoint unlocks. You can revise and resubmit any response.</p><button class="primary-btn" id="openPendingLesson">Open next practice ↗</button>`);$("#openPendingLesson").onclick=()=>openLesson(li,missing);return;}const questions=(level.quiz||[]).slice(0,10);if(questions.length<10){toast("This level's quiz is incomplete. Generate a new roadmap.");return;}showModal(`<div class="eyebrow">LEVEL ${li+1} CHECKPOINT</div><h2>${safe(level.name)} quiz</h2><p>10 questions · Easy, medium and hard. Score 70% or higher to clear this level.</p><form id="quizForm">${questions.map((q,i)=>`<div class="quiz-question"><small>${safe(q.difficulty||"mixed")} · QUESTION ${i+1}</small><p><b>${safe(q.question)}</b></p><div class="quiz-options">${q.options.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}" required>${safe(o)}</label>`).join("")}</div></div>`).join("")}<button class="primary-btn" style="margin-top:17px" type="submit">Submit answers ↗</button></form>`);
$("#quizForm").onsubmit=(e)=>{e.preventDefault();const data=new FormData(e.target);let score=0;questions.forEach((q,i)=>{if(Number(data.get(`q${i}`))===Number(q.answer))score++;});const passed=score>=7;showModal(`<div class="eyebrow">YOUR CHECKPOINT RESULT</div><h2>${passed?"Level cleared! ✨":"Keep practicing 🌱"}</h2><p>You scored <b>${score}/10</b> (${score*10}%). ${passed?"You have unlocked the next step in your journey.":"You need 7 correct answers to pass. Review the lessons and try again."}</p><div class="lesson-example">${questions.map((q,i)=>`<p><b>${i+1}. ${scoreAnswer(q,data.get(`q${i}`))?"Correct":"Review"}:</b> ${safe(q.explanation||"Review the lesson notes for this concept.")}</p>`).join("")}</div><button class="primary-btn" id="resultDone">${passed?"Continue journey":"Back to lessons"}</button>`);$("#resultDone").onclick=()=>{if(passed){skill.cleared=skill.cleared||[];if(!skill.cleared.includes(li))skill.cleared.push(li);skill.completedLevels=skill.cleared.length;if(skill.completedLevels>=skill.roadmap.levels.length)skill.completed=true;updateStreak();saveProgress();renderRoadmap(skill);}closeModal();};};}
function scoreAnswer(q,v){return Number(v)===Number(q.answer);}
function updateStreak(){const t=today(),last=progress.lastActive;if(last!==t){const y=new Date(Date.now()-86400000).toLocaleDateString("en-CA",{timeZone:"Asia/Dhaka"});progress.streak=last===y?(progress.streak||0)+1:1;progress.lastActive=t;}}
function showTips(r){showModal(`<div class="eyebrow">STUDY WITH INTENTION</div><h2>Make your learning stick</h2><ul>${(r.studyTips||["Use active recall: close your notes and explain the concept from memory.","Study in focused 25-minute sessions with short breaks.","Practice a little every day instead of cramming."]).map(t=>`<li style="font-size:11px;line-height:1.8;margin:9px 0">${safe(t)}</li>`).join("")}</ul><h3>Your weekly rhythm</h3>${(r.weeklyPlan||[]).map(x=>`<p><b>${safe(x.day)}:</b> ${safe(x.activity)}</p>`).join("")}`);}
// ==========================================
// ROADMAP GENERATION: PROGRESS BAR
// ==========================================
// Gemini cannot tell us how far along it is, so this bar is an
// honest ESTIMATE. It moves quickly at first, slows down as it
// nears 92%, and only reaches 100% when the roadmap has really
// arrived. The stage messages are time-based, not real events.
const GEN_STAGES=[
	{at:0,text:"Preparing your learning roadmap…"},
	{at:12,text:"Analysing your subject…"},
	{at:30,text:"Organising learning levels…"},
	{at:50,text:"Writing lessons and practice tasks…"},
	{at:70,text:"Preparing quizzes…"},
	{at:84,text:"Finalising your roadmap…"}
];
let generating=false,genTimer=null,genStart=0,genHideTimer=null;
function paintGenProgress(percent,seconds){
	const stage=[...GEN_STAGES].reverse().find(s=>percent>=s.at)||GEN_STAGES[0];
	const stageEl=$("#genStage");
	$("#genFill").style.width=`${percent}%`;
	$("#genBar").setAttribute("aria-valuenow",String(Math.round(percent)));
	if(stageEl.textContent!==stage.text)stageEl.textContent=stage.text;
	$("#genPercent").textContent=`≈ ${Math.round(percent)}%`;
	$("#genTime").textContent=seconds>=170?"Big roadmaps take a few minutes. Still working, please keep this page open.":`${Math.floor(seconds)}s`;
}
function startGenProgress(){
	clearTimeout(genHideTimer);clearInterval(genTimer);
	$("#genProgress").classList.remove("hidden","gen-error","gen-done");
	genStart=Date.now();
	paintGenProgress(0,0);
	genTimer=setInterval(()=>{
		const seconds=(Date.now()-genStart)/1000;
		paintGenProgress(92*(1-Math.exp(-seconds/75)),seconds);
	},250);
}
function hideGenProgress(){
	$("#genProgress").classList.add("hidden");
	$("#genFill").style.width="0%";
}
function finishGenProgress(){
	clearInterval(genTimer);genTimer=null;
	paintGenProgress(100,0);
	$("#genProgress").classList.add("gen-done");
	$("#genStage").textContent="Your roadmap is ready!";
	$("#genPercent").textContent="100%";
	$("#genTime").textContent="";
	genHideTimer=setTimeout(hideGenProgress,900);
}
function failGenProgress(message){
	clearInterval(genTimer);genTimer=null;
	$("#genProgress").classList.add("gen-error");
	$("#genStage").textContent=message;
	$("#genPercent").textContent="";
	$("#genTime").textContent="";
	genHideTimer=setTimeout(hideGenProgress,9000);
}
async function generate(){
	if(generating)return;
	const subject=$("#subjectInput").value.trim();
	if(subject.length<2){toast("Type a subject first.");return;}
	if(!user){showModal(`<div class="eyebrow">SAVE YOUR LEARNING JOURNEY</div><h2>Sign in to create a roadmap</h2><p>Google sign-in keeps your roadmaps, progress, streaks and daily AI quota connected to your account.</p><button class="primary-btn" id="modalSign">Continue with Google ↗</button><p class="muted">For a local preview, you can explore the interface, but AI roadmap generation requires Google sign-in and API setup.</p>`);$("#modalSign").onclick=()=>{closeModal();login();};return;}
	generating=true;
	const btn=$("#generateBtn"),input=$("#subjectInput");
	btn.disabled=true;input.disabled=true;btn.textContent="Building your path...";
	startGenProgress();
	try{
		// Stop waiting after 5 minutes so the screen can never stay stuck.
		const signal=typeof AbortSignal.timeout==="function"?AbortSignal.timeout(300000):undefined;
		const data=await api("/api/roadmap",{method:"POST",signal,body:JSON.stringify({subject,level:"Beginner",hoursPerWeek:5})});
		const skill={id:id(),title:subject,roadmap:data.roadmap,completedLevels:0,cleared:[],tasks:{},completed:false,createdAt:new Date().toISOString()};
		progress.skills.push(skill);currentSkillId=skill.id;currentRoadmap=skill.roadmap;
		await saveProgress();updateUsage(data.usage.used);
		finishGenProgress();
		renderRoadmap(skill);showPage("roadmap");toast("Your learning journey is ready!");
	}catch(e){
		const message=(e.name==="TimeoutError"||e.name==="AbortError")?"This is taking too long. Please wait a minute and try again.":(e.message||"Something went wrong. Please try again.");
		failGenProgress(message);toast(message);
	}finally{
		generating=false;btn.disabled=false;input.disabled=false;btn.innerHTML='Build my roadmap <span>↗</span>';
	}
}

// ==========================================
// EXPORT: PRINTABLE FLOWCHART
// ==========================================
// Builds a one-page flowchart from the roadmap data (not a copy of
// the screen) and opens the browser print window. Students choose
// "Save as PDF" or print it on paper. Lessons they already passed
// are shown with a tick.
function buildFlowchartHtml(skill){
	const r=skill.roadmap,cleared=skill.cleared||[];
	const date=new Intl.DateTimeFormat("en",{dateStyle:"medium"}).format(new Date());
	const diamond=`<svg viewBox="0 0 76 64" width="76" height="64" aria-hidden="true"><polygon points="38,2 74,32 38,62 2,32" fill="#fff1e3" stroke="#222" stroke-width="1.6"/><text x="38" y="30" text-anchor="middle" font-size="8" font-weight="800" fill="#222">QUIZ</text><text x="38" y="41" text-anchor="middle" font-size="7.5" font-weight="700" fill="#222">pass 7/10</text></svg>`;
	const levels=(r.levels||[]).map((level,i)=>{
		const lessons=level.lessons||[],done=cleared.includes(i);
		const steps=lessons.map((lesson,j)=>{
			const passed=skill.tasks?.[`${i}-${j}`]?.passed;
			return `<div class="ps-step"><span class="ps-box">${passed?"✔":""}</span><small>LESSON ${j+1}</small><b>${safe(lesson.title)}</b></div>`;
		}).join("");
		return `<section class="ps-level${done?" ps-done":""}"><div class="ps-level-head"><span>LEVEL ${String(i+1).padStart(2,"0")}</span><b>${safe(level.name)}</b><em>${done?"✔ Cleared":`about ${safe(level.estimatedDays||"?")} days`}</em></div><div class="ps-steps" style="--n:${lessons.length||1}">${steps}<div class="ps-quiz">${diamond}</div></div><div class="ps-loop"><span>No? ↺ Review the lessons and try the quiz again</span><span>Yes ↓ Next step</span></div></section>`;
	}).join(`<div class="ps-arrow"></div>`);
	const week=(r.weeklyPlan||[]).length?`<section class="ps-week"><h2>WEEKLY RHYTHM</h2><div class="ps-week-grid">${r.weeklyPlan.map(x=>`<div class="ps-day"><b>${safe(x.day)}</b>${safe(x.activity)}</div>`).join("")}</div></section>`:"";
	return `<header class="ps-head"><div><small>SKILLORA · LEARNING ROADMAP</small><h1>${safe(r.title||skill.title)}</h1><p>${safe(r.summary||"")}</p></div><div class="ps-meta"><span>Estimated: ${safe(r.estimatedWeeks||"—")} weeks</span><span>Printed: ${safe(date)}</span></div></header><div class="ps-flow"><div class="ps-node ps-start"><small>START HERE</small><b>${safe(skill.title)}</b></div><div class="ps-arrow"></div>${levels}<div class="ps-arrow"></div><div class="ps-node ps-goal"><small>YOUR GOAL</small><b>${safe(r.outcome||"Build confidence through practice.")}</b></div></div>${week}<p class="ps-foot">Tick each lesson when you finish it. Score 7 or more out of 10 on a level quiz to move on. · Made with Skillora</p>`;
}
function exportFlowchart(skill){
	let sheet=$("#printSheet");
	if(!sheet){sheet=document.createElement("div");sheet.id="printSheet";document.body.append(sheet);}
	sheet.innerHTML=buildFlowchartHtml(skill);
	// The browser uses the page title as the default PDF file name.
	const originalTitle=document.title;
	document.title=`${skill.roadmap.title||skill.title} - Skillora roadmap`;
	const restore=()=>{document.title=originalTitle;window.removeEventListener("afterprint",restore);};
	window.addEventListener("afterprint",restore);
	toast("In the print window, choose “Save as PDF” or your printer.");
	setTimeout(()=>window.print(),150);
}
async function login(){if(!auth){toast("Google sign-in is not configured. Follow the setup guide in README.");return;}try{await signInWithPopup(auth,new GoogleAuthProvider());}catch(e){toast(e.message||"Sign-in failed.");}}
async function startAmbience(){
	const AudioContextClass=window.AudioContext||window.webkitAudioContext;
	if(!AudioContextClass)throw new Error("Ambient audio is not supported in this browser.");
	ambienceContext=new AudioContextClass();
	const ctx0=ambienceContext;
	// Browsers only allow sound after the first click/tap/key. The music is
	// built now and unlocks itself on the very first interaction.
	unlockAudio=()=>{if(!videoPlaying&&ctx0.state==="suspended")ctx0.resume().catch(()=>{});};
	ctx0.resume().catch(()=>{});
	["pointerdown","keydown","touchstart"].forEach(ev=>window.addEventListener(ev,unlockAudio,{passive:true}));
	const context=ambienceContext,master=context.createGain();master.gain.value=.2;master.connect(context.destination);
	const buffer=context.createBuffer(1,context.sampleRate*3,context.sampleRate),samples=buffer.getChannelData(0);
	for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*.25;
	const wind=context.createBufferSource(),filter=context.createBiquadFilter(),windGain=context.createGain();
	wind.buffer=buffer;wind.loop=true;filter.type="lowpass";filter.frequency.value=420;windGain.gain.value=.12;
	wind.connect(filter);filter.connect(windGain);windGain.connect(master);wind.start();ambienceSources.push(wind);
	for(const frequency of [174.61,261.63]){const tone=context.createOscillator(),gain=context.createGain();tone.type="sine";tone.frequency.value=frequency;gain.gain.value=.012;tone.connect(gain);gain.connect(master);tone.start();ambienceSources.push(tone);}
	const notes=[523.25,392,440,523.25,659.25,587.33,523.25,440];let noteIndex=0;
	const playNote=()=>{const tone=context.createOscillator(),gain=context.createGain(),now=context.currentTime;tone.type="sine";tone.frequency.value=notes[noteIndex++%notes.length];gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.045,now+.12);gain.gain.exponentialRampToValueAtTime(.0001,now+1.5);tone.connect(gain);gain.connect(master);tone.start(now);tone.stop(now+1.55);};
	playNote();melodyTimer=setInterval(playNote,2600);
}
function stopAmbience(){if(unlockAudio){["pointerdown","keydown","touchstart"].forEach(ev=>window.removeEventListener(ev,unlockAudio));unlockAudio=null;}clearInterval(melodyTimer);melodyTimer=null;ambienceSources.forEach(source=>{try{source.stop();}catch{}});ambienceSources=[];if(ambienceContext){ambienceContext.close();ambienceContext=null;}}
async function toggleAmbience(){
	if(progress.sound){stopAmbience();progress.sound=false;progress.musicOff=true;applyPrefs();await saveProgress();toast("Background music turned off.");return;}
	try{await startAmbience();progress.sound=true;progress.musicOff=false;applyPrefs();await saveProgress();toast("Background music is on.");}
	catch(error){stopAmbience();toast(error.message||"Could not start background music.");}
}
function startMusicIfWanted(){if(progress.sound&&!ambienceContext)startAmbience().catch(()=>{});}
function setupChat(){
	const panel=$("#chatPanel");$("#chatLauncher").onclick=()=>panel.classList.add("open");$("#chatClose").onclick=()=>panel.classList.remove("open");$("#helpOpen").onclick=()=>panel.classList.add("open");
	function send(){const text=$("#chatInput").value.trim();if(!text)return;addChat(text,"user-msg");$("#chatInput").value="";const t=text.toLowerCase();let reply="I can help with roadmaps, lessons, quizzes, progress, themes and PDF exports. Try asking “How do I pass a level?”";if(t.includes("roadmap")||t.includes("create"))reply="Go to Home, enter the subject you want to learn, then choose Build my roadmap. You'll need to sign in with Google for AI generation.";else if(t.includes("quiz")||t.includes("level"))reply="Open one of your skills, study the lessons in a level, complete the practice tasks, then take its 10-question checkpoint. You need at least 7 correct answers.";else if(t.includes("pdf")||t.includes("download"))reply="Open a roadmap and select Export PDF. You get a one-page flowchart of your journey. In the print window, choose Save as PDF or print it.";else if(t.includes("streak"))reply="Your streak updates when you pass a level checkpoint on a new day. Try to make a little progress regularly.";else if(t.includes("theme")||t.includes("font"))reply="Open Settings to choose Sunrise, Forest, Lavender or Midnight, and switch between Modern, Pixel and Space fonts.";else if(t.includes("limit"))reply=`The current daily generation limit is ${config.dailyLimit} roadmaps per account, reset at midnight Bangladesh time.`;setTimeout(()=>addChat(reply,"bot-msg"),250);}
	$("#chatSend").onclick=send;$("#chatInput").onkeydown=e=>{if(e.key==="Enter")send();};$("#soundToggle").onclick=toggleAmbience;
}
function addChat(t,cls){const el=document.createElement("div");el.className=cls;el.textContent=t;$("#chatMessages").append(el);$("#chatMessages").scrollTop=$("#chatMessages").scrollHeight;}

// ==========================================
// PROFILE, POINTS AND LEADERBOARD
// ==========================================
let profile=null,lbPeriod="week";
function setPoints(n){$("#pointsText").textContent=String(n??0);if(profile)profile.points=n;}
function resetProfileUi(){$("#pointsText").textContent="0";$("#avatar").textContent="S";$("#topAvatar").textContent="S";}
async function loadProfile(){
	try{
		profile=await api("/api/profile");
		$("#userName").textContent=profile.displayName;
		$("#avatar").textContent=profile.avatar;$("#topAvatar").textContent=profile.avatar;
		setPoints(profile.points);
	}catch{}
}
function signInPrompt(text){return `<div class="empty-card glass"><span>✧</span><b>${safe(text)}</b><p>Sign in with Google to earn points and join the leaderboard.</p><button class="primary-btn" id="lbSign" style="margin-top:12px">Continue with Google ↗</button></div>`;}
async function renderLeaderboard(){
	const box=$("#leaderboardBody");
	$$("[data-lb]").forEach(b=>b.classList.toggle("active",b.dataset.lb===lbPeriod));
	if(!user){box.innerHTML=signInPrompt("Sign in to see the leaderboard");$("#lbSign").onclick=login;return;}
	box.innerHTML='<div class="video-loading">Loading leaderboard…</div>';
	try{
		const d=await api(`/api/leaderboard?period=${lbPeriod}`);
		if(d.me)setPoints(lbPeriod==="all"?d.me.points:profile?.points??0);
		const medal=r=>r===1?"🥇":r===2?"🥈":r===3?"🥉":`#${r}`;
		const meCard=`<div class="lb-me glass"><div><small>${lbPeriod==="week"?"YOUR POINTS THIS WEEK":"YOUR TOTAL POINTS"}</small><strong>${d.me.points} pts</strong></div><div style="text-align:right"><small>YOUR POSITION</small><strong>${d.me.rank?`#${d.me.rank}`:"—"}</strong></div></div>`;
		const rows=d.entries.map(e=>`<div class="lb-row glass${e.isMe?" is-me":""}"><div class="lb-rank">${medal(e.rank)}</div><div class="lb-av">${safe(e.avatar)}</div><div class="lb-name">${safe(e.displayName)}${e.isMe?"<small>You</small>":""}</div><div class="lb-pts">${e.points} <small>pts</small></div></div>`).join("");
		box.innerHTML=meCard+(rows?`<div class="lb-list">${rows}</div>`:`<div class="empty-card glass"><span>🏆</span><b>No points yet ${lbPeriod==="week"?"this week":""}</b><p>Pass a lesson's practice task to earn the first points and take the top spot.</p></div>`);
	}catch(e){box.innerHTML=`<div class="empty-card glass"><b>Couldn't load the leaderboard.</b><p>${safe(e.message)}</p></div>`;}
}
async function renderProfile(){
	const box=$("#profileBody");
	if(!user){box.innerHTML=signInPrompt("Sign in to make your profile");$("#lbSign").onclick=login;return;}
	box.innerHTML='<div class="video-loading">Loading your profile…</div>';
	await loadProfile();
	if(!profile){box.innerHTML='<div class="empty-card glass"><b>Couldn\'t load your profile.</b><p>Please try again.</p></div>';return;}
	let chosen=profile.avatar;
	box.innerHTML=`<div class="profile-card glass"><div class="profile-stats"><div><b>${profile.points}</b><small>POINTS</small></div><div><b>${profile.rank?`#${profile.rank}`:"—"}</b><small>RANK</small></div><div><b>${profile.lessonsCompleted}</b><small>LESSONS PASSED</small></div></div>
	<label for="pfName">DISPLAY NAME</label><input id="pfName" type="text" maxlength="24" value="${safe(profile.displayName)}">
	<label>AVATAR</label><div class="avatar-grid">${profile.avatars.map(a=>`<button type="button" data-av="${safe(a)}" class="${a===chosen?"selected":""}">${safe(a)}</button>`).join("")}</div>
	<label for="pfBio">ABOUT ME (OPTIONAL)</label><textarea id="pfBio" maxlength="120" placeholder="What are you learning?">${safe(profile.bio)}</textarea>
	<button class="primary-btn" id="pfSave" style="margin-top:18px">Save profile</button><p class="muted" style="margin-top:10px">Your name, avatar and points are visible to other learners. Don't use your full name or contact details.</p></div>`;
	box.querySelectorAll("[data-av]").forEach(b=>b.onclick=()=>{chosen=b.dataset.av;box.querySelectorAll("[data-av]").forEach(x=>x.classList.toggle("selected",x===b));});
	$("#pfSave").onclick=async()=>{
		const btn=$("#pfSave");btn.disabled=true;
		try{await api("/api/profile",{method:"PUT",body:JSON.stringify({displayName:$("#pfName").value,avatar:chosen,bio:$("#pfBio").value})});await loadProfile();toast("Profile saved ✓");}
		catch(e){toast(e.message);}
		btn.disabled=false;
	};
}
function setupSocial(){
	$$("[data-lb]").forEach(b=>b.onclick=()=>{lbPeriod=b.dataset.lb;renderLeaderboard();});
}
async function init(){try{config=await fetch("/api/config").then(r=>r.json());}catch{}updateUsage();if(config.authConfigured){firebaseApp=initializeApp(config.firebase);auth=getAuth(firebaseApp);onAuthStateChanged(auth,async u=>{user=u;if(u){$("#userName").textContent=u.displayName||"Learner";$("#userStatus").textContent="Signed in with Google";$("#avatar").textContent=(u.displayName||"S").charAt(0).toUpperCase();$("#topAvatar").textContent=$("#avatar").textContent;$("#signBtn").textContent="Sign out";await loadProgress();await refreshUsage();await loadProfile();}else{profile=null;resetProfileUi();$("#userName").textContent="Your learning space";$("#userStatus").textContent="Guest preview";$("#signBtn").textContent="Continue with Google ↗";await loadProgress();}});}else{await loadProgress();}
$$("[data-page]").forEach(b=>b.onclick=()=>showPage(b.dataset.page));$$("[data-goto]").forEach(b=>b.onclick=()=>showPage(b.dataset.goto));$("#generateBtn").onclick=generate;$("#subjectInput").onkeydown=e=>{if(e.key==="Enter")generate();};$("#signBtn").onclick=()=>user?signOut(auth):login();$("#modalClose").onclick=closeModal;$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal();};
$$(".theme-choice").forEach(b=>b.onclick=()=>{progress.theme=b.dataset.theme;applyPrefs();saveProgress();});$("#fontSelect").onchange=e=>{progress.font=e.target.value;applyPrefs();saveProgress();};$("#treeStyle").onchange=e=>{progress.treeStyle=e.target.value;applyPrefs();saveProgress();};$("#soundToggle").onclick=()=>{progress.sound=!progress.sound;applyPrefs();saveProgress();toast(progress.sound?"Ambient sound preference saved. Sound playback can be added in a later release.":"Ambient sound disabled.");};setupChat();setupSocial();$("#dateLabel").textContent=new Intl.DateTimeFormat("en",{weekday:"long",month:"long",day:"numeric"}).format(new Date()).toUpperCase();}
init();