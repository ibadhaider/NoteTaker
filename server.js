require("./port");
var express = require("express");
var app = express();
// to encode when saving html to db and decode when retrieving from db
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
// for authentication
var jwt = require("jsonwebtoken");

// http://www.sqlitetutorial.net/sqlite-nodejs/connect/
const sqlite3 = require("sqlite3").verbose();

// https://scotch.io/tutorials/use-expressjs-to-get-url-and-post-parameters
var bodyParser = require("body-parser");
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// will create the db if it does not exist
var db = new sqlite3.Database("db/database.db", err => {
	if (err) {
		console.erro
		++
		r(err.message);
	}
	console.log("Connected to the database.");
});

app.use(express.static("static-content"));

app.put("/api/register/:username/", function(req, res) {
	var result = {};
	var sql = "SELECT count(*) FROM appuser WHERE id = ?";
	db.get(sql, [req.body.username], (err, row) => {
		if (err) {
			result["error"] = err.message;
			res.status(500);
			res.json(result);
		} else if (row["count(*)"] != 0) {
			result["error"] = "User already exists!";
			res.status(400);
			res.json(result);
		} else {
			var sql_insert =
				"INSERT INTO appuser(id, password, name, email, GENDER) VALUES (?, ?, ?, ?, ?)";
			db.get(
				sql_insert,
				[
					req.body.username,
					req.body.password,
					req.body.full_name,
					req.body.email_address,
					req.body.gender
				],
				(err, row) => {
					if (err) {
						result["error"] = err.message;
						res.status(500);
						res.json(result);
					} else {
						res.status(200);
						result["username"] = req.body.username;
						result["password"] = req.body.password;

						jwt.sign(
							{ result: result },
							"secretkey",
							{ expiresIn: 60 * 60 * 3 },
							(err, token) => {
								res.json({
									username: req.body.username,
									token: token
								});
							}
						); //end jwt
					}
				}
			);
		}
	});
});


app.post("/api/user/:username/", jwt_verify, (req, res) => {
	var result = {};
	var user = req.params.username;
	jwt.verify(req.get("Authorization"), "secretkey", (err, authData) => {
		if (err) {
			res.status(401);
			result["error"] = "Token is invalid";
			res.json(result);
		} else {
			//compare userid in url and the token
			var tokenUserId = authData["result"]["username"];

			if (user !== tokenUserId) {
				res.status(403);
				result["error"] = "Access Denied";
				res.json(result);
			} else {
				var tokenPassword = authData["result"]["password"];

				var sql = "SELECT count(*) FROM appuser WHERE id = ?";
				db.get(sql, [req.body.username], (err, row) => {
					if (err) {
						result["error"] = err.message;
						res.status(500);
						res.json(result);
					} else if (
						row["count(*)"] != 0 &&
						req.body.username != req.params.username
					) {
						result["error"] = "User already exists!";
						res.status(400);
						res.json(result);
					} else {
						sql =
							"UPDATE appuser SET id = ?, password = ?, name = ?, email = ?, GENDER = ? WHERE id = ? AND password = ?";
						db.get(
							sql,
							[
								req.body.username,
								req.body.password,
								req.body.name,
								req.body.email,
								req.body.gender,
								tokenUserId,
								tokenPassword
							],
							(err, row) => {
								if (err) {
									result["error"] = err.message;
									res.status(500);
									res.json(result);
								} else {
									res.status(200);
									// insert new result values here
									result["username"] = req.body.username;
									result["password"] = req.body.password;

									jwt.sign(
										{ result: result },
										"secretkey",
										{ expiresIn: 60 * 60 * 3 },
										(err, token) => {
											res.json({
												username: req.body.username,
												token: token
											});
										}
									); //end jwt
								}
							}
						);
					}
				});
			}
		}
	});
});

app.delete("/api/user/:username/", jwt_verify, (req, res) => {
	var result = {};
	var user = req.params.username;
	jwt.verify(req.get("Authorization"), "secretkey", (err, authData) => {
		if (err) {
			res.status(401);
			result["error"] = "Token is invalid";
			res.json(result);
		} else {
			//compare userid in url and the token
			var tokenUserId = authData["result"]["username"];

			if (user !== tokenUserId) {
				res.status(403);
				result["error"] = "Access Denied";
				res.json(result);
			} else {
				var tokenPassword = authData["result"]["password"];
				var sql = "DELETE FROM appuser WHERE id = ? AND password = ?";
				db.get(sql, [tokenUserId, tokenPassword], (err, row) => {
					if (err) {
						result["error"] = "Error processing delete request!";
						res.status(400);
						res.json(result);
					} else {
						result["success"] = "User was successfully deleted";
						res.status(200);
						res.json(result);
					}
				});
			}
		}
	});
});

app.get("/api/user/:username/", jwt_verify, (req, res) => {
	var result = {};
	var user = req.params.username;

	jwt.verify(req.get("Authorization"), "secretkey", (err, authData) => {
		if (err) {
			res.status(401);
			result["error"] = "Token is invalid";
			res.json(result);
		} else {
			//compare userid in url and the token
			var tokenUserId = authData["result"]["username"];

			if (user !== tokenUserId) {
				res.status(403);
				result["error"] = "Access Denied";
				res.json(result);
			} else {
				var tokenPassword = authData["result"]["password"];
				var sql = "SELECT * FROM appuser WHERE id = ? AND password = ?";
				db.get(sql, [tokenUserId, tokenPassword], (err, row) => {
					if (row) {
						result["gender"] = row["GENDER"];
						result["name"] = row["name"];
						result["email"] = row["email"];
						result["user"] = user;
						res.status(200);
						res.json(result);
					} else {
						result["error"] = "User does not exist!";
						res.status(400);
						res.json(result);
					}
				});
			}
		}
	});
});
app.delete("/api/user/:username/note/:noteId/", jwt_verify, (req,res) => 
{
	var result = {};
	var user = req.params.username;
	var noteId = req.params.noteId;
	jwt.verify(req.get('Authorization'), 'secretkey', (err, authData) => 
	{
		if(err) {
			res.status(401);
			result["error"] = "Token is invalid";
			res.json(result);
	    } 
	    else {
	    	//compare userid in url and the token
			var tokenUserId = authData["result"]["username"];

			if (user !== tokenUserId){
				res.status(403);
				result["error"] = "Access Denied"; 
				res.json(result);
			}
			else{
					
				var sql = "DELETE FROM notes WHERE userid = ? AND noteid = ?";
				db.get(sql, [user, noteId], (err, row) => 
				{
				if (err)
				{	
					result["error"] = "Error processing delete request!";
					res.status(400);
					res.json(result)

				}
				else{
					result["success"] = "Note was successfully deleted";
					res.status(200);
					res.json(result);
					}
				});
 			}
		 }
  });
});

app.get("/api/user/:username/notes/", jwt_verify, (req, res) => {
	var result = {};
	var user = req.params.username;
	
	jwt.verify(req.get("Authorization"), "secretkey", (err, authData) => {
		if (err) {
			res.status(401);
			result["error"] = "Token is invalid";
			res.json(result);
		} else {
			var tokenUserId = authData["result"]["username"];
			if (user !== tokenUserId) {
				res.status(403);
				result["error"] = "Access Denied";
				res.json(result);
			} else {
				var sql = "SELECT * FROM notes WHERE userid = ?";

				db.all(sql, [user], (err, rows) => {
					if (rows) {
						result["notes"]=[];
						rows.forEach((row) => {
							row.data = entities.decode(row.data);
							result["notes"].push(row);
						});
						res.status(200);
						res.json(result);
					} else {
						result["error"] = "User does not have any notes!";
						res.status(400);
						res.json(result);
					}
				});
			}
			
		}
	});
});
app.post("/api/user/:username/note/:noteId/" , function(req, res) {
	var result = {};
	var user = req.params.username;
	var noteId = req.params.noteId;

	jwt.verify(req.get("Authorization"), "secretkey", (err, authData) => {
		if (err) {
			res.status(401);
			result["error"] = "Token is invalid";
			res.json(result);
		} else {
			
			var tokenUserId = authData["result"]["username"];

			if (user !== tokenUserId) {
				res.status(403);
				result["error"] = "Access Denied";
				res.json(result);
			} else{
				var sql = 'SELECT count(*) FROM notes WHERE userid = ? AND noteid=? ';
				db.get(sql,  [user,noteId], (err, row) => 
				{
					if (err)
					{
						result["error"] = err.message;
						res.status(500);
						res.json(result);
					}
						
					else if (row["count(*)"] == 0)
					{
						sql = 'INSERT INTO notes VALUES (?, ?, ?, ?)';
						db.get(sql, [noteId, user, entities.encode(req.body.noteData),
						req.body.noteTitle],(err, row) => 
						{
							if (err)
							{
								result["error"] = err.message;
								res.status(500);
								res.json(result);
							}
							else
							{	
								res.status(200);
							}
						});
					}	
					else
					{
						sql = 'UPDATE notes SET data=?, title=? WHERE userid = ? AND noteid = ?';
						db.get(sql, [entities.encode(req.body.noteData),
						req.body.noteTitle, user, noteId],(err, row) => 
						{
							if (err)
							{
								result["error"] = err.message;
								res.status(500);
								res.json(result);
							}
							else
							{	
								res.status(200);
							}
						});
					}		
				});	
 			}
		}
	});
});


app.post("/api/login/:username/", function(req, res) {
	var result = {};
	var user = req.body.username;
	var pass = req.body.password;
	var sql = "SELECT * FROM appuser WHERE id = ? AND password = ?";
	db.get(sql, [user, pass], (err, row) => {
		if (err) {
			result["error"] = err.message;
			res.status(500);
			res.json(result);
		} else if (row) {
			res.status(200);
			result["username"] = user;
			result["password"] = pass;
			jwt.sign(
				{ result: result },
				"secretkey",
				{ expiresIn: 60 * 60 * 3 },
				(err, token) => {
					res.json({
						username: req.body.username,
						token: token
					});
				}
			); //end jwt
		} else {
			result["error"] = "Invalid ID or Password!";
			res.status(400);
			res.json(result);
		}
	});
});

//On every request to restricted endpoints, we use this
//helper function to check if the Json Web Token (jwt) in
//headers request is actually a valid one, else 403 status for
//forbidden
function jwt_verify(req, res, next) {
	//Get request headers specifically for authorization
	const authorization_req_header = req.headers["authorization"];

	//requests are of the form 'Bearer [jwt]' and we are sending
	//as json content type
	if (typeof authorization_req_header !== "undefined") {
		//gives us just the token by itself
		const jwt_token = authorization_req_header.split(" ")[1];

		//set the token in request
		req.token = jwt_token;
		next();
	} else {
		//Forbidden status
		res.status(403);
	}
}

app.listen(port, function() {
	console.log("Listening on port " + port);
});
