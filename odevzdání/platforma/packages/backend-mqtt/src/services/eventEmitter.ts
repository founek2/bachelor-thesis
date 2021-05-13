import { EventEmitter } from "events";
import * as types from "../types";
import type { IDevice, DeviceCommand } from "common/lib/models/interface/device";
import { IThing, IThingProperty } from "common/lib/models/interface/thing";
import { IUser } from "common/lib/models/interface/userInterface";

type EventMap = Record<string, any>;

type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

export interface Emitter<T extends EventMap> {
    on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
    off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
    emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
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

export interface deviceSetState {
    device: {
        _id?: IDevice["_id"];
        things: IDevice["things"];
        metadata: IDevice["metadata"];
    };
    nodeId: IThing["config"]["nodeId"];
    propertyId: IThingProperty["propertyId"];
    value: string | number;
}

export interface EmitterEvents {
    device_pairing_init: { deviceId: IDevice["_id"]; apiKey: IDevice["apiKey"] };
    device_pairing_done: IDevice;
    device_set_state: deviceSetState;
    device_send_command: { device: IDevice, command: DeviceCommand }
}

class MyClass extends MyEmitter<EmitterEvents> { }

export default new MyClass();
