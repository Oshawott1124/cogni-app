# Cogni-App: Your AI-Powered Overlay Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/oshawott1124/cogni-app)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)](https://github.com/oshawott1124/cogni-app/issues)

An intelligent, screen-aware AI assistant that uses screenshots to understand your context and provide help through a customizable, interactive overlay. Built with Electron, React, and TypeScript.

## Key Features

-   **Context-Aware Assistance**: Automatically takes screenshots to understand the content on your screen and provide relevant suggestions.
-   **Customizable Overlay**: A sleek, draggable overlay that provides AI assistance without interrupting your workflow.
-   **Edit Mode**: Easily reposition all overlay components to fit your screen and preferences.
-   **Interactive AI Chat**: A chat interface to directly interact with the AI, ask questions, and get responses.
-   **Suggestion Bubbles**: Get quick, actionable suggestions from the AI based on the on-screen context.
-   **Presentation/Meeting Notes**: A dedicated, resizable area for your notes. Select and send text directly to the AI with a single click.

## Technology Stack

-   **Framework**: [Electron](https://www.electronjs.org/)
-   **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/)
-   **AI Integration**: [OpenAI](https://openai.com/)/[Gemini](https://gemini.google.com/)

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/YifanJin/cogni-app.git
    cd cogni-app
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Application

To run the application in development mode with hot-reloading:

```bash
npm run dev
```

### Building the Application

To build the application for your platform:

```bash
# For Windows
npm run build:win

# For macOS
npm run build:mac

# For Linux
npm run build:linux
```

## Contributing

Contributions are welcome! If you have ideas for new features, bug fixes, or improvements, please feel free to:

1.  **Open an Issue**: Discuss the changes you'd like to make.
2.  **Fork the Repository**: Create your own fork to work on.
3.  **Create a Pull Request**: Submit your changes for review.

Please make sure to follow the existing code style and lint your code before submitting.

```bash
npm run lint
npm run format
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
Copyright (c) Complexity LLC. All rights reserved.

## Acknowledgments

-   Built with the powerful [ElectronVite](https://electron-vite.org/) boilerplate.
-   Icons by [Lucide](https://lucide.dev/).
