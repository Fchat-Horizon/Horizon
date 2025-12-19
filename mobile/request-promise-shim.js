// Browser-compatible request-promise shim using Axios
// The mobile app needs HTTP functionality but request is a Node.js library
// We use Axios as it works in browser environments

var Axios = require('axios').default;

function jar() {
  return {
    setCookie: function (cookie, url) {
      // noop
    },
    getCookies: function (url) {
      return [];
    }
  };
}

function requestPromise(options) {
  var axiosConfig = {
    method: options.method || 'GET',
    url: options.url || options.uri,
    headers: options.headers || {},
    data: options.body || options.form || options.json,
    params: options.qs,
    responseType: options.encoding === null ? 'arraybuffer' : 'text'
  };

  if (options.form) {
    axiosConfig.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  if (options.json && typeof options.json === 'object') {
    axiosConfig.data = options.json;
    axiosConfig.headers['Content-Type'] = 'application/json';
  } else if (options.json) {
    axiosConfig.headers['Content-Type'] = 'application/json';
  }

  return Axios(axiosConfig)
    .then(function (response) {
      // if resolveWithFullResponse, return full response, otherwise just body
      if (options.resolveWithFullResponse) {
        return {
          statusCode: response.status,
          headers: response.headers,
          body: response.data
        };
      }
      return response.data;
    })
    .catch(function (error) {
      // convert Axios error to request-promise style error
      if (error.response) {
        var err = new Error('HTTP Error ' + error.response.status);
        err.statusCode = error.response.status;
        err.response = {
          statusCode: error.response.status,
          headers: error.response.headers,
          body: error.response.data
        };
        throw err;
      }
      throw error;
    });
}

// add defaults method to return a new instance with default options
requestPromise.defaults = function (defaultOptions) {
  return function (options) {
    // Merge defaultOptions with options
    var mergedOptions = Object.assign({}, defaultOptions, options);
    return requestPromise(mergedOptions);
  };
};

requestPromise.jar = jar;

// common HTTP methods
['get', 'post', 'put', 'delete', 'patch', 'head'].forEach(function (method) {
  requestPromise[method] = function (url, options) {
    return requestPromise(
      Object.assign({}, options, { method: method.toUpperCase(), url: url })
    );
  };
});

module.exports = requestPromise;
