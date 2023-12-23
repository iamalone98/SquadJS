export declare const initLogger: (id: number, enabled: boolean) => {
    log: (...text: string[]) => void;
    warn: (...text: string[]) => void;
    error: (...text: string[]) => void;
};
