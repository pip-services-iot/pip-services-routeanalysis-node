import { IStringIdentifiable } from 'pip-services3-commons-node';
import { PositionV1 } from 'pip-clients-routes-node';
import { AddressV1 } from 'pip-clients-routes-node';

// import { TimedPositionV1 } from './TimedPositionV1';
import { ObjectPositionV1 } from './ObjectPositionV1';

export class CurrentObjectRouteV1 implements IStringIdentifiable {
    public id: string;
    public org_id: string;
    public object_id: string;
    public type?: string;
    public start_time?: Date;
    public start_addr?: AddressV1;
    public end_time?: Date;
    public end_addr?: AddressV1;
    public duration?: number;
    public compressed?: number;
    public positions?: ObjectPositionV1[];  
    // public positions?: TimedPositionV1[];  
}
