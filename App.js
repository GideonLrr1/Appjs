 'use strict';


//TWO
//load config file
const apiai = require('apiai');
const config = require('./config');
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const request = require('request');
const pg = require ('pg');
const app = express();//express
const uuid = require('uuid');
const userData= require('./user');
const passport = require('passport');
const FacebookStrategy =require('passport-facebook').Strategy;
const session = require('express-session');

pg.defaults.ssl=true;
// Messenger API parameters
if (!config.FB_PAGE_TOKEN) {
	throw new Error('missing FB_PAGE_TOKEN');
}
if (!config.FB_VERIFY_TOKEN) {
	throw new Error('missing FB_VERIFY_TOKEN');
}
if (!config.API_AI_CLIENT_ACCESS_TOKEN) {
	throw new Error('missing API_AI_CLIENT_ACCESS_TOKEN');
}
if (!config.FB_APP_SECRET) {
	throw new Error('missing FB_APP_SECRET');
}
if (!config.SERVER_URL) { //used for link to static files
	throw new Error('missing SERVER_URL');
}
if (!config.SENDGRID_API_KEY) { //sending email
	throw new Error('missing SENDGRID_API_KEY');
}
if (!config.EMAIL_FROM) { //sending email
	throw new Error('missing EMAIL_FROM');
}
if (!config.EMAIL_TO) { //sending email
	throw new Error('missing EMAIL_TO');
}


app.set('port', (process.env.PORT || 5000))

//verify request came from facebook
app.use(bodyParser.json({
	verify: verifyRequestSignature
}));

//serve static files in the public directory
app.use(express.static('public'));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended: false
}))

// Process application/json
app.use(bodyParser.json())




const apiAiService = apiai(config.API_AI_CLIENT_ACCESS_TOKEN, {
	language: "en",
	requestSource: "fb"
});
const sessionIds = new Map();
const usersMap = new Map();

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})







// //EJS
// pg.defaults.ssl = true;


//var pg = require('pg');
pg.defaults.ssl = true;
app.use(session(

	{
		secret : 'gideonler123',
		resave : true,
		saveUninitialized: true

	}
));

 app.use(passport.initialize());
 app.use(passport.session());

passport.serializeUser(function(profile, cb) {//cb=callback
	cb(null, profile);
  });
  
  passport.deserializeUser(function(profile, cb) {
	cb(null, profile);
  });

 app.set('view engine', 'ejs');

  app.get('/auth/facebook', passport.authenticate('facebook' ,{scope: 'public_profile'}));//authenticate once user logs in
  app.get('/auth/facebook/callback', passport.authenticate( 'facebook',{ successRedirect : '/broadcast',failureRedirect:'/'} ));



passport.use(new FacebookStrategy({//fb logn setup passport
    clientID: config.FB_APP_ID,
    clientSecret: config.FB_APP_SECRET,
    callbackURL: config.SERVER_URL+ "auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
  
   process.nextTick(function (){
	  
	return cb(null,profile);
   });
  }
));




// Index route
app.get('/', function (req, res) {
//hello world
	res.render('login');//check if theres login file
});

app.get('/no-access', function (req, res) {

	res.render('no-access');//check if theres login file
});

app.get('/broadcast',ensureAuthenticated, function (req, res) {

	res.render('broadcast', {user: req.user});//check if theres login file
});

app.post('/broadcast',ensureAuthenticated, function (req, res) {

	res.render('broadcast-confirm');//check if theres login file
});

app.get('/broadcast-send',ensureAuthenticated, function (req, res) {

	res.redirect('broadcast-sent');//check if theres login file
});

app.get('/broadcast-sent',ensureAuthenticated, function (req, res) {

	res.redirect('broadcast-sent');
});

app.get('/logout',ensureAuthenticated, function (req, res) {

	req.logout();
	res.redirect('/');
});

function  ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}else{
		res.redirect('/');
	}
}



// const apiAiService = apiai(config.API_AI_CLIENT_ACCESS_TOKEN, {
// 	language: "en",
// 	requestSource: "fb"
// });

//end of ejs










// for Facebook verification
app.get('/webhook/', function (req, res) {
	console.log("request");
	if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === config.FB_VERIFY_TOKEN) {
		res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error("Failed validation. Make sure the validation tokens match.");
		res.sendStatus(403);
	}
})

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page. 
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook/', function (req, res) {
	var data = req.body;
	console.log(JSON.stringify(data));



	// Make sure this is a page subscription
	if (data.object == 'page') {
		// Iterate over each entry
		// There may be multiple if batched
		data.entry.forEach(function (pageEntry) {
			var pageID = pageEntry.id;
			var timeOfEvent = pageEntry.time;

			// Iterate over each messaging event
			pageEntry.messaging.forEach(function (messagingEvent) {
				if (messagingEvent.optin) {
					receivedAuthentication(messagingEvent);
				} else if (messagingEvent.message) {
					receivedMessage(messagingEvent);
				} else if (messagingEvent.delivery) {
					receivedDeliveryConfirmation(messagingEvent);
				} else if (messagingEvent.postback) {
					receivedPostback(messagingEvent);
				} else if (messagingEvent.read) {
					receivedMessageRead(messagingEvent);
				} else if (messagingEvent.account_linking) {
					receivedAccountLink(messagingEvent);
				} else {
					console.log("Webhook received unknown messagingEvent: ", messagingEvent);
				}
			});
		});

		// Assume all went well.
		// You must send back a 200, within 20 seconds
		res.sendStatus(200);
	}
});

function setSessionAndUser(senderID){
	if (!sessionIds.has(senderID)) {
		sessionIds.set(senderID, uuid.v1());
	}
		
if(!usersMap.has(senderID)){




userData(function(user){
usersMap.set(senderID,user);//callback function



},senderID);



}


	}

function receivedMessage(event) {

	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfMessage = event.timestamp;
	var message = event.message;

    setSessionAndUser(senderID);
	console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
	console.log(JSON.stringify(message));

	var isEcho = message.is_echo;
	var messageId = message.mid;
	var appId = message.app_id;
	var metadata = message.metadata;

	// You may get a text or attachment but not both
	var messageText = message.text;
	var messageAttachments = message.attachments;
	var quickReply = message.quick_reply;

	if (isEcho) {
		handleEcho(messageId, appId, metadata);
		return;
	} else if (quickReply) {
		handleQuickReply(senderID, quickReply, messageId);
		return;
	}


	if (messageText) {
		//send message to api.ai
		sendToApiAi(senderID, messageText);
	} else if (messageAttachments) {
		handleMessageAttachments(messageAttachments, senderID);
	}
}


function handleMessageAttachments(messageAttachments, senderID){
	//for now just reply
	sendTextMessage(senderID, "Attachment received. Thank you.");	
}
// function handleQuickReply(senderID, quickReply, messageId) {
// 	var quickReplyPayload = quickReply.payload;
// 	console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
// 	//send payload to api.ai 

// 	sendToApiAi(senderID, quickReplyPayload);

// }
function handleQuickReply(senderID, quickReply, messageId) {
	var quickReplyPayload = quickReply.payload;

switch (quickReplyPayload){


	case 'NEWS_PER_WEEK':
	 newsSettings.newsletterSettings(function(updated){
       if(updated){

		sendTextMessage(senderID,"Thanks for subscribing"+
		        "to unsubscribe just type 'unsub'");//fbService
	   }else{
		sendTextMessage(senderID,"Newsletter unavailable at the moment"+
		      "try again later");//fbService
	   }
	 },1,senderID);
	break;

	case 'NEWS_PER_DAY':
	newsSettings.newsletterSettings(function(updated){
		if(updated){
 
		 sendTextMessage(senderID,"Thanks for subscribing"+
				 "to unsubscribe just type 'unsub'");//fbService
		}else{
		 sendTextMessage(senderID,"Newsletter unavailable at the moment"+
			   "try again later");//fbService
		}
	  },2,senderID);




	break;

	default:
	sendToApiAi(senderID, quickReplyPayload,sessionIds,handleApiAiAction);
}

	console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
	//send payload to api.ai 
	

}
// function handleQuickReply(senderID, quickReply, messageId) {

//  var quickReplyPayload = quickReply.payload;
//  console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
//  //send payload to api.ai
//  //


//   switch (quickReplyPayload){

//   case 'NEWS_PER_WEEK':

//   //var newsSettings= require ("./user");
  
// newsSettings.newsletterSettings( function(updated){//userService. creating updated function

//       if(updated){
//        sendTextMessage(senderID,"Thanks for subscribing"+
//        "to unsubscribe just type 'unsub'");//fbService

//    }else{
//      sendTextMessage(senderID,"Newsletter unavailable at the moment"+
//      "try again later");//fbService
//    }
//  }, 1,senderID);
//   break;

//   case 'NEWS_PER_DAY':

// newsSettings.newsletterSettings(function(updated){//userService. creating updated function
    
//        if(updated){
//            sendTextMessage(senderID,"Thanks for subscribing"+
//            "to unsubscribe just type 'unsub'");//fbService
    
//        }else{
//          sendTextMessage(senderID,"Newsletter unavailable at the moment"+
//          "try again later");//fbService
//        }
//   }, 2,senderID);
//   break;
//   default:
//   sendToApiAi(sessionIds,handleApiAiResponse,senderID,quickReplyPayload);
//  }


//  console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);

// }


//https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-echo
function handleEcho(messageId, appId, metadata) {
	// Just logging message echoes to console 
	console.log("Received echo for message %s and app %d with metadata %s", messageId, appId, metadata);
}




//TEST
var readUsers={
 readAllUsers: function (callback, newstype) {//readallusers
 var pool = new pg.Pool(config.PG_CONFIG);
 pool.connect(function(err, client, done) {
     if (err) {
         return console.error('Error acquiring client', err.stack);
     }
     client.query(
             'SELECT fb_id, first_name, last_name FROM users WHERE newsletter=$1',
             [newstype],
             function(err, result) {
                 if (err) {
                     console.log(err);
                     callback([]);
                 } else {
                     console.log('rows');
                     console.log(result.rows);
                     callback(result.rows);
                 };
             });
     done();
 });
 pool.end();
}
}

var newsSettings={ // for subscribing to news per week/day
 newsletterSettings: function (callback, setting, userId) {//newslettersetting
 var pool = new pg.Pool(config.PG_CONFIG);
 pool.connect(function(err, client, done) {
     if (err) {
         return console.error('Error acquiring client', err.stack);
     }
     client.query(
             'UPDATE users SET newsletter=$1 WHERE fb_id=$2',//1=per week, 2=per day
             [setting, userId],
             function(err, result) {
                 if (err) {
                     console.log(err);
                     callback(false);
                 } else {
                     callback(true);
                 };
             });
     done();
 });
 pool.end();
}
}

//TEST





function handleApiAiAction(sender, action, responseText, contexts, parameters) { //handles api inquiree
switch (action) {

case "get-school-subjects":

if(parameters.hasOwnProperty("Singapore-schools")&&parameters["Singapore-schools"]!=''){



var request=require('request');
request ({
	url:'https://data.gov.sg/api/action/datastore_search', //URL to hit
	qs:{
		resource_id:parameters["Singapore-schools"]


},

}, function (error, response, body ){


	if(!error&&response.statusCode==200)
	{
	  let subjects=json.parse(body);//records of json subjectes
	  if(subjects.hasOwnProperty("records"))
	  {
		let reply = `${responseText} ${subjects["records"][0,1,2,3,4,5,6,7,8]["description"]}`;
		sendTextMessage(sender,reply);
	  }
	  else
	  {
		  sendTextMessage(sender, `No school available for ${parameters["Singapore-schools"]}`)
	  }

	}else
	{
		console.error(response.error);
	}

});




}
else
{
	sendTextMessage(sender,responseText);
}
break;





   case "write-feedback"://api ai action

//    if (isDefined(contexts[0]) &&
// (contexts[0].name == 'feedback' || contexts[0].name == '82c0f3ea-7eb2-42e6-8dad-25ade6c929fd_id_dialog_context')//apiai context to refer
//    && contexts[0].parameters) {
if(isDefined(contexts[0])&& contexts[0].name=='feedback'&&contexts[0].parameters){

	let feed_back= (isDefined(contexts[0].parameters['user-feedback'])
	&& contexts[0].parameters['user-feedback']!= '') ? contexts[0].parameters['user-feedback'] : '';
	let email_user = (isDefined(contexts[0].parameters['email-feedback'])
	&& contexts[0].parameters['email-feedback']!= '') ? contexts[0].parameters['email-feedback'] : '';
	
	//otherwise its empty string

	if (feed_back != '' && email_user!= '' )
	 {
		let user = usersMap.get(userId);
		 
		let emailContent = 'New feedback: '+feed_back+'from'+userID+'User email: '+email_user;
		sendEmail('New feedback',emailContent);
	    
	 }

	}
	
	
	
		sendTextMessage(sender, responseText);
	
	

       break;

		default:
			//unhandled action, just send back the text
			sendTextMessage(sender, responseText);
	}
}






function handleMessage(message, sender) {
	switch (message.type) {
		case 0: //text
			sendTextMessage(sender, message.speech);
			break;
		case 2: //quick replies
			let replies = [];
			for (var b = 0; b < message.replies.length; b++) {
				let reply =
				{
					"content_type": "text",
					"title": message.replies[b],
					"payload": message.replies[b]
				}
				replies.push(reply);
			}
			sendQuickReply(sender, message.title, replies);
			break;
		case 3: //image
			sendImageMessage(sender, message.imageUrl);
			break;
		case 4:
			// custom payload
			var messageData = {
				recipient: {
					id: sender
				},
				message: message.payload.facebook

			};

			callSendAPI(messageData);

			break;
	}
}


function handleCardMessages(messages, sender) {

	let elements = [];
	for (var m = 0; m < messages.length; m++) {
		let message = messages[m];
		let buttons = [];
		for (var b = 0; b < message.buttons.length; b++) {
			let isLink = (message.buttons[b].postback.substring(0, 4) === 'http');
			let button;
			if (isLink) {
				button = {
					"type": "web_url",
					"title": message.buttons[b].text,
					"url": message.buttons[b].postback
				}
			} else {
				button = {
					"type": "postback",
					"title": message.buttons[b].text,
					"payload": message.buttons[b].postback
				}
			}
			buttons.push(button);
		}


		let element = {
			"title": message.title,
			"image_url":message.imageUrl,
			"subtitle": message.subtitle,
			"buttons": buttons
		};
		elements.push(element);
	}
	sendGenericMessage(sender, elements);
}

function handleApiAiResponse(sender, response) {
	let responseText = response.result.fulfillment.speech;
	let responseData = response.result.fulfillment.data;
	let messages = response.result.fulfillment.messages;
	let action = response.result.action;
	let contexts = response.result.contexts;
	let parameters = response.result.parameters;

	sendTypingOff(sender);
	console.log('SAMPLE');
	if (isDefined(messages) && (messages.length == 1 && messages[0].type != 0 || messages.length > 1)) {//what does this line do??
		console.log('STUFF');
		let timeoutInterval = 1100;
		let previousType ;
		let cardTypes = [];                   
		let timeout = 0;
		for (var i = 0; i < messages.length; i++) {

			if ( previousType == 1 && (messages[i].type != 1 || i == messages.length - 1)) {

				timeout = (i - 1) * timeoutInterval;
				setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
				cardTypes = [];
				timeout = i * timeoutInterval;
				setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
			} else if ( messages[i].type == 1 && i == messages.length - 1) {
				cardTypes.push(messages[i]);
				timeout = (i - 1) * timeoutInterval;
				setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
				cardTypes = [];
			} else if ( messages[i].type == 1 ) {
				cardTypes.push(messages[i]);
			} else {
				timeout = i * timeoutInterval;
				setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
			}

			previousType = messages[i].type;

		}
	} else if (responseText == '' && !isDefined(action)) {
		//api ai could not evaluate input and the user did not add fallback intent, auto msg appear
		console.log('input.unknown' + response.result.resolvedQuery);
		sendTextMessage(sender, "I'm not sure what you want. Can you be more specific?");
	} else if (isDefined(action)) {
		handleApiAiAction(sender, action, responseText, contexts, parameters);
	} else if (isDefined(responseData) && isDefined(responseData.facebook)) {
		try {
			console.log('Response as formatted message' + responseData.facebook);
			sendTextMessage(sender, responseData.facebook);
		} catch (err) {
			sendTextMessage(sender, err.message);
		}
	} else if (isDefined(responseText)) {
		console.log('Respond as text message');
		sendTextMessage(sender, responseText);
	}
}

function sendToApiAi(sender, text) {

	sendTypingOn(sender);
	let apiaiRequest = apiAiService.textRequest(text, {
		sessionId: sessionIds.get(sender)
	});

	apiaiRequest.on('response', (response) => {
		if (isDefined(response.result)) {
			handleApiAiResponse(sender, response);
		}
	});
	
	

	apiaiRequest.on('error', (error) => console.error(error));
	apiaiRequest.end();
}




function sendTextMessage(recipientId, text) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: text
		}
	}
	callSendAPI(messageData);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId, imageUrl) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "image",
				payload: {
					url: imageUrl
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "image",
				payload: {
					url: config.SERVER_URL + "/assets/instagram_logo.gif"//example
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "audio",
				payload: {
					url: config.SERVER_URL + "/assets/sample.mp3"
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 * example videoName: "/assets/allofus480.mov"
 */
function sendVideoMessage(recipientId, videoName) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "video",
				payload: {
					url: config.SERVER_URL + videoName
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 * example fileName: fileName"/assets/test.txt"
 */
function sendFileMessage(recipientId, fileName) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "file",
				payload: {
					url: config.SERVER_URL + fileName
				}
			}
		}
	};

	callSendAPI(messageData);
}



/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId, text, buttons) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: text,
					buttons: buttons
				}
			}
		}
	};

	callSendAPI(messageData);
}


function sendGenericMessage(recipientId, elements) {
	var messageData = {
		recipient: {
			id: recipientId
		},

		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "generic",
					elements: elements
				}
			}
		}
	};



	callSendAPI(messageData);
}


function sendReceiptMessage(recipientId, recipient_name, currency, payment_method,
							timestamp, elements, address, summary, adjustments) {
	// Generate a random receipt ID as the API requires a unique ID
	var receiptId = "order" + Math.floor(Math.random() * 1000);

	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "receipt",
					recipient_name: recipient_name,
					order_number: receiptId,
					currency: currency,
					payment_method: payment_method,
					timestamp: timestamp,
					elements: elements,
					address: address,
					summary: summary,
					adjustments: adjustments
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId, text, replies, metadata) {//fb quick reply
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: text,
			metadata: isDefined(metadata)?metadata:'',
			quick_replies: replies
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {

	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "mark_seen"
	};

	callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {


	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "typing_on"
	};

	callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {


	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "typing_off"
	};

	callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: "Welcome. Link your account.",
					buttons: [{
						type: "account_link",
						url: config.SERVER_URL + "/authorize"
          }]
				}
			}
		}
	};

	callSendAPI(messageData);
}




function greetUserText(userId) {//greets uuser

   let user=usersMap.get(userId);
	sendTextMessage(userId, "Welcome " + user.first_name + 'âœ‹');

	//start
	//first read user firstname
	request({
		uri: 'https://graph.facebook.com/v2.7/' + userId,
		qs: {
			access_token: config.FB_PAGE_TOKEN
		}

		//ehhhh
		

	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {

			var user = JSON.parse(body);

			if (user.first_name) {
				console.log("FB user: %s %s, %s",
					user.first_name, user.last_name, user.gender);

			
				



               pg.connect(process.env.DATABASE_URL,function(err,client){//connect user info to database postgreSQL

					 if(err)throw err;
					 console.log("connected to postgreSQL. Searching for user..");
					 let rows=[];
					 client.query(`SELECT id FROM users WHERE fb_id = '${userId}' LIMIT 1`)
					 .on ('row',function(row){
							
						 rows.push(row);
					 })
					 .on('end', () => {
						if (rows.length === 0 ) {
							let sql = 'INSERT INTO users (fb_id, first_name, last_name, profile_pic, ' +
								'locale, timezone, gender)' +
								'VALUES ($1, $2, $3, $4, $5, $6, $7)';

							client.query(sql, [
								userId,
								user.first_name,
								user.last_name,
								user.profile_pic,
								user.locale,
								user.timezone,
								user.gender
							])
						}

					})
			   })

			
			} else {
				console.log("Cannot get data for fb user with id",
					userId);
			}
		} else {
			console.error(response.error);
		}

	});
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {
			access_token: config.FB_PAGE_TOKEN
		},
		method: 'POST',
		json: messageData

	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var recipientId = body.recipient_id;
			var messageId = body.message_id;

			if (messageId) {
				console.log("Successfully sent message with id %s to recipient %s",
					messageId, recipientId);
			} else {
				console.log("Successfully called Send API for recipient %s",
					recipientId);
			}
		} else {
			console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
		}
	});
}

function sendNewsNewsSubscribe(userId){
let responseText="Sending the latest news from schoolbag.sg," +"How often would you like to receive them?";

let replies=[
    {
		"content_type":"text",
		"title":"Once a week",
		"payload":"NEWS_PER_WEEK"

		
    },
	{
		"content_type":"text",
		"title":"Once a day",
		"payload":"NEWS_PER_DAY"

		
    },
  ];

  sendQuickReply(userId,responseText,replies);//quick reply payload for user
}



/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message. 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 * 
 */
function receivedPostback(event) {//handle payloads
	var senderID=event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfPostback = event.timestamp;

	// The 'payload' param is a developer-defined field which is set in a postback 
	// button for Structured Messages. 
	var payload = event.postback.payload;
    setSessionAndUser(senderID);

	switch (payload) {


	  case 'Student development':
	  sendToApiAi(senderID,"Student development");
	  break;

	  case 'Curriculum matters':
	  sendToApiAi(senderID,"Curriculum matters");
	  break;

	  case 'National examination':
	  sendToApiAi(senderID,"National examination");
	  break;

	  case 'Higher education':
	  sendToApiAi(senderID,"Higher education");
	  break;

	  case 'MENU_PAYLOAD':
	  sendToApiAi(senderID,"menu");
	  break;

	   case 'NEWS_NEWS':
	   sendNewsNewsSubscribe(senderID);
	   break;



		case 'HELP_PAYLOAD'://persistent menu help payload
		sendToApiAi(senderID,"help");
		break;

		case 'FEEDBACK_PAYLOAD'://persistent menu feedback payload
		sendToApiAi(senderID,"feedback");
		break;
		


		case 'FACEBOOK_WELCOME'://get started payload at start of the bot
		greetUserText(senderID);
		sendToApiAi(senderID,"get started");

		
		break;
		//default to unindentified payload
		//default:

	
	}
	console.log("payload" + payload);
	console.log("Received postback for user %d and page %d with payload '%s' " +
		"at %d", senderID, recipientID, payload, timeOfPostback);

}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 * 
 */
function receivedMessageRead(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;

	// All messages before watermark (a timestamps) or sequence have been seen.
	var watermark = event.read.watermark;
	var sequenceNumber = event.read.seq;

	console.log("Received message read event for watermark %d and sequence " +
		"number %d", watermark, sequenceNumber);
}



/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 * 
 */
function receivedAccountLink(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;

	var status = event.account_linking.status;
	var authCode = event.account_linking.authorization_code;

	console.log("Received account link event with for user %d with status %s " +
		"and auth code %s ", senderID, status, authCode);
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var delivery = event.delivery;
	var messageIDs = delivery.mids;
	var watermark = delivery.watermark;
	var sequenceNumber = delivery.seq;

	if (messageIDs) {
		messageIDs.forEach(function (messageID) {
			console.log("Received delivery confirmation for message ID: %s",
				messageID);
		});
	}

	console.log("All message before %d were delivered.", watermark);
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to 
 * Messenger" plugin, it is the 'data-ref' field. Read more at 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfAuth = event.timestamp;

	// The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
	// The developer can set this to an arbitrary value to associate the 
	// authentication callback with the 'Send to Messenger' click event. This is
	// a way to do account linking when the user clicks the 'Send to Messenger' 
	// plugin.
	var passThroughParam = event.optin.ref;

	console.log("Received authentication for user %d and page %d with pass " +
		"through param '%s' at %d", senderID, recipientID, passThroughParam,
		timeOfAuth);

	// When an authentication is received, we'll send a message back to the sender
	// to let them know it was successful.
	sendTextMessage(senderID, "Authentication successful");
}

/*
 * Verify that the callback came from Facebook. Using the App Secret from 
 * the App Dashboard, we can verify the signature that is sent with each 
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
	var signature = req.headers["x-hub-signature"];

	if (!signature) {
		throw new Error('Couldn\'t validate the signature.');
	} else {
		var elements = signature.split('=');
		var method = elements[0];
		var signatureHash = elements[1];

		var expectedHash = crypto.createHmac('sha1', config.FB_APP_SECRET)
			.update(buf)
			.digest('hex');

		if (signatureHash != expectedHash) {
			throw new Error("Couldn't validate the request signature.");
		}
	}
}






function sendEmail(subject, content) {//send to sendgrid
	var helper = require('sendgrid').mail;

	var from_email = new helper.Email(config.EMAIL_FROM);
	var to_email = new helper.Email(config.EMAIL_TO);
	var subject = subject;
	var content = new helper.Content("text/html", content);
	var mail = new helper.Mail(from_email, subject, to_email, content);

	var sg = require('sendgrid')(config.SENDGRID_API_KEY);
	var request = sg.emptyRequest({
		method: 'POST',
		path: '/v3/mail/send',
		body: mail.toJSON()
	});

	sg.API(request, function(error, response) {
		console.log(error);
		console.log(response.statusCode)
		console.log(response.body)
		console.log(response.headers)
	})
}




function isDefined(obj) {
	if (typeof obj == 'undefined') {
		return false;
	}

	if (!obj) {
		return false;
	}

	return obj != null;
}

// Spin up the server
app.listen(app.get('port'), function () {
	console.log('running on port', app.get('port'))
})





