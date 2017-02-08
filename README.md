# x-ray-slow-proxy-driver

A [node-slow-caching-proxy](https://github.com/ProfessorEugene/node-slow-caching-proxy) request driver for x-ray.  Can
be used to configure a delegate driver (a [request-x-ray](https://github.com/Crazometer/request-x-ray) driver by
default) to use a proxy that's automatically started on the first x-ray crawl.

This driver requires a "close" call to shut down the proxy at the end of an x-ray run.

Basic usage:

```js
var XRay = require('x-ray'),
    ProxyDriver = require('x-ray-slow-proxy-driver'),
    proxyDriverOptions = {},
    x = new XRay().driver(ProxyDriver(proxyDriverOptions));
x('http://www.github.com/','title')(function(error, result){
    /* do stuff with result */
    x.driver().close()
    /* optional then */
    .then(function(){
        console.log('driver shut down');
    });
});
```

Options:

* ```proxyOptions``` options to pass to node-slow-caching-proxy (see [this](https://professoreugene.github.io/node-slow-caching-proxy/Proxy.html) reference)
* ```driverFactory``` optional driver factory function - accepts a Proxy instance, must return an x-ray driver function configured to use proxy
* ```proxyPortRange``` optional port range to scan for an open port to run Proxy on

# Documentation

Documentation is available [here](https://professoreugene.github.io/x-ray-slow-proxy-driver/ProxyDriver.html)