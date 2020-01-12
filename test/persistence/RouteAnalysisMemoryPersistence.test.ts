import { ConfigParams } from 'pip-services3-commons-node';

import { RouteAnalysisMemoryPersistence } from '../../src/persistence/RouteAnalysisMemoryPersistence';
import { RouteAnalysisPersistenceFixture } from './RouteAnalysisPersistenceFixture';

suite('RouteAnalysisMemoryPersistence', ()=> {
    let persistence: RouteAnalysisMemoryPersistence;
    let fixture: RouteAnalysisPersistenceFixture;
    
    setup((done) => {
        persistence = new RouteAnalysisMemoryPersistence();
        persistence.configure(new ConfigParams());
        
        fixture = new RouteAnalysisPersistenceFixture(persistence);
        
        persistence.open(null, done);
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