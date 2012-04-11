var assert = require('assert'),
    lib = require('../node_modules/lumbar/test/lib'),
    lumbarTester = require('../lib/lumbar-tester')();

exports['test-modules'] = lib.runTest('test/artifacts/test-modules.json', 'test/expected/test-modules', {plugins: [lumbarTester]});
