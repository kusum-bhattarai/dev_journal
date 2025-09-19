# DevJournal: A Matrix-Inspired Daily Journal for Developers

### [View Live Demo](https://dev-journal-topaz.vercel.app/)

## Project Overview

DevJournal is a personal journaling application designed for developers, blending the aesthetic of "The Matrix" with functional features for logging coding thoughts, progress, and solutions. It combines private note-taking with a real-time collaboration and chat system, allowing users to record journal entries, share them with others, and communicate in real-time.

The application is built on a cloud-native microservice architecture, fully containerized with Docker, and deployed on AWS and Vercel with a CI/CD pipeline for automated builds and deployments.

-   **User Service**: Manages user authentication, registration, and GitHub OAuth.
-   **Journal Service**: Handles CRUD operations for journal entries, collaboration, and sharing.
-   **Chat Service**: Enables real-time messaging and notifications between users.

---

## Core Features

-   **Secure User Authentication**: Provides two paths for users:
    -   **Manual**: Standard email/password registration and login with password hashing using `bcrypt`.
    -   **GitHub OAuth**: Securely register or log in with a GitHub account.
-   **Full Journal Management**:
    -   Create, view, update, and delete journal entries.
    -   A dashboard to view all past entries, sorted by creation date.
-   **Journal Sharing & Collaboration**:
    -   Share journal entries with other users by granting either "viewer" or "editor" permissions.
    -   When a journal is shared, the recipient instantly receives a notification and a link to the journal in their chat window.
-   **Real-Time Chat**:
    -   Search for any user to start a new private conversation.
    -   View a list of all existing conversations with a preview of the last message.
    -   Send and receive messages in real-time, powered by WebSockets.
-   **Matrix-Inspired UI**: A visually distinctive interface with a dark, hacker-themed aesthetic tailored for developers.

---

## Deployment & Infrastructure

The application is fully deployed to the cloud using modern DevOps practices.

-   **Frontend Hosting**: The React frontend is deployed on **Vercel**, providing a global CDN for fast load times.
-   **Backend Hosting**: The three backend microservices are containerized with **Docker** and run on a single **AWS EC2** instance.
-   **Container Registry**: Docker images for each service are stored in **AWS ECR (Elastic Container Registry)**.
-   **CI/CD**: A **GitHub Actions** workflow automatically builds and pushes new Docker images to ECR whenever changes are pushed to the `main` branch.
-   **Database**: A serverless **PostgreSQL** database hosted on **Neon**, which scales to zero when not in use to stay within the free tier.
-   **Reverse Proxy & Security**: **Nginx** is used as a reverse proxy on the EC2 instance to route traffic to the appropriate microservice. **Certbot** and **Let's Encrypt** provide free, auto-renewing SSL certificates, ensuring all API communication is secure over HTTPS.


---

## Technologies Used

### Backend
-   **Node.js & Express**: Web application framework.
-   **PostgreSQL**: Relational database.
-   **Socket.IO**: Real-time WebSocket communication.
-   **jsonwebtoken**: JWT-based authentication.
-   **Passport.js**: GitHub OAuth integration.
-   **bcrypt**: Password hashing.
-   **Docker & Docker Compose**: Containerization and service orchestration.

### Frontend
-   **React & TypeScript**: Component-based UI library.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **React Router DOM**: Declarative routing.
-   **axios**: HTTP client for API calls.
-   **Socket.IO Client**: Real-time client-side communication.

### Infrastructure
-   **AWS (EC2, ECR)**: Cloud hosting and container registry.
-   **Vercel**: Frontend deployment and hosting.
-   **Neon**: Serverless PostgreSQL hosting.
-   **Nginx**: Reverse proxy and SSL termination.
-   **GitHub Actions**: Continuous Integration & Continuous Deployment (CI/CD).

---

## Local Development Setup

### Prerequisites
-   Node.js (LTS version)
-   npm
-   Docker & Docker Compose
-   A local PostgreSQL instance or a cloud-hosted one like Neon.

### Installation & Setup
1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/kusum-bhattarai/dev_journal.git](https://github.com/kusum-bhattarai/dev_journal.git)
    cd dev_journal
    ```
2.  **Configure Environment Variables**:
    - In the root of the `backend` directory, create a `.env` file.
    - Copy the contents of `.env.example` (if available) or add the required variables for database connection strings, JWT secrets, and GitHub OAuth credentials.

3.  **Install Dependencies**:
    - Run `npm install` inside each of the three `backend` service directories (`user-service`, `journal-service`, `chat-service`).
    - Run `npm install` inside the `frontend` directory.

4.  **Run Locally**:
    - You can run each service individually using `npm start` in their respective directories.
    - For a more integrated setup, you can adapt the project's `docker-compose.yml` file for local development.
