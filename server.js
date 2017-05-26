

/*
    library include
*/
var WebSocketServer = require('websocket').server;
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var http = require('http');

var db = require('./db/dbconnection');

var connection = db.connect();
db.getOnlineUsers(connection);

//3000 http communication channel
var app = express();

//store all the live connections;
var connections = [];

app.use(bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});


//HTTP REST end points starts here
app.get('/users', function(req, res) {

    var users = [];
    for (var i = 0; i < connections.length; i++) {
        
        var cxn = connections[i];
        var email = cxn['email'];
        var name = cxn['name'];

        users.push({name:name, email:email});
    };    

    res.send(users);
});

app.get('/', function(req, res) {

    console.log(path.join(__dirname + '/public/index.html'));
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.listen(3000, function() {
    console.log((new Date()) + ' Server is listening on port 3000');
});

////HTTP REST end points ends here
 
wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production 
    // applications, as it defeats all standard cross-origin protection 
    // facilities built into the protocol and the browser.  You should 
    // *always* verify the connection's origin and decide whether or not 
    // to accept it. 
    autoAcceptConnections: false
});

// 
function getUserInfoForConnection(connection) {

    for (var i = 0; i < connections.length; i++) {
        
        if (connection === connections[i]['connectionObject']) {

            return connections[i];
        }
    }  

    return null;  
}
// 
function removeConnectionFor(connection) {

    for (var i = 0; i < connections.length; i++) {
        
        if (connection === connections[i]['connectionObject']) {

            break;
        }
    }

    connections.splice(i, 1);
}
// 
function getConnectionFor(email) {

    for (var i = 0; i < connections.length; i++) {
        
        var cxn = connections[i];
        var emailId = cxn['email'];

        if (email == emailId) {

            return cxn['connectionObject'];
        }
    };

    return null;
}

 
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed. 
  return true;
}
//
function sendMessage(connection, message) {

    console.log(message);

    var email = JSON.parse(message['utf8Data'])['to']['email'];

    var c = getConnectionFor(email);

    if (message.type === 'utf8') {

        console.log('Received Message: ' + message.utf8Data);

        if (c != null || c != undefined) {

            c.sendUTF(message.utf8Data);                
        }
        else {
            connection.sendUTF(JSON.stringify({'status':'failed', msg:'User is not live'}));
        }
    }    
}
 
//When user log-in  
wsServer.on('request', function(request) {

    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin 
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    //connection - when user login in, This will be used to send data to user.
    var connection = request.accept('protocol', request.origin);    

    var newEntry = {

        name:request['resourceURL']['query']['name'],
        email:request['resourceURL']['query']['email'],
        connectionObject: connection
    }
    //This connection array is used to maintain the active users.
    connections.push(newEntry);
    console.log((new Date()) + ' Connection accepted.');

    //This method is called when user receives message.
    connection.on('message', function(message) {

        sendMessage(connection, message);
    });
//
    connection.on('close', function(reasonCode, description) {

        removeConnectionFor(connection);        
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });

});
