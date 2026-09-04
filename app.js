const $ = (selector) => document.querySelector(selector);
const input = $('#messageInput'), send = $('#sendButton'), messages = $('#messages'), welcome = $('#welcome');
const statusText = $('#statusText'), orb = $('#orbWrap'), dialog = $('#permissionDialog');
let pendingAction = null, recognition = null, listening = false;
let localAI = { available: false, models: [], selectedModel: null };
let availableVoices = [];
const avatarStateText = { idle: 'KRITAM is ready', listening: 'KRITAM is listening', thinking: 'KRITAM is thinking', speaking: 'KRITAM is speaking', happy: 'KRITAM is happy' };

function setState(state, text) {
  const safeState = ['idle', 'listening', 'thinking', 'speaking', 'happy'].includes(state) ? state : 'idle';
  orb.className = `orb-wrap ${safeState}`;
  statusText.textContent = text || avatarStateText[safeState];
  window.kritamDesktop?.setCompanionState?.(safeState, text || undefined).catch?.(() => {});
}
function addMessage(text, role = 'assistant') {
  welcome.classList.add('hidden'); messages.classList.remove('hidden');
  const item = document.createElement('article'); item.className = `message ${role}`;
  item.innerHTML = `<div class="message-icon">${role === 'assistant' ? 'K' : 'D'}</div><div class="bubble">${text}</div>`;
  messages.append(item); messages.parentElement.scrollTop = messages.parentElement.scrollHeight;
}
function toast(text) { const t=$('#toast');t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3200); }
function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  availableVoices = speechSynthesis.getVoices();
}
function pickFriendlyVoice(text) {
  if (!availableVoices.length) loadVoices();
  if (!availableVoices.length) return null;

  const isHindiScript = /[\u0900-\u097F]/.test(text);
  const langPreferences = isHindiScript
    ? ['hi-IN', 'hi']
    : ['en-IN', 'en-US', 'en-GB', 'en'];
  const femaleNames = ['jenny', 'aria', 'sara', 'zira', 'hazel', 'samantha', 'female', 'heera', 'neerja'];
  const naturalNames = ['online', 'natural', 'neural'];

  const sameLanguage = availableVoices.filter((voice) =>
    langPreferences.some((lang) => voice.lang?.toLowerCase() === lang.toLowerCase() || voice.lang?.toLowerCase().startsWith(`${lang.toLowerCase()}-`))
  );
  const pool = sameLanguage.length ? sameLanguage : availableVoices;
  const female = pool.filter((voice) => femaleNames.some((name) => voice.name?.toLowerCase().includes(name)));
  const naturalFemale = female.filter((voice) => naturalNames.some((name) => voice.name?.toLowerCase().includes(name)));
  return naturalFemale[0] || female[0] || pool.find((voice) => voice.default) || pool[0] || null;
}
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const phrase = new SpeechSynthesisUtterance(text);
  const voice = pickFriendlyVoice(text);
  if (voice) {
    phrase.voice = voice;
    phrase.lang = voice.lang;
  } else {
    phrase.lang = /[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-IN';
  }
  phrase.rate = 0.96;
  phrase.pitch = 1.08;
  phrase.volume = 0.96;
  phrase.onstart=()=>setState('speaking','KRITAM is speaking');
  phrase.onend=()=>setState('idle','KRITAM is ready');
  phrase.onerror=()=>setState('idle','KRITAM is ready');
  speechSynthesis.speak(phrase);
}
function respond(text, say = true) { setState('thinking','KRITAM is thinking'); setTimeout(()=>{addMessage(text); if(say) speak(text.replace(/<[^>]*>/g,'')); else setState('idle','KRITAM is ready');},520); }
async function refreshLocalAI() {
  if (!window.kritamDesktop?.getOllamaStatus) return;
  localAI = await window.kritamDesktop.getOllamaStatus().catch(() => ({ available:false, models:[] }));
  const tag = $('#aiTag');
  if (!tag) return;
  if (!localAI.available) tag.textContent = 'LOCAL AI: OFF';
  else if (!localAI.models?.length) tag.textContent = 'OLLAMA: NO MODEL';
  else tag.textContent = `OLLAMA: ${localAI.selectedModel}`;
}
async function askLocalAI(userText) {
  if (!localAI.available) await refreshLocalAI();
  if (!localAI.available) return null;
  if (!localAI.models?.length) throw new Error('Ollama is running, but no local model is installed.');
  const messagesForAI = [
    { role: 'system', content: 'You are KRITAM, a helpful privacy-first personal desktop AI companion. Be concise, friendly, practical, and honest. Understand English and Hinglish. Reply in the language style the user uses. Do not claim to have performed desktop actions. If a request requires a tool, explain that KRITAM will handle it through its permission system.' },
    { role: 'user', content: userText },
  ];
  const result = await window.kritamDesktop.ollamaChat(messagesForAI, { model: localAI.selectedModel });
  return result.message?.trim() || null;
}
async function respondWithLocalAI(text) {
  setState('thinking', 'KRITAM is thinking locally');
  try {
    const answer = await askLocalAI(text);
    if (answer) { addMessage(answer); speak(answer); return; }
    respond('I can answer that once a local Ollama model is available.');
  } catch (error) {
    console.error('Local AI error:', error);
    addMessage(`I couldn't use the local AI right now. ${error.message || 'Please check Ollama.'}`);
    setState('idle', 'KRITAM is ready');
  }
}
function actionCard(label, detail, action) { const el=document.createElement('div');el.className='action-card';el.innerHTML=`<span class="action-symbol">↗</span><div><strong>${label}</strong><p>${detail}</p></div><button>Review & allow</button>`;el.querySelector('button').onclick=()=>askPermission(action);messages.append(el); }
function askPermission(action) { pendingAction=action; $('#dialogTitle').textContent='Approve this action?'; $('#dialogText').textContent=action.description; $('#dialogDetail').textContent=action.kind; $('#dialogAction').textContent=action.label; dialog.showModal(); }
function runAction() { if(!pendingAction)return; const a=pendingAction; dialog.close(); if(a.url) { if(window.kritamDesktop) window.kritamDesktop.openUrl(a.url).catch(() => toast('KRITAM blocked that website.')); else window.open(a.url,'_blank','noopener'); } if(a.camera) requestCamera(); toast(`${a.label} approved for this session.`); respond(`Done — ${a.done}.`, false); pendingAction=null; }
function requestCamera(){navigator.mediaDevices?.getUserMedia({video:true}).then(stream=>{stream.getTracks().forEach(t=>t.stop());toast('Camera permission was granted, then released.');}).catch(()=>toast('Camera access was not available.'));}
async function interpret(text) {
  const q=text.toLowerCase().trim();
  if(/youtube|open\s+(the\s+)?(website|google|github)/.test(q)){const site=q.includes('youtube')?['YouTube','https://www.youtube.com']:q.includes('github')?['GitHub','https://github.com']:['Google','https://google.com'];addMessage(`I found a desktop action for that. I’ll only open it after you approve.`, 'assistant');actionCard('Open website',site[0],{kind:'Desktop action',label:`Open ${site[0]}`,description:`KRITAM wants to open ${site[0]} in your default browser.`,url:site[1],done:`${site[0]} is opening in your browser`});return;}
  if(/camera|take\s+(a\s+)?photo/.test(q)){respond('I can use your camera only for the moment you approve.');actionCard('Camera access','One-time permission',{kind:'Sensitive access',label:'Use camera once',description:'KRITAM wants one-time camera access. A visible browser permission prompt will appear.',camera:true,done:'camera permission request has been sent'});return;}
  if(/\b(study|focus)\b/.test(q)){respond('Let’s make it easy: try one 45-minute focus block, then take a 10-minute break. Pick one clear outcome—like “finish chapter 3 notes”—and I’ll help you stay on track.');return;}
  if(/^(kya chal raha|hello|hi|hey|namaste)\b/.test(q)){respond('Bas ready hoon 😊 Batao, kya karna hai?');return;}
  await respondWithLocalAI(text);
}
function submit(text=input.value.trim()){if(!text)return;addMessage(text,'user');input.value='';send.disabled=true;interpret(text);}
$('#composer').addEventListener('submit',e=>{e.preventDefault();submit();});input.addEventListener('input',()=>send.disabled=!input.value.trim());
document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{input.value=b.dataset.prompt;submit();});
$('#approveAction').onclick=runAction;$('#denyAction').onclick=()=>{dialog.close();pendingAction=null;toast('Action cancelled. Nothing changed.');};
$('#newChat').onclick=()=>{messages.innerHTML='';messages.classList.add('hidden');welcome.classList.remove('hidden');speechSynthesis?.cancel();setState('idle','KRITAM is ready');};
$('#themeBtn').onclick=()=>{document.body.classList.toggle('light');toast('Theme preference saved locally.');};
$('#privacyBtn').onclick=()=>{pendingAction={kind:'Privacy centre',label:'Review permissions',description:'Microphone, camera, files and desktop actions are disabled by default. Each sensitive request needs your approval.',done:'your privacy controls are ready'};askPermission(pendingAction);};
$('#startupToggle').onchange=(event)=>{if(!window.kritamDesktop){event.target.checked=false;toast('Run KRITAM as the desktop app to enable startup.');return;}window.kritamDesktop.setLaunchAtLogin(event.target.checked).then((enabled)=>{event.target.checked=enabled;toast(enabled?'KRITAM will start when you sign in.':'Startup launch has been disabled.');});};
$('#showCompanion').onclick=()=>window.kritamDesktop ? window.kritamDesktop.showCompanion() : toast('Open KRITAM as a desktop app to use the companion.');
function startVoice(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){toast('Voice recognition is not available in this browser.');return;}if(listening){recognition.stop();return;}recognition=new SR();recognition.lang='en-IN';recognition.interimResults=true;recognition.continuous=false;recognition.onstart=()=>{listening=true;$('#micButton').classList.add('listening');setState('listening','Listening…');};recognition.onresult=e=>{const transcript=[...e.results].map(r=>r[0].transcript).join('');input.value=transcript;send.disabled=!transcript.trim();if(e.results[e.results.length-1].isFinal)submit(transcript);};recognition.onerror=()=>{setState('idle','KRITAM is ready');toast('I’m having trouble accessing the microphone.');};recognition.onend=()=>{listening=false;$('#micButton').classList.remove('listening');if(!speechSynthesis?.speaking)setState('idle','KRITAM is ready');};recognition.start();}
$('#micButton').onclick=startVoice;$('#stopListening').onclick=()=>{recognition?.stop();toast('Wake listening is off.');};
window.addEventListener('online',()=>$('#networkTag').textContent='ONLINE');window.addEventListener('offline',()=>{$('#networkTag').textContent='OFFLINE';respond('I’m offline right now, but I can still help with local tasks.');});
window.addEventListener('DOMContentLoaded', ()=>{ loadVoices(); refreshLocalAI(); });
if ('speechSynthesis' in window && 'onvoiceschanged' in speechSynthesis) speechSynthesis.onvoiceschanged = loadVoices;
