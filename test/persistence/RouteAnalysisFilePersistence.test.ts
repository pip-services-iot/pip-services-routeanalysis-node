import { ConfigParams } from 'pip-services3-commons-node';

import { RouteAnalysisFilePersistence } from '../../src/persistence/RouteAnalysisFilePersistence';
import { RouteAnalysisPersistenceFixture } from './RouteAnalysisPersistenceFixture';

suite('RouteAnalysisFilePersistence', ()=> {
    let persistence: RouteAnalysisFilePersistence;
    let fixture: RouteAnalysisPersistenceFixture;
    
    setup((done) => {
        persistence = new RouteAnalysisFilePersistence('./data/current_routes.test.json');

        fixture = new RouteAnalysisPersistenceFixture(persistence);

        persistence.open(null, (err) => {
            persistence.clear(null, done);
        });
    });
    
    teardown((done) => {
        persistence.close(null, done);
    });
        
    test('CRUD Operations', (done) => {
        fixture.testCrudOperations(done);
    });

    test('Get with Filters', (done) => {
        fixture.testGetWithFilter(done);
    });

});