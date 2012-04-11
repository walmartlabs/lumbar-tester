var async = require('async'),
    lumbar = require('lumbar'),
    fu = lumbar.fileUtil;

function generator(string) {
  var ret = function(context, callback) { callback(undefined, {data: string, noSeparator: true}); };
  ret.sourceFile = undefined;
  return ret;
}

module.exports = {
  mode: 'scripts',
  priority: 80,

  moduleResources: function(context, next, complete) {
    var attr = context.config.attributes,
        includeDir = attr.test && attr.test['auto-include'];

    next(function(err, ret) {
      if (err || !ret) {
        return complete(err);
      }

      var tests = context.module.tests;

      // Auto-include if enabled
      if (!tests && includeDir) {
        tests = ret.map(function(resource) {
            if (context.config.filterResource(resource, context)) {
              return includeDir + (resource.src || resource);
            }
          }).filter(function(resource) { return resource; });
      }

      // Create a submodule scope for all of the output
      if (tests && tests.length) {
        ret.push(generator('(function() {\n'));
        ret.push.apply(ret, tests);
        ret.push(generator('})();\n'));
      }

      complete(undefined, ret);
    });
  }
};
