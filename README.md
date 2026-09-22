# FrameFlow

### Interactive Sliding Window Protocol Simulator

FrameFlow is an interactive learning and experimentation tool for visualizing
Sliding Window protocols. It demonstrates frame transmission,
acknowledgements, window movement, frame loss, and retransmission.

## Features

- Go-Back-N and Selective Repeat simulation
- Adjustable window size and total frames
- Manual, random, or no frame loss
- Slow / Default / Fast transmission
- Previous Step / Next Step / Auto Play
- Sender, receiver and ACK visualization
- Protocol state and sequence numbers
- Frame loss and retransmission visualization
- Transmission log
- Experiment statistics and efficiency
- Experiment history and efficiency graph
- Integrated learning material and terminology
- Go-Back-N vs Selective Repeat comparison

## How It Works

The simulator models the basic Sliding Window process:

1. Frames are created and assigned sequence numbers.
2. The sender transmits frames within its window.
3. The receiver sends acknowledgements.
4. The sender moves the window as frames are acknowledged.
5. Lost frames trigger protocol-specific retransmission behaviour.
6. Experiment results are recorded for analysis.

### Go-Back-N

When a frame is lost, the missing frame and subsequent outstanding frames
are retransmitted after timeout.

### Selective Repeat

Correctly received out-of-order frames can be buffered, so only the missing
frame needs to be retransmitted.

## Technology

- HTML5
- CSS3
- JavaScript
- SVG

## Run

Open `index.html` using VS Code Live Server or directly in a modern browser.

## Project Structure

```text
FrameFlow/
├── index.html
├── style.css
├── script.js
└── README.md
Scope

FrameFlow is a protocol simulator and learning tool, not a real packet
transmission or network monitoring system.

License

MIT License
