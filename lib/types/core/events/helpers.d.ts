/// <reference types="node" />
import EventEmitter from 'events';
export declare const convertObjToArrayEvents: (events: {
    [x: string]: string;
}) => string[];
export declare const chatCommandParser: (listener: EventEmitter) => void;
