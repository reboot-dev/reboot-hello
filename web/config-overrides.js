const { removeModuleScopePlugin, override, babelInclude } = require("customize-cra");
const path = require("path");

module.exports = function (config, env) {

    return Object.assign(
      config,
      override(
        removeModuleScopePlugin(),
        babelInclude([
          path.resolve('src'),
          path.resolve('../api/hello_world/v1'),
        ])
      )(config, env)
    )
  }
