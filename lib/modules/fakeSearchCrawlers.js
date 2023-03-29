const CIDRMatcher = require('cidr-matcher');
const utils = require('../utils');
const logger = require('../logger');
const dns = require('node:dns');
const ip6addr = require('ip6addr');

/** @type {EasyWafConfig} */
var config;

String.prototype.replaceAll = function (target, payload) {
    let regex = new RegExp(target, 'g')
    return this.valueOf().replace(regex, payload)
};

const uaRegex = new RegExp('(Google|Bingbot|AdIdxBot|BingPreview|MicrosoftPreview|DuckDuck(Go|Bot)|Yahoo!|Yandex\\S|Baiduspider|Qwantify)', 'i');
const rdnsRegex = new RegExp('(.googlebot.com|.google.com|.live.com|.msn.com|.bing.com|.microsoft.com|.yahoo.com|.yahoo.net|.yandex.net|.yandex.ru|.yandex.com|.baidu.com|.baidu.jp|.qwant.com)$', 'i');

var ipWhitelist;
/** @type {Array.<String>} */
var ipList = [];

/**
 * 
 * @param {EasyWafConfig} conf
 */
function init(conf){
    config = conf;

    if(('enabled' in config.modules.fakeSearchCrawlers && config.modules.fakeSearchCrawlers.enabled) && (typeof process.env.TEST_FAKE_SEARCH_CRAWLERS !== 'string' && process.env.TEST_FAKE_SEARCH_CRAWLERS !== '1')){
        updateIPWhitelist();
    }
}

/**
 * 
 * @param {EasyWAFRequestInfo} reqInfo
 */
function check(reqInfo){
    return new Promise(function(resolve) {
        if(uaRegex.test(reqInfo.ua)){
            if(typeof ipWhitelist !== 'undefined' && ipWhitelist.contains(reqInfo.ip)){
                resolve(true);
                return;
            }

            dns.reverse(reqInfo.ip, (err, hostnames) => {
                if(err){
                    if(typeof process.env.TEST_FAKE_SEARCH_CRAWLERS === 'undefined') logger.log('Error', `Error on reverse DNS (fakeSearchCrawlers): ${err.message}`);
                    resolve(false);
                    return;
                }
                let matchedHostname = hostnames.find(h => rdnsRegex.test(h));
                if(!matchedHostname){
                    resolve(false);
                    return;
                }
                dns.lookup(matchedHostname, {}, (err, addresses) => {
                    /* istanbul ignore next */
                    if(err){
                        logger.log('Error', `Error on DNS lookup (fakeSearchCrawlers): ${err.message}`);
                        resolve(false);
                        return;
                    }
                    if(addresses.includes(reqInfo.ip)){
                        // The request comes from a real search crawler, so add to the whitelist (only temporarily)
                        addIPToWhitelist(reqInfo.ip);
                        resolve(true);
                        return;
                    }
                    resolve(false);
                });
            });
            return;
        }
        resolve(true);
    });
}

/**
 * Checks whether an IP is written in a valid CIDR notation.
 * @param {String} ip
 * @returns {Boolean}
 */
 function validateCIDR(ip){
    try {
        ip6addr.createCIDR(ip);
        return true;
    } catch (e) /* istanbul ignore next */ {
        logger.log('Warn', `Invalid ip in CIDR format: ${ip} ${e.message}`);
        return false;
    }
}

/**
 * Changes the prefix list of Google and Bing into an array
 * @param {Array.<Object>} arr 
 * @returns {Array.<String>}
 */
function parsePrefixList(arr){
    let list = [];
    arr.forEach(e => {
        if(typeof e.ipv4Prefix === 'string'){
            e.ipv4Prefix = e.ipv4Prefix.replaceAll('\u200b', ''); //Some Bing ip addresses contain the unicode character "Zero Width Space" (200B).
            if(validateCIDR(e.ipv4Prefix)) list.push(e.ipv4Prefix);
            return;
        }
        if(typeof e.ipv6Prefix === 'string'){
            e.ipv6Prefix = e.ipv6Prefix.replaceAll('\u200b', ''); //Some Bing ip addresses contain the unicode character "Zero Width Space" (200B).
            if(validateCIDR(e.ipv6Prefix)) list.push(e.ipv6Prefix);
        }
    });
    return list;
}

/**
 * Downloads Google and Bing ip list and adds DuckDuckGo ips
 */
async function updateIPWhitelist(){
    /** @type {Array.<String>} */
    try {
        // Google
        const gData = await utils.httpGET('https://www.gstatic.com/ipranges/goog.json');
        let gJson = JSON.parse(gData);
        ipList.push(...parsePrefixList(gJson.prefixes));
        // Bing
        const bData = await utils.httpGET('https://www.bing.com/toolbox/bingbot.json');
        let bJson = JSON.parse(bData);
        ipList.push(...parsePrefixList(bJson.prefixes));
        // DuckDuckGo 
        // https://raw.githubusercontent.com/duckduckgo/duckduckgo-help-pages/master/_docs/results/duckduckbot.md
        ipList.push(...['20.191.45.212', '40.88.21.235', '40.76.173.151', '40.76.163.7', '20.185.79.47', '52.142.26.175', '20.185.79.15', '52.142.24.149', '40.76.162.208', '40.76.163.23', '40.76.162.191', '40.76.162.247']);
        utils.refactorIPArray(ipList);
        ipWhitelist = new CIDRMatcher(ipList);
    } catch (e) /* istanbul ignore next */ {
        logger.log('Error', 'Error on updateIPWhitelist in fakeSearchCrawlers: ' + e.message);
    }
    setTimeout(updateIPWhitelist, 3600000); //1 hour
}

/**
 * Adds an ip address to the fakeSearchCrawlers whitelist 
 * @param {String} ip 
 */
function addIPToWhitelist(ip){
    if(!ip.includes('/')){
        if(ip.includes(':')){ /* istanbul ignore next */
            ip += '/128';
        } else {
            ip += '/32';
        }
    }
    ipList.push(ip);
    ipWhitelist = new CIDRMatcher(ipList);
}

module.exports = {
    init: init,
    check: check,
    updateIPWhitelist: updateIPWhitelist,
    info: () => {
        return {
            name: 'fakeSearchCrawlers'
        };
    }
};
