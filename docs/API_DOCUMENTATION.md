# API Documentation

This document outlines the REST API endpoints for the DevJournal microservices. All protected routes require an `Authorization: Bearer <JWT>` header.

---

## User Service

-   **Base URL**: `http://localhost:3001`

| Method | Endpoint                  | Description                                                                                                                              | Body / Params                                                                   | Protected |
| :----- | :------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------ | :-------- |
| `POST` | `/auth/register`          | Registers a new user with an email and password.                                                                                    | `{ "username": "string", "email": "string", "password": "string" }`             | No        |
| `POST` | `/auth/login`             | Logs in a user with an email and password and returns a JWT.                                                                      | `{ "email": "string", "password": "string" }`                                   | No        |
| `GET`  | `/auth/github`            | Initiates the GitHub OAuth flow. A `state` query param (`login` or `register`) should be included to specify the desired action. | `?state=login` or `?state=register`                                             | No        |
| `GET`  | `/auth/github/callback`   | Callback URL for GitHub OAuth. The server handles token generation or status redirects from here.                               | N/A                                                                             | No        |
| `GET`  | `/users`                  | Searches for users by username or email based on a query parameter.                                                             | `?search={query}`                                                               | Yes       |

---

## Journal Service

-   **Base URL**: `http://localhost:3002`

| Method   | Endpoint          | Description                                                                 | Body / Params                      | Protected                  |
| :------- | :---------------- | :-------------------------------------------------------------------------- | :--------------------------------- | :------------------------- |
| `GET`    | `/api/journals`   | Fetches all journal entries for the authenticated user, ordered by most recent. | N/A                                | Yes              |
| `POST`   | `/api/journals`   | Creates a new journal entry.                                                | `{ "content": "string" }`    | Yes              |
| `DELETE` | `/api/journals/:id` | Deletes a specific journal entry owned by the user.                         | `id` (URL param)           | Yes              |

---

## Chat Service

-   **Base URL**: `http://localhost:3003`

| Method | Endpoint                   | Description                                                                                             | Body / Params                                | Protected |
| :----- | :------------------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------------------- | :-------- |
| `POST` | `/conversations`           | Creates a new conversation between two users if one doesn't already exist.                              | `{ "user1Id": number, "user2Id": number }`   | Yes       |
| `GET`  | `/conversations`           | Fetches all conversations for the authenticated user, including data about the other participant and the last message. | N/A                                          | Yes       |
| `GET`  | `/messages/:conversationId`| Fetches all messages for a specific conversation.                                              | `conversationId` (URL param)                 | Yes       |