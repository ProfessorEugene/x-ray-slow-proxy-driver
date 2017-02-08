const expect = require('chai').expect;

const Xray = require('x-ray');

const ProxyDriver = require('./driver.js');

describe('ProxyDriver tests', () => {
    it('fails on error', (done) => {
        const x = new Xray().driver(ProxyDriver({
            driverFactory: () => {
                throw new Error('Driver can not be initialized');
            },
        }));
        x('http://www.google.com', 'title')((err, result) => {
            try {
                expect(result).to.be.an('undefined');
                expect(err.message).to.equal('Driver can not be initialized');
                done();
            } catch (e) {
                done(e);
            }
        });
    });
    it('has a shutdown hook', (done) => {
        let proxy = null;
        const x = new Xray().driver(ProxyDriver({
            driverFactory: (startedProxy) => {
                proxy = startedProxy;
                return (ctx, callback) => {
                    callback(null, '<html><title>OK</title></html>');
                };
            },
        }));
        x('http://www.google.com', 'title')((err, result) => {
            try {
                expect(result).to.equal('OK');
                expect(proxy.proxy._server.listening).to.equal(true);
                /* try closing x */
                x.driver().close().then(() => {
                    try {
                        expect(proxy.proxy._server.listening).to.equal(false);
                        done();
                    } catch (e) {
                        done(e);
                    }
                }).catch(done);
            } catch (e) {
                done(e);
            }
        });
    });
});
