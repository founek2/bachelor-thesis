import { IDevice } from "./device";
import { IThing, IThingProperty, PropertyDataType } from "./thing";
import { IUser } from "./userInterface";

export enum NotifyType {
    always = "always",
    below = "below",
    over = "over",
    equal = "equal",
}
const numericNotifyTypes = [NotifyType.below, NotifyType.over, NotifyType.equal, NotifyType.always];
export const NotfyTypeForDataType: { [dataType in PropertyDataType]: NotifyType[] } = {
    [PropertyDataType.string]: [NotifyType.equal, NotifyType.always],
    [PropertyDataType.float]: numericNotifyTypes,
    [PropertyDataType.integer]: numericNotifyTypes,
    [PropertyDataType.boolean]: [NotifyType.equal, NotifyType.always],
    [PropertyDataType.enum]: [NotifyType.equal, NotifyType.always],
};

export const NotifyTypeText: { [dataType in NotifyType]: string } = {
    [NotifyType.always]: "vždy",
    [NotifyType.below]: "pod",
    [NotifyType.equal]: "rovno",
    [NotifyType.over]: "nad",
};

export interface INotifyThingProperty {
    _id?: any;
    propertyId: IThingProperty["propertyId"];
    type: NotifyType;
    value: string | number;
    advanced: {
        interval: number;
        from: string;
        to: string;
        daysOfWeek: number[];
    };
    tmp?: {
        lastSendAt: Date;
        lastSatisfied: Boolean;
    };
}

export interface INotifyThing {
    _id?: any;
    nodeId: IThing["config"]["nodeId"];
    properties: INotifyThingProperty[];
}

export interface INotify {
    _id?: any;
    deviceId: IDevice["_id"];
    userId: IUser["_id"];
    things: INotifyThing[];
}
