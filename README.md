# NETVIS AI Platform v4

NETVIS is an advanced, interactive machine learning exploration and visualization platform. It allows users to build, train, and inspect complex neural networks and classical ML models directly in the browser with real-time 3D feedback.

## 🚀 Key Features

### 1. Multi-Dimensional Visualization
*   **Neural Canvas**: Real-time 3D and 2D visualizations of neural network architectures.
*   **Dynamic Data Pass**: Animate forward and backward propagation with adjustable speeds.
*   **Classical ML Views**: Specialized visualizations for KMeans clustering and XGBoost decision trees.

### 2. Intelligent Command Center
*   **Modeling & Intelligence**: Integrated data input (files, sketches, images) and AI-powered creative engine.
*   **Architecture & Theory**: Side-by-side inspection of layer properties and production-ready source code (PyTorch, sklearn, XGBoost).
*   **Optimization Console**: Real-time hyperparameter tuning with instant simulation resets.
*   **Performance Metrics**: Live charting of loss, accuracy, and gradient norms alongside confusion matrices.

### 3. AI Copilot (NETVIS AI)
*   **Search-Grounded Chat**: Ask questions about ML theory or specific model configurations. The AI uses real-time search grounding to provide accurate, up-to-date context.
*   **Creative Engine**: Generate synthetic assets or visualize concept art for ML architectures using integrated AI image generation.

### 4. Enterprise-Grade Infrastructure
*   **Persistent Checkpoints**: Save your trained model configurations and training states. 
*   **Cloud Sync**: Securely sync your saved models across devices using Supabase integration (requires Sign In).
*   **Guest Mode**: Works out of the box using LocalStorage for persistence without an account.
*   **Universal Theming**: Seamless transition between high-contrast Light and Dark modes.

## 🛠 Tech Stack

*   **Frontend**: React 19, TypeScript, Vite.
*   **Styling**: Tailwind CSS, Custom CSS Variable Theme Engine.
*   **AI**: Google Gemini API (@google/genai) with Search Grounding tools.
*   **Backend & Auth**: Supabase (PostgreSQL & GoTrue).
*   **Icons & Motion**: Lucide React, Framer Motion.

## 📖 How to Use

1.  **Select a Model**: Use the architecture dropdown in the top nav to pick from 15+ models.
2.  **Configure Framework**: Toggle between PyTorch, Keras, or sklearn to see different implementation styles.
3.  **Train**: Head to the "Optimization" or "Performance" module and hit the training pass to see the live simulation.
4.  **Inspect**: Click any layer in the visualization to see detailed stats in the HUD.
5.  **Save**: Use the "Checkpoints" module to name and store your current configuration for later retrieval.

---
*Created for ML educators, researchers, and enthusiasts.*
