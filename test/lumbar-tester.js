var _ = require('underscore'),
    fs = require('fs'),
    lib = require('../node_modules/lumbar/test/lib'),
    watch = require('../node_modules/lumbar/test/lib/watch');

describe('lumbar-tester', function() {
  describe('test mode', function() {
    var lumbarTester = require('../lib/lumbar-tester')({includeTests: true});

    it('should include tests', lib.runTest('test/artifacts/test-modules.json', 'test/expected/test-modules', {plugins: [lumbarTester]}));
  });

  describe('no-test mode', function() {
    var lumbarNoTester = require('../lib/lumbar-tester')({includeTests: false});

    it('should ignore test files', lib.runTest('test/artifacts/test-modules.json', 'test/expected/no-tests', {plugins: [lumbarNoTester]}));
  });

  describe('mixin', function() {
    var config = {};
    lib.mockFileList(config);
    lib.mockStat(config);

    it('should auto-include within mixins', function(done) {
      var lumbarTester = require('../lib/lumbar-tester')({includeTests: true});
      var config = {
        plugins: [
          'mixin',
          lumbarTester
        ],
        test: {
          'auto-include': 'testFoo/'
        }
      };
      var module = {
        mixins: ['mixin1'],
        scripts: [ 'baz1.1' ]
      };

      var mixins = [
        {
          name: 'mixin',
          root: 'mixin1/',
          mixins: {
            mixin1: {
              scripts: [ 'baz1.1' ]
            },
          },
          test: {
            'auto-include': 'test/'
          }
        }
      ];

      lib.pluginExec(lumbarTester, 'scripts', module, mixins, config, function(resources) {
        resources = _.map(resources, function(resource) {
          return resource.stringValue || resource.src;
        });

        resources.should.eql([
          'mixin1/baz1.1',
          'baz1.1',
          'exports.tests = function() {\n',
          'mixin1/test/baz1.1',
          'testFoo/baz1.1',
          '};\n'
        ]);
        done();
      });
    });
  });

  describe('watch', function() {
    var lumbarTester = require('../lib/lumbar-tester')({includeTests: true});

    var mock,
        originalRead,
        originalReadSync,
        originalStat,

        fileFilter;

    lib.mockFileList({});
    before(function() {
      mock = watch.mockWatch();
      originalRead = fs.readFile;
      originalReadSync = fs.readFileSync;
      originalStat = fs.stat;

      fs.readFileSync = function() {
        return JSON.stringify({
          modules: {
            module: {scripts: ['js/views/test.js']}
          },
          test: {
            "auto-include": "test/"
          }
        });
      };

      fs.readFile = function(path, callback) {
        if (/test.js$/.test(path)) {
          return callback(undefined, 'foo');
        } else {
          return originalRead.apply(this, arguments);
        }
      };
      fs.stat = function(path, callback) {
        var err = fileFilter && fileFilter.test(path),
            stat;
        if (!err) {
          stat = {
            isDirectory: function() {
              return !/\.[^\/]+$/.test(path);
            }
          };
        } else {
          err = new Error('Your mock ' + path + ' does not exist foo');
        }
        callback(err, stat);
      };
    });
    after(function() {
      mock.cleanup();
    });


    function runWatchTest(srcdir, config, operations, expectedFiles, done) {
      var options = {packageConfigFile: 'config/dev.json', plugins: [lumbarTester]};

      watch.runWatchTest.call(this, srcdir, config, operations, expectedFiles, options, done);
    }

    it('should add newly created templates', function(done) {
      var expectedFiles = ['/module.js', '/module.js'],
          operations = {
            1: function(testdir) {
              fileFilter = false;
              mock.trigger('create', testdir + 'test/js/views');
            }
          };

      fileFilter = /test\/js\/.+\.js$/;
      runWatchTest.call(this,
        'test/artifacts', 'lumbar.json',
        operations, expectedFiles,
        done);
    });

    it('should remove deleted templates', function(done) {
      var expectedFiles = ['/module.js', '/module.js'],
          operations = {
            1: function(testdir) {
              fileFilter = /test\/js\/.+\.js$/;
              mock.trigger('remove', testdir + 'test/js/views/test.js');
            }
          };

      fileFilter = false;
      runWatchTest.call(this,
        'test/artifacts', 'lumbar.json',
        operations, expectedFiles,
        done);
    });
  });
});
