'use strict';
(() => {
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const elements=new Map(),keys=new Set();
const $=id=>{if(!elements.has(id))elements.set(id,document.getElementById(id));return elements.get(id);};
function setText(id,value){const node=$(id),text=String(value);if(node.textContent!==text)node.textContent=text;}
const STEP=1/120;let accumulator=0;
const WORLD=540,GAP=86,GRAV=1550;
let W=innerWidth,H=innerHeight,DPR=1,scale=1,ox=0,time=0,last=0,mode='menu',camera=0,highest=0,score=0,maxFloor=0,combo=0,comboTimer=0,lastFloor=0,hazard=-460,elapsed=0,shake=0,muted=false,audio=null,best=0,platforms=[],particles=[],trails=[],orbs=[],jumpBuffer=0;
let map='aurora',tapes=[],idleTime=0,jumpBoost=0;
const goods={magnet:{name:'Mıknatıs',price:10,detail:'İlk 15 sn mıknatıs + 2× kristal puanı'},jump:{name:'Yaylı ayakkabı',price:12,detail:'İlk 20 sn daha yüksek sıçrayış'},rocket:{name:'Roket kalkışı',price:20,detail:'Tura 10 katlık roketle başla'}};
let wallet={balance:0,pending:[]},walletSaved=true;
try{const saved=JSON.parse(localStorage.getItem('auroraTowerWallet'));if(saved&&Number.isSafeInteger(saved.balance)&&saved.balance>=0){wallet.balance=saved.balance;wallet.pending=Array.isArray(saved.pending)?[...new Set(saved.pending.filter(id=>Object.hasOwn(goods,id)))]:[];}}catch{}
function saveWallet(){try{localStorage.setItem('auroraTowerWallet',JSON.stringify(wallet));walletSaved=true;}catch{walletSaved=false;}}
function renderShop(){setText('walletBalance',wallet.balance+' ◆');setText('walletHud','CÜZDAN '+wallet.balance+' ◆');setText('shopNote',walletSaved?'Her ürün sonraki turda bir kez kullanılır. Harita değiştirirken korunur.':'Tarayıcı kaydı kullanılamıyor: cüzdan yalnızca bu oturumda saklanıyor.');$('shopItems').innerHTML=Object.entries(goods).map(([id,g])=>{const queued=wallet.pending.includes(id);return `<button type="button" data-buy="${id}" ${queued||wallet.balance<g.price?'disabled':''}><strong>${g.name}</strong><small>${g.detail}</small><b>${queued?'SONRAKİ TURDA HAZIR':g.price+' ◆'}</b></button>`;}).join('');document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buyBooster(b.dataset.buy));}
function buyBooster(id){if(mode==='playing'||mode==='paused'||!Object.hasOwn(goods,id)||wallet.pending.includes(id)||wallet.balance<goods[id].price)return false;wallet.balance-=goods[id].price;wallet.pending.push(id);saveWallet();renderShop();tone(700,.12);return true;}
function earnCrystal(){wallet.balance=Math.min(Number.MAX_SAFE_INTEGER,wallet.balance+1);saveWallet();setText('walletHud','CÜZDAN '+wallet.balance+' ◆');}
function useBoosters(){const pending=wallet.pending.slice();wallet.pending=[];saveWallet();for(const id of pending){if(id==='magnet')rush=15;if(id==='jump')jumpBoost=20;if(id==='rocket')activateRocket();}renderShop();}
function dancing(){return map==='retro'&&mode==='playing'&&p.ground&&idleTime>.4&&Math.abs(p.vx)<10;}

try{if(localStorage.getItem('auroraTowerMap')==='retro')map='retro';}catch{}
function bestKey(){return map==='retro'?'auroraTowerBestRetro':'auroraTowerBest';}
function selectMap(id){if(mode==='playing'||mode==='paused'||!['aurora','retro'].includes(id))return;map=id;try{localStorage.setItem('auroraTowerMap',map);best=Number(localStorage.getItem(bestKey()))||0;}catch{best=0;}reset();mode='menu';$('overlay').classList.remove('results-mode');$('results').classList.add('hidden');$('controls').classList.remove('hidden');setText('eyebrow','SAHNE HAZIR');setText('title',map==='retro'?'NEON 1986':'AURORA TOWER');setText('description',map==='retro'?'Neon pedlerden sıçra, kasetleri topla, geceyi geride bırak.':'Hızını koru, katları aş, fırtınadan kaç.');setText('start','TIRMANIŞA BAŞLA');setText('best',best);renderMaps();}
function renderMaps(){document.querySelectorAll('[data-map]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.map===map));b.onclick=()=>selectMap(b.dataset.map);});setText('mapDetail',map==='retro'?'NEON 1986 · Pembe pedlerden güçlü sıçra. Kasetler +150 puan ve atılma verir.':'AURORA · Yedi ortam, yükseldikçe değişen gökyüzü.');}
let crumbs=[],crumbClock=0;
let pollen=[],pollenClock=0,rockets=[],rocketTarget=null,rocketTrail=0,spinTime=0,spinDirection=1;
const outfits={melduk:[{name:'Klasik',body:'#542638',boots:'#302735',style:'classic'},{name:'Bal',body:'#e8b342',boots:'#6b4936',style:'stripe'},{name:'Gece',body:'#303760',boots:'#bfbce6',style:'star'},{name:'Ada',body:'#6aaf8b',boots:'#f2e6cd',style:'jacket'}],white:[{name:'Klasik',body:'#202936',boots:'#d8dfdf',style:'classic'},{name:'Kolej',body:'#ece1cf',boots:'#3c536b',style:'jacket'},{name:'Kızıl',body:'#943d43',boots:'#282c37',style:'stripe'},{name:'Uzay',body:'#636090',boots:'#dae4f4',style:'star'}]};
outfits.melduk.push({name:'Disco 86',body:'#f05da8',boots:'#6ef0e0',style:'retro'});
outfits.white.push({name:'Miami 86',body:'#a9ecdf',boots:'#faf0d9',style:'retro'});
let wardrobe={melduk:0,white:0};
try{const saved=JSON.parse(localStorage.getItem('auroraTowerOutfits'));for(const id of ['melduk','white'])if(Number.isInteger(saved?.[id])&&saved[id]>=0&&saved[id]<outfits[id].length)wardrobe[id]=saved[id];}catch{}
function currentSkin(id=selected){return outfits[id]?{...characters[id],...outfits[id][wardrobe[id]] ,name:characters[id].name}:characters[id];}
function chooseOutfit(index){if(!outfits[selected]||mode==='playing'||mode==='paused'||!Number.isInteger(index)||index<0||index>=outfits[selected].length)return;wardrobe[selected]=index;try{localStorage.setItem('auroraTowerOutfits',JSON.stringify(wardrobe));}catch{}renderCharacters();}
function renderWardrobe(){const choices=outfits[selected];$('wardrobe').classList.toggle('hidden',!choices);if(!choices)return;$('outfitOptions').innerHTML=choices.map((o,i)=>`<button type="button" data-outfit="${i}" aria-pressed="${wardrobe[selected]===i}" style="--cloth:${o.body}"><i></i>${o.name}</button>`).join('');document.querySelectorAll('[data-outfit]').forEach(b=>b.onclick=()=>chooseOutfit(Number(b.dataset.outfit)));}
function activateRocket(){if(rocketTarget!==null)return;rocketTarget=p.y+10*GAP;p.ground=false;p.support=null;p.coyote=0;p.dashTime=0;p.vy=950;spinTime=0;announce('ROKET ATEŞLENDİ','10 kat yükseliş · A / D ile yön ver');tone(140,.4,'sawtooth',.025);}
function rocketStep(dt){if(rocketTarget===null)return;rocketTrail+=dt;while(rocketTrail>=.04){rocketTrail-=.04;burst(p.x,p.y-4,'#ffbb65',3,65);}if(p.y>=rocketTarget-.01){p.y=rocketTarget;rocketTarget=null;p.vy=0;p.dash=true;}}

let bestCombo=0,previousBest=0,newRecord=false,landedFloor=0,meteors=[],meteorClock=0,skyTime=0;
let p,selected='nova',milestone=0,crystals=0,rush=0,noticeTimer=0;
const characters={
 nova:{name:'Nova',desc:'Kutup kâşifi',body:'#e2ede6',head:'#f1f6eb',accent:'#ff846c',visor:'#68f9e4',boots:'#59899b',kind:'explorer'},
 ember:{name:'Köz',desc:'Alev gezgini',body:'#ed9860',head:'#ffd39c',accent:'#ff536f',visor:'#ffe78b',boots:'#8d4356',kind:'fox'},
 pixel:{name:'Piksel',desc:'Neon robot',body:'#9187e8',head:'#c8b9ff',accent:'#5af1df',visor:'#7bffdf',boots:'#5c53a0',kind:'robot'},
 mint:{name:'Nane',desc:'Orman kedisi',body:'#7cd7b3',head:'#c4f8da',accent:'#ffd477',visor:'#99e9ff',boots:'#37796f',kind:'cat'},
 melduk:{name:'melduk',desc:'Bal poleni',body:'#542638',head:'#ecc09f',accent:'#f5c457',visor:'#765039',boots:'#302735',hair:'#594033',kind:'human',pollen:true},
 white:{name:'white',desc:'Gece koşucusu',body:'#202936',head:'#ddb393',accent:'#b9d8e6',visor:'#644732',boots:'#d8dfdf',hair:'#282422',kind:'human'},
 ebucehil:{name:'EbuCehil',desc:'Sürpriz iz',body:'#181a20',head:'#ddb18a',accent:'#a4a99e',visor:'#59422f',boots:'#171921',hair:'#292323',kind:'human',style:'shirt',poop:true}
};
try{const saved=localStorage.getItem('auroraTowerCharacter');if(Object.hasOwn(characters,saved))selected=saved;}catch{}
function selectCharacter(id){if(!Object.hasOwn(characters,id)||mode==='playing'||mode==='paused')return;selected=id;try{localStorage.setItem('auroraTowerCharacter',id);}catch{}renderCharacters();}
function portrait(c){return '<svg viewBox="0 0 64 64" aria-hidden="true">'+
 (c.pollen?'<path d="M18 22 Q12 2 33 3 Q56 2 52 25 L56 47 L15 47Z" fill="'+c.hair+'"/>':'')+
 '<rect x="18" y="37" width="31" height="23" rx="9" fill="'+c.body+'"/><rect x="27" y="31" width="12" height="11" rx="4" fill="'+c.head+'"/><ellipse cx="33" cy="23" rx="15" ry="18" fill="'+c.head+'"/>'+
 (c.pollen?'<path d="M17 26 Q12 2 33 3 Q55 1 50 28 L45 19 Q39 14 33 8 Q25 12 20 19Z" fill="'+c.hair+'"/><path d="M18 29 a4 6 0 1 0 1 0 M48 29 a4 6 0 1 0 1 0" fill="none" stroke="#efcf82" stroke-width="1.5"/><path d="M23 40 Q33 51 44 40 L37 58" fill="none" stroke="#cbd6cb"/><path d="M34 49 l3 -3 2 4 -3 2Z" fill="#f9d57c"/>':'<path d="M18 22 L16 12 L23 5 L30 6 L36 1 L40 5 L48 8 L50 20 L44 15 L27 13Z" fill="'+c.hair+'"/><path d="M20 28 Q20 41 33 42 Q46 39 47 28 L42 34 Q33 38 25 33Z" fill="#44362e" opacity=".75"/><path d="M28 31 Q33 28 38 31" fill="none" stroke="#44362e" stroke-width="2"/>')+
 '<path d="M23 20 L29 19 M37 19 L43 20" stroke="'+c.hair+'" stroke-width="1.6"/><ellipse cx="27" cy="24" rx="2" ry="2.3" fill="'+c.visor+'"/><ellipse cx="40" cy="24" rx="2" ry="2.3" fill="'+c.visor+'"/><path d="M29 34 Q34 36 38 33" stroke="#ad6d69" stroke-width="1.3" fill="none"/>'+
 (c.poop?'<path d="M17 23 Q8 5 22 2 Q29 -3 35 2 Q48 -3 53 12 L48 25 L43 15 L24 14Z" fill="'+c.hair+'"/><path d="M20 28 Q20 41 33 42 Q46 39 47 28 L42 34 Q33 38 25 33Z" fill="'+c.head+'"/><path d="M28 34 L38 34" stroke="#ad6d69"/><path d="M24 39 L32 46 L35 40 L42 45 L46 38" fill="#393b43"/><path d="M35 47 V58" stroke="#858780"/><rect x="18" y="57" width="31" height="4" fill="#45423b"/><rect x="29" y="56" width="8" height="6" rx="1" fill="#c6c4ad"/>':'')+
 (c.pollen?'<circle cx="9" cy="43" r="3" fill="#ffce57"/><circle cx="8" cy="53" r="1.5" fill="#ffe9ac"/>':'')+'</svg>';}
function renderCharacters(){
 $('characters').innerHTML=Object.entries(characters).map(([id])=>{const c=currentSkin(id);return c.kind==='human'?`<button type="button" class="character" data-character="${id}" aria-pressed="${selected===id}" aria-label="${c.name}, ${c.desc}" style="--accent:${c.accent}">${portrait(c)}<strong>${c.name}</strong><small>${c.desc}</small></button>`:`<button type="button" class="character" data-character="${id}" aria-pressed="${selected===id}" aria-label="${c.name}, ${c.desc}" style="--accent:${c.accent}"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M25 33 L6 42 L12 29 Z" fill="${c.accent}"/><rect x="21" y="30" width="25" height="24" rx="6" fill="${c.body}"/><rect x="19" y="12" width="30" height="25" rx="${c.kind==='robot'?3:9}" fill="${c.head}"/>${c.kind==='cat'||c.kind==='fox'?'<path d="M20 20 L20 4 L30 14 M39 14 L49 4 L48 22" fill="'+c.head+'"/>':c.kind==='robot'?'<path d="M34 12 V5" stroke="'+c.accent+'" stroke-width="3"/><circle cx="34" cy="5" r="3" fill="'+c.visor+'"/>':''}<rect x="29" y="19" width="17" height="11" rx="4" fill="#153c53"/><rect x="32" y="21" width="11" height="3" rx="1" fill="${c.visor}"/><path d="M22 51 v7 h9 v-7 M37 51 v7 h9 v-7" fill="${c.boots}"/></svg><strong>${c.name}</strong><small>${c.desc}</small></button>`;}).join('');
 document.querySelectorAll('[data-character]').forEach(b=>b.onclick=()=>selectCharacter(b.dataset.character));renderWardrobe();
}
function announce(title,detail){setText('noticeTitle',title);setText('noticeDetail',detail);noticeTimer=3.2;}
const environments=[
 {top:'#080e24',mid:'#102a3f',bottom:'#123a45',mountains:['#132e42','#102536','#0d2030'],wall:'#071426c9',center:'#0d1d3090',edge:'#5fdbd854',orb:'#b2ddd9',name:'01 / GECE BAHÇESİ'},
 {top:'#172b58',mid:'#b4677c',bottom:'#f5bd8d',mountains:['#755578','#594968','#373750'],wall:'#352e49bb',center:'#65475c50',edge:'#ffd19a77',orb:'#ffe4ac',name:'02 / ŞAFAK ZİRVESİ'},
 {top:'#160d32',mid:'#562967',bottom:'#a94f77',mountains:['#40214e','#301b40','#241932'],wall:'#271d3dcc',center:'#36264c70',edge:'#d99bff66',orb:'#efd7ff',name:'03 / YILDIZ DENİZİ'},
 {top:'#05192d',mid:'#1b617b',bottom:'#98dfe3',mountains:['#34758b','#265265','#193e50'],wall:'#103040bb',center:'#28677c55',edge:'#a6faff99',orb:'#e5ffff',name:'04 / BUZUL FIRTINASI'},
 {top:'#240e1c',mid:'#813b31',bottom:'#e6914e',mountains:['#753c36','#512d31','#331f29'],wall:'#381d25cc',center:'#66352966',edge:'#ffab6599',orb:'#ffcf8a',name:'05 / KÜL VADİSİ'},
 {top:'#061e2b',mid:'#14685e',bottom:'#6cad87',mountains:['#286b60','#205049','#153931'],wall:'#10332bbb',center:'#24634b55',edge:'#adf99b99',orb:'#d5ffd3',name:'06 / ZÜMRÜT GÖKLER'},
 {top:'#110b32',mid:'#392d77',bottom:'#bc69aa',mountains:['#473264','#302749','#211b36'],wall:'#201637bb',center:'#54336c55',edge:'#f2b6ff99',orb:'#ffd6f4',name:'07 / KOZMİK EŞİK'}
];
function theme(){if(map==='retro'){const colors=[['#170c33','#642369','#ef876c'],['#071c38','#3a4a95','#ec72b5'],['#29102c','#853760','#ffc77c']][Math.floor(maxFloor/100)%3];return {top:colors[0],mid:colors[1],bottom:colors[2],mountains:['#371e52','#28173c','#19112b'],wall:'#180d2dcc',center:'#36143966',edge:'#ff79d999',orb:'#ffce85',name:'NEON 1986 / '+['SUNSET STRIP','MIDNIGHT DRIVE','DISCO DAWN'][Math.floor(maxFloor/100)%3]};}return environments[Math.min(6,Math.floor(maxFloor/100))];}
// Each century adds difficulty; asymptotic limits keep late runs playable.
function difficulty(floor=maxFloor){const tier=Math.max(0,Math.floor(floor/100)),pressure=1-Math.exp(-tier/5);return {tier,pressure,minWidth:140-45*pressure,maxWidth:205-65*pressure,safeWidth:260-65*pressure,moveSpeed:1.3+1.5*pressure,amplitude:22+24*pressure,movingChance:.14+.24*pressure,fragileChance:.09+.13*pressure,breakDelay:.65-.25*pressure,stormBoost:42*pressure};}
function drawRetro(){
 const horizon=H*.54,sx=W*.77,sy=H*.28,r=Math.min(W,H)*.12;
 ctx.save();let sun=ctx.createLinearGradient(0,sy-r,0,sy+r);sun.addColorStop(0,'#ffe494');sun.addColorStop(1,'#ff5cb8');ctx.fillStyle=sun;ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);ctx.fill();ctx.fillStyle=theme().mid;for(let i=0;i<6;i++)ctx.fillRect(sx-r,sy+i*r*.15,r*2,3+i);
 ctx.fillStyle='#110d25';for(let i=0;i<25;i++){let x=i*W/24,bh=35+(Math.sin(i*13)*.5+.5)*100;ctx.fillRect(x,horizon-bh,W/24-3,bh);ctx.fillStyle='#ff78cc55';for(let row=0;row<5;row++)ctx.fillRect(x+7,horizon-bh+10+row*14,4,5);ctx.fillStyle='#110d25';}
 ctx.strokeStyle='#f66bd74a';ctx.lineWidth=1;for(let i=-12;i<=12;i++){ctx.beginPath();ctx.moveTo(W/2+i*14,horizon);ctx.lineTo(W/2+i*W*.16,H);ctx.stroke();}for(let i=0;i<15;i++){let t=((i/15+time*.035)%1);let y=horizon+t*t*(H-horizon);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
 ctx.strokeStyle='#111328';ctx.lineWidth=6;for(const x of [W*.08,W*.92]){ctx.beginPath();ctx.moveTo(x,H*.85);ctx.quadraticCurveTo(x-10,H*.55,x+10,H*.31);ctx.stroke();ctx.lineWidth=4;for(let j=-3;j<=3;j++){ctx.beginPath();ctx.moveTo(x+10,H*.31);ctx.quadraticCurveTo(x+j*22,H*.24,x+j*35,H*.35);ctx.stroke();}}
 ctx.restore();
}
function drawEnvironment(){if(map==='retro'){drawRetro();return;}
 const stage=Math.min(6,Math.floor(maxFloor/100));if(stage<3)return;
 ctx.save();
 if(stage===3){ // Snow at two depths, with distant ice ridges.
  for(let i=0;i<95;i++){const depth=i%3+1,x=((i*173+time*(15+depth*9))%(W+60))-30,y=(i*97+time*(18+depth*14))%(H+30);ctx.fillStyle=depth===3?'#ecffff88':'#c9f6ff44';ctx.beginPath();ctx.arc(x,y,depth*.65,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#a3f7ff16';for(let i=0;i<9;i++){const x=i*W/8;ctx.beginPath();ctx.moveTo(x-55,H);ctx.lineTo(x,H*.55+Math.sin(i*4)*H*.12);ctx.lineTo(x+40,H);ctx.fill();}
 }else if(stage===4){ // Updrafts of embers and distant lava seams.
  for(let i=0;i<65;i++){const x=(i*151+Math.sin(time*.8+i)*30)%W,y=H-((i*79+time*(25+i%5*9))%(H+30));ctx.globalAlpha=.25+Math.sin(time*2+i)*.15;ctx.fillStyle=i%4===0?'#ffe3a3':'#ff975a';ctx.fillRect(x,y,i%4===0?3:2,4);}
  ctx.globalAlpha=.35;ctx.strokeStyle='#ff9254';ctx.lineWidth=2;for(let i=0;i<7;i++){const x=i*W/6;ctx.beginPath();ctx.moveTo(x,H);ctx.lineTo(x+20,H*.9);ctx.lineTo(x-8,H*.83);ctx.stroke();}
 }else if(stage===5){ // Floating islands and fireflies.
  for(let i=0;i<7;i++){let x=(i*233+time*5)%(W+160)-80,y=H*(.28+(i%3)*.16)+Math.sin(time*.5+i)*8;ctx.fillStyle='#153f43aa';ctx.beginPath();ctx.moveTo(x-48,y);ctx.lineTo(x+48,y);ctx.lineTo(x+10,y+50);ctx.closePath();ctx.fill();round(x-48,y-5,96,8,4,'#77c59955');ctx.strokeStyle='#8cdf9f33';ctx.beginPath();ctx.moveTo(x+10,y+5);ctx.lineTo(x+10,y+80);ctx.stroke();}
  for(let i=0;i<50;i++){ctx.globalAlpha=.3+Math.sin(time*2+i)*.25;ctx.fillStyle='#d8ff9c';ctx.beginPath();ctx.arc((i*137+Math.sin(time+i)*18)%W,(i*83+Math.cos(time*.6+i)*20+H)%H,2,0,Math.PI*2);ctx.fill();}
 }else{ // Ringed planet and drifting orbital dust.
  const x=W*.78,y=H*.28;ctx.strokeStyle='#eebdff44';ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(x,y,98,26,-.4,0,Math.PI*2);ctx.stroke();let planet=ctx.createRadialGradient(x-14,y-16,2,x,y,47);planet.addColorStop(0,'#f2cbef');planet.addColorStop(1,'#694984');ctx.fillStyle=planet;ctx.beginPath();ctx.arc(x,y,44,0,Math.PI*2);ctx.fill();
  for(let i=0;i<65;i++){const angle=time*.035+i*2.4,radius=80+i*5;ctx.globalAlpha=.25;ctx.fillStyle='#ffc9f3';ctx.fillRect(W*.5+Math.cos(angle)*radius,H*.45+Math.sin(angle)*radius*.5,2,2);}
 }
 ctx.restore();
}

renderCharacters();renderMaps();renderShop();
try{best=Number(localStorage.getItem(bestKey()))||0;muted=localStorage.getItem('auroraTowerMuted')==='true';}catch{}
setText('best',best);setText('sound',muted?'SES KAPALI':'SES AÇIK');
function resize(){W=innerWidth;H=innerHeight;DPR=Math.min(devicePixelRatio||1,2,Math.sqrt(3500000/(W*H)));canvas.width=W*DPR;canvas.height=H*DPR;scale=Math.min(W/620,H/760,1.45);ox=(W-WORLD*scale)/2;}
addEventListener('resize',resize);resize();
function tone(freq,duration=.1,type='sine',vol=.04){if(muted)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();let o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.55,audio.currentTime+duration);g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
function rand(a,b){return a+Math.random()*(b-a)}
function burst(x,y,color,n=12,power=150){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-power,power),vy:rand(-power,power),life:rand(.25,.65),max:.65,color,size:rand(2,5)});}
function generate(){
 let n=platforms.length?platforms[platforms.length-1].n+1:0;
 const end=Math.max(highest+H/scale+450,1500);
 for(;n*GAP<end;n++){
  const d=difficulty(n),safe=n%10===0,width=n===0?WORLD:safe?d.safeWidth:rand(d.minWidth,d.maxWidth);
  const moving=!safe&&n>15&&(d.tier===0?n%7===0:Math.random()<d.movingChance);
  const margin=moving?d.amplitude+12:26,x=n===0?0:rand(margin,WORLD-width-margin);
  const type=map==='retro'&&!safe&&n%12===6?'boost':safe?'normal':n>9&&n%9===0?'spring':n>20&&(d.tier===0?n%11===0:Math.random()<d.fragileChance)?'fragile':'normal';
  const phase=rand(0,6.28),position=moving?x+Math.sin(time*d.moveSpeed+phase)*d.amplitude:x;
  platforms.push({n,y:n*GAP,x:position,prevX:position,base:x,w:width,moving,phase,moveSpeed:d.moveSpeed,amplitude:d.amplitude,breakDelay:d.breakDelay,type,broken:false,crack:0});
  if(map==='retro'&&n%15===8)tapes.push({x:position+width/2,y:n*GAP+34,taken:false});
  if(n>=35&&n%80===35&&Math.random()<.7)rockets.push({x:position+width/2,y:n*GAP+34,taken:false});
  if(n>0&&n%3===0)orbs.push({x:x+width/2,y:n*GAP+34,taken:false});
 }
}

function reset(){time=0;accumulator=0;p={support:null,x:WORLD/2,y:0,vx:0,vy:0,w:24,h:36,ground:true,coyote:.1,wall:0,wallLock:0,dash:true,dashTime:0,face:1,land:0};platforms=[];orbs=[];particles=[];trails=[];camera=0;highest=0;score=0;maxFloor=0;combo=0;comboTimer=0;lastFloor=0;hazard=-460;elapsed=0;shake=0;jumpBuffer=0;keys.clear();idleTime=0;jumpBoost=0;tapes=[];crumbs=[];crumbClock=0;rockets=[];rocketTarget=null;rocketTrail=0;spinTime=0;pollen=[];pollenClock=0;bestCombo=0;landedFloor=0;newRecord=false;meteors=[];meteorClock=0;skyTime=0;milestone=0;crystals=0;rush=0;noticeTimer=0;$('notice').style.opacity=0;$('combo').style.opacity=0;generate();p.support=platforms[0];}
function start(){reset();$('overlay').classList.remove('results-mode');mode='playing';useBoosters();$('overlay').classList.add('hidden');tone(550,.2);}
function overlay(kind){renderShop();$('shop').classList.toggle('hidden',kind==='paused');
 $('overlay').classList.remove('hidden');
 $('overlay').classList.toggle('results-mode',kind==='over');
 $('results').classList.toggle('hidden',kind!=='over');
 $('controls').classList.toggle('hidden',kind==='over');
 $('characterSelect').classList.toggle('hidden',kind==='paused');$('mapSelect').classList.toggle('hidden',kind==='paused');
 if(kind==='paused'){
  setText('eyebrow','DURAKLATILDI');$('title').innerHTML='Mola.';
  setText('description','Hazır olduğunda kaldığın yerden devam et.');
  setText('start','DEVAM ET');setText('hint','P / ESC — devam et');
 }else{
  const number=n=>Math.floor(n).toLocaleString('tr-TR');
  setText('eyebrow','AURORA TOWER / TUR SONU');
  setText('title',newRecord?'REKOR.':'TUR BİTTİ.');
  setText('description',newRecord?'Bunu geçmek kolay olmayacak.':maxFloor===0?'İlk basamak seni bekliyor.':maxFloor>=200?'Yıldızlara kadar çıktın.':maxFloor>=100?'Bulutların üstünü gördün.':'Bir sonraki turda biraz daha yukarı.');
  setText('resultScore',number(score));
  setText('resultFloor',number(maxFloor));
  setText('resultCombo',bestCombo>1?bestCombo+'×':'—');
  setText('resultTime',Math.floor(elapsed/60)+':'+String(Math.floor(elapsed%60)).padStart(2,'0'));
  setText('resultCrystals',number(crystals));
  setText('resultBest',number(best));
  setText('resultDelta',newRecord?'+'+number(score-previousBest)+' PUAN · YENİ REKOR':score===best&&score>0?'REKORLA AYNI PUAN':number(Math.max(0,best-Math.floor(score)))+' PUAN FARK');
  setText('resultStamp',newRecord?'YENİ REKOR':'TUR KAYDI');
  setText('resultPilot',characters[selected].name+' / '+theme().name.split(' / ')[1]);
  $('resultProgress').style.width=(best>0?Math.min(100,score/best*100):0)+'%';
  $('start').innerHTML='BİR TUR DAHA <span>↗</span>';
  setText('hint','ENTER — yeniden başla');
 }
}
// Only a first landing on a higher platform advances the chain. Returning to
// the same or an older platform breaks it immediately, including held jumps.
function registerLanding(floor){
 landedFloor=floor;
 if(floor<=lastFloor){combo=0;comboTimer=0;return;}
 const skip=floor-lastFloor;
 combo=comboTimer>0?Math.min(combo+1,8):1;
 comboTimer=3.5;bestCombo=Math.max(bestCombo,combo);
 score+=skip*10*combo;lastFloor=floor;
 setText('comboLabel',skip>=2?skip+' KAT TEK SIÇRAYIŞTA':'YÜKSELİŞ KOMBOSU');
 if(skip>=2)shake=2;
}
function updateSky(dt){
 if(maxFloor<200||(maxFloor>=300&&maxFloor<600))return;
 skyTime+=dt;meteorClock-=dt;
 const shower=skyTime%16<5;
 if(meteorClock<=0){
  meteorClock=shower?rand(.10,.23):rand(.65,1.5);
  const speed=rand(280,650),large=Math.random()<.18;
  meteors.push({x:rand(-W*.3,W),y:rand(-160,H*.22),vx:speed,vy:speed*.6,life:0,duration:rand(.8,1.7),tail:large?180:rand(50,110),size:large?3:1.5,warm:large});
 }
 for(const m of meteors){m.x+=m.vx*dt;m.y+=m.vy*dt;m.life+=dt;}
 meteors=meteors.filter(m=>m.life<m.duration&&m.x<W+220&&m.y<H+100);
}
function drawMeteors(){
 ctx.save();
 for(const m of meteors){
  const alpha=Math.min(1,m.life*6,(m.duration-m.life)*3);
  const tx=m.x-m.tail,ty=m.y-m.tail*.6;
  let streak=ctx.createLinearGradient(tx,ty,m.x,m.y);
  streak.addColorStop(0,m.warm?'#ffb67b00':'#b0ccff00');
  streak.addColorStop(1,m.warm?'#ffd2a0':'#dae5ff');
  ctx.globalAlpha=alpha*.8;ctx.strokeStyle=streak;ctx.lineWidth=m.size;
  ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(m.x,m.y);ctx.stroke();
  ctx.shadowColor=m.warm?'#ffa169':'#b5cbff';ctx.shadowBlur=m.warm?18:8;
  ctx.fillStyle='#fff3df';ctx.beginPath();ctx.arc(m.x,m.y,m.size,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  if(m.warm){for(let i=1;i<=4;i++){ctx.globalAlpha=alpha*(1-i/5)*.6;ctx.fillStyle='#ffb078';ctx.fillRect(m.x-i*17,m.y-i*10+Math.sin(m.life*12+i)*7,2,2);}}
 }
 ctx.restore();
}
function pause(){accumulator=0;if(mode==='playing'){mode='paused';keys.clear();overlay('paused');}else if(mode==='paused'){mode='playing';$('overlay').classList.add('hidden');}}
function die(){if(mode==='over')return;mode='over';previousBest=best;newRecord=Math.floor(score)>best;$('combo').style.opacity=0;$('notice').style.opacity=0;burst(p.x,p.y+18,'#ff779d',35,260);tone(110,.5,'sawtooth',.04);best=Math.max(best,Math.floor(score));try{localStorage.setItem(bestKey(),best);}catch{}setText('best',best);overlay('over');}
$('start').onclick=()=>{if(mode==='paused')pause();else start();};$('pause').onclick=pause;$('sound').onclick=()=>{muted=!muted;setText('sound',muted?'SES KAPALI':'SES AÇIK');try{localStorage.setItem('auroraTowerMuted',muted);}catch{}};
function press(code){if(code==='KeyP'||code==='Escape'){pause();return;}if(code==='Enter'&&mode!=='playing'){if(mode==='paused')pause();else start();return;}if(mode!=='playing')return;keys.add(code);if(['Space','ArrowUp','KeyW'].includes(code))jumpBuffer=.14;if(code==='ShiftLeft'||code==='ShiftRight')dash();}
addEventListener('keydown',e=>{if(e.target?.closest?.('[data-character], [data-outfit], [data-map], [data-buy]')&&(e.code==='Enter'||e.code==='Space'))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code)&&e.code!=='Tab')e.preventDefault();if(!e.repeat)press(e.code);});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{if(mode==='playing')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();last=0;accumulator=0;});
document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);press(b.dataset.key);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.key);});
function dash(){if(!p.dash||p.ground||rocketTarget!==null)return;p.dash=false;p.dashTime=.15;p.vx=p.face*660;p.vy=Math.max(p.vy,350);shake=3;tone(800,.18,'triangle');burst(p.x,p.y+18,'#82ffeb',15,130);}
function updatePollen(dt){
 if(selected==='ebucehil'&&!p.ground){crumbClock+=dt;while(crumbClock>=.1){crumbClock-=.1;crumbs.push({x:p.x-p.face*9,y:p.y+5,vx:-p.vx*.12+rand(-15,15),vy:rand(-30,-10),life:.85,size:rand(2.5,4.5),angle:rand(0,6)});}}else crumbClock=0;
 for(const a of crumbs){a.life-=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy-=260*dt;a.angle+=dt*3;}crumbs=crumbs.filter(a=>a.life>0).slice(-16);

 if(selected==='melduk'&&!p.ground){pollenClock+=dt;while(pollenClock>=.025){pollenClock-=.025;pollen.push({x:p.x-p.face*10+rand(-4,4),y:p.y+rand(9,25),vx:-p.vx*.15+rand(-20,20),vy:rand(-45,-12),life:rand(.5,.95),size:rand(1.5,4),phase:rand(0,7)});}}else pollenClock=0;
 for(const a of pollen){a.life-=dt;a.x+=a.vx*dt+Math.sin(time*5+a.phase)*dt*8;a.y+=a.vy*dt;a.vy-=25*dt;}
 pollen=pollen.filter(a=>a.life>0).slice(-70);
}
function drawHuman(c,run){
 if(c.pollen){ctx.fillStyle=c.hair;ctx.beginPath();ctx.moveTo(-13,-33);ctx.quadraticCurveTo(-19,-52,0,-49);ctx.quadraticCurveTo(20,-48,16,-25);ctx.lineTo(18+Math.sin(time*9)*3,-12);ctx.lineTo(-15,-13);ctx.fill();}
 round(-10,-23,22,22,6,c.body);
 if(c.poop){ctx.fillStyle='#30323a';ctx.beginPath();ctx.moveTo(-8,-23);ctx.lineTo(0,-16);ctx.lineTo(2,-22);ctx.lineTo(6,-16);ctx.lineTo(11,-23);ctx.fill();round(1,-15,1,12,0,'#41434a');for(let y=-13;y<-3;y+=4)round(1,y,2,2,1,'#acafa7');round(-10,-4,22,3,0,'#44423b');round(-2,-5,6,5,1,'#c6c4ad');round(0,-4,2,3,0,'#22252a');}

 if(c.style==='retro'){ctx.fillStyle=c.pollen?'#77eee1':'#f585be';ctx.beginPath();ctx.moveTo(-9,-22);ctx.lineTo(-2,-10);ctx.lineTo(1,-21);ctx.lineTo(5,-9);ctx.lineTo(11,-22);ctx.fill();round(-9,-6,20,3,1,'#d3a5f9');}
 if(c.style==='stripe'){round(-9,-16,20,3,1,c.pollen?'#775032':'#e9c7a6');round(-9,-9,20,2,1,c.pollen?'#775032':'#e9c7a6');}
 if(c.style==='jacket'){round(-2,-22,3,21,1,'#e6e6d9');round(-9,-15,5,5,1,'#d5dfc6');round(5,-15,5,5,1,'#d5dfc6');}
 if(c.style==='star'){ctx.fillStyle='#f6da91';ctx.beginPath();for(let i=0;i<10;i++){const r=i%2?2:4,angle=i*Math.PI/5-Math.PI/2;const x=2+Math.cos(angle)*r,y=-13+Math.sin(angle)*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();}
round(-10,-5+run*2,9,7,2,c.boots);round(3,-5-run*2,9,7,2,c.boots);
 round(-3,-28,8,9,3,c.head);round(-12,-45,27,24,10,c.head);
 ctx.fillStyle=c.hair;ctx.beginPath();
 if(c.pollen){ctx.moveTo(-13,-28);ctx.quadraticCurveTo(-20,-51,1,-50);ctx.quadraticCurveTo(21,-49,15,-28);ctx.lineTo(10,-39);ctx.lineTo(1,-45);ctx.lineTo(-7,-39);}
 else{ctx.moveTo(-13,-34);ctx.lineTo(-14,-43);ctx.lineTo(-8,-49);ctx.lineTo(-2,-48);ctx.lineTo(4,-52);ctx.lineTo(9,-48);ctx.lineTo(16,-44);ctx.lineTo(15,-35);ctx.lineTo(9,-40);ctx.lineTo(-6,-40);}
 ctx.closePath();ctx.fill();
 if(c.poop){ctx.fillStyle=c.hair;ctx.beginPath();ctx.moveTo(-14,-33);ctx.bezierCurveTo(-23,-51,-10,-61,1,-55);ctx.bezierCurveTo(12,-61,24,-49,16,-33);ctx.lineTo(10,-41);ctx.lineTo(-7,-41);ctx.fill();}
 if(c.style==='retro'){round(-12,-43,26,3,1,c.pollen?'#6cffe4':'#fb79bd');}
 const look=p.face*2;ctx.fillStyle=c.visor;ctx.beginPath();ctx.ellipse(-5+look,-34,1.6,2,0,0,Math.PI*2);ctx.ellipse(6+look,-34,1.6,2,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=c.hair;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-8+look,-38);ctx.lineTo(-3+look,-39);ctx.moveTo(4+look,-39);ctx.lineTo(9+look,-38);ctx.stroke();
 if(!c.pollen&&!c.poop){ctx.fillStyle='#44362eaa';ctx.beginPath();ctx.moveTo(-11,-29);ctx.quadraticCurveTo(1,-17,14,-29);ctx.lineTo(11,-23);ctx.quadraticCurveTo(1,-17,-8,-23);ctx.fill();round(-3,-28,9,2,1,c.hair);}
 ctx.strokeStyle='#ad6d69';ctx.beginPath();ctx.moveTo(-2,-25);ctx.lineTo(5,-25);ctx.stroke();
 round(p.face>0?9:-15,-21,6,12,3,c.body);round(p.face>0?10:-14,-12,5,5,2,c.head);
 if(c.pollen){ctx.strokeStyle='#f2d18c';ctx.lineWidth=1.2;for(const x of [-13,15]){ctx.beginPath();ctx.ellipse(x,-26,2.3,3.6,0,0,Math.PI*2);ctx.stroke();}ctx.strokeStyle='#c7d4cb';ctx.beginPath();ctx.moveTo(-5,-20);ctx.lineTo(1,-15);ctx.lineTo(7,-20);ctx.moveTo(1,-15);ctx.lineTo(4,-7);ctx.stroke();ctx.fillStyle='#f7dc93';ctx.fillRect(1,-12,4,3);}
}
// Update every platform before collision detection. A landing must never stop
// the animation or crumble timer of platforms later in the array.
function updatePlatforms(dt){
 for(const a of platforms){
  a.prevX=a.x;
  if(a.moving)a.x=a.base+Math.sin(time*a.moveSpeed+a.phase)*a.amplitude;
  if(a.crack>0){a.crack=Math.max(0,a.crack-dt);if(a.crack===0){a.broken=true;burst(a.x+a.w/2,a.y,'#ec98ad',18,180);}}
 }
 const support=p.support;
 if(p.ground&&support){
  if(!support.broken&&Math.abs(p.y-support.y)<.1&&p.x+p.w/2>support.prevX&&p.x-p.w/2<support.prevX+support.w){
   p.x=Math.max(p.w/2,Math.min(WORLD-p.w/2,p.x+support.x-support.prevX));
  }else{p.ground=false;p.support=null;}
 }
}
function update(dt){if(mode!=='playing'){if(mode==='menu'){time+=dt;camera=Math.sin(time*.15)*12;}return;}time+=dt;elapsed+=dt;jumpBoost=Math.max(0,jumpBoost-dt);idleTime=p.ground&&Math.abs(p.vx)<10&&!keys.has('KeyA')&&!keys.has('KeyD')&&!keys.has('ArrowLeft')&&!keys.has('ArrowRight')?idleTime+dt:0;spinTime=Math.max(0,spinTime-dt);updatePlatforms(dt);updateSky(dt);rush=Math.max(0,rush-dt);noticeTimer=Math.max(0,noticeTimer-dt);$('notice').style.opacity=noticeTimer>0?1:0;comboTimer=Math.max(0,comboTimer-dt);if(!comboTimer)combo=0;jumpBuffer-=dt;p.coyote-=dt;p.wallLock-=dt;p.land=Math.max(0,p.land-dt*4);p.dashTime=Math.max(0,p.dashTime-dt);let dir=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);if(dir)p.face=dir;
if(p.dashTime<=0&&p.wallLock<=0){if(dir)p.vx+=dir*(p.ground?1650:1080)*dt;else p.vx*=Math.exp(-(p.ground?8:1.3)*dt);p.vx=Math.max(-430,Math.min(430,p.vx));}
p.wall=p.x<=p.w/2+1?-1:p.x>=WORLD-p.w/2-1?1:0;
const held=keys.has('Space')||keys.has('ArrowUp')||keys.has('KeyW');
if(rocketTarget===null&&((jumpBuffer>0&&(p.ground||p.coyote>0||p.wall))||(held&&p.ground))){let wallJump=!p.ground&&p.coyote<=0&&p.wall;p.vy=wallJump?640:560+Math.abs(p.vx)*.62;if(wallJump){p.vx=-p.wall*390;p.face=-p.wall;p.wallLock=.16;spinTime=.6;spinDirection=-p.wall;if(combo>=2&&comboTimer>0){p.vy=640+Math.min(combo,8)*38;burst(p.x,p.y+20,'#8affdc',18,190);setText('comboLabel','DUVAR TAKLASI · GÜÇLÜ SIÇRAYIŞ');}}let under=platforms.find(a=>!a.broken&&Math.abs(a.y-p.y)<2&&p.x>a.x-12&&p.x<a.x+a.w+12);if(under?.type==='boost'){p.vy=Math.max(p.vy,780);burst(p.x,p.y,'#ff79dd',20,170);tone(980,.2,'triangle');}if(under?.type==='spring'){p.vy*=1.3;burst(p.x,p.y,'#f7c16f',22,180);}if(jumpBoost>0)p.vy+=100;p.ground=false;p.support=null;p.coyote=0;jumpBuffer=0;p.land=.3;tone(380+Math.abs(p.vx),.15,'triangle');burst(p.x,p.y,'#9becf7',8,75);}
const wasGround=p.ground,oldSupport=p.support,oldX=p.x;let oldY=p.y;p.x+=p.vx*dt;if(p.x<p.w/2){p.x=p.w/2;p.vx=0;}if(p.x>WORLD-p.w/2){p.x=WORLD-p.w/2;p.vx=0;}
if(rocketTarget!==null)p.vy=Math.max(0,Math.min(950,(rocketTarget-p.y)/Math.max(dt,1/120)));
else p.vy-=(p.dashTime>0?200:GRAV*(p.vy>0&&!held?1.7:1))*dt;if(p.wall&&dir===p.wall&&p.vy< -170)p.vy=-170;p.y+=p.vy*dt;rocketStep(dt);p.ground=false;
p.support=null;
// Test horizontal overlap at the instant the feet cross the platform plane.
// Descending order chooses the upper surface if a fast fall crosses two floors.
for(let i=platforms.length-1;i>=0;i--){const a=platforms[i];
 if(rocketTarget!==null||a.broken||p.vy>0||oldY<a.y-.1||p.y>a.y)continue;
 const fraction=oldY===p.y?1:Math.max(0,Math.min(1,(oldY-a.y)/(oldY-p.y)));
 const crossX=oldX+(p.x-oldX)*fraction,platformX=a.prevX+(a.x-a.prevX)*fraction;
 if(crossX+p.w/2<=platformX||crossX-p.w/2>=platformX+a.w)continue;
 p.y=a.y;p.vy=0;spinTime=0;p.ground=true;p.support=a;p.coyote=.1;p.dash=true;
 if(!wasGround||oldSupport!==a){
  // Carry the remaining movement after contact, not the pre-contact movement.
  p.x=Math.max(p.w/2,Math.min(WORLD-p.w/2,p.x+(a.x-platformX)));
  p.land=1;burst(p.x,p.y,'#94e4ee',8,80);tone(190+a.n*3,.075,'sine',.025);registerLanding(a.n);
  if(a.type==='fragile'&&a.crack===0)a.crack=a.breakDelay;
 }
 break;
}

highest=Math.max(highest,p.y);maxFloor=Math.max(maxFloor,Math.floor(highest/GAP));
while(maxFloor>=milestone+25){milestone+=25;const reward=milestone%100===0?1000:250;score+=reward;announce(milestone%100===0?theme().name.split(' / ')[1]:milestone+'. KAT!', '+'+reward+' puan · '+(milestone%100===0?'Zorluk '+(difficulty().tier+1)+' · Daha dar platformlar, daha hızlı fırtına':'Yükselmeye devam!'));burst(p.x,p.y+40,'#ffe6a3',32,240);tone(950,.25,'triangle');}
setText('goal','SONRAKİ HEDEF: '+(milestone+25)+'. KAT');setText('crystalStatus',rush>0?'KRİSTAL ŞÖLENİ · '+Math.ceil(rush)+' sn · 2× puan + mıknatıs':'KRİSTAL '+(crystals%5)+'/5 · ŞÖLENE DOĞRU');let target=Math.max(0,highest-H/scale*.46);camera+=(target-camera)*(1-Math.exp(-5*dt));hazard=Math.max(hazard+dt*(elapsed<8?15:Math.min(65,27+elapsed*.3)+difficulty().stormBoost),camera-170);generate();platforms=platforms.filter(a=>a.y>camera-550);orbs=orbs.filter(a=>a.y>camera-400);for(let o of orbs){if(o.taken)continue;let distance=Math.hypot(o.x-p.x,o.y-(p.y+18));if(rush>0&&distance<180){o.x+=(p.x-o.x)*Math.min(1,dt*9);o.y+=(p.y+18-o.y)*Math.min(1,dt*9);distance=Math.hypot(o.x-p.x,o.y-(p.y+18));}if(distance<32){o.taken=true;score+=rush>0?50:25;crystals++;earnCrystal();if(crystals%5===0){rush=Math.max(rush,8);announce('KRİSTAL ŞÖLENİ','8 saniye mıknatıs + kristallerden 2× puan!');}tone(1200,.12);burst(o.x,o.y,'#ffe6a3',14,125);}}
tapes=tapes.filter(t=>!t.taken&&t.y>camera-400);for(const tape of tapes)if(Math.hypot(tape.x-p.x,tape.y-p.y-18)<30){tape.taken=true;score+=150;p.dash=true;announce('SIDE A · +150','Kaset bulundu · Havada atılma hazır');tone(1400,.15,'square',.025);burst(tape.x,tape.y,'#ff9fda',18,130);}
rockets=rockets.filter(r=>!r.taken&&r.y>camera-400);for(const r of rockets)if(rocketTarget===null&&Math.hypot(r.x-p.x,r.y-p.y-18)<30){r.taken=true;activateRocket();break;}
updatePollen(dt);
if(Math.abs(p.vx)>200||p.dashTime>0)trails.push({x:p.x,y:p.y+18,life:.22,color:p.dashTime>0?'#79ffe0':'#95beff'});trails.forEach(t=>t.life-=dt);trails=trails.filter(t=>t.life>0);particles.forEach(a=>{a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy-=400*dt;a.life-=dt;});particles=particles.filter(a=>a.life>0);shake*=Math.exp(-12*dt);
if(p.y<hazard-12||p.y<camera-H/scale*.25)die();setText('floor',maxFloor);setText('score',Math.floor(score));$('combo').style.opacity=combo>1&&mode==='playing'?1:0;setText('comboN',combo+'×');setText('dashLabel',jumpBoost>0?'YAYLI AYAKKABI · '+Math.ceil(jumpBoost)+' sn':p.dash?'ATILMA HAZIR':'İNİŞTE YENİLENİR');$('dashMeter').style.width=p.dash?'100%':'0%';setText('zone',theme().name+' · Z'+(difficulty().tier+1));}
function round(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function sy(y){return H-100*scale-(y-camera)*scale;}
function draw(){ctx.setTransform(DPR,0,0,DPR,0,0);const scene=theme();let bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,scene.top);bg.addColorStop(.55,scene.mid);bg.addColorStop(1,scene.bottom);ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
// A slow aurora drifts behind the tower.
for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-100,H*.13+i*35);for(let x=-100;x<=W+100;x+=35)ctx.lineTo(x,H*.16+i*30+Math.sin(x*.004+time*.12+i*.8)*65);ctx.lineTo(W+100,H*.6);ctx.lineTo(-100,H*.6);ctx.closePath();let g=ctx.createLinearGradient(0,H*.08,0,H*.6);g.addColorStop(0,['#4bdec012','#6ec9ff12','#a782f00d','#53efcf0b'][i]);g.addColorStop(1,'#00000000');ctx.fillStyle=g;ctx.fill();}
for(let i=0;i<100;i++){let x=((Math.sin(i*127.1)*.5+.5)*W),y=((i*137.7+camera*.09*scale)%(H+30));ctx.globalAlpha=.2+.4*(.5+.5*Math.sin(time+i));ctx.fillStyle='#d8f6ff';ctx.fillRect(x,y,i%9===0?2:1,i%9===0?2:1);}ctx.globalAlpha=1;
let moonX=W*.79,moonY=H*.22;let glow=ctx.createRadialGradient(moonX,moonY,5,moonX,moonY,110);glow.addColorStop(0,'#a4f1ec22');glow.addColorStop(1,'#a4f1ec00');ctx.fillStyle=glow;ctx.fillRect(moonX-110,moonY-110,220,220);ctx.fillStyle=scene.orb;ctx.beginPath();ctx.arc(moonX,moonY,29,0,Math.PI*2);ctx.fill();
for(let layer=0;layer<3;layer++){ctx.fillStyle=scene.mountains[layer];ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W+70;x+=70)ctx.lineTo(x,H*(.63+layer*.09)-Math.sin(x*.011+layer*3)*50-Math.cos(x*.026)*25+Math.sin(camera*.0005)*20);ctx.lineTo(W,H);ctx.fill();}
if(maxFloor>=100&&maxFloor<200){ctx.fillStyle='#ffe8d518';for(let i=0;i<5;i++){let cx=((i*331+time*9)%(W+260))-130;ctx.beginPath();ctx.ellipse(cx,H*(.3+i*.09),120,16,0,0,Math.PI*2);ctx.fill();}}
drawEnvironment();
if(maxFloor>=200&&(maxFloor<300||maxFloor>=600))drawMeteors();
ctx.save();ctx.translate(ox+(Math.random()-.5)*shake,0);ctx.scale(scale,scale);const h=H/scale,Y=y=>H/scale-100-y+camera;
let interior=ctx.createLinearGradient(0,0,WORLD,0);interior.addColorStop(0,scene.wall);interior.addColorStop(.5,scene.center);interior.addColorStop(1,scene.wall);ctx.fillStyle=interior;ctx.fillRect(0,0,WORLD,h);
for(let y=Math.floor(camera/130)*130-200;y<camera+h+150;y+=130){let yy=Y(y);ctx.strokeStyle='#91bbd90a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(WORLD,yy);ctx.stroke();for(let x=0;x<WORLD;x+=90){let xx=x+(Math.round(y/130)%2)*45;ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx,yy-130);ctx.stroke();}for(let x of [70,WORLD-95]){round(x,yy-92,25,48,12,'#081425');round(x+6,yy-84,13,30,7,'#4dbac410');}}
round(-19,0,19,h,0,'#182e43');round(WORLD,0,19,h,0,'#182e43');ctx.fillStyle=scene.edge;ctx.fillRect(-2,0,2,h);ctx.fillRect(WORLD,0,2,h);
for(let a of platforms){if(a.broken)continue;let y=Y(a.y);if(y< -40||y>h+30)continue;let color=a.type==='boost'?'#ff75d4':a.type==='spring'?'#f8cb7b':a.type==='fragile'?'#ed98b2':a.moving?'#a19cfa':'#6bdccb';ctx.shadowBlur=12;ctx.shadowColor=color+'44';round(a.x,y,a.w,13,5,'#243d52');round(a.x,y,a.w,3,3,color);ctx.shadowBlur=0;round(a.x+7,y+13,a.w-14,5,2,'#091527');ctx.fillStyle='#99bac84a';ctx.fillRect(a.x+10,y+6,3,3);ctx.fillRect(a.x+a.w-13,y+6,3,3);if(a.n%5===0){ctx.font='10px Segoe UI';ctx.textAlign='center';ctx.fillStyle='#94b7cb';ctx.fillText(String(a.n).padStart(2,'0'),a.x+a.w/2,y+27);}if(a.type==='boost'){ctx.fillStyle='#ffb4e9';ctx.font='bold 10px Segoe UI';ctx.textAlign='center';ctx.fillText('↑ ↑ ↑',a.x+a.w/2,y-7);}if(a.type==='spring'){ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(a.x+a.w/2-12,y-6);ctx.lineTo(a.x+a.w/2,y-12);ctx.lineTo(a.x+a.w/2+12,y-6);ctx.stroke();}if(a.crack>0){ctx.strokeStyle='#ffb0c2';ctx.beginPath();ctx.moveTo(a.x+a.w*.4,y);ctx.lineTo(a.x+a.w*.45,y+8);ctx.lineTo(a.x+a.w*.6,y+12);ctx.stroke();}}
for(let o of orbs){if(o.taken)continue;let y=Y(o.y)+Math.sin(time*3+o.x)*4;if(y< -30||y>h)continue;ctx.save();ctx.translate(o.x,y);ctx.rotate(time*.8);ctx.shadowColor='#fbd87d';ctx.shadowBlur=15;round(-5,-5,10,10,2,'#ffe6a3');ctx.restore();}
for(const tape of tapes){if(tape.taken)continue;const ty=Y(tape.y)+Math.sin(time*3)*3;if(ty< -30||ty>h+30)continue;ctx.save();ctx.translate(tape.x,ty);ctx.rotate(Math.sin(time*2)*.12);round(-13,-8,26,16,3,'#ff93cd');round(-10,-5,20,8,2,'#3b2352');round(-7,-3,4,4,2,'#fff1c9');round(3,-3,4,4,2,'#fff1c9');round(-6,4,12,3,1,'#f8d7b8');ctx.restore();}
for(const r of rockets){if(r.taken)continue;const ry=Y(r.y)+Math.sin(time*3)*4;if(ry< -35||ry>h+35)continue;ctx.save();ctx.translate(r.x,ry);ctx.rotate(.2*Math.sin(time*2));ctx.strokeStyle='#ffcf7955';ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.stroke();round(-7,-13,14,25,7,'#f2e8d5');ctx.fillStyle='#f58265';ctx.beginPath();ctx.moveTo(-7,1);ctx.lineTo(-14,14);ctx.lineTo(-6,10);ctx.moveTo(7,1);ctx.lineTo(14,14);ctx.lineTo(6,10);ctx.fill();round(-3,-5,6,6,3,'#78cbef');ctx.fillStyle='#ffce72';ctx.beginPath();ctx.moveTo(-4,12);ctx.lineTo(0,22+Math.sin(time*15)*3);ctx.lineTo(4,12);ctx.fill();ctx.restore();}
for(let t of trails){ctx.globalAlpha=t.life/.22*.25;round(t.x-12,Y(t.y)-17,24,34,8,t.color);}ctx.globalAlpha=1;
for(const a of crumbs){ctx.save();ctx.globalAlpha=Math.min(1,a.life*3);ctx.translate(a.x,Y(a.y));ctx.rotate(a.angle);round(-a.size,a.size*.1,a.size*2,a.size,2,'#714528');round(-a.size*.7,-a.size*.5,a.size*1.4,a.size,2,'#8d5730');round(-a.size*.3,-a.size,a.size*.8,a.size*.8,2,'#a56c3d');ctx.restore();}
for(const a of pollen){ctx.save();ctx.globalAlpha=Math.min(1,a.life*2);ctx.translate(a.x,Y(a.y));ctx.rotate(a.phase+time);ctx.shadowColor='#ffc34d';ctx.shadowBlur=7;ctx.fillStyle='#f6ba43';ctx.beginPath();for(let i=0;i<6;i++){let angle=i*Math.PI/3;let x=Math.cos(angle)*a.size,y=Math.sin(angle)*a.size;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.fillStyle='#fff1b8';ctx.fillRect(-a.size*.35,-a.size*.45,1.5,1.5);ctx.restore();}
// The little climber: scarf, backpack, illuminated visor and animated feet.
const skin=currentSkin(),dance=dancing(),beat=time*7;let py=Y(p.y)-(dance?Math.abs(Math.sin(beat))*3:0),run=Math.sin(time*20)*Math.min(1,Math.abs(p.vx)/200)*(p.ground?1:0);ctx.save();ctx.translate(p.x+(dance?Math.sin(beat)*3:0),py-20);ctx.rotate(dance?Math.sin(beat)*.15:spinTime>0?spinDirection*(1-spinTime/.6)*Math.PI*2:p.vx*.0001);ctx.translate(0,20);let squash=p.land*.14;ctx.scale(1+squash,1-squash);if(skin.kind==='human'){drawHuman(skin,run);}else{ctx.fillStyle=skin.accent;ctx.beginPath();ctx.moveTo(-p.face*4,-27);ctx.lineTo(-p.face*(25+Math.abs(p.vx)*.045),-23+Math.sin(time*15)*4);ctx.lineTo(-p.face*20,-16);ctx.lineTo(-p.face*3,-20);ctx.fill();round(-15,-26,11,20,4,'#2f5b73');round(-10,-26,22,22,6,skin.body);round(-11,-39,25,20,skin.kind==='robot'?3:8,skin.head);
if(skin.kind==='cat'||skin.kind==='fox'){ctx.fillStyle=skin.head;ctx.beginPath();ctx.moveTo(-11,-31);ctx.lineTo(-12,-48);ctx.lineTo(-2,-39);ctx.moveTo(5,-39);ctx.lineTo(14,-48);ctx.lineTo(14,-31);ctx.fill();}else if(skin.kind==='robot'){round(0,-47,3,9,1,skin.accent);round(-2,-50,7,5,2,skin.visor);}
round(p.face>0?-2:-10,-35,15,10,4,'#153c53');round(p.face>0?1:-8,-33,10,3,2,skin.visor);round(-10,-7+run*2,9,8,3,skin.boots);round(3,-7-run*2,9,8,3,skin.boots);round(p.face>0?8:-14,-24,7,13,3,skin.body);}if(dance){ctx.strokeStyle=skin.body;ctx.lineWidth=6;ctx.lineCap='round';const side=Math.sin(beat*.5)>0?1:-1;ctx.beginPath();ctx.moveTo(side*11,-21);ctx.lineTo(side*18,-33);ctx.lineTo(side*23,-45);ctx.moveTo(-side*10,-21);ctx.lineTo(-side*19,-12);ctx.lineTo(-side*11,-7);ctx.stroke();round(side*23-2,-49,5,6,2,skin.head);ctx.lineCap='butt';ctx.fillStyle='#ffd188';ctx.font='12px Segoe UI';ctx.fillText('♪',-26,-48+Math.sin(beat)*3);}
if(rush>0){ctx.strokeStyle='#ffe6a388';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,-20,31+Math.sin(time*5)*3,0,Math.PI*2);ctx.stroke();}ctx.restore();
for(let a of particles){ctx.globalAlpha=Math.max(0,a.life/a.max);round(a.x,Y(a.y),a.size,a.size,2,a.color);}ctx.globalAlpha=1;
let hy=Y(hazard);if(hy<h+100){let storm=ctx.createLinearGradient(0,hy-35,0,hy+160);storm.addColorStop(0,'#f65b9400');storm.addColorStop(.25,'#fc66854f');storm.addColorStop(1,'#711e50ee');ctx.fillStyle=storm;ctx.fillRect(0,hy-35,WORLD,h-hy+60);ctx.strokeStyle='#ff8bae';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<=WORLD;x+=8){let y=hy+Math.sin(x*.04+time*3)*5;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();ctx.font='10px Segoe UI';ctx.fillStyle='#ffb9c9';ctx.textAlign='center';ctx.fillText('F I R T I N A',WORLD/2,hy+30);}
ctx.restore();let vignette=ctx.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,Math.max(W,H)*.75);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#03071388');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);}
reset();function advanceFrame(dt){
 if(mode!=='playing'){accumulator=0;update(Math.min(dt,.1));return;}
 accumulator+=Math.max(0,Math.min(dt,.1));
 while(accumulator+1e-10>=STEP&&mode==='playing'){accumulator=Math.max(0,accumulator-STEP);update(STEP);}
 if(mode!=='playing')accumulator=0;
}
function frame(now){const dt=last?Math.max(0,(now-last)/1000):0;last=now;advanceFrame(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
