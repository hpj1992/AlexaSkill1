
'use strict';
/**
 * App ID for the skill
 */
var APP_ID_TEST_LOCAL = "amzn1.ask.skill.96a8e8d9-c1a0-407b-a713-43112715cd27"; //replace with "amzn1.echo-sdk-ams.app.amzn1.ask.skill.96a8e8d9-c1a0-407b-a713-43112715cd"
var APP_ID = "amzn1.ask.skill.31ede0d6-bed4-4500-861a-1edb26dd1d51";
/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var aws = require('aws-sdk');
var s3 = new aws.S3({apiVersion: '2006-03-01'});
var async = require('async');

var IndianFest = function () {
    AlexaSkill.call(this, APP_ID);
};

var params_year = {
  Bucket: 'indian-fest', 
  Key: '2016.json' 
};

var params_supported_festivals = {
    Bucket: 'indian-fest', /* required */
  Key: 'supported_festivals.json' 
}

var today = new Date();
var day = today.getDate();
var month = today.getMonth(); //January is 0!
var year = today.getFullYear();
var foundFestivalCount = 0;
var max_festivals_supported = 3;
var final_result = [];
params_year.Key = year + '.json';

// Extend AlexaSkill
IndianFest.prototype = Object.create(AlexaSkill.prototype);
IndianFest.prototype.constructor = IndianFest;

IndianFest.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("Indian Fest onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session init logic would go here
};

IndianFest.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("Indian Fest onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

IndianFest.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("Indian Fest onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session cleanup logic would go here
};

IndianFest.prototype.intentHandlers = {
    "GetFestivalDate": function (intent, session, response) {
        getFestivalDate(intent, session, response);
    },
     "GetUpcomingFestivals": function (intent, session, response) {
        getUpcomingFestivals(intent, session, response);
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        helpTheUser(intent, session, response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

function getFestivalDate(intent, session, response) {
   var speechText = "Yes I can help you with that. But that feature is not supported as of now. However, I can tell you about upcoming festivals.";

    var speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.tell(speechOutput);
}

function getUpcomingFestivals(intent, session, response) {
    /*var speechText = "GetUpcomingFestivals invoked.";

    var speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.tell(speechOutput);*/
    performUpcomingFestivalOperation(response);
}

/**
 * Returns the welcome response for when a user invokes this skill.
 */
function getWelcomeResponse(response) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var speechText = "Welcome to Indian Fest. Your calender for indian festivals. I remember all the indian festivals whole year.";
    var repromptText = "Just ask, which are upcoming festivals.";
   var speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.ask(speechOutput, repromptOutput);
}

/**
 * Instructs the user on how to interact with this skill.
 */
function helpTheUser(intent, session, response) {
    var speechText = "I can remind you about upcoming Indian festivals. You just need to ask me, which are upcoming festivals?";
    var repromptText = "<speak> I'm sorry I didn't understand that. You can say things like, " +
        "Which are upcoming festivals ? <break time=\"0.2s\" /> " +
        "Which festivals are coming now ? <break time=\"0.2s\" /> " +
        "Now, what can I help you with? </speak>";

    var speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.ask(speechOutput, repromptOutput);
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var indianFest = new IndianFest();
    indianFest.execute(event, context);
};

String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
};

function performUpcomingFestivalOperation(response) {

async.whilst(
    function() { return foundFestivalCount < max_festivals_supported; },
    function(callback) {
              //console.log("foundFestivalCount " + foundFestivalCount + "max_festivals_supported " + max_festivals_supported);
        s3.getObject(params_year, function(err, data) {
        if (err) {
        console.log(err, err.stack); // an error occurred
        } else {
            //console.log(data);           // successful response
        
        s3.getObject(params_supported_festivals, function(err, supported_fest_list) {
        if (err) {
            console.log(err, err.stack); // an error occurred
         } else {
            //console.log(data);  
            var fileContents = data.Body.toString();
            var json = JSON.parse(fileContents);
            //console.log(json);

            var supported_festivals_json = JSON.parse(supported_fest_list.Body.toString());
            var supported_festivals_string = supported_fest_list.Body.toString();
            //console.log("\n Supprted festivals:" + supported_festivals_json);
            //console.log("\n Supprted festivals String :" + supported_festivals_string);

            var monthData = json.months;
            
            for(var i = month;i < monthData.length; i++) {
                var festivals = monthData[i].festivals;
                for(var j = 0; j < festivals.length; j++) {
                    var same_day_festivals_name = festivals[j].name.split(",");
                    var festival_date = festivals[j].date;
                    //console.log("Date:" + festival_date + " Day: " + day);
                    if(festival_date > day) {
                        for(var k = 0; k < same_day_festivals_name.length; k++) {
                            //console.log("Found:" + same_day_festivals_name[k]);
                            if( supported_festivals_string.indexOf(same_day_festivals_name[k].trim()) !== -1) {
                                var festival_result = {};
                                festival_result.name = same_day_festivals_name[k].trim();
                                festival_result.date = festivals[j].date.replace(/^0+/, '');
                                festival_result.day = festivals[j].day;
                                festival_result.month = monthData[i].name.replace(" Festivals","");
                                festival_result.year = year;

                                if(festival_result.name.indexOf("Merry") != -1) {
                                    festival_result.name = festival_result.name.replace("Merry ","");
                                }    

                                final_result.push(festival_result);
                                //console.log(JSON.stringify(festival_result));
                                /*console.log("\n Found :" + same_day_festivals_name[k] + " on " + festivals[j].day + 
                                    " Date : " + festivals[j].date + " Year: " + year + " Month: " + monthData[i].name)*/
                                foundFestivalCount++;
                            }
                        }
                    }
                }
            }
            year = year + 1;
            month = 0;
            day = 0;
            params_year.Key = year + ".json";
            callback(null,final_result);
            
        }
        
    })
   };

})
    },
    function (err, final_result_all) {
        var speechText = "Here are upcoming festivals to remember. First is " + final_result[0].name + ", it is on " +
            final_result[0].month + " " + final_result[0].date + " " +  final_result[0].year + ". After that, it is " + final_result[1].name +
            " on " + final_result[1].month + " " + final_result[1].date + " " + final_result[1].year + ". And last is " + final_result[2].name +
            " on " + final_result[2].month + " " + final_result[2].date + " " + final_result[2].year + ".";
            
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);


        //response.end("Hello World\n successful data received.\n " + JSON.stringify(final_result));
    }
);


}