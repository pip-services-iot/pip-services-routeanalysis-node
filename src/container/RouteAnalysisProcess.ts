import { IReferences } from 'pip-services3-commons-node';
import { ProcessContainer } from 'pip-services3-container-node';
import { DefaultRpcFactory } from 'pip-services3-rpc-node';

import { RoutesClientFactory } from 'pip-clients-routes-node';

import { RouteAnalysisServiceFactory } from '../build/RouteAnalysisServiceFactory';

export class RouteAnalysisProcess extends ProcessContainer {

    public constructor() {
        super("route_analysis", "Route analysis microservice");
        this._factories.add(new RouteAnalysisServiceFactory);
        this._factories.add(new RoutesClientFactory());
        this._factories.add(new DefaultRpcFactory);
    }

}
