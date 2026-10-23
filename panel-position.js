// The launcher position is shared by eproc and Notebook tabs in this browser profile.
globalThis.easyNotebookPositionPanel=function(root,session=globalThis.easyNotebookSession()){
  const anchor=root.querySelector('aside'),button=root.getElementById('toggle'),panel=root.querySelector('section');
  const key='launcherPosition',margin=12;
  let position=null,gesture=null,suppressClick=false,changedLocally=false,docked=false;
  const clamp=(value,min,max)=>Math.max(min,Math.min(value,Math.max(min,max)));
  function bounds(){const rect=button.getBoundingClientRect();return {width:rect.width,height:rect.height,maxX:Math.max(margin,innerWidth-rect.width-margin),maxY:Math.max(margin,innerHeight-rect.height-margin)};}
  function layout(){
    const b=bounds();
    const x=position?margin+position.x*(b.maxX-margin):Math.max(margin,b.maxX-10);
    const y=position?margin+position.y*(b.maxY-margin):Math.max(margin,b.maxY-10);
    if(!docked){anchor.style.left=clamp(x,margin,b.maxX)+'px';anchor.style.top=clamp(y,margin,b.maxY)+'px';}else{anchor.style.left='auto';anchor.style.top='auto';}anchor.style.right='auto';anchor.style.bottom='auto';
    const rect=button.getBoundingClientRect(),width=Math.min(360,Math.max(0,innerWidth-margin*2));
    panel.style.position=docked?'fixed':'absolute';panel.style.width=width+'px';panel.style.left=(clamp(rect.right-width,margin,innerWidth-width-margin)-(docked?0:rect.left))+'px';panel.style.right='auto';
    const above=rect.top-margin-12,below=innerHeight-rect.bottom-margin-12;
    const openAbove=above>=Math.min(320,panel.scrollHeight||320)||above>=below;
    panel.style.maxHeight=Math.max(0,openAbove?above:below)+'px';
    if(docked){panel.style.top=openAbove?'auto':clamp(rect.bottom+12,margin,innerHeight-margin)+'px';panel.style.bottom=openAbove?Math.max(margin,innerHeight-rect.top+12)+'px':'auto';}else{panel.style.top=openAbove?'auto':(rect.height+12)+'px';panel.style.bottom=openAbove?(rect.height+12)+'px':'auto';}
  }
  function move(x,y){const b=bounds();position={x:(clamp(x,margin,b.maxX)-margin)/Math.max(1,b.maxX-margin),y:(clamp(y,margin,b.maxY)-margin)/Math.max(1,b.maxY-margin)};layout();}
  function save(){changedLocally=true;session.call(()=>chrome.storage.local.set({[key]:position})).catch(error=>{if(session.active())console.warn('Easy Notebook: não foi possível salvar a posição.',error);});}
  button.title='Arraste para mover. Clique para abrir. Alt + setas também move o botão.';
  button.addEventListener('pointerdown',event=>{
    if(docked||!event.isPrimary||event.button!==0)return;
    suppressClick=false;const rect=button.getBoundingClientRect();
    gesture={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top,previous:position,moved:false};
    button.setPointerCapture(event.pointerId);
  });
  button.addEventListener('pointermove',event=>{
    if(!gesture||gesture.id!==event.pointerId)return;
    const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
    if(!gesture.moved&&Math.hypot(dx,dy)<5)return;
    gesture.moved=true;button.dataset.dragging='true';event.preventDefault();move(gesture.left+dx,gesture.top+dy);
  });
  function finish(event,cancelled=false){
    if(!gesture||gesture.id!==event.pointerId)return;
    const previous=gesture;gesture=null;delete button.dataset.dragging;
    if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);
    if(previous.moved){suppressClick=true;if(cancelled){position=previous.previous;layout();}else save();}
  }
  button.addEventListener('pointerup',event=>finish(event));button.addEventListener('pointercancel',event=>finish(event,true));
  button.addEventListener('lostpointercapture',event=>{if(gesture)finish(event,true);});
  button.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}},true);
  button.addEventListener('keydown',event=>{
    if(docked||!event.altKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();const rect=button.getBoundingClientRect(),step=event.shiftKey?40:10;
    move(rect.left+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0),rect.top+(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0));save();
  });
  const valid=value=>value&&Number.isFinite(value.x)&&Number.isFinite(value.y)&&value.x>=0&&value.x<=1&&value.y>=0&&value.y<=1;
  session.call(()=>chrome.storage.local.get(key)).then(data=>{if(!changedLocally&&!gesture){position=valid(data[key])?data[key]:null;layout();}}).catch(()=>{});
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes[key]&&!gesture){position=valid(changes[key].newValue)?changes[key].newValue:null;layout();}});
  window.addEventListener('resize',layout);window.addEventListener('scroll',()=>{if(docked&&!panel.hidden)layout();},true);layout();
  return {refresh:layout,isDocked:()=>docked,dock(print){
    if(gesture)return;
    docked=true;anchor.dataset.docked='true';root.host.setAttribute('data-eproc-toolbar','');
    if(print.nextElementSibling!==root.host)print.after(root.host);
    button.title='Enviar este processo ao Notebook';button.setAttribute('aria-label','Enviar processo ao Notebook');layout();
  },undock(){
    if(!docked)return;docked=false;delete anchor.dataset.docked;root.host.removeAttribute('data-eproc-toolbar');document.documentElement.append(root.host);
    button.title='Arraste para mover. Clique para abrir. Alt + setas também move o botão.';button.removeAttribute('aria-label');layout();
  }};
};
