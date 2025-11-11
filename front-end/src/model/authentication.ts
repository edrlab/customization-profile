

export interface IAuthentication {
    // group: string;
    id: number;
    username: string;
    timestamp: number;
    counter: number;
    lastConnectionTime: number;
    sessionId: string;
    expiresAt: string;
}