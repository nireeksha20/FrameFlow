const $ = (id) => document.getElementById(id);

const els = {
  protocol: $("protocol"),
  windowSize: $("windowSize"),
  totalFrames: $("totalFrames"),
  lossMode: $("lossMode"),
  manualLossWrap: $("manualLossWrap"),
  manualLossFrame: $("manualLossFrame"),
  lossRateWrap: $("lossRateWrap"),
  lossRate: $("lossRate"),
  startBtn: $("startBtn"),
  prevBtn: $("prevBtn"),
  nextBtn: $("nextBtn"),
  playBtn: $("playBtn"),
  resetBtn: $("resetBtn"),
  clearHistoryBtn: $("clearHistoryBtn"),
  speedLabel: $("speedLabel"),
  protocolLabel: $("protocolLabel"),
  stepLabel: $("stepLabel"),
  statusText: $("statusText"),
  windowLabel: $("windowLabel"),
  senderWindow: $("senderWindow"),
  receiverWindow: $("receiverWindow"),
  senderState: $("senderState"),
  receiverState: $("receiverState"),
  activityMessage: $("activityMessage"),
  baseState: $("baseState"),
  nextState: $("nextState"),
  waitingState: $("waitingState"),
  lastAckState: $("lastAckState"),
  expectedState: $("expectedState"),
  eventState: $("eventState"),
  explanation: $("explanation"),
  framesSent: $("framesSent"),
  framesReceived: $("framesReceived"),
  acksReceived: $("acksReceived"),
  lostFrames: $("lostFrames"),
  retransmissions: $("retransmissions"),
  efficiency: $("efficiency"),
  historyBody: $("historyBody"),
  chart: $("efficiencyChart"),
  eventLog: $("eventLog"),
  conceptGrid: $("conceptGrid"),
};

const speeds = { slow: 1300, default: 650, fast: 220 };
let speed = "default";
let timer = null;
let playing = false;
let history = [];
let state = null;

const concepts = [
  [
    "Computer Network",
    "A collection of connected devices that communicate and exchange data using agreed communication rules called protocols.",
  ],
  [
    "Protocol",
    "A set of rules that defines how devices format, send, receive and interpret information.",
  ],
  [
    "Frame",
    "A unit of data represented in the simulator by a numbered item such as F0 or F1. Frames are the units transmitted between the sender and receiver in FrameFlow.",
  ],
  [
    "Sequence Number",
    "A number assigned to a frame so the sender and receiver can identify it and keep track of ordering.",
  ],
  [
    "Sender",
    "The device that transmits frames. In FrameFlow, it is the left side of the simulation.",
  ],
  [
    "Receiver",
    "The device that receives frames and sends acknowledgements. In FrameFlow, it is the right side.",
  ],
  [
    "ACK",
    "Acknowledgement sent by the receiver to indicate successful receipt. The exact ACK behaviour depends on the selected protocol.",
  ],
  [
    "Sender Window",
    "The range of frames that the sender is currently permitted to have in transit without waiting for every earlier acknowledgement.",
  ],
  [
    "Window Size",
    "The maximum number of frames that can be outstanding in the sender window at one time.",
  ],
  [
    "Sliding",
    "The movement of the sender window toward higher sequence numbers as acknowledged frames leave the window.",
  ],
  [
    "Base",
    "The first outstanding frame position in the sender window. In FrameFlow, the Base value helps show where the current window starts.",
  ],
  [
    "Next Frame",
    "The next new frame that the sender is ready to transmit when there is space in the current window.",
  ],
  [
    "Outstanding Frame",
    "A frame that has been transmitted but has not yet been successfully acknowledged or otherwise cleared from the sender's outstanding set.",
  ],
  [
    "Expected Frame",
    "The frame position the receiver is currently expecting next. FrameFlow displays this value in the protocol state panel.",
  ],
  [
    "Buffer",
    "Temporary storage for a correctly received frame that arrived out of order. Selective Repeat can buffer such frames.",
  ],
  [
    "Out-of-order Frame",
    "A frame that arrives before an earlier frame that is still missing. Selective Repeat can keep it in a buffer instead of discarding it.",
  ],
  [
    "Timeout",
    "A recovery trigger used when the sender determines that an expected acknowledgement has not arrived within the required time.",
  ],
  [
    "Frame Loss",
    "A simulated event in which a transmitted frame does not reach the receiver successfully.",
  ],
  [
    "Retransmission",
    "Sending a frame again after the protocol determines that the earlier transmission was unsuccessful or needs to be repeated.",
  ],
  [
    "ARQ",
    "Automatic Repeat reQuest: a family of reliability mechanisms that use acknowledgements and retransmissions to recover from transmission errors or loss.",
  ],
  [
    "Cumulative ACK",
    "An acknowledgement that confirms successful receipt up to a particular sequence position. Go-Back-N commonly uses cumulative acknowledgements.",
  ],
  [
    "Flow Control",
    "A mechanism for controlling how much data can be sent before acknowledgements are received. A sliding window helps limit the amount of outstanding data.",
  ],
  [
    "Error Control",
    "Mechanisms used to detect or recover from lost or corrupted data. In this project, loss recovery is demonstrated using ACKs, timeouts and retransmissions.",
  ],
  [
    "Go-Back-N",
    "A sliding-window ARQ method in which, after a loss and timeout, the sender retransmits the missing frame and the subsequent outstanding frames.",
  ],
  [
    "Selective Repeat",
    "A sliding-window ARQ method in which correctly received out-of-order frames can be buffered and only missing frames are retransmitted.",
  ],
  [
    "Throughput",
    "The amount of successfully delivered data over a period of time. FrameFlow focuses primarily on protocol behaviour rather than measuring a real network's physical throughput.",
  ],
  [
    "Efficiency",
    "A FrameFlow experiment metric calculated from successfully received frames relative to the total frame transmissions performed during that experiment.",
  ],
  [
    "Experiment",
    "One configured simulation run whose parameters and results can be recorded and compared with other runs.",
  ],
];

els.conceptGrid.innerHTML = concepts
  .map(
    ([term, definition]) => `
  <div>
    <strong>${term}</strong>
    <span>${definition}</span>
  </div>
`,
  )
  .join("");

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function protocolName() {
  return els.protocol.value === "sr" ? "Selective Repeat" : "Go-Back-N";
}
function frameText(n) {
  return n < 0 ? "—" : `F${n}`;
}

function config() {
  return {
    protocol: els.protocol.value,
    windowSize: clamp(Number(els.windowSize.value) || 4, 1, 8),
    totalFrames: clamp(Number(els.totalFrames.value) || 12, 1, 30),
    lossMode: els.lossMode.value,
    manualLoss: Number(els.manualLossFrame.value),
    lossRate: clamp(Number(els.lossRate.value) || 0, 0, 80),
  };
}

function createInitialState(c) {
  const lost = new Set();
  if (
    c.lossMode === "manual" &&
    c.manualLoss >= 0 &&
    c.manualLoss < c.totalFrames
  )
    lost.add(c.manualLoss);

  const s = {
    config: c,
    step: 0,
    base: 0,
    nextFrame: 0,
    expected: 0,
    lastAck: -1,
    received: new Set(),
    acked: new Set(),
    buffered: new Set(),
    waiting: new Set(),
    lost,
    retransmitFrames: new Set(),
    retransmitQueue: [],
    sent: 0,
    receivedCount: 0,
    acks: 0,
    lostCount: 0,
    retransmissions: 0,
    completed: false,
    currentEvent: "Ready",
    explanation: "Press Start / Restart to create the experiment.",
    eventLog: ["FrameFlow initialized."],
  };
  return s;
}

function randomLossForFrame(s, frame) {
  if (s.config.lossMode === "none") return false;
  if (s.config.lossMode === "manual")
    return s.lost.has(frame) && !s.retransmitFrames.has(frame);
  return Math.random() * 100 < s.config.lossRate;
}

function windowEnd(s) {
  return Math.min(s.base + s.config.windowSize, s.config.totalFrames);
}

function outstanding(s) {
  return [...s.waiting].sort((a, b) => a - b);
}

function addLog(s, message) {
  s.eventLog.unshift(message);
}

function efficiency(s) {
  return s.sent ? (s.receivedCount / s.sent) * 100 : 0;
}

function buildEvent(s) {
  const end = windowEnd(s);
  if (s.completed) return { type: "complete" };
  if (s.base >= s.config.totalFrames) return { type: "complete" };

  // Send the next frame inside the window.
  if (s.nextFrame < end) {
    const f = s.nextFrame;
    s.nextFrame++;
    s.sent++;
    s.waiting.add(f);
    s.retransmitFrames.delete(f);
    s.currentEvent = `Frame ${frameText(f)} transmitted`;
    s.explanation = `Frame ${frameText(f)} is inside the current window, so the sender can transmit it without waiting for every earlier ACK.`;
    addLog(s, `Sent ${frameText(f)}.`);
    if (randomLossForFrame(s, f)) {
      s.waiting.delete(f);
      s.lostCount++;
      s.lost.add(f);
      s.currentEvent = `Frame ${frameText(f)} lost`;
      s.explanation = `Frame ${frameText(f)} was lost in the simulated network. The sender must eventually retransmit it.`;
      addLog(s, `⚠ ${frameText(f)} was lost.`);
    }
    return { type: "send", frame: f };
  }

  // Selective Repeat: acknowledge correctly received frames independently.
  // Out-of-order frames are buffered until the missing base frame arrives.
  if (s.config.protocol === "sr") {
    const pending = outstanding(s);
    if (pending.length) {
      const f = pending[0];
      s.waiting.delete(f);
      s.acked.add(f);
      s.received.add(f);
      s.receivedCount++;
      s.acks++;
      s.lastAck = f;
      if (f > s.base) {
        s.buffered.add(f);
        s.currentEvent = `ACK ${f} received — ${frameText(f)} buffered`;
        s.explanation = `${frameText(f)} arrived while ${frameText(s.base)} was missing. Selective Repeat keeps the correctly received out-of-order frame in a buffer instead of retransmitting it.`;
        addLog(s, `ACK ${f} received. ${frameText(f)} buffered.`);
      } else {
        s.currentEvent = `ACK ${f} received`;
        s.explanation = `Selective Repeat acknowledges ${frameText(f)} independently. Correctly received frames do not need to be retransmitted just because another frame was lost.`;
        addLog(s, `ACK ${f} received.`);
      }
      while (s.acked.has(s.base)) {
        s.buffered.delete(s.base);
        s.base++;
      }
      s.expected = s.base;
      return { type: "ack", frame: f };
    }
  } else {
    // Go-Back-N: a timeout at the oldest unacknowledged frame causes the
    // missing frame AND every later outstanding frame to be retransmitted.
    if (s.retransmitQueue.length) {
      const f = s.retransmitQueue.shift();
      s.retransmitFrames.add(f);
      s.sent++;
      s.retransmissions++;
      s.waiting.add(f);
      s.currentEvent = `Retransmitting ${frameText(f)}`;
      s.explanation = `Go-Back-N retransmits ${frameText(f)} because it was outstanding when the timeout occurred at ${frameText(s.base)}.`;
      addLog(s, `Retransmitting ${frameText(f)}.`);
      return { type: "retransmit", frame: f };
    }

    if (!s.acked.has(s.base) && s.lost.has(s.base)) {
      const outstandingAfterBase = [...s.waiting]
        .filter((f) => f > s.base)
        .sort((a, b) => a - b);
      s.lost.delete(s.base);
      s.retransmitQueue = [s.base, ...outstandingAfterBase];
      addLog(
        s,
        `Timeout for ${frameText(s.base)}. Go-Back-N retransmission started for ${s.retransmitQueue.map(frameText).join(", ")}.`,
      );
      s.currentEvent = `Timeout for ${frameText(s.base)}`;
      s.explanation = `Go-Back-N goes back to the oldest unacknowledged frame and retransmits that frame plus all later outstanding frames.`;
      return { type: "timeout", frame: s.base };
    }

    const ackCandidate = [...s.waiting].sort((a, b) => a - b)[0];
    if (ackCandidate !== undefined) {
      s.waiting.delete(ackCandidate);
      s.acked.add(ackCandidate);
      s.received.add(ackCandidate);
      s.receivedCount++;
      s.acks++;
      s.lastAck = ackCandidate;
      s.expected = s.base;
      s.currentEvent = `ACK ${ackCandidate} received`;
      s.explanation = `The receiver acknowledges the next successful frame. The sender can slide its window once the base frame is acknowledged.`;
      addLog(s, `ACK ${ackCandidate} received.`);
      while (s.acked.has(s.base)) s.base++;
      return { type: "ack", frame: ackCandidate };
    }
  }

  // If a frame remains lost/pending, retransmit it.
  const retry =
    s.config.protocol === "sr"
      ? [...s.lost].sort((a, b) => a - b)[0]
      : undefined;

  if (retry !== undefined && retry < s.config.totalFrames) {
    s.lost.delete(retry);
    s.retransmitFrames.add(retry);
    s.sent++;
    s.retransmissions++;
    s.waiting.add(retry);
    s.currentEvent = `Retransmitting ${frameText(retry)}`;
    s.explanation = `Selective Repeat retransmits only the missing frame ${frameText(retry)}.`;
    addLog(s, `Retransmitting ${frameText(retry)}.`);
    return { type: "retransmit", frame: retry };
  }

  if (
    s.base >= s.config.totalFrames ||
    s.receivedCount >= s.config.totalFrames
  ) {
    s.completed = true;
    s.currentEvent = "Experiment completed";
    s.explanation = "All frames have been successfully delivered.";
    addLog(s, "✓ Experiment completed.");
    return { type: "complete" };
  }

  return { type: "idle" };
}

function render() {
  if (!state) return;
  const s = state,
    c = s.config;
  els.protocolLabel.textContent = protocolName();
  els.stepLabel.textContent = `${s.step}`;
  els.statusText.textContent = s.completed
    ? "Completed"
    : playing
      ? "Running"
      : "Paused / Ready";
  els.windowLabel.textContent =
    s.base < c.totalFrames
      ? `F${s.base}–F${Math.min(windowEnd(s) - 1, c.totalFrames - 1)}`
      : "Complete";
  els.activityMessage.textContent = s.currentEvent;
  els.explanation.textContent = s.explanation;

  els.baseState.textContent = frameText(s.base);
  els.nextState.textContent = frameText(s.nextFrame);
  els.waitingState.textContent =
    outstanding(s).map(frameText).join(", ") || "None";
  els.lastAckState.textContent = frameText(s.lastAck);
  els.expectedState.textContent = frameText(s.expected);
  els.eventState.textContent = s.currentEvent;

  els.framesSent.textContent = s.sent;
  els.framesReceived.textContent = s.receivedCount;
  els.acksReceived.textContent = s.acks;
  els.lostFrames.textContent = s.lostCount;
  els.retransmissions.textContent = s.retransmissions;
  els.efficiency.textContent = `${efficiency(s).toFixed(1)}%`;

  els.senderWindow.innerHTML = "";
  for (let i = s.base; i < windowEnd(s); i++) {
    const d = document.createElement("div");
    d.className =
      "frame " +
      (s.lost.has(i)
        ? "lost"
        : s.waiting.has(i)
          ? s.retransmitFrames.has(i)
            ? "retransmit"
            : "waiting"
          : s.acked.has(i)
            ? "received"
            : "");
    d.innerHTML = `<span>F${i}</span><small>Seq ${i}</small>`;
    els.senderWindow.appendChild(d);
  }

  els.receiverWindow.innerHTML = "";
  [...s.received]
    .filter((i) => !s.buffered.has(i))
    .sort((a, b) => a - b)
    .forEach((i) => {
      const d = document.createElement("div");
      d.className = "frame received";
      d.innerHTML = `<span>F${i}</span><small>ACK ${i}</small>`;
      els.receiverWindow.appendChild(d);
    });
  [...s.buffered]
    .sort((a, b) => a - b)
    .forEach((i) => {
      const d = document.createElement("div");
      d.className = "frame buffered";
      d.innerHTML = `<span>F${i}</span><small>Buffered</small>`;
      els.receiverWindow.appendChild(d);
    });

  els.senderState.textContent = s.waiting.size
    ? "Waiting for ACK"
    : s.completed
      ? "Complete"
      : "Ready";
  els.receiverState.textContent = s.receivedCount ? "Receiving" : "Ready";
  els.eventLog.innerHTML = s.eventLog
    .map((x) => `<div class="log-item">${x}</div>`)
    .join("");
  els.prevBtn.disabled = !state || state.step <= 0;
  els.nextBtn.disabled = !state || state.completed;
  els.playBtn.disabled = !state || state.completed;
  els.playBtn.textContent = playing ? "⏸ Pause" : "▶ Auto Play";
  renderHistory();
  renderChart();
}

function startExperiment() {
  stopAuto();
  const c = config();
  if (
    c.lossMode === "manual" &&
    (c.manualLoss < 0 || c.manualLoss >= c.totalFrames)
  ) {
    alert("Select a valid frame to lose, or choose None.");
    return;
  }
  state = createInitialState(c);
  updateManualFrameOptions();
  render();
}

function nextStep() {
  if (!state || state.completed) return;
  const result = buildEvent(state);
  state.step++;
  if (result.type === "complete") state.completed = true;
  if (state.base >= state.config.totalFrames && state.waiting.size === 0) {
    state.completed = true;
    state.currentEvent = "Experiment completed";
    state.explanation = "All frames have been delivered and acknowledged.";
    addLog(state, "✓ Experiment completed.");
  }
  if (state.completed && !state.saved) {
    saveExperiment();
    state.saved = true;
  }
  render();
}

function previousStep() {
  if (!state || state.step <= 0) return;
  // Replaying from the beginning gives deterministic history for manual/no-loss runs.
  const target = state.step - 2;
  const c = { ...state.config };
  const replay = createInitialState(c);
  state = replay;
  for (let i = 0; i <= target; i++) buildEvent(state);
  state.step = Math.max(0, target + 1);
  render();
}

function autoPlay() {
  if (!state || state.completed) return;
  if (playing) {
    stopAuto();
    return;
  }
  playing = true;
  render();
  const tick = () => {
    if (!playing || !state || state.completed) {
      stopAuto();
      return;
    }
    nextStep();
    if (!state.completed) timer = setTimeout(tick, speeds[speed]);
    else stopAuto();
  };
  timer = setTimeout(tick, speeds[speed]);
}

function stopAuto() {
  playing = false;
  if (timer) clearTimeout(timer);
  timer = null;
  if (state) render();
}

function reset() {
  stopAuto();
  state = createInitialState(config());
  state.eventLog = ["FrameFlow reset. Ready for a new experiment."];
  render();
}

function saveExperiment() {
  const s = state;
  history.push({
    protocol: protocolName(),
    window: s.config.windowSize,
    loss:
      s.config.lossMode === "random"
        ? s.config.lossRate
        : s.config.lossMode === "manual"
          ? "Manual"
          : "0",
    sent: s.sent,
    retrans: s.retransmissions,
    efficiency: efficiency(s),
  });
}

function renderHistory() {
  if (!history.length) {
    els.historyBody.innerHTML = `<tr><td colspan="7" class="empty">No completed experiments yet.</td></tr>`;
    return;
  }
  els.historyBody.innerHTML = history
    .map(
      (h, i) =>
        `<tr><td>${i + 1}</td><td>${h.protocol}</td><td>${h.window}</td><td>${h.loss}${h.loss === "Manual" ? "" : "%"}</td><td>${h.sent}</td><td>${h.retrans}</td><td>${h.efficiency.toFixed(1)}%</td></tr>`,
    )
    .join("");
}

function renderChart() {
  const svg = els.chart,
    W = 900,
    H = 330,
    left = 55,
    bottom = 45,
    top = 20,
    chartH = H - top - bottom;
  svg.innerHTML = "";
  const values = history.map((h) => h.efficiency);
  const max = 100;
  for (let y = 0; y <= 100; y += 20) {
    const py = top + chartH - (y / max) * chartH;
    svg.insertAdjacentHTML(
      "beforeend",
      `<line class="chart-grid" x1="${left}" y1="${py}" x2="${W - 20}" y2="${py}"/><text class="chart-label" x="10" y="${py + 4}">${y}%</text>`,
    );
  }
  svg.insertAdjacentHTML(
    "beforeend",
    `<line class="chart-axis" x1="${left}" y1="${top}" x2="${left}" y2="${H - bottom}"/><line class="chart-axis" x1="${left}" y1="${H - bottom}" x2="${W - 20}" y2="${H - bottom}"/>`,
  );
  if (!values.length) {
    svg.insertAdjacentHTML(
      "beforeend",
      `<text class="chart-label" x="360" y="160">Complete an experiment to populate the chart.</text>`,
    );
    return;
  }
  const gap = (W - left - 35) / values.length;
  values.forEach((v, i) => {
    const bw = Math.min(48, gap * 0.62),
      x = left + i * gap + gap * 0.19,
      h = (v / max) * chartH,
      y = top + chartH - h;
    svg.insertAdjacentHTML(
      "beforeend",
      `<rect class="chart-bar" x="${x}" y="${y}" width="${bw}" height="${h}" rx="4"/><text class="chart-value" x="${x + bw / 2}" y="${y - 7}" text-anchor="middle">${v.toFixed(0)}%</text><text class="chart-label" x="${x + bw / 2}" y="${H - 20}" text-anchor="middle">#${i + 1}</text>`,
    );
  });
}

function updateManualFrameOptions() {
  const n = clamp(Number(els.totalFrames.value) || 12, 4, 30);
  const current = Number(els.manualLossFrame.value);
  els.manualLossFrame.innerHTML = `<option value="-1">None</option>`;
  for (let i = 0; i < n; i++)
    els.manualLossFrame.insertAdjacentHTML(
      "beforeend",
      `<option value="${i}">F${i}</option>`,
    );
  if (current >= 0 && current < n) els.manualLossFrame.value = String(current);
}

function updateLossVisibility() {
  const manual = els.lossMode.value === "manual",
    random = els.lossMode.value === "random";
  els.manualLossWrap.style.display = manual ? "flex" : "none";
  els.lossRateWrap.style.display = random ? "flex" : "none";
}

els.startBtn.addEventListener("click", startExperiment);
els.nextBtn.addEventListener("click", nextStep);
els.prevBtn.addEventListener("click", previousStep);
els.playBtn.addEventListener("click", autoPlay);
els.resetBtn.addEventListener("click", reset);
els.clearHistoryBtn.addEventListener("click", () => {
  history = [];
  render();
});
els.totalFrames.addEventListener("input", updateManualFrameOptions);
els.lossMode.addEventListener("change", updateLossVisibility);
els.protocol.addEventListener("change", () => {
  if (state) startExperiment();
});
document.querySelectorAll(".speed-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    speed = btn.dataset.speed;
    document
      .querySelectorAll(".speed-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    els.speedLabel.textContent = btn.textContent;
  });
});

updateManualFrameOptions();
updateLossVisibility();
state = createInitialState(config());
render();
