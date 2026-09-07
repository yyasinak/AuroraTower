const fs=require('fs'),vm=require('vm'),assert=require('assert');
const els={};const noop=()=>{};const gradient={addColorStop:noop};
const context=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(t,k)=>t[k]||noop,set:(t,k,v)=>(t[k]=v,true)});
function el(id){if(els[id])return els[id];const classes=new Set();return els[id]={textContent:'',innerHTML:'',style:{},classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),toggle:(name,on)=>on?classes.add(name):classes.delete(name),contains:name=>classes.has(name)},getContext:()=>context};}
const sandbox={console,innerWidth:1280,innerHeight:800,devicePixelRatio:1,document:{getElementById:el,querySelectorAll:()=>[],addEventListener:noop},localStorage:{getItem:()=>null,setItem:noop},addEventListener:noop,requestAnimationFrame:noop,Math};
sandbox.window=sandbox;vm.createContext(sandbox);
const source=fs.readFileSync('game.js','utf8').replace('reset();function advanceFrame(dt)', 'globalThis.test={start,update,advanceFrame,draw,press,pause,reset,dash,selectCharacter,chooseOutfit,currentSkin,activateRocket,theme,difficulty,registerLanding,die,release:code=>keys.delete(code),state:()=>({p,rocketTarget,spinTime,wardrobe,time,mode,platforms,highest,score,pollen,combo,comboTimer,bestCombo,lastFloor,meteors,skyTime,best,newRecord,hazard,selected,milestone,crystals,rush,orbs})};reset();function advanceFrame(dt)');
vm.runInContext(source,sandbox);const t=sandbox.test;
t.start();t.draw();assert.equal(t.state().mode,'playing');
t.press('Space');for(let i=0;i<20;i++)t.update(1/120);assert(t.state().p.y>50,'Jump must gain height');
t.dash();assert.equal(t.state().p.dash,false);assert(t.state().p.vx>500);
t.pause();let y=t.state().p.y;t.update(.1);assert.equal(t.state().p.y,y);t.pause();
let s=t.state();s.p.x=s.platforms[1].x+s.platforms[1].w/2;s.p.y=90;s.p.vy=-150;s.p.dashTime=0;
for(let i=0;i<6;i++)t.update(1/120);assert.equal(t.state().p.y,86);assert(t.state().p.ground);assert(t.state().p.dash);assert(t.state().score>0);
t.draw();t.state().p.y=-1000;t.update(1/60);assert.equal(t.state().mode,'over');t.start();assert.equal(t.state().score,0);assert.equal(t.state().p.y,0);
for(let i=0;i<2000;i++){t.update(1/120);t.draw();}assert.equal(t.state().mode,'over');
console.log('PASS: render calls, jump, dash, pause/resume, landing, score, dash reset, death, restart, idle storm.');
t.selectCharacter('pixel');assert.equal(t.state().selected,'pixel');t.start();t.draw();t.selectCharacter('ember');assert.equal(t.state().selected,'pixel','Character cannot change during a run');
// Isolate the starting platform so a held key must cause repeated real landings.
t.state().platforms.splice(1);t.press('Space');let jumps=0,wasRising=false;
for(let i=0;i<300;i++){t.state().platforms.splice(1);t.update(1/120);const rising=t.state().p.vy>0;if(rising&&!wasRising)jumps++;wasRising=rising;}
assert(jumps>=3,'Holding jump must bounce on successive landings');t.release('Space');
for(let i=0;i<130;i++){t.state().platforms.splice(1);t.update(1/120);}assert(t.state().p.ground,'Releasing jump must stop auto bounce');
t.start();s=t.state();s.p.y=100*86;s.p.vy=0;t.update(1/120);assert.equal(t.state().milestone,75);s.p.y=100*86+20;t.update(1/120);assert.equal(t.state().milestone,100);assert(t.theme().name.includes('ŞAFAK'));assert.equal(t.state().score,1750);t.draw();
let reward=t.state().score;t.update(1/120);assert.equal(t.state().score,reward,'Milestone rewards cannot repeat');
s.p.y=200*86+20;t.update(1/120);assert(t.theme().name.includes('YILDIZ'));t.draw();
t.start();for(let i=0;i<5;i++){s=t.state();s.orbs.push({x:s.p.x,y:s.p.y+18,taken:false});t.update(1/120);}assert.equal(t.state().crystals,5);assert(t.state().rush>7);assert.equal(t.state().score,125);
s=t.state();s.orbs.push({x:s.p.x,y:s.p.y+18,taken:false});t.update(1/120);assert.equal(t.state().score,175,'Rush doubles crystal score');
s=t.state();s.orbs.push({x:s.p.x+100,y:s.p.y+18,taken:false});let orb=s.orbs[s.orbs.length-1];t.update(1/120);assert(orb.x<s.p.x+100,'Rush attracts nearby crystals');
t.pause();let rush=t.state().rush;t.update(1);assert.equal(t.state().rush,rush);t.pause();t.start();assert.equal(t.state().crystals,0);assert.equal(t.state().milestone,0);assert.equal(t.state().rush,0);
console.log('PASS: character selection, held jump repeats, release stops, 100/200 themes, milestone rewards, crystal rush, magnet, bonus pause/reset.');
// Same/older landings break a chain and must never award repeat points.
t.start();t.registerLanding(1);t.registerLanding(2);assert.equal(t.state().combo,2);let earned=t.state().score;t.registerLanding(2);assert.equal(t.state().combo,0);assert.equal(t.state().comboTimer,0);assert.equal(t.state().score,earned);
t.registerLanding(1);assert.equal(t.state().score,earned);t.registerLanding(3);assert.equal(t.state().combo,1);t.registerLanding(4);assert.equal(t.state().combo,2);
// A sub-pixel final fall must still register the landing and break the chain.
s=t.state();let platform=s.platforms.find(a=>a.n===4);s.p.x=platform.x+platform.w/2;s.p.y=platform.y+.1;s.p.vy=-10;s.p.ground=false;t.update(1/120);assert.equal(t.state().combo,0);assert.equal(els.combo.style.opacity,0);
t.start();t.state().platforms.splice(1);t.press('Space');for(let i=0;i<250;i++){t.state().platforms.splice(1);t.update(1/120);}assert.equal(t.state().combo,0);assert.equal(t.state().score,0,'Stationary bouncing cannot farm score');
t.start();t.registerLanding(1);t.registerLanding(2);for(let i=0;i<450;i++)t.update(1/120);assert.equal(t.state().combo,0,'Chain expires without progress');
t.start();for(let i=1;i<20;i++)t.registerLanding(i);assert.equal(t.state().combo,8);assert.equal(t.state().bestCombo,8,'Displayed and awarded multiplier have the same cap');
let finalScore=t.state().score;t.die();assert(els.overlay.classList.contains('results-mode'));assert(!els.results.classList.contains('hidden'));assert.equal(els.resultScore.textContent,finalScore.toLocaleString('tr-TR'));assert.equal(els.resultCombo.textContent,'8×');assert.equal(els.resultBest.textContent,t.state().best.toLocaleString('tr-TR'));assert(t.state().newRecord);assert.equal(els.title.textContent,'REKOR.');
t.die();assert(t.state().newRecord,'Duplicate death cannot overwrite record status');t.start();assert(!els.overlay.classList.contains('results-mode'));assert.equal(t.state().bestCombo,0);t.pause();assert(els.results.classList.contains('hidden'));t.pause();t.die();assert.equal(els.title.textContent,'TUR BİTTİ.');assert.equal(els.resultCombo.textContent,'—');
t.start();s=t.state();s.p.y=200*86+20;t.update(1/120);for(let i=0;i<400;i++){t.state().p.y=200*86+20;t.state().p.vy=0;t.update(1/120);t.draw();}assert(t.state().meteors.length>0);assert(t.state().meteors.length<30,'Meteor pool stays bounded');let sky=t.state().skyTime;t.pause();t.update(1);assert.equal(t.state().skyTime,sky);t.start();assert.equal(t.state().meteors.length,0);
console.log('PASS: stationary/revisited/short-fall combo regression, expiry, multiplier cap, result stats, record handling, results/pause/restart, meteor lifetime.');
const names=['GECE','ŞAFAK','YILDIZ','BUZUL','KÜL','ZÜMRÜT','KOZMİK'];
for(let tier=0;tier<=6;tier++){
 t.start();s=t.state();s.p.y=tier*8600+.1;s.p.vy=0;t.update(0);assert(t.theme().name.includes(names[tier]));t.draw();
 if(tier){s.p.y=tier*8600-.1;t.start();t.state().p.y=s.p.y;t.update(0);assert(t.theme().name.includes(names[tier-1]),'Theme must not change before boundary');}
 const d=t.difficulty(tier*100);assert.equal(d.tier,tier);if(tier){let prior=t.difficulty((tier-1)*100);assert(d.minWidth<prior.minWidth);assert(d.moveSpeed>prior.moveSpeed);assert(d.stormBoost>prior.stormBoost);assert(d.breakDelay<prior.breakDelay);}
}
t.start();t.state().p.y=620*86;t.update(0);
for(const a of t.state().platforms){const d=t.difficulty(a.n);if(a.n===0)continue;assert(a.w>=d.minWidth);assert(a.w<=d.safeWidth);if(a.moving){assert(a.base-a.amplitude>=0);assert(a.base+a.amplitude+a.w<=540);}if(a.n%10===0){assert(!a.moving);assert.equal(a.type,'normal');assert.equal(a.w,d.safeWidth);}}
assert(t.difficulty(700).stormBoost>t.difficulty(600).stormBoost);assert(t.difficulty(10000).minWidth>=95);assert(t.difficulty(10000).breakDelay>=.4);
t.start();assert(t.theme().name.includes('GECE'));assert.equal(t.difficulty().tier,0);
console.log('PASS: all seven environments, exact century boundaries, increasing difficulty, bounded platform motion, safe rest platforms, late-game limits, reset.');
t.die();t.selectCharacter('melduk');assert.equal(t.state().selected,'melduk');assert(els.characters.innerHTML.includes('melduk'));assert(els.characters.innerHTML.includes('white'));t.start();t.draw();t.press('Space');for(let i=0;i<30;i++)t.update(1/120);assert(t.state().pollen.length>0);assert(t.state().pollen.length<=70);t.draw();let pollenLife=t.state().pollen[0].life;t.pause();t.update(.5);assert.equal(t.state().pollen[0].life,pollenLife);t.pause();t.start();assert.equal(t.state().pollen.length,0);for(let i=0;i<20;i++)t.update(1/120);assert.equal(t.state().pollen.length,0,'Standing still emits no pollen');t.die();t.selectCharacter('white');assert.equal(t.state().selected,'white');t.start();t.draw();t.press('Space');for(let i=0;i<30;i++)t.update(1/120);assert.equal(t.state().pollen.length,0,'Pollen belongs only to melduk');t.draw();
console.log('PASS: melduk/white selection and drawing, airborne pollen, pause, reset, stationary and white exclusions.');
// Platforms after a grounded player's surface must still move and crumble.
t.start();s=t.state();let later=s.platforms[2];later.moving=true;later.base=200;later.phase=0;later.x=200;later.amplitude=30;later.moveSpeed=2;
let crumble=s.platforms[3];crumble.crack=.01;let before=later.x;t.update(1/120);assert.notEqual(later.x,before);t.update(1/120);assert(crumble.broken,'A lower collision cannot stop an upper crumble timer');
// Ride a complete oscillation without accumulating relative drift or combo.
t.start();s=t.state();const ride=s.platforms[0];Object.assign(ride,{x:190,prevX:190,base:190,w:160,moving:true,phase:0,amplitude:40,moveSpeed:2});s.p.x=270;
for(let i=0;i<480;i++){t.update(1/120);assert(t.state().p.ground);assert(Math.abs(t.state().p.x-ride.x-80)<1e-7);assert.equal(t.state().combo,0);}
before=ride.x;t.pause();const frozenTime=t.state().time;t.advanceFrame(.1);assert.equal(ride.x,before);assert.equal(t.state().time,frozenTime);t.pause();t.update(1/120);assert(Math.abs(ride.x-before)<1,'Resume must not teleport a platform');
t.press('Space');t.update(1/120);assert(!t.state().p.ground);assert.equal(t.state().p.support,null,'Jump must release the moving support');
function simulate(fps){t.start();for(const a of t.state().platforms)if(a.n>0)Object.assign(a,{x:0,base:0,prevX:0,w:1,moving:false});t.press('Space');for(let i=0;i<fps/2;i++)t.advanceFrame(1/fps);return {y:t.state().p.y,vy:t.state().p.vy,time:t.state().time};}
const at30=simulate(30),at60=simulate(60),at144=simulate(144);assert(Math.abs(at30.y-at60.y)<1e-7);assert(Math.abs(at60.y-at144.y)<1e-7);assert(Math.abs(at30.time-.5)<1e-7);
t.start();t.advanceFrame(5);assert(t.state().time<=.10001,'Long stalls have bounded catch-up work');
console.log('PASS: all-platform updates, crumble independence, moving support drift, pause/resume, takeoff, 30/60/144 FPS parity, bounded stall recovery.');
function wallLeap(withCombo){t.start();if(withCombo){t.registerLanding(1);t.registerLanding(2);}Object.assign(t.state().p,{x:12,y:100,ground:false,support:null,coyote:0,vy:0});t.press('Space');t.update(1/120);t.draw();assert(t.state().spinTime>0);assert(t.state().p.vx>0);return t.state().p.vy;}
assert(wallLeap(true)>wallLeap(false)+70,'Active combo boosts a wall leap');
t.start();t.activateRocket();const rocketEnd=t.state().rocketTarget;assert.equal(rocketEnd,860);let steps=0;while(t.state().rocketTarget!==null&&steps++<200)t.update(1/120);assert(steps<200);assert(Math.abs(t.state().p.y-rocketEnd)<.01);assert(t.state().p.dash);assert(t.state().highest>=860);t.draw();
t.start();t.activateRocket();const savedTarget=t.state().rocketTarget;t.pause();t.update(.5);assert.equal(t.state().rocketTarget,savedTarget);t.pause();t.start();assert.equal(t.state().rocketTarget,null);assert.equal(t.state().spinTime,0);
for(const id of ['melduk','white']){t.die();t.selectCharacter(id);const colors=new Set();for(let i=0;i<4;i++){t.chooseOutfit(i);colors.add(t.currentSkin().body);t.draw();}assert.equal(colors.size,4);t.start();assert.equal(t.state().wardrobe[id],3);t.chooseOutfit(0);assert.equal(t.state().wardrobe[id],3,'No outfit mutation mid-run');t.draw();}
console.log('PASS: combo wall boost and flip, ten-floor rocket endpoint, rocket pause/reset, four outfits per human, outfit persistence across runs.');
