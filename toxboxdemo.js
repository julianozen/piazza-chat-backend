// Require the packages we will use:

var HTML_ISNT_THIS_GOOD_CODE =  "<html><head><title>Piazza Chat</title><script src='http://static.opentok.com/webrtc/v2.2/js/opentok.min.js'></script><link rel='stylesheet' href='http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css'><link rel='stylesheet' href='http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap-theme.min.css'><script src='http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js'></script><script src='http://macdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js'></script><script src='/socket.io/socket.io.js'></script><script type='text/javascript'> var apiKey='YOUR_API_KEY_HERE';var sessionId='YOUR_SESSION_ID_HERE';var token='YOUR_TOKEN_HERE';function sessionConnectedHandler (event){session.publish( publisher );subscribeToStreams(event.streams);}function subscribeToStreams(streams){for (var i=0;i < streams.length;i++){var stream=streams[i];if (stream.connection.connectionId !=session.connection.connectionId){session.subscribe(stream, 'mySubscriberElement',{width:1280, height:800});}}}function streamCreatedHandler(event){subscribeToStreams(event.streams);}var dom=document.getElementById('user_video');var publisherProperties={width:1280, height:800};var publisher=TB.initPublisher(apiKey, 'user_video', publisherProperties);var session=TB.initSession(sessionId);session.connect(apiKey, token);session.addEventListener('sessionConnected', sessionConnectedHandler);session.addEventListener('streamCreated', streamCreatedHandler);console.log(apiKey);console.log(sessionId);console.log(token);</script></head><body><nav class='navbar navbar-default' role='navigation'><div class='container-fluid'><div class='navbar-header'><button type='button' class='navbar-toggle' data-toggle='collapse' data-target='#bs-example-navbar-collapse-1'><span class='sr-only'>Toggle navigation</span><span class='icon-bar'></span><span class='icon-bar'></span><span class='icon-bar'></span></button><div class='navbar-brand'>Piazza Chat</div></div></div></nav><div class='container'><div class='row'><div class='col-sm-9'> Other Users </div><div id='user_video' lass='col-sm-3'> User Video </div></div></div></body></html>";




var http = require("http"),
    socketio = require("socket.io"),
    url = require('url'),
    fs = require("fs");

var databaseUrl = "greylock1"; // "username:password@example.com/mydb"
var collections = ["chatrooms", "klasses", "users"]
var db = require("mongojs").connect(databaseUrl, collections);



var apiKey = "44906182";
var secret = "939b67a237dc65b2d8ca7bcd2f340e6b6589af27";
var OpenTok = require('opentok'),
    opentok = new OpenTok(apiKey, secret);


db.dropDatabase();


// Listen for HTTP connections.  This is essentially a miniature static file server that only serves our one file, chat.html:
var app = http.createServer(function (req, resp) {
    // This callback runs when a new connection is made to our HTTP server.
    // fs.readFile("tokbox.html", function (err, data) {
    //     // This callback runs when the chat.html file has been read from the filesystem.
    //     if (err) return resp.writeHead(500);
    //     resp.writeHead(200);
    //     console.log(data)


    //req = tokbox?klassId=10&user....
    //generate 3 vars based on klass, user

    data = fs.readFileSync('tokbox.html', 'utf8');

	HTML_ISNT_THIS_GOOD_CODE = data;
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;

	console.log(query);
	if (query.klassId){
		db.chatrooms.find({klassId: query.klassId}, function(err, rooms) {

			room = rooms[0];
			console.log(room);
			var sessionId = room.tokboxSessionId;
      		var token = opentok.generateToken(sessionId);
      		// content = {apiKey:apiKey, sessionId:sessionId, token:token}

			var HTML_ISNT_THIS_GOOD_CODE_temp = HTML_ISNT_THIS_GOOD_CODE;
			HTML_ISNT_THIS_GOOD_CODE_temp = HTML_ISNT_THIS_GOOD_CODE_temp.replace("YOUR_API_KEY_HERE", apiKey);
			HTML_ISNT_THIS_GOOD_CODE_temp = HTML_ISNT_THIS_GOOD_CODE_temp.replace("YOUR_SESSION_ID_HERE", sessionId);
			HTML_ISNT_THIS_GOOD_CODE_temp = HTML_ISNT_THIS_GOOD_CODE_temp.replace("YOUR_TOKEN_HERE", token);
			resp.end(HTML_ISNT_THIS_GOOD_CODE_temp);
		});
	}
	else {
		resp.end("lol nope");
	}



    


});

app.listen(8080);

// Do the Socket.IO magic:
var io = socketio.listen(app);
io.sockets.on("connection", function (socket) {
    // This callback runs when a new Socket.IO connection is established.
    // console.log(socket);
    socket.on("init_message", function (content) {
        // This callback runs when the client sends us a "message" event
        // console.log(userInDB());
        // check if user exists
        // or add them
        //check if room exists
        //add user to that room
        //get messages in room
        //get room, get users in room, messages in room and user
		db.users.find({userId: content.userId}, function(err, users) {
			var user, room;
			console.log("________________________")
			if (users.length > 0) {
				user = users[0];
				user.socket = socket.id;
				db.users.save(user);
			} else {
		        user = {userId: content.userId,
		        		name: content.name,
		        		socket: socket.id
		        };
		        db.users.save(user);
			}
			console.log("klassid", content.klassId);
			db.chatrooms.find({klassId: content.klassId}, function(err, rooms) {
				if (rooms.length > 0) {
					room = rooms[0];

					var userInRoom = false;
					for (i = 0; i < room.users.length; ++i) {
						if (room.users[i] == content.userId) {
							userInRoom = true;
						}
					}
					if (!userInRoom) {
						room.users.push(user.userId);
						db.chatrooms.save(room);
					}
					content = { room:room };
				console.log(content)
				socket.emit("render_chat", content); // broadcast the message to other users
				} else {
					console.log("make session:")
								console.log("klassid the second time", content.klassId);

			        (function(content){opentok.createSession({mediaMode:"routed"}, function(error, session) {
						  if (error) {
						    console.log("Error creating session:")
						  } else {

						console.log("session made:")
					console.log("klassid before room", content.klassId);


					    room = {klassId:content.klassId,
			        		klassName:content.klass,
			        		users:[content.userId],
			        		messages:[],
			        		tokboxSessionId:session.sessionId
				        };
				        db.chatrooms.save(room);
				        	content = { room:room };
				console.log(content)
				socket.emit("render_chat", content); // broadcast the message to other users

					  }
					});
			    })(content);


				}


			});
		});
    });


	socket.on("send_message", function (content) {
		console.log('1')

		message = {
			type:content.messageType,
			content:content.content,
			time:new Date(),
			poster:content.poster
		};

		console.log(content);
		db.chatrooms.find({klassId: content.room.klassId}, function(err, rooms) {
			console.log('2')

			//TODO check room exists
			room = rooms[0];

			room.messages.push(message);
			db.chatrooms.save(room);
			console.log('3')


			content = { room:room };

			// console.log(room.users[0]);
			for (var i = 0; i < room.users.length; ++i) {
				console.log('4')


				db.users.find({userId: room.users[i]}, function(err, users) {
					console.log('6')


					console.log(users[0]);
					console.log('7')


					console.log(io.sockets.connected);
					if (io.sockets.connected[users[0].socket]) {
						console.log('here')
						console.log(content);
						io.sockets.connected[users[0].socket].emit('render_chat', content);
					}
				});
			}
		});


	});

	socket.on("init_video_server", function (content) {

		db.chatrooms.find({klassId: content.user.klassId}, function(err, rooms) {

			room = rooms[0];
			console.log(room);
			var sessionId = room.tokboxSessionId;
      		var token = opentok.generateToken(sessionId);
      		content = {apiKey:apiKey, sessionId:sessionId, token:token}

			socket.emit("start_playing", content);


				});


	});
});

