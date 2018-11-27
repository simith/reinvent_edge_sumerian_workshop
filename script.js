'use strict';
// The sumerian object can be used to access Sumerian engine
// types.
//
/* global sumerian */

// Called when play mode starts.
//


var client;
var cristineIsTalking = true;
var lastPrediction;
var startSpeech = false;


// Called on every physics update, after setup(). When used in a 
// ScriptAction, this function is called only while the state 
// containing the action is active.
//
// For the best performance, remove this function if it is not 
// used.
//
function fixedUpdate(args, ctx) {}

// Called on every render frame, after setup(). When used in a 
// ScriptAction, this function is called only while the state 
// containing the action is active.
//
// For the best performance, remove this function if it is not 
// used.
//
function update(args, ctx) {}

// Called after all script "update" methods in the scene has 
// been called. When used in a ScriptAction, this function is
// called only while the state containing the action is active.
//
// For the best performance, remove this function if it is not
// used.
//
function lateUpdate(args, ctx) {}

// When used in a ScriptAction, called when a state is entered.
// Use ctx.transitions.success() to trigger the On<State>Success transition
// and ctx.transitions.failure() to trigger the On<State>Failure transition
function enter(args, ctx) {}

// When used in a ScriptAction, called when a state is exited.
//
function exit(args, ctx) {}

// Called when play mode stops.
//
function cleanup(args, ctx) {

    client.unsubscribe("security/gate_00/prediction");
    console.log("Unsubscribing now");
    client.disconnect();
}

// Defines script parameters.
//
var parameters = [];



function SigV4Utils() {}

SigV4Utils.sign = function(key, msg) {
    var hash = CryptoJS.HmacSHA256(msg, key);
    return hash.toString(CryptoJS.enc.Hex);
};

SigV4Utils.sha256 = function(msg) {
    var hash = CryptoJS.SHA256(msg);
    return hash.toString(CryptoJS.enc.Hex);
};

SigV4Utils.getSignatureKey = function(key, dateStamp, regionName, serviceName) {
    var kDate = CryptoJS.HmacSHA256(dateStamp, 'AWS4' + key);
    var kRegion = CryptoJS.HmacSHA256(regionName, kDate);
    var kService = CryptoJS.HmacSHA256(serviceName, kRegion);
    var kSigning = CryptoJS.HmacSHA256('aws4_request', kService);
    return kSigning;
};

function createEndpoint(regionName, awsIotEndpoint, accessKey, secretKey, sessionToken) {
    var time = moment.utc();
    var dateStamp = time.format('YYYYMMDD');
    var amzdate = dateStamp + 'T' + time.format('HHmmss') + 'Z';
    var service = 'iotdevicegateway';
    var region = regionName;
    var secretKey = secretKey;
    var accessKey = accessKey;
    var algorithm = 'AWS4-HMAC-SHA256';
    var method = 'GET';
    var canonicalUri = '/mqtt';
    var host = awsIotEndpoint;
    var credentialScope = dateStamp + '/' + region + '/' + service + '/' + 'aws4_request';
    var canonicalQuerystring = 'X-Amz-Algorithm=AWS4-HMAC-SHA256';
    canonicalQuerystring += '&X-Amz-Credential=' + encodeURIComponent(accessKey + '/' + credentialScope);
    canonicalQuerystring += '&X-Amz-Date=' + amzdate;
    canonicalQuerystring += '&X-Amz-SignedHeaders=host';
    var canonicalHeaders = 'host:' + host + '\n';
    var payloadHash = SigV4Utils.sha256('');
    var canonicalRequest = method + '\n' + canonicalUri + '\n' + canonicalQuerystring + '\n' + canonicalHeaders + '\nhost\n' + payloadHash;
    var stringToSign = algorithm + '\n' + amzdate + '\n' + credentialScope + '\n' + SigV4Utils.sha256(canonicalRequest);
    var signingKey = SigV4Utils.getSignatureKey(secretKey, dateStamp, region, service);
    var signature = SigV4Utils.sign(signingKey, stringToSign);
    canonicalQuerystring += '&X-Amz-Signature=' + signature;
    canonicalQuerystring += '&X-Amz-Security-Token=' + encodeURIComponent(sessionToken);
    return 'wss://' + host + canonicalUri + '?' + canonicalQuerystring;
}


function cristineCanTalk() {

    return !cristineIsTalking;

}

function setCristineTalkingState(state) {

    cristineIsTalking = state;

}


function playSpeech(msg) {


    const speech = new sumerian.Speech();
    speech.body = msg;
    speech.type = 'ssml';


    speech.updateConfig({
        entity: ctxt.entity
    });

    const speechComponent = ctxt.entity.getComponent('SpeechComponent');


    speechComponent.addSpeech(speech);
    speech.play().then(() => {

        setCristineTalkingState(false);
    });


}

function playSubscribing(msg) {


    const speech = new sumerian.Speech();
    speech.body = msg;
    speech.type = 'ssml';


    speech.updateConfig({
        entity: ctxt.entity
    });

    const speechComponent = ctxt.entity.getComponent('SpeechComponent');


    speechComponent.addSpeech(speech);
    speech.play().then(() => {

        setCristineTalkingState(false);
        startSpeech = true;
    });
}


function subscribe() {


    playSubscribing("Starting demo for Vest detection...");
    client.subscribe("security/gate_00/prediction");
    console.log("subscribed to topic");

}


function getJsonItemCount(message) {


    return Object.keys(message).length;

}


//1 - person, 2 - vest, 3 - hardhat
function numberOfObjectsPresentForLabel(jsonInferenceObject, label) {

    var keys = Object.keys(jsonInferenceObject);
    var values = Object.values(jsonInferenceObject);
    var numberOfObjects = 0,
        i = 0;

    var keyLen = keys.length;

    for (i = 0; i < keyLen; i++) {

        if (keys[i].startsWith("Object") && values[i].label == label) {

            numberOfObjects++;
        }

    }

    return numberOfObjects;
}

function isSinglePerson(jsonInferenceObject) {

    var numberOfObjects = numberOfObjectsPresentForLabel(jsonInferenceObject, 1);
    var result = false;
    console.log("isSinglePerson returned " + numberOfObjects);

    if (numberOfObjects == 1) {
        result = true;
    }

    return result;
}

function haveVest(jsonInferenceObject) {

    var numberOfObjects = numberOfObjectsPresentForLabel(jsonInferenceObject, 2);
    var result = false;
    console.log("haveVest returned " + numberOfObjects);

    if (numberOfObjects == 1) {
        result = true;
    }

    return result;
}

function haveHelmet(jsonInferenceObject) {

    var numberOfObjects = numberOfObjectsPresentForLabel(jsonInferenceObject, 3);
    var result = false;
    console.log("haveHelmet returned " + numberOfObjects);

    if (numberOfObjects == 1) {
        result = true;
    }

    return result;
}




function getPrediction(jsonObjectPrediction) {

    var prediction = "none";

    if (isSinglePerson(jsonObjectPrediction)) {
        //is a single person
        prediction = "person";
        if (haveVest(jsonObjectPrediction)) {
            //person with vest
            prediction = "person_vest";


        }

    } else {
        console.log("Not a single person, nothing to do");
    }



    return prediction;
}




function onMessage(message) {


    var receivedMsg = JSON.parse(message.payloadString);


    var len = getJsonItemCount(receivedMsg);
    console.log("Item count:" + len);

    //make sure cristine has said something

    if (startSpeech == false) {

        return;
    }


    var prediction = getPrediction(receivedMsg);

    if (lastPrediction == prediction)
        return;

    lastPrediction = prediction;

    if (prediction == "none")
        return;
    console.log("onMessage: " + message.payloadString);
    console.log("getPrediction predicting:" + prediction);


    if (cristineCanTalk()) {

        console.log("Christine can talk!!!");
        setCristineTalkingState(true);

        updateUiWithPrediction(prediction);

        //will be set to false once Speech playback completes
        //see the playSpeech method
    } else {
        console.log("Christine CANNOT talk!!!");
    }
}


function connectToAWSIoT() {

    console.log("Connecting to AWS IoT");


    AWS.config.region = 'us-west-2';

    var params = {
        IdentityPoolId: 'us-west-2:73d6f77b-bf39-4e41-8d42-c2f0930f3fbe'
    };

    var cognitoidentity = new AWS.CognitoIdentity();
    var identityId;

    cognitoidentity.getId(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            console.log(data); // successful response
            identityId = data.IdentityId;

            console.log("IdentityId:" + data.IdentityId);

            var params = {
                IdentityId: identityId
            };

            cognitoidentity.getCredentialsForIdentity(params, function(err, data) {
                if (!err) {
                    //
                    // Update our latest AWS credentials; the MQTT client will use these
                    // during its next reconnect attempt.
                    console.log(data);
                    var endpoint = createEndpoint(
                        'us-west-2', // YOUR REGION
                        'a1qcrinz7qykdk-ats.iot.us-west-2.amazonaws.com', // YOUR IoT ENDPOINT  
                        data.Credentials.AccessKeyId, // YOUR ACCESS KEY    
                        data.Credentials.SecretKey,
                        data.Credentials.SessionToken); // YOUR SECRET ACCESS KEY   

                    var clientId = Math.random().toString(36).substring(7);
                    client = new Paho.MQTT.Client(endpoint, clientId);
                    var connectOptions = {
                        useSSL: true,
                        timeout: 3,
                        mqttVersion: 4,
                        onSuccess: subscribe
                    };
                    client.connect(connectOptions);
                    client.onMessageArrived = onMessage;
                    client.onConnectionLost = function(e) {
                        console.log(e);
                    };



                    console.log(data);
                } else {
                    console.log('error retrieving credentials: ' + err);
                    alert('error retrieving credentials: ' + err);
                }
            });

        }
    });






}


function updateUiWithPrediction(prediction) {


    var goDiv = '<div id="statusDiv"><img width="100" height="100" id="statusImg" src="https://media.istockphoto.com/vectors/shiny-icon-with-the-word-go-vector-id167172486?k=6&m=167172486&s=612x612&w=0&h=q0aVHmB9U9p5Wzd8rKpnJSp8yr5PTcIZ-T3XyW7W_lk="></div>';




    var vestMissing = '<div><img src="https://img.auctiva.com/imgdata/0/9/8/9/7/4/webimg/680404384_tp.jpg" width="100" height="100"></div>';


    switch (prediction) {


        case "person":
            {

                playSpeech("Please wear a Vest to Enter");
                document.getElementById('canvas_div').innerHTML = vestMissing;

            }
            break;



        case "person_vest":
            {

                playSpeech("You are good to go, have a great day!");
                document.getElementById('canvas_div').innerHTML = goDiv;
            }
            break;

        default:
            {
                console.log("unknown prediction");
            }
            break;



            lastPrediction = prediction;
    }


}



function hideMessageBoard() {

    //document.getElementById('messageboard').style.display = "none";



}

var ctxt;

function setup(args, ctx) {




    ctx.worldData.counter = 0;
    console.log("Setup called " + ctx.worldData.count);
    ctxt = ctx;
    //CONNECT TO AWS IoT as unauthenticated user
    connectToAWSIoT();



}