# DevJournal: A Matrix-Inspired Daily Journal for Developers

## Project Overview

DevJournal is a personal journaling application designed for developers, blending the aesthetic of "The Matrix" with functional features for logging coding thoughts, progress, and solutions. It combines private note-taking with a real-time chat system, allowing users to record journal entries and communicate with others. The application is built on a microservice architecture.

-   **User Service**: Manages user authentication, registration, and GitHub OAuth.
-   **Journal Service**: Handles creation, retrieval, and deletion of journal entries.
-   **Chat Service**: Enables real-time messaging between users.

## Core Features

-   **Secure User Authentication**: Provides two paths for users:
    -   **Manual**: Standard email/password registration and login with password hashing using `bcryptjs`.
    -   **GitHub OAuth**: Separate flows for registering or logging in with a GitHub account.
-   **Journal Management**:
    -   Users can create new journal entries on the home page.
    -   View a list of all past entries, sorted by creation date.
    -   Delete entries directly from the list.
    -   Clicking an entry opens a modal to display the full content.
-   **Markdown Highlighting**: Journal entries are rendered in a modal with Markdown syntax highlighting, powered by Prism.js.
-   **Real-Time Chat**:
    -   Search for users to start new conversations.
    -   View a list of existing conversations.
    -   Send and receive messages in real-time.
    -   See message timestamps and read-status indicators.
-   **Matrix-Inspired UI**: A visually distinctive interface tailored for developers.

## Project Architecture & Documentation

This project is divided into multiple services. For detailed technical information, please refer to the documentation below:

* **[Authentication Flow](./docs/AUTHENTICATION.md)**: Explains the JWT and WebSocket authentication strategies.
* **[API Documentation](./docs/API_DOCUMENTATION.md)**: Details the REST endpoints for each microservice.
* **[Chat Service Internals](./docs/CHAT_SERVICE.md)**: A deep dive into the WebSocket events and real-time architecture.

## Technologies Used

### Backend
-   **Node.js & Express**: Web application framework and runtime.
-   **PostgreSQL**: Relational database, connected via a connection pool.
-   **Socket.IO**: Real-time WebSocket communication.
-   **jsonwebtoken**: JWT-based authentication.
-   **passport & passport-github2**: GitHub OAuth integration.
-   **bcryptjs**: Password hashing.

### Frontend
-   **React & TypeScript**: For building typed, component-based user interfaces.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **React Router DOM**: Declarative routing.
-   **Prism.js**: Syntax highlighting for code snippets in journal entries.
-   **axios**: HTTP client for API calls.

## Getting Started

### Prerequisites
-   Node.js (LTS version)
-   npm
-   PostgreSQL

### Installation
1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/kusum-bhattarai/dev_journal.git](https://github.com/kusum-bhattarai/dev_journal.git)
    cd dev_journal
    ```
2.  **Install backend dependencies**:
    ```bash
    cd backend/user-service
    npm install
    cd ../journal-service
    npm install
    cd ../chat-service
    npm install
    cd ../..
    ```
3.  **Install frontend dependencies**:
    ```bash
    cd frontend
    npm install
    cd ..
    ```