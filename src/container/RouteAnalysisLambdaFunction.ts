import { Descriptor } from 'pip-services3-commons-node';
import { IReferences } from 'pip-services3-commons-node';
import { CommandableLambdaFunction } from 'pip-services3-aws-node';

import { RoutesClientFactory } from 'pip-clients-routes-node';

import { RouteAnalysisServiceFactory } from '../build/RouteAnalysisServiceFactory';

export class RouteAnalysisLambdaFunction extends CommandableLambdaFunction {
    public constructor() {
        super("route_analysis", "Route analysis function");
        this._dependencyResolver.put('controller', new Descriptor('pip-services-routeanalysis', 'controller', 'default', '*', '*'));

        this._factories.add(new RouteAnalysisServiceFactory());
        this._factories.add(new RoutesClientFactory());
    }

    public getReferences(): IReferences {
        return this._references;
    }
}

export const handler = new RouteAnalysisLambdaFunction().getHandler();