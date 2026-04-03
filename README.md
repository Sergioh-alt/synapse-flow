# Synapse Flow (SF-2026)

Synapse Flow is a high-performance, node-based orchestration engine designed for AI content drafting and automated compliance workflows. Built with React Flow and FastAPI, the platform enables modular data processing by connecting Large Language Models (LLMs) with real-time hardware telemetry.

## Technical Architecture

* **Frontend**: Built with React.js and XYFlow, featuring persistent layout hydration, custom node rotation, and 8-point omnidirectional resizing.
* **Backend**: FastAPI (Python) server managing a universal LLM Factory (supporting Groq, Ollama, and LiteLLM) through a structured message-passing protocol.
* **Telemetry**: Native system resource monitoring (CPU/RAM) integrated directly into the node-graph for performance-aware automation.
* **UI/UX**: Fully malleable interface with individual node rotation and guided connection lines for streamlined workflow design.

## Key Features

* **Multi-LLM 3-Phase Refinement**: Automated iterative prompting (Proposal, Critique, Synthesis) to ensure high-quality outputs across different model providers.
* **Decision-Logic Nodes**: Rhomboid-style boolean gates for filtering and routing content based on technical constraints.
* **Approval Gates**: Integrated human-in-the-loop nodes to maintain content quality and manual oversight before external publication.

## Development Status

Synapse Flow is currently in active development, focusing on the refinement of AI agent orchestration and secure API gateway integration for professional software engineering environments.
