# DevJournal: A Matrix-Inspired Daily Journal for Developers

## Project Overview

DevJournal is a personal journaling application designed specifically for developers. Inspired by the aesthetic and thematic elements of "The Matrix," it provides a minimalist yet functional interface for logging daily coding thoughts, progress, challenges, and solutions. This application aims to help developers reflect on their journey, track their learning, and maintain a consistent record of their professional growth. My vision is to develop something that would be an amalgamation of Notion and Slack where you can dump your thoughts like in Notion while being able to chat with your friends and share those thoughts as in Slack.

The project is structured into two main parts:

  * **Backend:** Handles user authentication, journal entry management, and data storage. It's built with Node.js and Express, using PostgreSQL as the database.
  * **Frontend:** A responsive web application built with React, providing an intuitive interface for users to log in, register, create, view, and manage their journal entries.


## Features

  * **User Authentication:** Secure registration and login for users, including traditional email/password and GitHub OAuth.
  * **Journal Management:** Create, view, and manage personal journal entries.
  * **Markdown Support:** (Planned/Future) Render journal entries with Markdown for rich formatting.
  * **Matrix-Inspired UI:** A unique visual theme that enhances the developer journaling experience.

## Technologies Used

### Backend

  * **Node.js**: JavaScript runtime environment.
  * **Express**: Web application framework.
  * **PostgreSQL**: Relational database.
  * **bcryptjs**: For password hashing.
  * **jsonwebtoken**: For JWT-based authentication.
  * **passport & passport-github2**: For GitHub OAuth integration.
  * **cors**: Middleware for enabling Cross-Origin Resource Sharing.
  * **dotenv**: For managing environment variables.

### Frontend

  * **React**: JavaScript library for building user interfaces.
  * **TypeScript**: Typed superset of JavaScript.
  * **Tailwind CSS**: Utility-first CSS framework for styling.
  * **React Router DOM**: For declarative routing.
  * **axios**: Promise-based HTTP client for the browser and Node.js.
  * **react-icons**: For popular iconography.
  * **Prism.js**: For syntax highlighting of code snippets in journal entries.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:

  * Node.js (LTS version recommended)
  * npm (Node Package Manager, usually comes with Node.js)
  * PostgreSQL

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/kusum-bhattarai/dev_journal.git
    cd dev_journal
    ```

2.  **Install backend dependencies:**

    ```bash
    cd backend/user-service
    npm install
    cd ../journal-service
    npm install
    cd ../.. # Go back to root
    ```

3.  **Install frontend dependencies:**

    ```bash
    cd frontend
    npm install
    cd .. # Go back to root
    ```

### Environment Variables

Create a `.env` file in the `backend/user-service` directory with the following content:

```
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/your_database_name"
JWT_SECRET="your_jwt_secret_key"
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
```

  * Replace `your_username`, `your_password`, and `your_database_name` with your PostgreSQL credentials.
  * `your_jwt_secret_key` should be a strong, random string.
  * `your_github_client_id` and `your_github_client_secret` are obtained by registering a new OAuth application on GitHub. Set the callback URL for GitHub OAuth to `http://localhost:3001/auth/github/callback`.

### Database Setup

1.  **Connect to your PostgreSQL database:**

    ```sql
    CREATE DATABASE your_database_name;
    \c your_database_name
    ```

2.  **Create the `users` table:**

    ```sql
    CREATE TABLE users (
        user_id SERIAL PRIMARY KEY,
        github_id VARCHAR(255) UNIQUE,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ```

3.  **Create the `journals` table (for Journal Service):**

    ```sql
    CREATE TABLE journals (
        journal_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ```

### Running the Application

1.  **Start the User Service (Backend):**

    ```bash
    cd backend/user-service
    npm start # This will run src/index.ts using ts-node
    ```

    The user service will run on `http://localhost:3001`.

2.  **Start the Journal Service (Backend):**
    (This service is currently under development. You would typically run it similarly to the user service once it's set up.)

    ```bash
    cd backend/journal-service
    npm start # Or a similar command as defined in its package.json
    ```

    The journal service is expected to run on `http://localhost:3002` based on the frontend configuration.

3.  **Start the Frontend:**

    ```bash
    cd frontend
    npm start
    ```

    The frontend application will open in your browser at `http://localhost:3000`.

## API Documentation

### User Service API

The User Service handles all user-related operations, including registration, login, and GitHub OAuth. It runs on `http://localhost:3001`.

**Endpoints:**

  * **`POST /auth/register`**

      * **Description:** Registers a new user with a username, email, and password.
      * **Request Body (JSON):**
        ```json
        {
            "username": "yourusername",
            "email": "your_email@example.com",
            "password": "your_password"
        }
        ```
      * **Success Response (201 Created):**
        ```json
        {
            "message": "User registered successfully",
            "user": {
                "user_id": 1,
                "username": "yourusername",
                "email": "your_email@example.com"
            }
        }
        ```
      * **Error Responses:**
          * `400 Bad Request`: If any required field is missing.
          * `409 Conflict`: If a user with the provided email or username already exists.
          * `500 Internal Server Error`: For other server-side errors.

  * **`POST /auth/login`**

      * **Description:** Logs in an existing user with email and password.
      * **Request Body (JSON):**
        ```json
        {
            "email": "your_email@example.com",
            "password": "your_password"
        }
        ```
      * **Success Response (200 OK):**
        ```json
        {
            "token": "your_json_web_token"
        }
        ```
      * **Error Responses:**
          * `400 Bad Request`: If email or password is missing.
          * `401 Unauthorized`: If credentials are invalid.
          * `500 Internal Server Error`: For other server-side errors.

  * **`GET /auth/github`**

      * **Description:** Initiates the GitHub OAuth flow. Redirects to GitHub for authentication.
      * **Query Parameters:**
          * `state`: (Optional) Can be `login` or `register` to indicate the desired action after GitHub authentication.
      * **Redirects to:** GitHub authorization page.

  * **`GET /auth/github/callback`**

      * **Description:** GitHub OAuth callback URL. Handles the response from GitHub.
      * **Redirects to:** Frontend (`http://localhost:3000`) with a `token` (for successful login) or `status` (for registration success/failure or already registered cases) query parameter.

### Journal Service API

The Journal Service will handle the creation, retrieval, updating, and deletion of journal entries. It is expected to run on `http://localhost:3002`.

**Current Status:** This service is the next development step. The following endpoints are planned:

  
## Project Status

The `user-service` and user-related functionalities, including traditional login/registration and GitHub OAuth, and logout are complete. The next major development phase will focus on building out the `journal-service` and integrating it with the frontend.

## Future Enhancements

  * **Markdown Rendering:** Implement full Markdown rendering for journal entries.
  * **Search Functionality:** Allow users to search through their journal entries.
  * **Tagging/Categories:** Add functionality to tag or categorize journal entries.
  * **Deployment:** Set up deployment to a cloud platform.

