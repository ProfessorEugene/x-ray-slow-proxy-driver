const Proxy = require('node-slow-caching-proxy');
const RequestDriver = require('request-x-ray');
const freePort = require('freeport-async');

/**
 * A delegating driver that accepts a proxy promise (for shutdown) and driver promise and returns
 * a driver function that delegates calls to the driver promise
 */
class DelegateDriver {
    /**
     * Construct a delegate driver
     * @param proxyPromise proxy proimse (for closing)
     * @param driverPromise driver promise
     * @returns {function(*=, *=)}
     */
    constructor(proxyPromise, driverPromise) {
        this.proxyPromise = proxyPromise;
        const driverFn = (context, callback) => {
            driverPromise.then((delegateDriverFn) => {
                delegateDriverFn(context, callback);
            }).catch((driverError) => {
                callback(driverError);
            });
        };
        driverFn.proxyPromise = proxyPromise;
        driverFn.close = this.close;
        return driverFn;
    }

    /**
     * Shuts down this driver and resolves to this driver
     * @returns {Promise<DelegateDriver,Error>} promise that resolves to this when this driver is shut down
     */
    close() {
        return this.proxyPromise.then(proxy => proxy.close()).then(() => this);
    }
}

/**
 * An x-ray driver wrapper that uses node-slow-caching-proxy to make requests to remote servers.
 *
 * @param {object} [options] optional configuration
 * @param {number} [options.proxyPortRange=9000]    port range to scan for a free port to run proxy on
 * @param {object} [options.proxyOptions={}]        options to pass to node-slow-caching-proxy
 * @param {function}    [options.driverFactory]     function that accepts a proxy and returns an x-ray driver configured to use said proxy
 * @returns {DelegateDriver} a driver function with a "close" property
 * @constructor
 */
function ProxyDriver(options) {
    const myOptions = Object.assign({
        proxyPortRange: 9000,
        proxyOptions: {
            hostname: 'localhost',
        },
        driverFactory: proxy => RequestDriver({
            proxy: `http://${proxy.getAddress().address}:${proxy.getAddress().port}`,
        }),
    }, options);
    /* make a promise that resolves to a port */
    const proxyPortPromise = myOptions.proxyOptions.port ? Promise.resolve(myOptions.proxyOptions.port)
        : freePort(myOptions.proxyPortRange, myOptions.proxyOptions.hostname);
    /* make a promise that resolves to a proxy */
    const proxyPromise = proxyPortPromise.then(proxyPort => new Proxy(Object.assign(
        myOptions.proxyOptions, { port: proxyPort })).start());
    /* make a promise that resolves to a driver */
    const driverPromise = proxyPromise.then(proxy => myOptions.driverFactory(proxy));
    /* return a delegating driver */
    return new DelegateDriver(proxyPromise, driverPromise);
}
module.exports = ProxyDriver;
