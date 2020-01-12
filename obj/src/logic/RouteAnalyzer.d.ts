import { CurrentObjectRouteV1 } from '../data/version1/CurrentObjectRouteV1';
import { ObjectPositionV1 } from '../data/version1/ObjectPositionV1';
export declare class RouteAnalyzer {
    static checkEmptyRoute(route: CurrentObjectRouteV1): boolean;
    static checkObsoleteRoute(route: CurrentObjectRouteV1, position: ObjectPositionV1): boolean;
    static checkLongRoute(route: CurrentObjectRouteV1): boolean;
    static checkMovedAfterStop(route: CurrentObjectRouteV1, pos: ObjectPositionV1): boolean;
    static checkStoppedAfterMove(route: CurrentObjectRouteV1, pos: ObjectPositionV1): boolean;
    static checkStartedStaying(route: CurrentObjectRouteV1, pos: ObjectPositionV1): boolean;
}
