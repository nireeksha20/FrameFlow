# FrameFlow

### Interactive Sliding Window Protocol Simulator

FrameFlow is an interactive learning and experimentation tool for understanding
Sliding Window protocols through visual simulation.

It demonstrates how frames are transmitted between a sender and receiver,
how acknowledgements are generated, how the sender window moves, and how
different protocols handle frame loss and retransmission.

---

## 📌 Problem Statement

Sliding Window protocols are an important concept in Computer Networks, but
their operation can be difficult to understand using only static diagrams
and theoretical explanations.

FrameFlow provides a visual and interactive way to study these protocols by
allowing users to control the simulation, introduce frame loss, observe
acknowledgements and retransmissions, and compare different protocol
behaviours.

---

## 🎯 Objectives

- Visualize Sliding Window protocol operation.
- Understand how frames move between sender and receiver.
- Observe acknowledgements and window movement.
- Demonstrate frame loss and retransmission.
- Compare Go-Back-N and Selective Repeat.
- Experiment with different window sizes and loss conditions.
- Analyze simulation results using statistics and efficiency.
- Provide step-by-step learning material alongside the simulation.

---

## ✨ Features

### Simulation Controls

- Adjustable window size
- Adjustable total number of frames
- Manual frame loss
- Random frame loss
- No-loss mode
- Slow / Default / Fast transmission speed
- Start / Restart simulation
- Reset simulation

### Step-by-Step Simulation

- Previous Step
- Next Step
- Auto Play / Pause
- Current simulation step
- Current protocol state
- Current sender window
- Frames waiting for ACK

### Protocol Visualization

- Sender and receiver representation
- Frame transmission
- ACK transmission
- Sequence numbers
- Frame loss
- Retransmission
- Out-of-order frame buffering
- Window movement
- Expected frame
- Base and next-frame state

### Statistics and Analysis

- Frames sent
- Frames received
- ACKs
- Lost frames
- Retransmissions
- Efficiency
- Experiment history
- Efficiency comparison graph

### Learning Material

FrameFlow includes an integrated learning section covering:

- Computer Networks
- Protocols
- Frames
- Sequence Numbers
- Sender and Receiver
- ACK
- Sender Window
- Window Size
- Sliding
- Base
- Next Frame
- Outstanding Frames
- Expected Frame
- Buffer
- Out-of-order Frames
- Timeout
- Frame Loss
- Retransmission
- ARQ
- Cumulative ACK
- Flow Control
- Error Control
- Go-Back-N
- Selective Repeat
- Throughput
- Efficiency
- Experiments

---

## 🔄 How Sliding Window Works

The basic operation demonstrated by FrameFlow is:

1. Data is divided into numbered frames.
2. The sender maintains a transmission window.
3. Multiple frames can be transmitted without waiting for every ACK.
4. The receiver processes incoming frames and sends acknowledgements.
5. As acknowledgements are received, the sender window moves forward.
6. When a frame is lost, the selected protocol determines the recovery behaviour.
7. The experiment records transmission and retransmission activity for analysis.
