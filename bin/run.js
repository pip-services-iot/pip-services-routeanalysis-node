let RouteAnalysisProcess = require('../obj/src/container/RouteAnalysisProcess').RouteAnalysisProcess;

try {
    new RouteAnalysisProcess().run(process.argv);
} catch (ex) {
    console.error(ex);
}
