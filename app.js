// ---------- sync (Firebase) ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { browserLocalPersistence, createUserWithEmailAndPassword, getAuth, onAuthStateChanged, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, initializeFirestore, onSnapshot, persistentLocalCache, persistentMultipleTabManager, serverTimestamp, setDoc, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";


// Catalog: pp = per person per month; fx = fixed household quantity regardless of size/goal
const CATS = ["Water","Grains & pasta","Protein","Sauces & seasoning","Fats & extras","Medicine","Hygiene","Power & cooking"];
// pp = per person per month; fx = fixed household quantity; shelf = months it keeps (targets never exceed this, so you rotate)
const CATALOG = [
  {id:"water",cat:"Water",name:"Drinking water",unit:"gal",pp:30,capMonths:0.5,tip:"1 gal per person per day. Capped at 2 weeks of storage; rely on filters beyond that."},
  {id:"filters",cat:"Water",name:"Water filters / LifeStraws",unit:"each",fx:4},
  {id:"bleach",cat:"Water",name:"Unscented bleach",unit:"bottle",fx:1,tip:"For disinfecting water and surfaces. Loses strength after about a year."},
  {id:"rice",cat:"Grains & pasta",name:"White rice",unit:"lb",pp:10,shelf:300,tip:"In mylar with oxygen absorbers it keeps 25+ years. Brown rice goes rancid fast; skip it for long storage."},
  {id:"beans",cat:"Grains & pasta",name:"Dry beans (oloyin / black-eyed)",unit:"lb",pp:5,shelf:300},
  {id:"garri",cat:"Grains & pasta",name:"Garri",unit:"lb",pp:3,shelf:24,tip:"No cooking needed in a power outage."},
  {id:"swallow",cat:"Grains & pasta",name:"Poundo / semolina / fufu flour",unit:"lb",pp:2,shelf:12},
  {id:"pasta",cat:"Grains & pasta",name:"Spaghetti & other pasta",unit:"lb",pp:4,shelf:96},
  {id:"noodles",cat:"Grains & pasta",name:"Instant noodles",unit:"pack",pp:8,shelf:12},
  {id:"oats",cat:"Grains & pasta",name:"Rolled oats",unit:"lb",pp:2,shelf:300},
  {id:"milk",cat:"Grains & pasta",name:"Powdered milk",unit:"lb",pp:1.5,shelf:18,tip:"Full-cream milk (Peak, Nido) keeps about 18 months. Nonfat in mylar lasts far longer."},
  {id:"sardine",cat:"Protein",name:"Sardines / mackerel (canned)",unit:"can",pp:6,shelf:36},
  {id:"chicken",cat:"Protein",name:"Canned chicken",unit:"can",pp:3,shelf:36,tip:"Good for fried rice and pasta."},
  {id:"corned",cat:"Protein",name:"Corned beef / canned meat",unit:"can",pp:3,shelf:36},
  {id:"pb",cat:"Protein",name:"Peanut butter",unit:"jar",pp:1,shelf:12},
  {id:"stockfish",cat:"Protein",name:"Stockfish / dried fish",unit:"lb",pp:0.5,shelf:24},
  {id:"veg",cat:"Protein",name:"Canned mixed veg / peas & carrots / corn",unit:"can",pp:6,shelf:24,tip:"For fried rice, jollof and stews."},
  {id:"tomato",cat:"Sauces & seasoning",name:"Tomato paste / canned tomatoes",unit:"can",pp:6,shelf:18},
  {id:"sauce",cat:"Sauces & seasoning",name:"Pasta sauce",unit:"jar",pp:1.5,shelf:18},
  {id:"soy",cat:"Sauces & seasoning",name:"Soy sauce",unit:"bottle",pp:0.2,shelf:24},
  {id:"egusi",cat:"Sauces & seasoning",name:"Egusi (whole seeds keep longer)",unit:"lb",pp:0.75,shelf:12,tip:"Ground egusi goes rancid. Store whole, or freeze ground."},
  {id:"crayfish",cat:"Sauces & seasoning",name:"Crayfish",unit:"lb",pp:0.4,shelf:12},
  {id:"pepper",cat:"Sauces & seasoning",name:"Dried pepper",unit:"oz",pp:2,shelf:24},
  {id:"spice",cat:"Sauces & seasoning",name:"Curry, thyme, garlic & onion powder",unit:"jar",pp:0.5,shelf:24},
  {id:"cubes",cat:"Sauces & seasoning",name:"Seasoning / bouillon cubes",unit:"cube",pp:12,shelf:18},
  {id:"salt",cat:"Sauces & seasoning",name:"Salt",unit:"lb",pp:0.3},
  {id:"palmoil",cat:"Fats & extras",name:"Palm oil",unit:"L",pp:0.4,shelf:24},
  {id:"vegoil",cat:"Fats & extras",name:"Vegetable oil",unit:"L",pp:0.6,shelf:12,tip:"Oil is the first thing to go bad in long storage. Rotate it."},
  {id:"sugar",cat:"Fats & extras",name:"Sugar",unit:"lb",pp:0.5},
  {id:"tea",cat:"Fats & extras",name:"Tea / Milo / coffee",unit:"tin",pp:0.25,shelf:18},
  {id:"tylenol",cat:"Medicine",name:"Acetaminophen",unit:"bottle",fx:2},
  {id:"ibu",cat:"Medicine",name:"Ibuprofen",unit:"bottle",fx:1},
  {id:"allergy",cat:"Medicine",name:"Claritin / Benadryl",unit:"box",fx:2},
  {id:"ors",cat:"Medicine",name:"Oral rehydration / electrolytes",unit:"packet",pp:4,shelf:24},
  {id:"imodium",cat:"Medicine",name:"Loperamide",unit:"box",fx:1},
  {id:"cold",cat:"Medicine",name:"Cold & flu relief",unit:"box",fx:2},
  {id:"thermo",cat:"Medicine",name:"Thermometer",unit:"each",fx:1},
  {id:"firstaid",cat:"Medicine",name:"First aid kit",unit:"kit",fx:1},
  {id:"masks",cat:"Medicine",name:"N95 / KN95 masks",unit:"mask",pp:10,shelf:60},
  {id:"rx",cat:"Medicine",name:"Prescription refills on hand",unit:"days",fx:90,tip:"Ask your doctor or pharmacy about 90-day fills."},
  {id:"tp",cat:"Hygiene",name:"Toilet paper",unit:"roll",pp:9},
  {id:"towels",cat:"Hygiene",name:"Paper towels",unit:"roll",pp:1.5},
  {id:"fem",cat:"Hygiene",name:"Feminine hygiene",unit:"pack",fx:3},
  {id:"soap",cat:"Hygiene",name:"Bar soap",unit:"bar",pp:1},
  {id:"sanit",cat:"Hygiene",name:"Hand sanitizer",unit:"bottle",fx:3},
  {id:"bags",cat:"Hygiene",name:"Trash bags",unit:"box",fx:1},
  {id:"station",cat:"Power & cooking",name:"Portable power station",unit:"each",fx:1,tip:"500–1000Wh LiFePO4 for a studio."},
  {id:"panel",cat:"Power & cooking",name:"Foldable solar panel",unit:"each",fx:1,tip:"100–200W, set up on the balcony."},
  {id:"lantern",cat:"Power & cooking",name:"Rechargeable lantern",unit:"each",fx:2},
  {id:"powerbank",cat:"Power & cooking",name:"Power banks",unit:"each",fx:2},
  {id:"batt",cat:"Power & cooking",name:"AA / AAA batteries",unit:"pack",fx:2},
  {id:"co",cat:"Power & cooking",name:"Battery CO alarm",unit:"each",fx:1},
  {id:"stove",cat:"Power & cooking",name:"Butane stove (balcony use only)",unit:"each",fx:1,tip:"Never indoors: carbon monoxide."},
  {id:"butane",cat:"Power & cooking",name:"Butane canisters",unit:"can",pp:3},
  {id:"mylar",cat:"Power & cooking",name:"Mylar bags + O2 absorbers",unit:"set",fx:20,tip:"Raise this for 12+ month goals: about one 1-gallon bag per 7 lb of rice or beans."}
];

const LS = "prep-tracker-v1";
let state = { settings:{people:4, horizon:1}, items:{} }; // items[id] = {have, expiry, custom?...}
let saveTimers = {};
const $ = s => document.querySelector(s);

function allItems(){
  const custom = Object.entries(state.items).filter(([,v])=>v.custom).map(([id,v])=>({id,cat:v.cat,name:v.name,unit:v.unit,fxTarget:v.target,custom:true}));
  return CATALOG.concat(custom);
}
function target(it){
  const p = state.settings.people, h = state.settings.horizon;
  if (it.custom) return +it.fxTarget || 0;
  if (it.fx != null) return it.fx;
  let months = it.capMonths ? Math.min(h, it.capMonths) : h;
  if (it.shelf) months = Math.min(months, it.shelf);
  return Math.ceil(it.pp * p * months);
}
const capped = it => !it.custom && it.pp!=null && ((it.shelf && it.shelf < state.settings.horizon) || (it.capMonths && it.capMonths < state.settings.horizon));
const have = id => +(state.items[id]?.have || 0);
function daysLeft(d){ if(!d) return null; return Math.round((new Date(d+"T00:00") - new Date())/86400000); }

function render(){
  $("#horizon").value = String(state.settings.horizon);
  $("#people").value = state.settings.people;
  const items = allItems();
  let tot=0, got=0; const catStats = {};
  items.forEach(it=>{ const t=target(it); if(!t) return; const g=Math.min(have(it.id),t);
    tot+=1; got+=g/t; (catStats[it.cat] ||= {t:0,g:0}); catStats[it.cat].t+=1; catStats[it.cat].g+=g/t; });
  const pct = tot? Math.round(got/tot*100):0;
  $("#pct").textContent = pct+"%";
  const hz = state.settings.horizon===0.5 ? "2-week" : state.settings.horizon+"-month";
  $("#heroText").textContent = `of your ${hz} goal for ${state.settings.people} ${state.settings.people==1?"person":"people"} is stocked.`;

  $("#cats").innerHTML = CATS.map(c=>{ const s=catStats[c]||{t:0,g:0}; const p=s.t?Math.round(s.g/s.t*100):0;
    return `<button class="cat" data-jump="${c}"><b>${c}</b><small>${p}%</small><div class="bar"><i style="width:${p}%"></i></div></button>`; }).join("");

  const gaps = items.map(it=>({it,t:target(it),h:have(it.id)})).filter(x=>x.t>0 && x.h<x.t)
    .sort((a,b)=>(a.h/a.t)-(b.h/b.t) || CATS.indexOf(a.it.cat)-CATS.indexOf(b.it.cat)).slice(0,10);
  $("#gaps").innerHTML = gaps.length ? gaps.map(x=>`<li><span>${esc(x.it.name)}</span><span class="need">${fmt(x.t-x.h)} ${esc(x.it.unit)}</span></li>`).join("")
    : `<li><span>You've hit every target for this goal.</span></li>`;

  const alerts=[];
  items.forEach(it=>{ const h=have(it.id), d=daysLeft(state.items[it.id]?.expiry);
    if(d!==null && h>0 && d<0) alerts.push([0,it.name,"expired","red"]);
    else if(d!==null && h>0 && d<=60) alerts.push([1,it.name,"use within "+d+" days",""]); });
  ["water","rice","beans","tylenol","firstaid"].forEach(id=>{ const it=items.find(i=>i.id===id); if(it && have(id)===0) alerts.push([2,it.name,"none on hand","red"]); });
  if(state.settings.stockDay){ const n=new Date(), sd=+state.settings.stockDay; let next=new Date(n.getFullYear(),n.getMonth(),sd);
    if(next<new Date(n.getFullYear(),n.getMonth(),n.getDate())) next=new Date(n.getFullYear(),n.getMonth()+1,sd);
    const dd=Math.round((next-new Date(n.getFullYear(),n.getMonth(),n.getDate()))/86400000);
    if(dd<=3) alerts.push([3,"Stock-up day", dd===0?"today":"in "+dd+" day"+(dd>1?"s":""),""]); }
  alerts.sort((x,y)=>x[0]-y[0]);
  $("#alerts").innerHTML = alerts.length ? alerts.map(x=>`<li><span>${esc(x[1])}</span><span class="need ${x[3]}">${esc(x[2])}</span></li>`).join("")
    : `<li><span class="ok-msg">Nothing urgent. Tap an item's name to add expiry dates.</span></li>`;
  $("#stockDay").value = String(state.settings.stockDay||"");

  $("#groups").innerHTML = CATS.map(c=>{
    const rows = items.filter(i=>i.cat===c); if(!rows.length) return "";
    return `<h2 id="cat-${slug(c)}">${c}</h2><section class="group">${rows.map(rowHTML).join("")}</section>`;
  }).join("");
}
function rowHTML(it){
  const t=target(it), h=have(it.id), d=daysLeft(state.items[it.id]?.expiry);
  let flag = h===0 ? `<span class="flag none">none</span>` : h<t ? `<span class="flag low">low</span>` : `<span class="flag ok">stocked</span>`;
  if (d!==null && h>0 && d<=60) flag += `<span class="flag exp">${d<0?"expired":"use within "+d+"d"}</span>`;
  const ex = state.items[it.id]?.expiry || "";
  return `<div class="row" data-id="${it.id}">
    <div class="main">
      <div class="name" data-toggle><strong>${esc(it.name)}${flag}</strong><span>Target ${fmt(t)} ${esc(it.unit)}${capped(it)?" · capped at shelf life, rotate":""}</span></div>
      <div class="step"><button data-d="-1" aria-label="Less ${esc(it.name)}">−</button><input type="number" min="0" step="any" value="${fmt(h)}" aria-label="${esc(it.name)} on hand"><button data-d="1" aria-label="More ${esc(it.name)}">+</button></div>
    </div>
    <div class="more">
      <label>Earliest expiry<input type="date" data-exp value="${ex}"></label>
      ${it.tip?`<p class="tip">${esc(it.tip)}</p>`:""}
      ${it.custom?`<button class="del" data-del>Remove item</button>`:""}
    </div></div>`;
}
const fmt = n => Math.round(n*10)/10;
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slug = s => s.toLowerCase().replace(/[^a-z]+/g,"-");

// ---------- events ----------
document.addEventListener("click", e=>{
  const j = e.target.closest("[data-jump]"); if(j){ document.getElementById("cat-"+slug(j.dataset.jump))?.scrollIntoView({behavior:"smooth"}); return; }
  const row = e.target.closest(".row"); if(!row) return; const id=row.dataset.id;
  if(e.target.closest("[data-toggle]")){ row.classList.toggle("open"); return; }
  const b = e.target.closest("[data-d]");
  if(b){ const cur=have(id); const nv=Math.max(0,cur+ +b.dataset.d); (state.items[id] ||= {}).have=nv; saveItem(id); rerenderKeepOpen(); return; }
  if(e.target.closest("[data-del]")){ delete state.items[id]; saveItem(id); render(); }
});
document.addEventListener("change", e=>{
  const row = e.target.closest(".row");
  if(e.target.id==="horizon"){ state.settings.horizon=+e.target.value; saveSettings(); render(); return; }
  if(e.target.id==="imp"){ importFile(e.target.files[0]); e.target.value=""; return; }
  if(e.target.id==="people"){ state.settings.people=Math.max(1,Math.min(20,+e.target.value||1)); saveSettings(); render(); return; }
  if(!row) return; const id=row.dataset.id;
  if(e.target.matches("[data-exp]")) (state.items[id] ||= {}).expiry = e.target.value || null;
  else if(e.target.type==="number") (state.items[id] ||= {}).have = Math.max(0,+e.target.value||0);
  saveItem(id); rerenderKeepOpen();
});
function rerenderKeepOpen(){
  const open=[...document.querySelectorAll(".row.open")].map(r=>r.dataset.id); render();
  open.forEach(id=>document.querySelector(`.row[data-id="${id}"]`)?.classList.add("open"));
}
$("#nCat").innerHTML = CATS.map(c=>`<option>${c}</option>`).join("");
$("#nAdd").addEventListener("click", ()=>{
  const name=$("#nName").value.trim(); if(!name) return $("#nName").focus();
  const id="c-"+name.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,40)+"-"+Date.now().toString(36);
  state.items[id]={custom:true,name,unit:$("#nUnit").value.trim()||"each",target:+$("#nTarget").value||1,cat:$("#nCat").value,have:0};
  ["#nName","#nUnit","#nTarget"].forEach(s=>$(s).value=""); saveItem(id); render();
  document.querySelector(`.row[data-id="${id}"]`)?.scrollIntoView({behavior:"smooth",block:"center"});
});

let fdb=null, auth=null, uid=null, hid=null, unsubs=[], members={}, memberIds=[], pendingName="";
const gate = id => ["gAuth","gHouse","gSetup"].forEach(g=>$("#"+g).classList.toggle("on", g===id));
function toast(t){ const el=$("#toast"); el.textContent=t; el.style.display="block"; clearTimeout(toast.t); toast.t=setTimeout(()=>el.style.display="none",2600); }
function setStatus(t){ $("#status").textContent = t + " · synced to your household"; }
const nice = e => ({"auth/invalid-credential":"Wrong email or password.","auth/email-already-in-use":"That email already has an account. Sign in instead.","auth/weak-password":"Use at least 6 characters.","auth/invalid-email":"Check the email address.","permission-denied":"That invite link isn't valid."}[e.code] || e.message || "Something went wrong.");

function saveItem(id){
  if(!hid) return;
  clearTimeout(saveTimers[id]);
  saveTimers[id]=setTimeout(()=>{
    const v=state.items[id], ref=doc(fdb,"households",hid,"items",id);
    (v ? setDoc(ref,{...v, updatedBy:uid, updatedAt:serverTimestamp()}) : deleteDoc(ref))
      .then(()=>setStatus("Saved"), e=>setStatus("Not saved: "+nice(e)));
  },500);
}
function saveSettings(){ if(hid) updateDoc(doc(fdb,"households",hid),{people:state.settings.people,horizon:state.settings.horizon}).catch(e=>toast(nice(e))); }

function watchHousehold(){
  unsubs.forEach(u=>u()); unsubs=[];
  unsubs.push(onSnapshot(doc(fdb,"households",hid), s=>{
    if(!s.exists()) return;
    const d=s.data(); $("#hhName").textContent=d.name||"Household";
    memberIds=d.members||[]; state.settings={people:+d.people||4, horizon:+d.horizon||1, stockDay:d.stockDay||null}; rerenderKeepOpen(); renderMembers();
  }, ()=>{ hid=null; gate("gHouse"); }));
  unsubs.push(onSnapshot(collection(fdb,"households",hid,"members"), snap=>{
    members={}; snap.forEach(d=>members[d.id]=d.data()); renderMembers();
  }, ()=>{}));
  unsubs.push(onSnapshot(collection(fdb,"households",hid,"items"), snap=>{
    const items={}; snap.forEach(d=>{ const v={...d.data()}; delete v.updatedAt; delete v.updatedBy; items[d.id]=v; });
    state.items=items;
    if(!document.activeElement || document.activeElement.type!=="number") rerenderKeepOpen();
    setStatus(snap.metadata.fromCache ? "Offline, will sync later" : "Up to date");
  }));
  gate(null);
}
function myName(){ const u=auth.currentUser; return (pendingName || u?.displayName || (u?.email||"").split("@")[0] || "Member").slice(0,40); }
function writeMe(){ return setDoc(doc(fdb,"households",hid,"members",uid),{name:myName(),email:auth.currentUser?.email||"",joinedAt:serverTimestamp()},{merge:true}).catch(()=>{}); }
function renderMembers(){
  const ids = memberIds.length ? memberIds : Object.keys(members);
  $("#members").innerHTML = ids.map(id=>{ const m=members[id]||{};
    return `<li><span>${esc(m.name||"Member")}${id===uid?'<span class="you">(you)</span>':""}</span><span class="you">${esc(m.email||"")}</span></li>`; }).join("") || "<li><span>Just you so far.</span></li>";
}
async function enterHousehold(id){ hid=id; await setDoc(doc(fdb,"users",uid),{householdId:id},{merge:true}); await writeMe(); watchHousehold(); }
async function leaveCurrent(){
  if(!hid) return; const old=hid; unsubs.forEach(u=>u()); unsubs=[]; hid=null;
  await deleteDoc(doc(fdb,"households",old,"members",uid)).catch(()=>{});
  await updateDoc(doc(fdb,"households",old),{members:arrayRemove(uid)}).catch(()=>{});
  await setDoc(doc(fdb,"users",uid),{householdId:null},{merge:true});
}
async function joinById(id){
  if(hid===id){ toast("You're already in this household"); return; }
  if(hid && !confirm("Join this household? You'll leave your current one, and its list stays with its members.")) return;
  await leaveCurrent();
  await updateDoc(doc(fdb,"households",id),{members:arrayUnion(uid)});
  await enterHousehold(id); toast("Joined household");
}
function parseInvite(t){ t=(t||"").trim(); try{ return new URL(t).searchParams.get("join"); }catch(e){ return /^[A-Za-z0-9]{15,40}$/.test(t)?t:null; } }

async function afterSignIn(){
  const pending = sessionStorage.getItem("pendingJoin");
  const u = await getDoc(doc(fdb,"users",uid));
  hid = u.exists() ? (u.data().householdId||null) : null;
  if(pending){ sessionStorage.removeItem("pendingJoin");
    try{ await joinById(pending); return; }catch(e){ $("#hErr").textContent=nice(e); } }
  if(hid){ const h=await getDoc(doc(fdb,"households",hid)).catch(()=>null); if(h&&h.exists()){ writeMe(); watchHousehold(); return; } hid=null; }
  gate("gHouse");
}

// auth & household buttons
const creds = () => [$("#aEmail").value.trim(), $("#aPass").value];
$("#aIn").onclick = ()=>signInWithEmailAndPassword(auth,...creds()).catch(e=>$("#aErr").textContent=nice(e));
$("#aUp").onclick = async()=>{ pendingName=$("#aName").value.trim();
  if(!pendingName) return $("#aErr").textContent="Add your first name so your household knows who you are.";
  try{ const c=await createUserWithEmailAndPassword(auth,...creds()); await updateProfile(c.user,{displayName:pendingName}).catch(()=>{}); }
  catch(e){ $("#aErr").textContent=nice(e); } };
$("#aReset").onclick = ()=>{ const em=$("#aEmail").value.trim(); if(!em) return $("#aErr").textContent="Enter your email first.";
  sendPasswordResetEmail(auth,em).then(()=>$("#aErr").textContent="Reset email sent.",e=>$("#aErr").textContent=nice(e)); };
$("#hCreate").onclick = async()=>{ try{
  const name=$("#hName").value.trim()||"My household";
  const ref=await addDoc(collection(fdb,"households"),{name,members:[uid],owner:uid,people:4,horizon:1,createdAt:serverTimestamp()});
  await enterHousehold(ref.id); toast("Household created");
}catch(e){ $("#hErr").textContent=nice(e); } };
$("#hJoin").onclick = async()=>{ const id=parseInvite($("#hLink").value); if(!id) return $("#hErr").textContent="Paste the full invite link.";
  try{ await joinById(id); }catch(e){ $("#hErr").textContent=nice(e); } };
$("#hOut").onclick = $("#menuOut").onclick = ()=>{ unsubs.forEach(u=>u()); unsubs=[]; hid=null; signOut(auth); };
$("#menuLeave").onclick = async()=>{ if(!confirm("Leave this household? Your devices will stop syncing with it.")) return; await leaveCurrent(); gate("gHouse"); };
$("#editName").onclick = async()=>{
  const n=(prompt("Your name as your household sees it:", myName())||"").trim(); if(!n) return;
  pendingName=n; await updateProfile(auth.currentUser,{displayName:n}).catch(()=>{}); await writeMe(); toast("Name updated");
};
$("#stockDay").innerHTML = '<option value="">Not set</option>'+Array.from({length:28},(_,i)=>`<option value="${i+1}">${i+1}${[,"st","nd","rd"][(i+1)%10>3||[11,12,13].includes(i+1)?0:(i+1)%10]||"th"} of the month</option>`).join("");
$("#stockDay").onchange = e=>{ state.settings.stockDay=+e.target.value||null; if(hid) updateDoc(doc(fdb,"households",hid),{stockDay:state.settings.stockDay}).catch(err=>toast(nice(err))); render(); };
$("#cal").onclick = ()=>{
  const pad=n=>String(n).padStart(2,"0"), ymd=d=>d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate());
  const stamp=new Date().toISOString().replace(/[-:]/g,"").slice(0,15)+"Z", ev=[];
  const hh=$("#hhName").textContent, link=location.origin+location.pathname;
  const vev=(id,date,title,desc,rule)=>["BEGIN:VEVENT","UID:"+id+"@prep-tracker","DTSTAMP:"+stamp,"DTSTART;VALUE=DATE:"+ymd(date),"DTEND;VALUE=DATE:"+ymd(new Date(date.getTime()+86400000)),
    "SUMMARY:"+title,"DESCRIPTION:"+desc,"URL:"+link,...(rule?[rule]:[]),"BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+title,"TRIGGER:-PT15H","END:VALARM","END:VEVENT"].join("\r\n");
  if(state.settings.stockDay){ const n=new Date(); let d=new Date(n.getFullYear(),n.getMonth(),state.settings.stockDay); if(d<n) d=new Date(n.getFullYear(),n.getMonth()+1,state.settings.stockDay);
    ev.push(vev("stockday-"+hid,d,"Stock-up day ("+hh+")","Open the prep tracker and check Buy next.","RRULE:FREQ=MONTHLY;BYMONTHDAY="+state.settings.stockDay)); }
  allItems().forEach(it=>{ const ex=state.items[it.id]?.expiry; if(!ex||!have(it.id)) return;
    let d=new Date(ex+"T00:00"); d.setDate(d.getDate()-14); if(d<new Date()) d=new Date(); d.setHours(0,0,0,0);
    ev.push(vev("exp-"+hid+"-"+it.id+"-"+ex,d,"Use or rotate: "+it.name,"Expires "+ex+". Eat it and buy fresh.")); });
  if(!ev.length){ toast("Pick a stock-up day or add expiry dates first"); return; }
  const ics=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Prep Tracker//EN","CALSCALE:GREGORIAN",...ev,"END:VCALENDAR"].join("\r\n");
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([ics],{type:"text/calendar"})); a.download="prep-reminders.ics"; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),2000); toast(ev.length+" reminder"+(ev.length>1?"s":"")+" ready to add");
};
$("#invite2").onclick = ()=>$("#invite").click();
$("#invite").onclick = async()=>{
  const link = location.origin+location.pathname+"?join="+hid;
  const text = "Join our household on Prep Tracker: "+link;
  if(navigator.share){ try{ await navigator.share({title:"Prep Tracker invite",text,url:link}); return; }catch(e){ if(e.name==="AbortError") return; } }
  try{ await navigator.clipboard.writeText(link); toast("Invite link copied"); }catch(e){ prompt("Copy this invite link:",link); }
};

// backup
function exportData(){
  const name="prep-tracker-backup-"+new Date().toISOString().slice(0,10)+".json";
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([JSON.stringify({version:1,...state},null,2)],{type:"application/json"}));
  a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); toast("Backup saved");
}
function importFile(f){
  if(!f||!hid) return; const r=new FileReader();
  r.onload=async()=>{ try{
    const d=JSON.parse(r.result); if(!d.items||!d.settings) throw 0;
    const b=writeBatch(fdb);
    Object.entries(d.items).slice(0,450).forEach(([id,v])=>b.set(doc(fdb,"households",hid,"items",id),{...v,updatedBy:uid,updatedAt:serverTimestamp()}));
    b.update(doc(fdb,"households",hid),{people:+d.settings.people||4,horizon:+d.settings.horizon||1});
    await b.commit(); toast("Backup restored");
  }catch(e){ toast("That file isn't a prep tracker backup"); } };
  r.readAsText(f);
}
$("#exp").addEventListener("click", exportData);

// boot
const join = new URLSearchParams(location.search).get("join");
if(join){ sessionStorage.setItem("pendingJoin",join); history.replaceState(null,"",location.pathname); }
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
render();
if(!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("PASTE")){ gate("gSetup"); }
else{
  const app=initializeApp(firebaseConfig);
  auth=getAuth(app); await setPersistence(auth,browserLocalPersistence);
  fdb=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});
  onAuthStateChanged(auth, async user=>{
    if(!user){ uid=null; state.items={}; render(); gate("gAuth"); return; }
    uid=user.uid; $("#aErr").textContent=""; $("#aPass").value="";
    try{ await afterSignIn(); }catch(e){ $("#hErr").textContent=nice(e); gate("gHouse"); }
  });
}