// Прелоадер — скрыть после загрузки всех ресурсов
(function(){
  document.documentElement.classList.remove('no-js');
  
  let loaded = false;
  const hidePreloader = () => {
    if (loaded) return;
    loaded = true;
    const prel = document.getElementById('preloader');
    if (prel) {
      prel.classList.add('hide');
      setTimeout(() => prel.remove(), 700);
    }
  };

  // Скрыть после загрузки всех ресурсов
  window.addEventListener('load', () => {
    setTimeout(hidePreloader, 600); // Дать анимации прогресса завершиться
  });

  // Резервный вариант: скрыть через 3 секунды даже если что-то не загрузилось
  setTimeout(hidePreloader, 3000);
})();



(function(){
"use strict";
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt=n=>Math.round(n).toLocaleString('ru-RU');

/* год и дата в смете */
$('#billDate').textContent=new Date().toLocaleDateString('ru-RU');
$('#billNo').textContent=Math.floor(1000+Math.random()*9000);

/* появление хиро */
requestAnimationFrame(()=>setTimeout(()=>document.body.classList.add('loaded'),80));

/* шапка */
const hdr=$('#hdr');
addEventListener('scroll',()=>hdr.classList.toggle('sc',scrollY>24),{passive:true});

/* мобильное меню */
const mnav=$('#mnav');
$('#burger').onclick=()=>{mnav.classList.add('open');document.body.style.overflow='hidden'};
const closeM=()=>{mnav.classList.remove('open');document.body.style.overflow=''};
$('#mclose').onclick=closeM;
$$('.mnav a').forEach(a=>a.onclick=closeM);

/* рулетка */
const ruler=$('#ruler');let rh='';
for(let i=0;i<60;i++)rh+=`<span>${i*10}</span>`;
ruler.innerHTML=rh;

/* бегущая строка — дублируем контент */
const mq=$('#marq');mq.innerHTML+=mq.innerHTML;

/* reveal + счётчики + скрэмбл */
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;
  const el=e.target;
  el.classList.add('in');
  if(el.hasAttribute('data-sc')&&!reduced)scramble(el);
  io.unobserve(el);
}),{threshold:.18});
$$('[data-rv],[data-sc]').forEach(el=>io.observe(el));

$$('[data-count]').forEach(el=>{
  const t=+el.dataset.count;
  new IntersectionObserver((es,obs)=>es.forEach(e=>{
    if(!e.isIntersecting)return;obs.disconnect();
    if(reduced){el.textContent=t;return}
    const st=performance.now(),dur=1400;
    (function f(n){const p=Math.min(1,(n-st)/dur),ea=1-Math.pow(1-p,3);
      el.textContent=Math.round(t*ea);if(p<1)requestAnimationFrame(f)})(st);
  }),{threshold:.6}).observe(el);
});

function scramble(el){
  const txt=el.textContent,chars='АВЕЖКМРСТУХ0123456789/#·';
  let frame=0;const total=txt.length*3+8;
  (function tick(){
    let out='';
    for(let i=0;i<txt.length;i++){
      out+=i<(frame/3)?txt[i]:(txt[i]===' '?' ':chars[Math.random()*chars.length|0]);
    }
    el.textContent=out;
    if(frame++<total)requestAnimationFrame(tick);else el.textContent=txt;
  })();
}

/* живой счётчик бригад */
const live=$('#live');
setInterval(()=>{
  const v=20+Math.floor(Math.random()*8);
  live.textContent=v;
  if(!reduced){live.classList.add('pop');setTimeout(()=>live.classList.remove('pop'),320)}
},11000);

/* таймер на «смете» */
const cd=$('#cd'),end=Date.now()+24*3600*1000;
setInterval(()=>{
  let s=Math.max(0,Math.floor((end-Date.now())/1000));
  const h=String(Math.floor(s/3600)).padStart(2,'0'),m=String(Math.floor(s%3600/60)).padStart(2,'0'),ss=String(s%60).padStart(2,'0');
  cd.textContent=`${h}:${m}:${ss}`;
},1000);

/* было/стало */
const ba=$('#ba'),baRange=$('#baRange'),baPct=$('#baPct');
baRange.addEventListener('input',()=>{
  ba.style.setProperty('--pos',baRange.value+'%');
  baPct.textContent=baRange.value+'%';
});

/* ======= КАЛЬКУЛЯТОР ======= */
const rates={cos:5500,cap:9800,des:15500}, dRate={cos:.9,cap:1.6,des:2.1};
const names={cos:'косметический',cap:'капитальный',des:'дизайнерский'};
const state={obj:1,objName:'квартира',kind:'cos',area:68,dem:false,proj:false,mat:false};
const optPrice={dem:1200,proj:1100,mat:4300};
let shown=0,raf=null;

function tween(target){
  if(reduced){$('#bTotal').textContent=fmt(target)+' ₽';shown=target;return}
  cancelAnimationFrame(raf);
  const from=shown,st=performance.now(),dur=450;
  (function f(n){const p=Math.min(1,(n-st)/dur),ea=1-Math.pow(1-p,3);
    shown=from+(target-from)*ea;
    $('#bTotal').textContent=fmt(shown)+' ₽';
    if(p<1)raf=requestAnimationFrame(f)})(st);
}
function calc(){
  const rate=rates[state.kind]*state.obj;
  const work=rate*state.area;
  const dem=state.dem?optPrice.dem*state.obj*state.area:0;
  const proj=state.proj?optPrice.proj*state.obj*state.area:0;
  const mat=state.mat?optPrice.mat*state.obj*state.area:0;
  $('#bWork').textContent=fmt(work)+' ₽';
  [['#bDem',dem],['#bProj',proj],['#bMat',mat]].forEach(([id,v])=>{
    const el=$(id);el.textContent=v?fmt(v)+' ₽':'—';el.classList.toggle('off',!v);
  });
  const total=work+dem+proj+mat;
  tween(total);
  $('#bPer').textContent=fmt(total/state.area)+' ₽/м²';
  const days=Math.round((state.area*dRate[state.kind]+18)*state.obj/5)*5;
  $('#bDays').textContent='≈ '+days+' дней';
  return {total,days};
}
$('#segObj').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  $$('#segObj button').forEach(x=>x.classList.remove('on'));b.classList.add('on');
  state.obj=+b.dataset.m;state.objName=b.textContent.trim().toLowerCase();calc();
});
$('#rt').addEventListener('change',e=>{
  state.kind=e.target.value;
  $$('#rt label').forEach(l=>l.classList.toggle('on',l.querySelector('input').checked));
  calc();
});
$('#area').addEventListener('input',e=>{
  state.area=+e.target.value;$('#areaOut').textContent=state.area;calc();
});
[['#optDem','dem'],['#optProj','proj'],['#optMat','mat']].forEach(([id,k])=>{
  $(id).addEventListener('change',e=>{state[k]=e.target.checked;calc()});
});
$('#fixBtn').addEventListener('click',()=>{
  const r=calc();
  $('#msg').value=`Хочу зафиксировать цену: ${names[state.kind]} ремонт, ${state.objName}, ${state.area} м², ≈ ${fmt(r.total)} ₽, срок ≈ ${r.days} дней.`;
  location.hash='#contact';
});
calc();

/* этапы — активный шаг */
const steps=$$('.step'),pIdx=$('#pIdx'),pFill=$('#pFill');
const stepIO=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;
  const i=steps.indexOf(e.target);
  steps.forEach((s,j)=>s.classList.toggle('on',j<=i));
  pIdx.textContent=String(i+1).padStart(2,'0');
  pFill.style.width=((i+1)/steps.length*100)+'%';
}),{rootMargin:'-42% 0px -42%'});
steps.forEach(s=>stepIO.observe(s));

/* отзывы */
const track=$('#revTrack');
$('#revL').onclick=()=>track.scrollBy({left:-396,behavior:reduced?'auto':'smooth'});
$('#revR').onclick=()=>track.scrollBy({left:396,behavior:reduced?'auto':'smooth'});

/* FAQ */
$$('.fq').forEach(f=>{
  const q=$('.fq-q',f),a=$('.fq-a',f);
  q.onclick=()=>{
    const open=f.classList.contains('open');
    $$('.fq.open').forEach(o=>{o.classList.remove('open');$('.fq-a',o).style.maxHeight=0});
    if(!open){f.classList.add('open');a.style.maxHeight=a.scrollHeight+'px'}
  };
});

/* шпион навигации */
const spy=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;
  $$('nav.main a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id));
}),{rootMargin:'-30% 0px -60%'});
['services','calc','works','prices','contact'].forEach(id=>{const s=document.getElementById(id);if(s)spy.observe(s)});

/* форма */
$('#lead').addEventListener('submit',e=>{
  e.preventDefault();
  let ok=true;
  const name=$('#name'),phone=$('#phone');
  const fN=$('#fName'),fP=$('#fPhone');
  fN.classList.remove('err');fP.classList.remove('err');
  if(name.value.trim().length<2){fN.classList.add('err');ok=false}
  if((phone.value.replace(/\D/g,'')).length<10){fP.classList.add('err');ok=false}
  if(!$('#agree').checked){ok=false;alert('Подтвердите согласие на обработку данных')}
  if(!ok)return;
  $('#lead').style.display='none';
  $('#okNum').textContent='Заявка № '+Math.floor(1000+Math.random()*9000)+' · '+name.value.trim();
  $('#formOk').classList.add('show');
});
})();