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
    other_user_id?: number;
    other_username?: string;
    last_message_content?: string;
    last_message_timestamp?: string;
    read_status?: boolean;
    last_message_sender_id?: number;
    message_type?: 'text' | 'journal_share';
    metadata?: {
        journalId?: number;
    };
}

export interface Message {
    message_id: number;
    conversation_id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    timestamp: string;
    read_status: boolean;
    message_type: 'text' | 'journal_share';
    metadata: {
        journalId?: number; // '?' makes it optional, for text messages
    } | null;
}