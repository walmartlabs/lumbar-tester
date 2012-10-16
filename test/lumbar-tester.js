var assert = require('assert'),
    lib = require('../node_modules/lumbar/test/lib');

describe('lumbar-tester', function() {
  describe('test mode', function() {
    var lumbarTester = require('../lib/lumbar-tester')({includeTests: true});

    it('should include tests', lib.runTest('test/artifacts/test-modules.json', 'test/expected/test-modules', {plugins: [lumbarTester]}));
  });

  describe('no-test mode', function() {
    var lumbarNoTester = require('../lib/lumbar-tester')({includeTests: false});

    it('should ignore test files', lib.runTest('test/artifacts/test-modules.json', 'test/expected/no-tests', {plugins: [lumbarNoTester]}));
  });
});
