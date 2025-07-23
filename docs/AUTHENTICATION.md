# Authentication Flow

Authentication in DevJournal is handled via JSON Web Tokens (JWT). The token is used to secure REST API endpoints and to authenticate real-time WebSocket connections.

## 1. JWT Strategy

When a user successfully logs in, the User Service generates a JWT.

-   **Payload**: The JWT payload contains the user's ID (`userId`).
-   **Expiration**: The token is set to expire in **1 hour**.
-   **Usage**: For all requests to protected REST endpoints, the client must include the token in the `Authorization` header.
    ```
    Authorization: Bearer <your_jwt_token>
    ```

## 2. GitHub OAuth Flow

The application uses the `state` query parameter to manage distinct registration and login flows via GitHub.

### Registration with GitHub

1.  A new user clicks the "Register with GitHub" link on the frontend, which navigates to `http://localhost:3001/auth/github?state=register`.
2.  The backend User Service receives the request, sees `state=register`, and initiates the Passport.js GitHub authentication flow, passing the state along.
3.  After the user authorizes on GitHub, they are redirected to the backend's `/auth/github/callback` endpoint.
4.  The backend logic for the `register` state is triggered:
    -   If a user with that GitHub ID already exists, it aborts and redirects to the frontend: `http://localhost:3000/login?status=already-registered`.
    -   If the GitHub ID is new, a user record is created in the database. The user is then redirected to the login page with a success message: `http://localhost:3000/login?status=registered`.

### Login with GitHub

1.  An existing user clicks the "Login with GitHub" link, which navigates to `http://localhost:3001/auth/github?state=login`.
2.  The backend receives `state=login` and initiates the same Passport.js flow.
3.  After GitHub authorization, the user is sent to the `/auth/github/callback` endpoint.
4.  The backend logic for the `login` state is triggered:
    -   If a user with that GitHub ID is found, the backend generates a JWT and redirects the user to the frontend home page with the token in the URL: `http://localhost:3000/?token=<your_jwt_token>`.
    -   If no user with that GitHub ID is found, it aborts and redirects to the frontend login page with a status message: `http://localhost:3000/login?status=not-registered`.

## 3. WebSocket Authentication

The Chat Service requires an authenticated WebSocket connection.

-   **Connection Handshake**: The client sends its JWT in the `auth` object of the Socket.IO connection handshake.
-   **Server-Side Middleware**: A middleware on the Chat Service verifies the incoming JWT. If valid, it attaches the `userId` to the socket instance for use in all subsequent real-time events. If invalid, the connection is refused.