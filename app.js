const $ = (selector) => document.querySelector(selector);
const input = $('#messageInput'), send = $('#sendButton'), messages = $('#messages'), welcome = $('#welcome');
const statusText = $('#statusText'), orb = $('#orbWrap'), dialog = $('#permissionDialog');
let pendingAction = null, recognition = null, listening = false;

function setState(state, text) { orb.className = `orb-wrap ${state}`; statusText.textContent = text; }
function addMessage(text, role = 'assistant') {
  welcome.classList.add('hidden'); messages.classList.remove('hidden');
  const item = document.createElement('article'); item.className = `message ${role}`;
  item.innerHTML = `<div class="message-icon">${role === 'assistant' ? 'K' : 'D'}</div><div class="bubble">${text}</div>`;
  messages.append(item); messages.parentElement.scrollTop = messages.parentElement.scrollHeight;
}
function toast(text) { const t=$('#toast');t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3200); }
function speak(text) { if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const phrase = new SpeechSynthesisUtterance(text); phrase.rate = 1.06; phrase.pitch = 1.03; phrase.onstart=()=>setState('speaking','KRITAM is speaking'); phrase.onend=()=>setState('','KRITAM is ready'); speechSynthesis.speak(phrase); }
function respond(text, say = true) { setState('thinking','KRITAM is thinking'); setTimeout(()=>{addMessage(text); if(say) speak(text.replace(/<[^>]*>/g,'')); else setState('','KRITAM is ready');},520); }
function actionCard(label, detail, action) { const el=document.createElement('div');el.className='action-card';el.innerHTML=`<span class="action-symbol">↗</span><div><strong>${label}</strong><p>${detail}</p></div><button>Review & allow</button>`;el.querySelector('button').onclick=()=>askPermission(action);messages.append(el); }
function askPermission(action) { pendingAction=action; $('#dialogTitle').textContent='Approve this action?'; $('#dialogText').textContent=action.description; $('#dialogDetail').textContent=action.kind; $('#dialogAction').textContent=action.label; dialog.showModal(); }
function runAction() { if(!pendingAction)return; const a=pendingAction; dialog.close(); if(a.url) { if(window.kritamDesktop) window.kritamDesktop.openUrl(a.url).catch(() => toast('KRITAM blocked that website.')); else window.open(a.url,'_blank','noopener'); } if(a.camera) requestCamera(); toast(`${a.label} approved for this session.`); respond(`Done — ${a.done}.`, false); pendingAction=null; }
function requestCamera(){navigator.mediaDevices?.getUserMedia({video:true}).then(stream=>{stream.getTracks().forEach(t=>t.stop());toast('Camera permission was granted, then released.');}).catch(()=>toast('Camera access was not available.'));}
function interpret(text) { const q=text.toLowerCase();
  if(/youtube|open.*(website|google|github)/.test(q)){const site=q.includes('youtube')?['YouTube','https://www.youtube.com']:q.includes('github')?['GitHub','https://github.com']:['Google','https://google.com'];addMessage(`I found a desktop action for that. I’ll only open it after you approve.`, 'assistant');actionCard('Open website',site[0],{kind:'Desktop action',label:`Open ${site[0]}`,description:`KRITAM wants to open ${site[0]} in your default browser.`,url:site[1],done:`${site[0]} is opening in your browser`});return;}
  if(/camera|take.*photo/.test(q)){respond('I can use your camera only for the moment you approve.');actionCard('Camera access','One-time permission',{kind:'Sensitive access',label:'Use camera once',description:'KRITAM wants one-time camera access. A visible browser permission prompt will appear.',camera:true,done:'camera permission request has been sent'});return;}
  if(/javascript.*promise|promise.*javascript/.test(q)){respond('A <b>Promise</b> is JavaScript’s placeholder for a result that will arrive later—like ordering chai and getting a token first. It can be <b>pending</b>, <b>fulfilled</b>, or <b>rejected</b>. Use <b>await</b> to pause inside an async function until it settles. Want a tiny code example?');return;}
  if(/study|focus/.test(q)){respond('Let’s make it easy: try one 45-minute focus block, then take a 10-minute break. Pick one clear outcome—like “finish chapter 3 notes”—and I’ll help you stay on track.');return;}
  if(/(kya chal raha|hello|hi|hey)/.test(q)){respond('Bas ready hoon 😊 Batao, kya karna hai?');return;}
  respond('I’m here with you. I can help answer that, plan it out, or turn a supported request into a safe desktop action.'); }
function submit(text=input.value.trim()){if(!text)return;addMessage(text,'user');input.value='';send.disabled=true;interpret(text);}
$('#composer').addEventListener('submit',e=>{e.preventDefault();submit();});input.addEventListener('input',()=>send.disabled=!input.value.trim());
document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{input.value=b.dataset.prompt;submit();});
$('#approveAction').onclick=runAction;$('#denyAction').onclick=()=>{dialog.close();pendingAction=null;toast('Action cancelled. Nothing changed.');};
$('#newChat').onclick=()=>{messages.innerHTML='';messages.classList.add('hidden');welcome.classList.remove('hidden');speechSynthesis?.cancel();setState('','KRITAM is ready');};
$('#themeBtn').onclick=()=>{document.body.classList.toggle('light');toast('Theme preference saved locally.');};
$('#privacyBtn').onclick=()=>{pendingAction={kind:'Privacy centre',label:'Review permissions',description:'Microphone, camera, files and desktop actions are disabled by default. Each sensitive request needs your approval.',done:'your privacy controls are ready'};askPermission(pendingAction);};
$('#startupToggle').onchange=(event)=>{if(!window.kritamDesktop){event.target.checked=false;toast('Run KRITAM as the desktop app to enable startup.');return;}window.kritamDesktop.setLaunchAtLogin(event.target.checked).then((enabled)=>{event.target.checked=enabled;toast(enabled?'KRITAM will start when you sign in.':'Startup launch has been disabled.');});};
$('#showCompanion').onclick=()=>window.kritamDesktop ? window.kritamDesktop.showCompanion() : toast('Open KRITAM as a desktop app to use the companion.');
function startVoice(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){toast('Voice recognition is not available in this browser.');return;}if(listening){recognition.stop();return;}recognition=new SR();recognition.lang='en-IN';recognition.interimResults=true;recognition.continuous=false;recognition.onstart=()=>{listening=true;$('#micButton').classList.add('listening');setState('listening','Listening…');};recognition.onresult=e=>{const transcript=[...e.results].map(r=>r[0].transcript).join('');input.value=transcript;send.disabled=!transcript.trim();if(e.results[e.results.length-1].isFinal)submit(transcript);};recognition.onerror=()=>toast('I’m having trouble accessing the microphone.');recognition.onend=()=>{listening=false;$('#micButton').classList.remove('listening');setState('','KRITAM is ready');};recognition.start();}
$('#micButton').onclick=startVoice;$('#stopListening').onclick=()=>{recognition?.stop();toast('Wake listening is off.');};
window.addEventListener('online',()=>$('#networkTag').textContent='ONLINE');window.addEventListener('offline',()=>{$('#networkTag').textContent='OFFLINE';respond('I’m offline right now, but I can still help with local tasks.');});
