export declare const initLogger: (id: number) => {
  log: (...text: string[]) => void;
  warn: (...text: string[]) => void;
  error: (...text: string[]) => void;
};
