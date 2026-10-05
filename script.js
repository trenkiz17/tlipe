'use strict';

// SIMULAÇÃO NO NAVEGADOR. NÃO ACIONA PINOS DO ESP32.
// Na integração real, o ESP32 será a fonte dos estados e dos intertravamentos.
const STEP_DURATION = 1700; // milissegundos por andar, somente para simulação
const state = { floor: 3, destination: null, moving: 0, queue: [], busy: false };

const el = (id) => document.getElementById(id);
const floorButtons = [...document.querySelectorAll('[data-call]')];
const sensors = [...document.querySelectorAll('[data-sensor]')];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function render() {
  el('currentFloor').textContent = `${state.floor}º`;
  el('floorDescription').textContent = state.moving ? `Último sensor confirmado: ${state.floor}º` : `Cabine no ${state.floor}º andar`;
  el('destinationFloor').textContent = state.destination ? `${state.destination}º` : '—';
  el('destinationSuffix').textContent = state.destination ? 'andar' : 'Sem chamada';
  const status = state.moving > 0 ? 'Subindo' : state.moving < 0 ? 'Descendo' : 'Parado';
  el('statusText').textContent = status;
  el('statusIcon').textContent = state.moving > 0 ? '↑' : state.moving < 0 ? '↓' : '■';
  el('upIndicator').classList.toggle('active', state.moving > 0);
  el('downIndicator').classList.toggle('active', state.moving < 0);
  sensors.forEach((node) => node.classList.toggle('active', Number(node.dataset.sensor) === state.floor && state.moving === 0));
  floorButtons.forEach((button) => button.classList.toggle('selected', state.destination === Number(button.dataset.call) || state.queue.includes(Number(button.dataset.call))));
  el('cab').setAttribute('aria-label', `Cabine: referência do ${state.floor}º andar${state.moving ? ', em movimento' : ''}`);
  el('helpText').textContent = state.busy ? `${status} para o ${state.destination}º andar • Chamadas pendentes: ${state.queue.length}` : 'Selecione o andar desejado para enviar uma chamada.';
}

// Os botões adicionam chamadas a uma fila, preservando solicitações recebidas durante o movimento.
function requestFloor(floor) {
  if (!Number.isInteger(floor) || floor < 1 || floor > 4) return;
  if (state.destination === floor || state.queue.includes(floor)) return;
  if (floor === state.floor && !state.busy) return;
  state.queue.push(floor);
  render();
  if (!state.busy) void processQueue();
}

async function processQueue() {
  if (state.busy) return;
  state.busy = true;
  while (state.queue.length) {
    state.destination = state.queue.shift();
    render();
    while (state.floor !== state.destination) {
      const nextFloor = state.floor + Math.sign(state.destination - state.floor);
      state.moving = Math.sign(nextFloor - state.floor);
      el('cab').style.setProperty('--position', nextFloor);
      render();
      await sleep(STEP_DURATION);
      state.floor = nextFloor;  // chegada simulada ao sensor seguinte
      render();
    }
    state.moving = 0;
    state.destination = null;
    render();
    await sleep(350);
  }
  state.busy = false;
  render();
}

floorButtons.forEach((button) => button.addEventListener('click', () => requestFloor(Number(button.dataset.call))));
render();
