# DevJournal: A Matrix-Inspired Daily Journal for Developers

[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/kusum-bhattarai/dev_journal/.github/workflows/backend-ci.yml?branch=main&style=flat-square)](https://github.com/kusum-bhattarai/dev_journal/actions)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel)](https://dev-journal-topaz.vercel.app/)
[![AWS](https://img.shields.io/badge/AWS-EC2%20|%20ECR-orange?style=flat-square&logo=amazonaws)](https://aws.amazon.com/)

### [View Live Demo](https://dev-journal-topaz.vercel.app/)
## Project Overview

DevJournal is a personal journaling application designed for developers, blending the aesthetic of "The Matrix" with functional features for logging coding thoughts, progress, and solutions. It combines private note-taking with a real-time collaboration and chat system, allowing users to record journal entries, share them with others, and communicate in real-time.

The application is built on a cloud-native microservice architecture, fully containerized with Docker, and deployed on AWS and Vercel with a CI/CD pipeline for automated builds and deployments.
-   **User Service**: Manages user authentication, registration, and GitHub OAuth.
-   **Journal Service**: Handles CRUD operations for journal entries, collaboration, and sharing.
-   **Chat Service**: Enables real-time messaging between users.

## Core Features

-   **Secure User Authentication**: Provides two paths for users:
    -   **Manual**: Standard email/password registration and login with password hashing using `bcryptjs`.
    -   **GitHub OAuth**: Separate flows for registering or logging in with a GitHub account.
-   **Journal Management**:
    -   Users can create new journal entries on the home page.
    -   View a list of all past entries, sorted by creation date.
    -   Edit or delete entries directly from the list.
    -   **Share entries with other users** with either "viewer" or "editor" permissions.
    -   **Collaborate on journal entries in real-time** with other users who have "editor" permissions.
-   **Markdown Highlighting**: Journal entries are rendered with Markdown syntax highlighting, powered by Prism.js.
-   **Real-Time Chat**:
    -   Search for any user to start a new private conversation.
    -   View a list of all existing conversations with a preview of the last message.
    -   Send and receive messages in real-time, powered by WebSockets.
    -   See message timestamps and read-status indicators.
    -   **Share journal entries directly in chat.**
-   **Matrix-Inspired UI**: A visually distinctive interface with a dark, hacker-themed aesthetic tailored for developers.

## Project Architecture & Documentation

This project is divided into multiple services. For detailed technical information, please refer to the documentation below:

* **[Authentication Flow](./docs/AUTHENTICATION.md)**: Explains the JWT and WebSocket authentication strategies.
* **[API Documentation](./docs/API_DOCUMENTATION.md)**: Details the REST endpoints for each microservice.
* **[Chat Service Internals](./docs/CHAT_SERVICE.md)**: A deep dive into the WebSocket events and real-time architecture.

## Testing

This project includes a comprehensive testing suite for both the frontend and backend services.

### Frontend

The frontend tests are written with **Jest** and **React Testing Library**. To run the tests, navigate to the `frontend` directory and run the following command:
```bash
npm test
```

### Backend
The backend services are tested individually. To run the tests for a specific service, navigate to the service's directory (e.g., backend/user-service) and run the following command:
```bash
npm test
```

##### There is also an E2E test (using Cypress) to test the login, registration, and redirection to the homepage. 

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
-   **Node.js & Express**: Web application framework and runtime.
-   **PostgreSQL**: Relational database, connected via a connection pool.
-   **Socket.IO**: Real-time WebSocket communication.
-   **jsonwebtoken**: JWT-based authentication.
-   **passport & passport-github2**: GitHub OAuth integration.
-   **bcryptjs**: Password hashing.
-   **Docker & Docker Compose**: Containerization and service orchestration.

### Frontend
-   **React & TypeScript**: For building typed, component-based user interfaces.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **React Router DOM**: Declarative routing.
-   **Prism.js**: Syntax highlighting for code snippets in journal entries.
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

### Troubleshooting

- **Docker issues**: Ensure Docker Desktop is running and you have sufficient memory allocated. Check logs with `docker-compose logs` for errors.
- **Database connection errors**: Verify your `.env` file has the correct PostgreSQL connection string and that the database is accessible.
- **GitHub OAuth issues**: Confirm your GitHub OAuth app credentials are correctly set in the `.env` file and that the callback URL matches your local or deployed setup.
- **Frontend not loading**: Ensure the backend services are running and the frontend is configured to point to the correct API base URL (check `frontend/.env`).
