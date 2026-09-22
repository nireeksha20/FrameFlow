const windowSizeInput = document.getElementById("windowSize");
const totalFramesInput = document.getElementById("totalFrames");
const lossRateInput = document.getElementById("lossRate");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

const senderWindow = document.getElementById("senderWindow");
const receiverWindow = document.getElementById("receiverWindow");

const statusText = document.getElementById("statusText");
const activityMessage = document.getElementById("activityMessage");
const windowDisplay = document.getElementById("windowDisplay");
const eventLog = document.getElementById("eventLog");

const framesSentElement = document.getElementById("framesSent");
const framesReceivedElement = document.getElementById("framesReceived");
const acksReceivedElement = document.getElementById("acksReceived");
const lostFramesElement = document.getElementById("lostFrames");
const retransmissionsElement = document.getElementById("retransmissions");

/* -----------------------------
   Simulation State
----------------------------- */

let windowSize = 4;
let totalFrames = 10;
let lossRate = 20;

let base = 0;
let nextFrame = 0;

let framesSent = 0;
let framesReceived = 0;
let acksReceived = 0;
let lostFrames = 0;
let retransmissions = 0;

let simulationRunning = false;
let simulationPaused = false;

let timer = null;

let receivedFrames = new Set();
let lostFrameSet = new Set();

/* -----------------------------
   Utility Functions
----------------------------- */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logEvent(message) {
  const item = document.createElement("div");

  item.className = "log-item";

  item.textContent = message;

  eventLog.prepend(item);
}

function updateStatistics() {
  framesSentElement.textContent = framesSent;
  framesReceivedElement.textContent = framesReceived;
  acksReceivedElement.textContent = acksReceived;
  lostFramesElement.textContent = lostFrames;
  retransmissionsElement.textContent = retransmissions;
}

function updateWindowDisplay() {
  if (base >= totalFrames) {
    windowDisplay.textContent = "Transmission Complete";
    return;
  }

  const end = Math.min(base + windowSize - 1, totalFrames - 1);

  windowDisplay.textContent = `F${base} → F${end}`;
}

function createFrame(frameNumber, className = "") {
  const frame = document.createElement("div");

  frame.className = `frame ${className}`;

  frame.textContent = `F${frameNumber}`;

  frame.dataset.frame = frameNumber;

  return frame;
}

/* -----------------------------
   Display Sender Window
----------------------------- */

function renderSenderWindow() {
  senderWindow.innerHTML = "";

  const end = Math.min(base + windowSize, totalFrames);

  for (let i = base; i < end; i++) {
    let className = "";

    if (lostFrameSet.has(i)) {
      className = "lost";
    }

    senderWindow.appendChild(createFrame(i, className));
  }

  updateWindowDisplay();
}

/* -----------------------------
   Display Receiver
----------------------------- */

function renderReceiverWindow() {
  receiverWindow.innerHTML = "";

  [...receivedFrames]
    .sort((a, b) => a - b)
    .forEach((frameNumber) => {
      receiverWindow.appendChild(createFrame(frameNumber, "received"));
    });
}

/* -----------------------------
   Send Frame
----------------------------- */

async function sendFrame(frameNumber, retransmission = false) {
  if (simulationPaused) {
    await waitUntilResumed();
  }

  framesSent++;

  if (retransmission) {
    retransmissions++;

    logEvent(`Retransmitting Frame F${frameNumber}`);
  } else {
    logEvent(`Sending Frame F${frameNumber}`);
  }

  updateStatistics();

  activityMessage.textContent = `Sending Frame F${frameNumber}`;

  await sleep(700);

  /* Random packet loss */

  const randomValue = Math.random() * 100;

  if (randomValue < lossRate) {
    lostFrames++;

    lostFrameSet.add(frameNumber);

    logEvent(`Frame F${frameNumber} was lost`);

    activityMessage.textContent = `⚠ Frame F${frameNumber} lost`;

    updateStatistics();

    renderSenderWindow();

    await sleep(700);

    return false;
  }

  /* Successful reception */

  receivedFrames.add(frameNumber);

  lostFrameSet.delete(frameNumber);

  framesReceived++;

  logEvent(`Receiver received Frame F${frameNumber}`);

  activityMessage.textContent = `Frame F${frameNumber} received`;

  renderReceiverWindow();
  renderSenderWindow();

  updateStatistics();

  await sleep(500);

  /* ACK */

  acksReceived++;

  logEvent(`ACK ${frameNumber} received by Sender`);

  activityMessage.textContent = `ACK ${frameNumber} received`;

  updateStatistics();

  await sleep(400);

  return true;
}

/* -----------------------------
   Pause Handling
----------------------------- */

function waitUntilResumed() {
  return new Promise((resolve) => {
    const check = setInterval(() => {
      if (!simulationPaused) {
        clearInterval(check);

        resolve();
      }
    }, 100);
  });
}

/* -----------------------------
   Main Simulation
----------------------------- */

async function startSimulation() {
  if (simulationRunning) {
    return;
  }

  windowSize = Number(windowSizeInput.value);
  totalFrames = Number(totalFramesInput.value);
  lossRate = Number(lossRateInput.value);

  if (windowSize < 1 || totalFrames < 1) {
    alert("Please enter valid values.");
    return;
  }

  resetState();

  simulationRunning = true;
  simulationPaused = false;

  statusText.textContent = "Running";

  logEvent("Simulation started.");

  renderSenderWindow();

  while (base < totalFrames && simulationRunning) {
    if (simulationPaused) {
      await waitUntilResumed();
    }

    const windowEnd = Math.min(base + windowSize, totalFrames);

    /* Send all frames in current window */

    let lost = false;

    for (let frame = nextFrame; frame < windowEnd; frame++) {
      const success = await sendFrame(frame);

      if (!success) {
        lost = true;
        break;
      }

      nextFrame = frame + 1;
    }

    /* If a frame was lost, retransmit from that frame */

    if (lost) {
      const lostFrame = [...lostFrameSet][0];

      logEvent(`Timeout detected for Frame F${lostFrame}`);

      activityMessage.textContent = `Timeout → retransmitting from F${lostFrame}`;

      await sleep(800);

      nextFrame = lostFrame;

      continue;
    }

    /* Slide the window */

    base = nextFrame;

    renderSenderWindow();

    if (base < totalFrames) {
      logEvent(`Window moved → F${base}`);

      activityMessage.textContent = `Window moved to F${base}`;

      await sleep(600);
    }
  }

  if (base >= totalFrames) {
    simulationRunning = false;

    statusText.textContent = "Completed";

    activityMessage.textContent = "✓ All frames transmitted successfully";

    logEvent("Simulation completed successfully.");
  }
}

/* -----------------------------
   Pause
----------------------------- */

pauseBtn.addEventListener("click", () => {
  if (!simulationRunning) {
    return;
  }

  simulationPaused = !simulationPaused;

  if (simulationPaused) {
    pauseBtn.textContent = "Resume";

    statusText.textContent = "Paused";

    activityMessage.textContent = "Simulation paused.";

    logEvent("Simulation paused.");
  } else {
    pauseBtn.textContent = "Pause";

    statusText.textContent = "Running";

    activityMessage.textContent = "Simulation resumed.";

    logEvent("Simulation resumed.");
  }
});

/* -----------------------------
   Reset State
----------------------------- */

function resetState() {
  clearTimeout(timer);

  base = 0;
  nextFrame = 0;

  framesSent = 0;
  framesReceived = 0;
  acksReceived = 0;
  lostFrames = 0;
  retransmissions = 0;

  receivedFrames.clear();
  lostFrameSet.clear();

  simulationRunning = false;
  simulationPaused = false;

  pauseBtn.textContent = "Pause";

  updateStatistics();

  senderWindow.innerHTML = "";
  receiverWindow.innerHTML = "";

  windowDisplay.textContent = "F0 → F3";

  statusText.textContent = "Ready";

  activityMessage.textContent = "Waiting for transmission...";

  eventLog.innerHTML = "";

  logEvent("FrameFlow initialized. Ready to simulate.");
}

/* -----------------------------
   Reset Button
----------------------------- */

resetBtn.addEventListener("click", () => {
  resetState();
});

/* -----------------------------
   Start Button
----------------------------- */

startBtn.addEventListener("click", () => {
  startSimulation();
});

/* Initial State */

resetState();
