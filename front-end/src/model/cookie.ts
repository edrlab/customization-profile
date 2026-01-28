

export interface IAuthentication {
    // group: string;
    id: number;
    username: string;
    timestamp: number;
    counter: number;
    lastConnectionTime: number;
}

export interface ISession {
    session: string;
    expiresAt: string;
}