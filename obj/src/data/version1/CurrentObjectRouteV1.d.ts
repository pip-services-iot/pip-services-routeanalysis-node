import { IStringIdentifiable } from 'pip-services3-commons-node';
import { AddressV1 } from 'pip-clients-routes-node';
import { ObjectPositionV1 } from './ObjectPositionV1';
export declare class CurrentObjectRouteV1 implements IStringIdentifiable {
    id: string;
    org_id: string;
    object_id: string;
    type?: string;
    start_time?: Date;
    start_addr?: AddressV1;
    end_time?: Date;
    end_addr?: AddressV1;
    duration?: number;
    compressed?: number;
    positions?: ObjectPositionV1[];
}
