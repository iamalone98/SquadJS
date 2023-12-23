/// <reference types="node" />
import EventEmitter from 'events';
import { TEvents } from '../../types';
export declare const initEvents: ({ rconEmitter, logsEmitter }: TEvents) => {
    coreEmitter: EventEmitter;
    localEmitter: EventEmitter;
};
