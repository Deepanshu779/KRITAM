const stage = document.querySelector('#avatarStage');
const statusText = document.querySelector('#statusText');
const message = document.querySelector('#message');

const states = {
  idle: 'KRITAM IS READY',
  listening: 'LISTENING',
  thinking: 'THINKING',
  speaking: 'SPEAKING',
  happy: 'READY'
};

function setAvatarState(state, text) {
  const next = states[state] ? state : 'idle';
  stage.dataset.state = next;
  statusText.textContent = text || states[next];
}

// Exposed for the main KRITAM UI/voice engine in the next integration step.
window.setKritamAvatarState = setAvatarState;

async function dailyBriefing() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning, Deepak.' : hour < 18 ? 'Good afternoon, Deepak.' : 'Good evening, Deepak.';
  document.querySelector('#greeting').textContent = greeting;

  setAvatarState('thinking');
  try {
    const news = await window.kritamDesktop.getNews();
    message.textContent = `${news[0]} — I’ve got your day covered. What’s one thing we’ll finish first?`;
    setAvatarState('happy');
    setTimeout(() => setAvatarState('idle'), 1500);
  } catch {
    message.textContent = 'Let’s pick one important task and make a calm start.';
    setAvatarState('idle');
  }
}

document.querySelector('#open').onclick = () => window.kritamDesktop.showCompanion().then(() => window.close());
document.querySelector('#close').onclick = () => window.close();
window.kritamDesktop.onDailyBriefing(dailyBriefing);
dailyBriefing();
