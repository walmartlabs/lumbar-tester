/**
 * Tester Plugin : Includes test files within the project's modules.
 *
 * Config:
 *    root:
 *      test:
 *        Array of test files to include. Alternatively may be an object with special values below.
 *
 *        Special Values:
 *          auto-include: Directory prefix that will be scaned for matching paths.
 *
 * Mixins:
 *  File mappings will be mixed in but are executed within the scope of the mixin only. I.e. foo.js
 *  will auto include mixin/test/foo.js etc.
 *
 */
var _ = require('underscore'),
    async = require('async'),
    lumbar = require('lumbar'),
    fu = lumbar.fileUtil,
    path = require('path');

function generator(string) {
  var ret = function(context, callback) { callback(undefined, {data: string, noSeparator: true}); };
  ret.stringValue = string;
  ret.sourceFile = undefined;
  return ret;
}

module.exports = function(options) {
  options = options || {};

  return {
    priority: 80,

    moduleResources: function(context, next, complete) {
      if (!options.includeTests && context.module['test-module']) {
        // Prevent output from any test modules if we aren't including tests
        return complete(undefined, []);
      }
      if (context.isModuleMap || context.mode !== 'scripts' || context.module['test-module']) {
        // Don't touch anything outside of script mode or explicit test modules
        return next(complete);
      }

      var attr = context.config.attributes.test || {};

      next(function(err, ret) {
        if (err || !ret) {
          return complete(err);
        }

        // Only include the test output if the user explicitly opted in
        var tests = options.includeTests ? context.module.tests : [];

        // Auto-include if enabled
        if (!tests) {
          tests = ret.map(function(resource) {
              var filterResource = (lumbar.build || context.config).filterResource,
                  library = resource.library && (resource.library.parent || resource.library),
                  config = (library ? library.test : attr) || {},
                  includeDir = config['auto-include'];
              if (includeDir && filterResource(resource, context)
                  && (resource.src || resource.originalSrc || _.isString(resource))) {
                if (resource.library) {
                  var root = resource.library.root;
                  if (root === './') {
                    root = '';
                  }

                  var src = resource.originalSrc || resource.src.substring(root.length);

                  return {src: root + includeDir + src, library: resource.library};
                } else {
                  return {src: includeDir + (resource.originalSrc || resource.src || resource)};
                }
              }
            });
          async.map(tests, function(resource, callback) {
              if (!resource) { return callback(undefined, resource); }
              fu.stat(fu.resolvePath(resource.src), function(err) {
                if (!err) {
                  callback(undefined, resource);
                } else {
                  // File not found, watch the parent dir for adds
                  var dir = fu.resolvePath(path.dirname(resource.src));
                  fu.stat(dir, function(err) {
                    callback(undefined, !err && {watch: dir});
                  });
                }
              });
            },
            function(err, tests) {
              finish(_.filter(tests, function(test) { return test; }));
            });
        } else {
          finish(tests);
        }

        function finish(tests) {
          // Create a submodule scope for all of the output
          if (tests && tests.length) {
            if (attr.scope !== 'none') {
              ret.push(generator('exports.' + (attr.export || 'tests') + ' = function() {\n'));
            }
            ret.push.apply(ret, tests);
            if (attr.scope !== 'none') {
              ret.push(generator('};\n'));
            }
          }

          complete(undefined, ret);
        }
      });
    }
  };
};
