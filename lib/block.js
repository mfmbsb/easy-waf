const logger = require('./logger');
const crypto = require('crypto');

/**
 * 
 * @param {import('http').IncomingMessage} req 
 * @param {import('http').ServerResponse} res 
 * @param {EasyWAFModuleInfo} moduleInfo 
 * @param {EasyWafConfig} config 
 * @param {String} ip
 * @returns {Boolean}
 */
function block(req, res, moduleInfo, config, ip){

    /** @type {Date} */
    var date = new Date();
    /** @type {String} */
    var referenceID = crypto.createHash('sha256').update(ip + date.getTime()).digest('hex');

    if(typeof config.preBlockHook === 'function' && config.preBlockHook(req, moduleInfo, ip) === false){
        return false;
    }

    if(!config.dryMode){
        res.writeHead(403, {'Content-Type': 'text/html'});
        if(!config.customBlockedPage){
            res.write(`<!DOCTYPE html><html lang="en" style="height:95%;">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta name="robots" content="noindex">
                    <title>403 Forbidden</title>
                    <style>p { line-height: 20px; };</style>
                </head>
                <body style="font-family:sans-serif;height:100%;">
                    <div style="display:flex;justify-content:center;align-items:center;height:100%;">
                        <div style="max-width:90%;word-wrap:break-word;">
                            <h1 style="margin-bottom:10px;">🛑 Request blocked</h1>
                            <h3 style="font-weight:normal;margin-top:0px;margin-bottom:5px;margin-left:52px;">403 Forbidden</h3>
                            <hr style="margin-top:1rem;margin-bottom:1rem;border:0;border-top:1px solid rgba(0, 0, 0, 0.1);">
                            <p>This website uses a firewall to protect itself from online attacks.<br>
                            You have sent a suspicious request, therefore your request has been blocked.</p>
                            <hr style="margin-top:1rem;margin-bottom:1rem;border:0;border-top:1px solid rgba(0, 0, 0, 0.1);">
                            <p>Time: ` + date.toUTCString() + `<br>
                            Your IP: ` + ip + `<br>
                            Reference ID: ` + referenceID + `</p>
                        </div>
                    </div>
                </body>
            </html>`);
        } else {
            var mapObj = {
                dateTime: date.toUTCString(),
                ip: ip,
                referenceID: referenceID,
                moduleName: moduleInfo.name
            };
            res.write(config.customBlockedPage.replace(/{\w+}/g, function(matched){
                return mapObj[matched.slice(1, -1)];
            }));
        }
        res.end();
    }

    logger.requestBlocked(moduleInfo, req, referenceID, config, ip);

    if(typeof config.postBlockHook === 'function'){
        config.postBlockHook(req, moduleInfo, ip);
    }

    if(config.dryMode){
        return false;
    }
    return true;
}

module.exports = block;
