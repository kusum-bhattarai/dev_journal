# Chat Service Internals (Real-Time)

The Chat Service uses Socket.IO to facilitate real-time, bidirectional communication between users.

## Overview

The service is responsible for:
-   Authenticating users via WebSockets.
-   Managing user connections and disconnections.
-   Routing messages within specific conversation rooms.
-   Persisting messages to the database.
-   Tracking and broadcasting message read-status updates.
-   Broadcasting real-time updates for collaborative journal editing.

## Database Schema

The service relies on three primary tables in the PostgreSQL database.

1.  **`conversations`**: Stores a record for each chat thread between two users.
    -   `conversation_id` (Primary Key)
    -   `user1_id` / `user2_id` (Foreign Keys to `users` table, stored in sorted order to ensure uniqueness)
    -   `last_message_id` (Foreign Key to `messages` table, for quick retrieval of last message)
2.  **`messages`**: Stores every message sent in the application.
    -   `message_id` (Primary Key)
    -   `conversation_id` (Foreign Key to `conversations`)
    -   `sender_id` (The ID of the user who sent the message)
    -   `receiver_id` (The ID of the user who received the message)
    -   `content` (The text of the message)
    -   `timestamp`
    -   `read_status` (A boolean indicating if the `receiver_id` has read the message)
    -   `message_type`: An enum or string ('text', 'journal_share') to distinguish between message types.
    -   `metadata`: A JSONB column to store additional data, like `journalId` for shared journals.
3.  **`journal_collaborators`**: Manages user access to shared journals.
    -   `collaboration_id` (Primary Key)
    -   `journal_id` (Foreign Key to `journal_entries`)
    -   `user_id` (Foreign Key to `users`)
    -   `permission` (An ENUM of either 'viewer' or 'editor')

## Socket.IO Event Architecture

Communication is handled through a set of defined events. Authentication is performed once upon connection via the `socketAuthMiddleware`.

### Rooms

To ensure messages are only sent to the intended participants, each conversation and collaborative journal is assigned a unique room.

-   **Chat Rooms**:
    -   **Event**: `joinRoom`
    -   **Room Name Format**: `room_<conversationId>`
-   **Journal Rooms**:
    -   **Event**: `joinJournal`
    -   **Room Name Format**: `journal-room-<journalId>`

### Client-to-Server Events

Events emitted from the React frontend to the Node.js server.

| Event         | Payload                                               | Description                                                                                                                                                                                          |
| :------------ | :---------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `joinRoom`    | `conversationId: number`                              | Instructs the server to add the client's socket to the room for the given conversation, enabling them to receive messages.                                                                        |
| `sendMessage` | `{ conversationId: number, senderId: number, content: string }` | Sends a new message. The server persists it to the database and then broadcasts it to all clients in the corresponding room using the `receiveMessage` event.            |
| `markAsRead`  | `{ conversationId: number, messageIds: number[] }`    | Sent when a user views a conversation. It informs the server to update the `read_status` of the specified messages to `TRUE` for the current user. The server then broadcasts an `messageUpdated` event. |
| `joinJournal` | `journalId: number`                                   | Instructs the server to add the client's socket to the room for the given journal, enabling them to receive real-time updates.                                                                       |
| `journalEdit` | `{ journalId: number, content: string }`                | Sent when a user with "editor" permissions edits a journal. The server broadcasts the updated content to all clients in the journal's room using the `journalUpdate` event.                       |

### Server-to-Client Events

Events emitted from the Node.js server to the React frontend.

| Event          | Payload                                          | Description                                                                                                                                                                 |
| :------------- | :----------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `receiveMessage` | `Message` object                                 | Broadcasts a new message to all clients in a conversation room after it has been successfully saved to the database. The payload is the full message object.               |
| `messageUpdated` | `{ messageIds: number[], read_status: boolean }` | Broadcasts that one or more messages have had their status updated (e.g., marked as read). The client uses this to update the UI with the double-check mark.   |
| `connect_error`| `Error` object                                   | Emitted to the client if the connection is refused by the server (e.g., due to an invalid authentication token).                                                     |
| `messageError` | `{ error: string, details?: string }`            | Sent to the originating client if an action like `sendMessage` or `markAsRead` fails on the server-side for any reason (e.g., invalid data, database error).      |
| `journalUpdate`| `{ content: string }`                            | Broadcasts the updated content of a journal to all clients in the corresponding journal room.                                                                            |