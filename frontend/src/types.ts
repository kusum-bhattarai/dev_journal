export interface User {
    user_id: number;
    username: string;
    email: string;
}

export interface Conversation {
    conversation_id: number;
    user1_id: number;
    user2_id: number;
    last_message_id?: number;
    created_at: string;
}

export interface Message {
    message_id: number;
    conversation_id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    timestamp: string;
    read_status: boolean;
}