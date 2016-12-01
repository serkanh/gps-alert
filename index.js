// Hipchat room notification auth token, as per: https://www.hipchat.com/docs/apiv2/auth
var critical = 'true';
// Hipchat server and room name
var host = 'YOUR-HOST.hipchat.com';

var https = require('https');

var pagespeed = require('gpagespeed')
 exports.handler = function(event, context) {
			 options = {
				url: process.env.TARGET_URL,
				key: process.env.API_KEY,
				useweb: true,
				apiversion: 'v3beta1',
				strategy: process.env.STRATEGY
			};
			
			pagespeed(options, function(error, data) {
				if (error) {
					console.error(error);
				} else {
					console.log(data);
					console.log(data.ruleGroups.SPEED.score);
					if(data.ruleGroups.SPEED.score < process.env.ALARM_THRESHOLD){
						Notify(options.url,options.strategy,data.ruleGroups.SPEED.score)
						context.done();
					}else{
						context.done();
					}
					
				}
			});
 };

function Notify(target_url,strategy,score) {
    var messageBody ='Google '+ strategy +' score for ' + target_url+' <strong>'+score+'</strong>';
    
    // The notification message to send
    var message = {
        message: messageBody,
        color: 'red',
        notify: critical,
        message_format: 'html'
    };

    var messageString = JSON.stringify(message);
    // Options and headers for the HTTPS request
    var options = {
        host: host,
        port: 443,
        path: '/v2/room/' + process.env.HIPCHAT_ROOM_ID + '/notification',
        method: 'POST',
        headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': messageString.length,
                    'Authorization': 'Bearer '+ process.env.HIPCHAT_AUTH_TOKEN
                 }
    };

    // Setup the HTTPS request
    var req = https.request(options, function (res) {

        // Collect response data as it comes back.
        var responseString = '';
        res.on('data', function (data) {
            responseString += data;
        });

        // Log the response received from Hipchat: if it's empty it's usually 200-OK.
        res.on('end', function () {
            if (!responseString) {
                console.log('Hipchat Response: 200 OK');
            } else {
                console.log('Hipchat Response: ' + JSON.stringify(responseString));
            }
        });
    });

    // Handler for HTTPS request errors.
    req.on('error', function (e) {
        console.error('HTTPS error: ' + e.message);
    });

    // Send the HTTPS request to the Hipchat API.
    // Log the message we are sending.
    console.log('Hipchat API call: ' + messageString);
    req.write(messageString);
    req.end();
}
