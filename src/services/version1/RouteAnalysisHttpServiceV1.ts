import { Descriptor } from 'pip-services3-commons-node';
import { CommandableHttpService } from 'pip-services3-rpc-node';

export class RouteAnalysisHttpServiceV1 extends CommandableHttpService {
    public constructor() {
        super('v1/route_analysis');
        this._dependencyResolver.put('controller', new Descriptor('pip-services-routeanalysis', 'controller', 'default', '*', '1.0'));
    }
}