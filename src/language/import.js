if (isNode) {
  var fs = require('fs');
  var path = require('path');
  DefaultScript.import = function (name) {
    var stats;

    try {
      stats = fs.lstatSync(name);
    }

    catch (e) {
      stats = fs.lstatSync(name + EXTENSION);
      name += EXTENSION;
    }

    if (stats.isDirectory()) {
      name = path.join(name, DefaultScript.index + EXTENSION);
    }

    var contents = fs.readFileSync(name, 'utf8')
    var tree = DefaultScript.parse(contents, name);
    var logic = DefaultScript.logic(tree, name);
    var scopes = [DefaultScript.global.scope()];
    return logic(scopes);
  };
}

else if (isBrowser) {
  DefaultScript.import = function (name) {
    if (name.substr(name.length - 3) !== EXTENSION) {
      name = name + EXTENSION;
    }

    return DefaultScript.pause(function (resume) {
      DefaultScript.global.request(name)(function (contents) {
        var tree = DefaultScript.parse(contents, name);
        var logic = DefaultScript.logic(tree, name);
        var scopes = [DefaultScript.global.scope()];
        resume(logic(scopes));
      });
    });
  };
}

else {
  throw new Error('@import is not supported on this platform');
}
