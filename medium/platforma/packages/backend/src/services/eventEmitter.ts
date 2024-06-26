import { EventEmitter } from 'events';
import * as types from '../types';

type EventMap = Record<string, any>;

type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

export interface Emitter<T extends EventMap> {
    on<K extends EventKey<T>>
        (eventName: K, fn: EventReceiver<T[K]>): void;
    off<K extends EventKey<T>>
        (eventName: K, fn: EventReceiver<T[K]>): void;
    emit<K extends EventKey<T>>
        (eventName: K, params: T[K]): void;
}


class MyEmitter<T extends EventMap> implements Emitter<T> {
    private emitter = new EventEmitter();
    on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>) {
        this.emitter.on(eventName, fn);
    }

    off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>) {
        this.emitter.off(eventName, fn);
    }

    emit<K extends EventKey<T>>(eventName: K, params: T[K]) {
        this.emitter.emit(eventName, params);
    }
}

class MyClass extends MyEmitter<types.EmitterEvents> { }

export default new MyClass()