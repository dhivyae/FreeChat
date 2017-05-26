module.exports = {

	connect: function(){

		var mysql      = require('mysql');
		var connection = mysql.createConnection({
	  		host     : 'localhost',
	  		user     : 'root',
	  		password : '',
	  		database : 'FreeChat'
		});
	 
		connection.connect(function(err){

			if (err) {

				console.error(err.stack);
				return;
			}	
			else {
				console.log("Connection successful...!");
			}		
		});

		return connection;
	},


	getOnlineUsers:function(connection) {

		connection.query('SELECT * from users', function(err, rows){

			console.log(rows);
		});
	},

	disconnect: function(connection) {

		connection.end();
	}	
};