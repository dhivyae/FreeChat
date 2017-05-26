var socket;

var messages = [];
var activeUsers = [];
var selectedUser = {};
var loggedInUser = '';
var loggedInUserEmail = '';

$('.messenger-container').hide();

//This method is called when user clicks on Let's talk (login)
$('#connect').click(function(e){

    console.log("lets talk clicked...!");
    //get the user name
    loggedInUser = $('#name').val();
    //get the email id
    loggedInUserEmail = $('#email').val();

    //create websocket url 
    var url = "ws://"+window.location.hostname+":8080?name="+loggedInUser+"&email="+loggedInUserEmail;
    //connect to server
    socket = new WebSocket(url, "protocol");

    //This method gets called when connection is created
    socket.addEventListener("open", function(event) {

      $('.loginForm').hide();
      $('.messenger-container').show();

      //Get all active user from server
      getActiveUsers();

    });

    socket.addEventListener("message", function(event) {

        console.log(event.data);
        messages.push(JSON.parse(event.data));
        updateActiveUser(event.data);

    });

});

//highlight current selected user
function updateActiveUser(data) {

    var messageContainer = $('.message-container');
    var data = JSON.parse(data);


    if (selectedUser['name'] != undefined && selectedUser['email'] === data['from']['email']) {
     
      var card = "<div class='message-ping'><div class='pic-ping'><p class='user-letter-ping'>"+selectedUser['name'].charAt(0).toUpperCase()+"</p></div><div class='from-msg'>"+data['message']+"</div></div>";          
      messageContainer.append(card);
    }
}

function getSelectedUserObject(name) {


    $('.active-user').removeClass('current-active-person');
    $('#'+name).addClass('current-active-person');

    for (var i = 0; i < activeUsers.length; i++) {
        
        var user = activeUsers[i];
        var userName = user['name'];

        if (name == userName) {

          return user;
        }
    };

    return null;
}

function sendMessage(message) {

  $('.message-box').val("");

  if (selectedUser != undefined) {

    var msg = {

        to: {          
          email:selectedUser['email']          
        },
        from: {
          email:loggedInUserEmail
        },
        message:message
    };

    messages.push(msg);

    var messageContainer = $('.message-container');
    var card = "<div class='my-message'><p class='msg'>"+message+"</p><div class='pic'><p class='user-letter'>"+loggedInUser.charAt(0).toUpperCase()+"</p></div></div>";

    messageContainer.append(card);

    socket.send(JSON.stringify(msg));    
  }
}


function getCardForMessage(msg) {

    if (msg['to']['email'] === selectedUser['email'])
      return getMyMessageCard(msg, loggedInUser);
    else
      return getMessagePingCard(msg, selectedUser['name']);
}


function getMyMessageCard(message, user) {

    var card = "<div class='my-message'>"+message['message']+"<div class='pic'><p class='user-letter'>"+user.charAt(0).toUpperCase()+"</p></div></div>";
    return card;
}


function getMessagePingCard(message, user) {

    var card = "<div class='message-ping'>"+"<div class='pic-ping'><p class='user-letter-ping'>"+user.charAt(0).toUpperCase()+"</p></div><div class='from-msg'>"+message['message']+"</div></div>";          
    return card;
}


function getEmailIdForUser(user) {

  for (var i = 0; i < activeUsers.length; i++) {
    
      if (activeUsers[i]['name'] == user)
        return activeUsers[i]['email'];
  }

  return null;
}


function getConversationForSelectedUser(user) {

      var email = getEmailIdForUser(user);
      var conversations = [];

      for (var i = 0; i < messages.length; i++) {
          
          var msg = messages[i];

          if ( 
                (msg['to']['email'] === loggedInUserEmail && msg['from']['email'] === email) ||
                (msg['to']['email'] === email && msg['from']['email'] === loggedInUserEmail)
             ){

              conversations.push(msg);
          }
      };

      return conversations;
}


function replaceConversationDialogs(conversations) {

    var messageContainer = $('.message-container');
    messageContainer.empty();

    for (var i = 0; i < conversations.length; i++) {

        var card = getCardForMessage(conversations[i]);
        messageContainer.append(card);
    };
}


function activeUserTaped(e) {

      console.log(e.target.id);
      selectedUser = getSelectedUserObject(e.target.id);
      var conversations = getConversationForSelectedUser(e.target.id);
      replaceConversationDialogs(conversations);
}

function constructActiveUserLayout(response) {

      var activeUserContainer = $('.online-container');
      activeUserContainer.empty();

      activeUsers = response;      


      $('.active-user').unbind('click');
      for (var i = 0; i < response.length; i++) {

          if (response[i]['name'] != loggedInUser) {

            var card = "<div class='active-user' id='"+response[i]['name']+"'>"+response[i]['name']+"</div>";          
            activeUserContainer.append(card);

            $('#'+response[i]['name']).click(activeUserTaped);   
          }

          if (response[i]['name'] == selectedUser['name']) {

              $('.active-user').removeClass('current-active-person');
              $('#'+selectedUser['name']).addClass('current-active-person');         
          }
      };      
}

function getActiveUsers() {

    // http://locahost:3000/users  - 
    $.ajax({

      type: "GET",
      url: '/users',
      data: null,
      contentType: "application/json; charset=utf-8",
      dataType: "json",

      success: function(response) {

          console.log(response);
          constructActiveUserLayout(response);
      },

      error: function(e){

          console.log(e);
      }
    });

}


$('.message-box').bind("enterKey",function(e) {
   
    var msg = $('.message-box').val();
    console.log(msg); 
    sendMessage(msg);   
});

$('.message-box').keyup(function(e) {

    if(e.keyCode == 13)
    {
        $(this).trigger("enterKey");
    }
});


setInterval(function() {

  getActiveUsers();

}, 40000);




