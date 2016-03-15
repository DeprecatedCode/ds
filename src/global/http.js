DefaultScript.global.http = remember(null, '@http', function $trap$(scopes, step, stepName, serverLogic, onException) {
  if (DefaultScript.global.type(serverLogic) !== 'logic') {
    return onException(new TypeError('@http: logic definition must follow'), step, stepName);
  }

  var requestFilters = [];
  var responseFilters = [];

  var routes = {};

  var server = DefaultScript.global.require('http').createServer(function (req, res) {
    var request = {
      domain: req.domain,
      method: req.method.toLowerCase(),
      url: req.url
    };

    var requestScopes = [{request: request}].concat(scopes);

    for (var i=0; i<requestFilters.length; i++) {
      if (requestFilters[i](requestScopes, step, stepName, undefined, onException) === false) {
        DefaultScript.global.print('Request ' + DefaultScript.global.format(request) +
          ' blocked by requestFilter ' + requestFilters[i].stepName + ' at ' + requestFilters[i].step[POSITION]());
        return;
      }
    }

    var respond = function (step, stepName, onException, response) {
      response.headers = {};

      if (typeof response.body === 'object' && 'document' in response.body) {
        response.headers['Content-Type'] = response.body.contentType;
        response.body = response.body.document;
      }

      var responseScopes = [{response: response}].concat(scopes);
      for (var i=0; i<responseFilters.length; i++) {
        if (responseFilters[i](responseScopes, step, stepName, undefined, onException) === false) {
          DefaultScript.global.print('Response to request ' + DefaultScript.global.format(request) +
            ' blocked by responseFilter ' + responseFilters[i].stepName + ' at ' + responseFilters[i].step[POSITION]());
          return;
        }
      }

      if (typeof response.body !== 'string') {
        return onException(new TypeError('response must be a string'), step, stepName);
      }

      res.writeHead(response.status, response.headers);
      res.end(response.body);
    };

    if (request.url in routes) {
      routes[request.url](requestScopes, respond);
    }

    else {
      respond(step, stepName, onException, {
        status: 404,
        body: 'Not found'
      });

      console.error('No route matched in @http server defined in ' + stepName + ' at ' + step[POSITION]());
    }
  });

  var httpServerScope = {};

  httpServerScope.requestFilter = remember(step, stepName, function $trap$(scopes, step, stepName, requestFilterLogic, onException) {
    requestFilters.push(requestFilterLogic);
  });

  httpServerScope.responseFilter = remember(step, stepName, function $trap$(scopes, step, stepName, responseFilterLogic, onException) {
    responseFilters.push(responseFilterLogic);
  });

  httpServerScope.get = remember(step, stepName, function $trap$(scopes, step, stepName, url, onException) {
    if (DefaultScript.global.type(url) !== 'string') {
      return onException(new TypeError('@http get: url string must follow'), step, stepName);
    }

    return remember(step, stepName, function $trap$(scopes, step, stepName, responseLogic, onException) {
      if (DefaultScript.global.type(responseLogic) !== 'logic') {
        return onException(new TypeError('@http get url: logic definition must follow'), step, stepName);
      }

      routes[url] = function (requestScopes, respond) {
        var responseScopes = [{
          ok: function $logic$(scopes, step, stepName, value, onException) {
            respond(step, stepName, onException, {
              status: 200,
              body: value
            });
          }
        }].concat(scopes).concat(requestScopes);

        responseLogic(responseScopes, step, stepName, url, onException);
      };
    });
  });

  httpServerScope.listen = remember(step, stepName, function $trap$(scopes, step, stepName, port, onException) {
    if (typeof port !== 'number') {
      return onException(new TypeError('port must be a number'), step, stepName);
    }
    if (port < 1) {
      return onException(new ValueError('port must be >= 1'), step, stepName);
    }
    if (port > 65535) {
      return onException(new ValueError('port must be <= 65535'), step, stepName);
    }
    server.listen(port);
  });

  var serverScopes = [httpServerScope].concat(scopes);
  serverLogic(serverScopes, step, stepName, null, onException);
});
