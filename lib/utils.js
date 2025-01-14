const proxyaddr = require('proxy-addr');
const https = require('https');
const logger = require('./logger');

/**
 * Modifies the passed array so that all entries are written in CIDR notation (even single ones).
 * @param {Array.<String>} array 
 */
 function refactorIPArray(array){
    array.forEach((ip, i, a) => {
        if(!ip.includes('/')){
            if(ip.includes(':')){
                a[i] += '/128';
            } else {
                a[i] += '/32';
            }
        }
    });
}

/**
 * Extends the proxyaddr.compile function so that functions, numbers and Boolean values can also be used in the configuration.
 * @param {String|Array.<String>|Function|Boolean|Number} val 
 * @returns {Function}
 */
 function compileProxyTrust(val){
    if(typeof val === 'function'){
        return val;
    }
    if (typeof val === 'number') {
        return function(a, i){ return i < val; };
    }
    if (typeof val === 'boolean') {
        return function(){ return val; };
    }

    return proxyaddr.compile(val);
}

/**
 * Simple HTTP GET request without any dependencies
 * @param {String} url 
 */
async function httpGET(url){
    return new Promise((resolve, reject) => {
        https.get(url, {timeout: 5000}, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                /* istanbul ignore if */
                if(!data || res.statusCode !== 200){
                    logger.log('Error', `Error on httpGET: No data or wrong status code - ${url}`);
                    return;
                }

                resolve(data);
            });
        // eslint-disable-next-line security-node/detect-unhandled-event-errors
        }).on('error', /* istanbul ignore next */ (err) => {
            logger.log('Error', `Error on httpGET: ${err.message} ${url}`);
            reject(err.message);
        });
    });
}

module.exports = {
    refactorIPArray: refactorIPArray,
    compileProxyTrust: compileProxyTrust,
    httpGET: httpGET
};