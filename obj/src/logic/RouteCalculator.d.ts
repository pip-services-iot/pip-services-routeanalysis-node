import { CurrentObjectRouteV1 } from '../data/version1/CurrentObjectRouteV1';
import { ObjectPositionV1 } from '../data/version1/ObjectPositionV1';
export declare class RouteCalculator {
    static simplifyRoute(route: any): any;
    static makeEmptyRoute(position: ObjectPositionV1): CurrentObjectRouteV1;
    static makeNextRoute(position: ObjectPositionV1): CurrentObjectRouteV1;
    static clearRoute(route: CurrentObjectRouteV1): CurrentObjectRouteV1;
    static sortPositions(route: CurrentObjectRouteV1): CurrentObjectRouteV1;
    static addPosition(route: CurrentObjectRouteV1, pos: ObjectPositionV1): CurrentObjectRouteV1;
    static findTimeCutOff(route: CurrentObjectRouteV1, time: Date): number;
    static findDistanceCutOff(route: CurrentObjectRouteV1, pos: ObjectPositionV1, maxDistance: number): number;
    static distanceCutOffRoute(route: CurrentObjectRouteV1, pos: ObjectPositionV1, maxDistance: number): CurrentObjectRouteV1;
}
