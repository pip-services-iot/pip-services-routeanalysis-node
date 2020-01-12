let _ = require('lodash');
let async = require('async');
let geojson = require('geojson-utils');

import { ConfigParams, IOpenable, IdGenerator } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { IReferences } from 'pip-services3-commons-node';
import { Descriptor } from 'pip-services3-commons-node';
import { IReferenceable } from 'pip-services3-commons-node';
import { DependencyResolver } from 'pip-services3-commons-node';
import { FilterParams } from 'pip-services3-commons-node';
import { PagingParams } from 'pip-services3-commons-node';
import { DataPage } from 'pip-services3-commons-node';
import { ICommandable } from 'pip-services3-commons-node';
import { CommandSet } from 'pip-services3-commons-node';
import { DateTimeConverter } from 'pip-services3-commons-node';
import { CompositeLogger } from 'pip-services3-components-node';
import { ICache } from 'pip-services3-components-node';
import { ILock } from 'pip-services3-components-node';

import { ObjectRouteV1, RouteTypeV1 } from 'pip-clients-routes-node';
import { IRoutesClientV1, PositionV1 } from 'pip-clients-routes-node';

import { ObjectPositionV1 } from '../data/version1/ObjectPositionV1';
import { TimedPositionV1 } from '../data/version1/TimedPositionV1';
import { CurrentObjectRouteV1 } from '../data/version1/CurrentObjectRouteV1';
import { IRouteAnalysisPersistence } from '../persistence/IRouteAnalysisPersistence';
import { IRouteAnalysisController } from './IRouteAnalysisController';
import { RouteAnalysisCommandSet } from './RouteAnalysisCommandSet';
import { RouteAnalyzer } from './RouteAnalyzer';
import { RouteCalculator } from './RouteCalculator';
import { RouteConstants } from './RouteConstants';
import { ContainerReferences } from 'pip-services3-container-node';

export class RouteAnalysisController implements IConfigurable, IReferenceable, IOpenable, ICommandable, IRouteAnalysisController {
    private static _defaultConfig: ConfigParams = ConfigParams.fromTuples(
        'dependencies.cache', '*:cache:*:*:1.0',
        'dependencies.lock', '*:lock:*:*:1.0',
        'dependencies.persistence', 'pip-services-routeanalysis:persistence:*:*:1.0',
        'dependencies.routes', 'pip-services-routes:client:*:*:1.0',
    );

    private _cache: ICache = null;
    private _lock: ILock = null;
    private _logger: CompositeLogger = new CompositeLogger();
    private _dependencyResolver: DependencyResolver = new DependencyResolver(RouteAnalysisController._defaultConfig);
    private _persistence: IRouteAnalysisPersistence;
    private _routesClient: IRoutesClientV1;
    private _commandSet: RouteAnalysisCommandSet;

    private _lockTimeout: number = 5000;
    private _cacheTimeout: number = 5 * 60000;
    private _offlineCheckTimer: any;
    private _offlineCheckInterval: number = RouteConstants.CUTOFF_TIMEOUT;

    public configure(config: ConfigParams): void {
        this._logger.configure(config);
        this._dependencyResolver.configure(config);

        this._offlineCheckInterval = config.getAsIntegerWithDefault('options.offline_check_interval', this._offlineCheckInterval);
        this._lockTimeout = config.getAsIntegerWithDefault('options.lock_timeout', this._lockTimeout);
        this._cacheTimeout = config.getAsIntegerWithDefault('options.cache_timeout', this._cacheTimeout);
    }

    public setReferences(references: IReferences): void {
        this._logger.setReferences(references);
        this._dependencyResolver.setReferences(references);

        this._cache = this._dependencyResolver.getOneOptional<ICache>('cache');
        this._lock = this._dependencyResolver.getOneOptional<ILock>('lock');
        this._persistence = this._dependencyResolver.getOneRequired<IRouteAnalysisPersistence>('persistence');
        this._routesClient = this._dependencyResolver.getOneRequired<IRoutesClientV1>('routes');
    }

    public getCommandSet(): CommandSet {
        if (this._commandSet == null)
            this._commandSet = new RouteAnalysisCommandSet(this);
        return this._commandSet;
    }

    public isOpen(): boolean {
        return this._offlineCheckTimer != null;
    }

    public open(correlationId: string, callback: (err: any) => void): void {
        if (this._offlineCheckTimer == null) {
            this._offlineCheckTimer = setInterval(() => {
                this.processObsoleteRoutes();
            }, this._offlineCheckInterval * 1000);
        }

        if (callback) callback(null);
    }

    public close(correlationId: string, callback: (err: any) => void): void {
        if (this._offlineCheckTimer) {
            clearInterval(this._offlineCheckTimer);
            this._offlineCheckTimer = null;
        }

        if (callback) callback(null);
    }

    private toRoute(route: CurrentObjectRouteV1): ObjectRouteV1 {
        return {
            id: route.id,
            org_id: route.org_id,
            object_id: route.object_id,
            type: route.type,
            start_time: route.start_time,
            start_addr: route.start_addr,
            end_time: route.end_time,
            end_addr: route.end_addr,
            duration: route.duration,
            positions: route.positions
        };
    }

    private toHistoricalRoute(route: CurrentObjectRouteV1): ObjectRouteV1 {
        return {
            id: null,
            org_id: route.org_id,
            object_id: route.object_id,
            type: route.type || RouteTypeV1.Travel,
            start_time: route.start_time,
            start_addr: route.start_addr,
            end_time: route.end_time,
            end_addr: route.end_addr,
            duration: route.duration,
            positions: route.positions
        };
    }

    private filterPositions(route: ObjectRouteV1, fromTime: Date, toTime: Date): ObjectRouteV1 {
        if (route == null || route.positions == null) return route;
        if (fromTime != null) {
            route.positions = _.filter(route.positions, p => p.time >= fromTime);
        }

        if (toTime != null) {
            route.positions = _.filter(route.positions, p => p.time < toTime);
        }

        return route;
    }

    private compressPositions(route: ObjectRouteV1, compressVal: number): ObjectRouteV1 {
        let newPositions = [];
        let i: number;
        for (i = 0; i < route.positions.length; i = i + compressVal) {
            newPositions.push(route.positions[i]);
        }

        // add last position
        if (i - compressVal != route.positions.length - 1) {
            newPositions.push(route.positions[route.positions.length - 1])
        }

        route.positions = newPositions;

        return route;
    }

    private getLastPosition(route: CurrentObjectRouteV1): ObjectPositionV1 {
        if (!route) return null;
        if (!route.positions || route.positions.length == 0) return null;

        if (route.type == RouteTypeV1.Travel) {
            return route.positions[route.positions.length - 1];
        } else {
            //  parametrs from last   stop route position
            let pos = route.positions[route.positions.length - 1];
            // take position from stop route, other positions delete when route simplify
            pos.lat = route.positions[0].lat;
            pos.lng = route.positions[0].lng;

            return pos;
        }
    } 

    public getCurrentRoutes(correlationId: string, filter: FilterParams, paging: PagingParams,
        callback: (err: any, page: DataPage<ObjectRouteV1>) => void): void {
        this._persistence.getPageByFilter(correlationId, filter, paging, (err, page) => {
            if (page != null) {
                page.data = _.map(page.data, d => this.toRoute(d));
                // Perform point filtering by time
                if (filter != null) {
                    let fromTime = filter.getAsNullableDateTime('from_time');
                    let toTime = filter.getAsNullableDateTime('to_time');
                    let compress = filter.getAsNullableLong('compress');
                    if (fromTime != null || toTime != null)
                        page.data = _.map(page.data, d => this.filterPositions(d, fromTime, toTime));

                    // make compression
                    if (compress)
                        _.each(page.data, (route: ObjectRouteV1) => {
                            if (route.type == RouteTypeV1.Travel && route.positions && route.positions.length > 2) {
                                route = this.compressPositions(route, compress);
                            }
                        });
                }
            }

            callback(err, <any>page);
        });
    }

    public getCurrentRoute(correlationId: string, objectId: string, fromTime: Date, toTime: Date, 
        callback: (err: any, route: ObjectRouteV1) => void): void {
        this._persistence.getOneById(correlationId, objectId, (err, data) => {
            let route = data != null ? this.toRoute(data) : null;

            // Perform point filtering by time
            if (route != null)
                route = this.filterPositions(route, fromTime, toTime);

            callback(err, route);
        });
    }

    public getNextRoute(route: CurrentObjectRouteV1, pos: ObjectPositionV1): CurrentObjectRouteV1 {
        // For empty route there is no cutoff
        if (RouteAnalyzer.checkEmptyRoute(route))
            return null;

        // For obsolete route cut the entire route
        if (RouteAnalyzer.checkObsoleteRoute(route, pos)) {
            return RouteCalculator.makeEmptyRoute(pos);
        }

        // For too long routes
        if (RouteAnalyzer.checkLongRoute(route)) {
            let lastPos: ObjectPositionV1 = this.getLastPosition(route);
            lastPos.object_id = lastPos.object_id ? lastPos.object_id : route.object_id;
            lastPos.org_id = lastPos.org_id ? lastPos.org_id : route.org_id;

            return RouteCalculator.makeNextRoute(lastPos);
        }

        // When object started to move after stop
        if (route.type == RouteTypeV1.Stop || route.type == RouteTypeV1.Stay) {
            if (RouteAnalyzer.checkMovedAfterStop(route, pos)) {
                // todo check DIFF_TIME between stop position and current position, now CUTOFF_TIMEOUT
                let lastPos: ObjectPositionV1 = this.getLastPosition(route);
                lastPos.object_id = lastPos.object_id ? lastPos.object_id : route.object_id;
                lastPos.org_id = lastPos.org_id ? lastPos.org_id : route.org_id;
    
                return RouteCalculator.makeNextRoute(lastPos);
                // return RouteCalculator.makeEmptyRoute(pos);
            }
        }

        // When object stopped after moving
        if (route.type == RouteTypeV1.Travel) {
            if (RouteAnalyzer.checkStoppedAfterMove(route, pos)) {
                // let stopTime = new Date(pos.time.getTime() - RouteConstants.STOP_TIMEOUT);
                // let nextRoute = RouteCalculator.timeCutOffRoute(route, stopTime);
                let distance = RouteConstants.STOP_DISTANCE;
                let nextRoute = RouteCalculator.distanceCutOffRoute(route, pos, distance);
                if (nextRoute != null)
                    nextRoute.type = RouteTypeV1.Stop;
                else route.type = RouteTypeV1.Stop;
                return nextRoute;
            }
        }

        // Switch to stay
        if (route.type == RouteTypeV1.Stop) {
            if (RouteAnalyzer.checkStartedStaying(route, pos))
                route.type = RouteTypeV1.Stay;
        }

        return null;
    }

    private acquireRouteLock(correlationId: string, objectId: string,
        callback: (err: any, result: boolean) => void): void {

        if (this._lock == null) {
            callback(null, true);
            return;
        }

        let key = "pip-services-routeanalysis:" + objectId;
        this._lock.tryAcquireLock(correlationId, key, this._lockTimeout, callback);
    }

    private releaseRouteLock(correlationId: string, objectId: string,
        callback?: (err: any) => void): void {

        if (this._lock == null) {
            callback(null);
            return;
        }

        let key = "pip-routeanalysis-lock:" + objectId;
        this._lock.releaseLock(correlationId, key, callback);
    }

    private loadRouteFromCache(correlationId: string, objectId: string,
        callback: (err: any, route: CurrentObjectRouteV1) => void): void {

        if (this._cache == null) {
            callback(null, null);
            return;
        }

        let key = "pip-routeanalysis-value:" + objectId;
        this._cache.retrieve(correlationId, key, callback);
    }

    private saveRouteToCache(correlationId: string, route: CurrentObjectRouteV1,
        callback: (err: any) => void): void {

        if (this._cache == null) {
            callback(null);
            return;
        }

        let key = "pip-routeanalysis-value:" + route.object_id;
        this._cache.store(correlationId, key, route, this._cacheTimeout, callback);
    }

    private fixPosition(position: ObjectPositionV1): ObjectPositionV1 {
        position.time = DateTimeConverter.toDateTime(position.time);
        return position;
    }

    public addPosition(correlationId: string, position: ObjectPositionV1,
        callback?: (err: any) => void): void {
        let route: CurrentObjectRouteV1;
        let locked: boolean = false;

        if (position == null || position.object_id == null || position.lat == null || position.lng == null
            || position.lat == NaN || position.lng == NaN) {
            if (callback) callback(null);
            return;
        }

        // Convert time just in case
        position = this.fixPosition(position);
        async.series([
            // Obtain lock
            (callback) => {
                this.acquireRouteLock(correlationId, position.object_id, (err, result) => {
                    locked = err == null && result;
                    callback(err);
                });
            },
            // Read route from cache
            (callback) => {
                this.loadRouteFromCache(correlationId, position.object_id, (err, data) => {
                    route = data;
                    callback(err);
                });
            },
            // Retrieve current route
            (callback) => {
                // If route was retrieved from cache then exit
                if (route != null) {
                    callback(null);
                    return;
                }

                this._persistence.getOneById(correlationId, position.object_id, (err, data) => {
                    route = data;

                    // Initialize route if it didn't exist
                    if (err == null && route == null) {
                        route = RouteCalculator.makeEmptyRoute(position);
                    }

                    callback(err);
                });
            },
            // check last position time
            (callback) => {
                // If route was retrieved from cache then exit
                if (route == null) {
                    callback(null);
                    return;
                }

                if (route.end_time < position.time) {
                    callback(null);
                    return;
                }

                // skip position
                callback('abort');
            },
            // Save old route if it has to split
            (callback) => {
                let nextRoute = this.getNextRoute(route, position);

                if (nextRoute == null) {
                    callback(null);
                    return;
                }

                // Save old route asynchronously
                let historicalRoute = this.toHistoricalRoute(route);
                historicalRoute = RouteCalculator.simplifyRoute(historicalRoute);

                this._routesClient.createRoute(correlationId, historicalRoute.org_id, historicalRoute, (err) => {
                    // Reset route after saving
                    // if (err == null) {
                    //     route = nextRoute;
  
                    // }
                    
                    if (err) {
                        this._logger.error(correlationId, err, 'Error adding route for object: ' + historicalRoute.object_id + ' org_id: ' + historicalRoute.org_id
                        + ' type: ' + historicalRoute.type + ' pos: ' + historicalRoute.positions.length
                        + ' duration ' + historicalRoute.duration + ' new route positions :  ' + route.positions + ' err:  ' + err);
                    } else {
                    }
                    // callback(err);
                });

                route = nextRoute;
                callback(null);
            },
            // Add point and save current route
            (callback) => {
                RouteCalculator.addPosition(route, position);
                this._persistence.set(correlationId, route, callback);
            },
            // Store route into cache
            (callback) => {
                this.saveRouteToCache(correlationId, route, callback);
            }
        ], (err) => {
            if (err == 'abort') err = null;

            if (locked) {
                this.releaseRouteLock(correlationId, position.object_id, (err2) => {
                    if (callback) callback(err || err2);
                });
            } else if (callback) callback(err);
        });
    }

    public addPositions(correlationId: string, positions: ObjectPositionV1[],
        callback?: (err: any) => void): void {
        if (positions == null || positions.length == 0) {
            if (callback) callback(null);
            return;
        }

        positions = _.sortBy(positions, (p) => new Date(p.time).getTime());

        async.eachSeries(positions, (position, callback) => {
            if (position.object_id) 
                this.addPosition(correlationId, position, callback);
                else callback();
        }, callback);
    }

    private processObsoleteRoute(correlationId: string, route: CurrentObjectRouteV1,
        callback: (err: any) => void): void {

        // Protect against empty routes
        if (RouteAnalyzer.checkEmptyRoute(route)) {
            callback(null);
            return;
        }

        let locked: boolean = false;
        this._logger.debug(correlationId, 'processObsoleteRoute for object start: ' + route.object_id
        + ' type: ' + route.type + ' end_time: ' + route.end_time
        + ' now: ' + new Date());
        async.series([
            // Lock route
            (callback) => {
                this.acquireRouteLock(correlationId, route.object_id, (err, result) => {
                    locked = err == null && result;
                    callback(err);
                });
            },
            // Save obsolete route into history
            (callback) => {
                // Save old route asynchronously
                let historicalRoute = this.toHistoricalRoute(route);
                historicalRoute = RouteCalculator.simplifyRoute(historicalRoute);

                this._routesClient.createRoute("pip-services-routeanalysis", historicalRoute.org_id, historicalRoute, callback);
            },
            // Clear and save route into database
            (callback) => {
                route = RouteCalculator.clearRoute(route);
                this._persistence.set("pip-services-routeanalysis", route, callback);
            },
            // Store route into cache
            (callback) => {
                this.saveRouteToCache(correlationId, route, callback);
            }
        ], (err) => {
            if (locked) {
                this.releaseRouteLock(correlationId, route.object_id, (err2) => {
                    callback(err || err2);
                });
            } else callback(err);
        });
    }

    public processObsoleteRoutes(callback?: (err: any) => void): void {
        let completed = false;
        let now = new Date().getTime();
        let cutOffTime = new Date(now - RouteConstants.CUTOFF_TIMEOUT * 1000);
        let filter = FilterParams.fromTuples(
            'until_time', cutOffTime
        );

        async.whilst(
            () => { return !completed; },
            (callback) => {
                this._persistence.getPageByFilter(
                    "pip-services-routeanalysis", filter, null,
                    (err, page) => {
                        if (err) {
                            callback(err);
                            return;
                        }

                        if (page.data == null || page.data.length == 0) {
                            completed = true;
                            callback();
                            return;
                        }

                        async.each(page.data, (route, callback) => {
                            this.processObsoleteRoute("pip-services-routeanalysis", route, callback);
                        }, callback);
                    }
                )
            },
            (err) => {
                if (err)
                    this._logger.error("pip-services-routeanalysis", err, "Failed to process obsolete routes");

                if (callback) callback(err);
            }
        );
    }

}
