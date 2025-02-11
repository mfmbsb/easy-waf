const { slash, dot, colon, underscore, minus } = require('./specialchars.regex');

const regex = new RegExp(`(?:${slash}{2})(?<domain>((\\w|${minus}|${underscore})+${dot})*(?:\\w|${minus}|${underscore})+[${dot}${colon}]\\w+)`, 'gi');

/** @type {EasyWafConfig} */
var config;

/**
 * 
 * @param {EasyWafConfig} conf
 */
function init(conf){
    config = conf;
}

/**
 * 
 * @param {EasyWAFRequestInfo} data
 * @returns {Boolean} Is false when a possible security incident has been found
 */
function check(data){    
    if(typeof config.queryUrlWhitelist === 'undefined'){
        return true;
    }
    
    var matches = data.url.matchAll(regex);
    for (const match of matches){
        if(match.groups.domain && !config.queryUrlWhitelist.includes(match.groups.domain)){
            return false;
        }
    }

    return true;
}

module.exports = {
    init: init,
    check: check,
    info: () => {
        return {
            name: 'openRedirect'
        };
    }
};