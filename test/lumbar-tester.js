var assert = require('assert'),
    lib = require('../node_modules/lumbar/test/lib'),
    lumbarTester = require('../lib/lumbar-tester')({includeTests: true}),
    lumbarNoTester = require('../lib/lumbar-tester')({includeTests: false});

exports['test-modules'] = lib.runTest('test/artifacts/test-modules.json', 'test/expected/test-modules', {plugins: [lumbarTester]});
exports['no-test'] = lib.runTest('test/artifacts/test-modules.json', 'test/expected/no-tests', {plugins: [lumbarNoTester]});
