var allNotes = {};
var currentNodeId = "";
var autoSaveInterval;
function createid() {
	return (
		randString() +
		randString() +
		randString() +
		randString() +
		randString() +
		randString() +
		randString() +
		randString()
	);
}
function randString() {
	return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
}


/* 
--------------------------------------LOAD, DELETE, SAVE NOTES-------------------------------------------------------------------------
*/
function loadNotesFromServer() {
	$.ajax({
		method: "GET",
		url: "/api/user/" + localStorage.getItem("username") + "/notes/",
		headers: { Authorization: localStorage.getItem("Authorization") }
	})
		.done(function(data) {
			var numNotes = 0;
			$.each(data["notes"], function(i, note) {
				numNotes++;
				allNotes[note.noteid] = {};
				allNotes[note.noteid].data = note.data;
				allNotes[note.noteid].title = note.title;
				$("#noteList").append(
					'<a class="list-group-item" id="' +
						note.noteid +
						'">' +
						note.title +
						"</a> "
				);
				$("#" + note.noteid).click(function() {
					selectNote($(this).attr("id"));
				});

				currentNodeId = note.noteid;
			});

			if (numNotes == 0) {
				createNewNote();
			} else {
				selectNote(currentNodeId);
			}
		})
		.fail(function(err) {});
}
function deleteNoteFromServer() {
	var id = currentNodeId;

	$.ajax({
		method: "DELETE",
		url:
			"/api/user/" +
			localStorage.getItem("username") +
			"/note/" +
			id +
			"/",
		headers: { Authorization: localStorage.getItem("Authorization") }
	})
		.done(function(data) {
			$("#" + id).remove();
			delete allNotes[id];
			if (Object.keys(allNotes).length === 0) {
				createNewNote();
			} else {
				selectNote(Object.keys(allNotes)[0]);
			}
		})
		.fail(function(err) {
			console.log(err.status);
			console.log(err);
		});
}
function saveNoteToServer() {
	var id = currentNodeId;
	$.ajax({
		method: "POST",
		url:
			"/api/user/" +
			localStorage.getItem("username") +
			"/note/" +
			id +
			"/",
		headers: { Authorization: localStorage.getItem("Authorization") },
		data: {
			noteData: allNotes[id].data,
			noteTitle: allNotes[id].title
		}
	})
		.done(function(data) {
			console.log("gets here");
		})

		.fail(function(err) {
			console.log(err.status);
			console.log(err);
		});
}


/*
------------------------------------  Note Helper Methods -------------------------------------------
*/
function autoSaveEnable(){
	autoSaveInterval = setInterval(save(),60000);
}
function autoSaveDisable(){
	clearInterval(autoSaveInterval);
}
function createNewNote() {
	var newId = createid();
	allNotes[newId] = {};
	allNotes[newId].data = "";
	allNotes[newId].title = "Untitled";
	$("#noteList").append(
		'<a class="list-group-item active" id="' + newId + '">Untitled</a> '
	);
	$("#" + newId).click(function() {
		selectNote($(this).attr("id"));
	});
	selectNote(newId);

	currentNodeId = newId;
}
function selectNote(id) {
	$(".list-group-item.active").removeClass("active");
	var $this = $("#" + id);
	if (!$this.hasClass("active")) {
		$this.addClass("active");
	}
	currentNodeId = id;
	$("#editor").html(allNotes[id].data);
	$("#title").val(allNotes[id].title);
}

function save() {
	if (currentNodeId != "") {
		allNotes[currentNodeId].data = $("#editor").html();
		allNotes[currentNodeId].title = $("#title").val();
		$("#" + currentNodeId).html($("#title").val());
		saveNoteToServer();
	}
}

/*
-------------------------------USER LOGIN/REGISTRATION Functions----------------------------
*/

function checkPassword() {
	var pass1 = document.getElementById("password1");
	var pass2 = document.getElementById("password2");

	if (pass1.value == pass2.value) {
		pass2.style.backgroundColor = "#66cc66";
		document.getElementById("confirmMessage").style.color = "#66cc66";
		document.getElementById("confirmMessage").innerHTML = "Passwords Match";
	} else {
		pass2.style.backgroundColor = "#ff6666";
		document.getElementById("confirmMessage").style.color = "#ff6666";
		document.getElementById("confirmMessage").innerHTML =
			"Passwords do not match.";
	}
}

function validate_id(id) {
	id.value = id.value.replace(/[^0-9'\n\r.]+/g, "");
}

function validate_name(name) {
	name.value = name.value.replace(/[^a-zA-Z-'\n\r.\s]+/g, "");
}

function create_user() {
	$.ajax({
		method: "PUT",
		url: "/api/register/" + $("#usr").val() + "/",
		data: {
			username: $("#usr").val(),
			gender: $('input[type="radio"]:checked').val(),
			full_name: $("#full_name").val(),
			email_address: $("#email").val(),
			password: $("#password1").val()
		}
	})
		.done(function(data) {
			localStorage.setItem("Authorization", data["token"]);
			localStorage.setItem("username", data["username"]);

			$("#usr").val("");
			$("#email").val("");
			$("#full_name").val("");
			$('input[type="radio"]:checked').prop("checked", false);
			$("#password1").val("");
			$("#password2").val("");
			$("#confirmMessage").html("");
			$(".registration-form").hide();
			$(".main_screen_area").show();
			$(".login-form").show();
		})
		.fail(function(err) {
			$("#errors_registration").html(err.responseJSON["error"]);
		});
}

function login_user() {
	$.ajax({
		method: "POST",
		url: "/api/login/" + $("#user_id_login").val() + "/",
		data: {
			username: $("#user_id_login").val(),
			password: $("#password_text_login").val()
		}
	})
		.done(function(data) {
			$(".main_screen_area").hide();
			$(".navbar").show();
			$("#user_id_login").val("");
			$("#password_text_login").val("");
			$("#errors_login").html("");
			localStorage.setItem("Authorization", data["token"]);
			localStorage.setItem("username", data["username"]);
			$("#home").show();
			loadNotesFromServer();
			autoSaveEnable();
		})
		.fail(function(err) {
			$("#errors_login").html("Invalid Username or Password!");
		});
}

function profile_user() {
	$.ajax({
		method: "GET",
		url: "/api/user/" + +localStorage.getItem("username") + "/",
		headers: { Authorization: localStorage.getItem("Authorization") }
	})
		.done(function(data) {
			$("#usr_summary").val(data["user"]);
			$("#email_profile_summary").val(data["email"]);
			$("#full_name_summary").val(data["name"]);
			$(
				"input[name=gender][value=" + data["gender"].toLowerCase() + "]"
			).prop("checked", true);
		})
		.fail(function(err) {
			$("#errors_profile_update").html(err.responseJSON["error"]);
		});
}

function profile_delete() {
	$.ajax({
		method: "DELETE",
		url: "/api/user/" + localStorage.getItem("username") + "/",
		headers: { Authorization: localStorage.getItem("Authorization") }
	})
		.done(function(data) {
			$(".login-form").show();
		})
		.fail(function(err) {
			localStorage.removeItem("username");
			localStorage.removeItem("Authorization");
			//$("#errors_login").html(err.responseJSON["error"]);
		});
}

function update_user() {
	$.ajax({
		method: "POST",
		url: "/api/user/" + localStorage.getItem("username") + "/",
		headers: { Authorization: localStorage.getItem("Authorization") },
		data: {
			username: $("#usr_summary").val(),
			email: $("#email_profile_summary").val(),
			name: $("#full_name_summary").val(),
			password: $("#password1_summary").val(),
			gender: $('input[type="radio"]:checked').val()
		}
	})
		.done(function(data) {
			localStorage.setItem("Authorization", data["token"]);
			localStorage.setItem("username", data["username"]);
			$("#errors_profile_update").html("Data was succesfully updated!");
			profile_user();
		})
		.fail(function(err) {
			$("#errors_profile_update").html(err.responseJSON["error"]);
		});
}

$(function() {
	$(".navbar").hide();
	$(".user_profile").hide();
	$("#home").hide();
	$(".main_screen_area").show();
	$(".registration-form").hide();

	/*
	-------------------- FOR RICH TEXT EDITOR --------------------------------------------------------
	*/
	function initToolbarBootstrapBindings() {
		var fonts = [
				"Serif",
				"Sans",
				"Arial",
				"Arial Black",
				"Courier",
				"Courier New",
				"Comic Sans MS",
				"Helvetica",
				"Impact",
				"Lucida Grande",
				"Lucida Sans",
				"Tahoma",
				"Times",
				"Times New Roman",
				"Verdana"
			],
			fontTarget = $("[title=Font]").siblings(".dropdown-menu");
		$.each(fonts, function(idx, fontName) {
			fontTarget.append(
				$(
					'<li><a data-edit="fontName ' +
						fontName +
						'" style="font-family:\'' +
						fontName +
						"'\">" +
						fontName +
						"</a></li>"
				)
			);
		});
		$("a[title]").tooltip({ container: "body" });
		$(".dropdown-menu input")
			.click(function() {
				return false;
			})
			.change(function() {
				$(this)
					.parent(".dropdown-menu")
					.siblings(".dropdown-toggle")
					.dropdown("toggle");
			})
			.keydown("esc", function() {
				this.value = "";
				$(this).change();
			});

		$("[data-role=magic-overlay]").each(function() {
			var overlay = $(this),
				target = $(overlay.data("target"));
			overlay
				.css("opacity", 0)
				.css("position", "absolute")
				.offset(target.offset())
				.width(target.outerWidth())
				.height(target.outerHeight());
		});
		if ("onwebkitspeechchange" in document.createElement("input")) {
			var editorOffset = $("#editor").offset();
			$("#voiceBtn")
				.css("position", "absolute")
				.offset({
					top: editorOffset.top,
					left: editorOffset.left + $("#editor").innerWidth() - 35
				});
		} else {
			$("#voiceBtn").hide();
		}
	}
	function showErrorAlert(reason, detail) {
		var msg = "";
		if (reason === "unsupported-file-type") {
			msg = "Unsupported format " + detail;
		} else {
			console.log("error uploading file", reason, detail);
		}
		$(
			'<div class="alert"> <button type="button" class="close" data-dismiss="alert">&times;</button>' +
				"<strong>File upload error</strong> " +
				msg +
				" </div>"
		).prependTo("#alerts");
	}
	initToolbarBootstrapBindings();
	$("#editor").wysiwyg({ fileUploadError: showErrorAlert });
	window.prettyPrint && prettyPrint();
	$("#editor").wysiwyg();


	/*
	---------------------------------------------- Assign On-Click functions to Buttons ----------------
	*/
	$("#newNote").click(function() {
		createNewNote();
	});
	$(".list-group-item").click(function() {
		selectNote($(this).attr("id"));
	});

	$("#saveButton").click(function() {
		save();
		$("#saveAlert").html(new Date().toLocaleString());
	});
	$("#deleteButton").click(function() {
		deleteNoteFromServer();
	});

	$("#home_click").click(function() {
		$(".user_profile").hide();
		$("#home").show();
		autoSaveEnable();
	});
	$("#change_user_info").click(function() {
		profile_user();
		$(".user_profile").show();
		$("#home").hide();
		autoSaveDisable();
	});

	$("#login_button").on("click", function() {
		login_user();
	});

	$("#create_account_button").on("click", function() {
		$(".registration-form").show();
		$(".login-form").hide();
		$("#user_profile").hide();
		$(".h1_login").show();
	});

	$("#register_submit_button").on("click", function() {
		var client_side_errors = "";
		var regexMail = /^([_a-zA-Z0-9-]+)(\.[_a-zA-Z0-9-]+)*@([a-zA-Z0-9-]+\.)+([a-zA-Z]{2,3})$/;
		var usernameRegex = /[0-9]+/;
		var passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,50}$/;

		if (regexMail.test($("#email").val()) == false) {
			client_side_errors += "Email isn't in a valid format!   Format: sameple@sample.com  <br>";
		}
		if (usernameRegex.test($("#usr").val()) == false) {
			client_side_errors += "Id isn't in a valid format ! Must be only numbers! <br>";
		}

		if (passwordRegex.test($("#password1").val()) == false) {
			client_side_errors += "Password isn't in a valid format! Must Contain an Uppercase letter, lowercase letter, a number and a special charachter (#?!@$%^&*-)Min 8 Characters Max 50 Characters.<br>";
		}

		if ($("#password1").val() != $("#password2").val()) {
			client_side_errors += "Password's don't match!<br>";
		}

		if (
			!$("#male_check_register").prop("checked") &&
			!$("#female_check_register").prop("checked") &&
			!$("#other_check_register").prop("checked")
		) {
			client_side_errors += "You haven't chosen a gender!<br>";
		}

		$("#errors_registration").html(client_side_errors);

		if (client_side_errors == "") {
			create_user();
		}
	});

	//
	$("#profile_delete_btn").on("click", function() {
		profile_delete();
		$(".navbar").hide();
		$(".main_screen_area").show();
		$(".user_profile").hide();
	});

	$("#logout_click").on("click", function() {
		allNotes = {};
		$("#noteList").empty();
		currentNodeId = "";
		localStorage.removeItem("username");
		localStorage.removeItem("Authorization");
		$(".navbar").hide();
		$(".user_profile").hide();
		$("#home").hide();
		autoSaveDisable();
		$(".main_screen_area").show();
	});

	$("#registration_login_btn").on("click", function() {
		$(".registration-form").hide();
		$(".login-form").show();
		$(".h1_login").show();
	});

	$("#submit_profile_change").on("click", function() {
		var client_side_errors = "";
		var regexMail = /^([_a-zA-Z0-9-]+)(\.[_a-zA-Z0-9-]+)*@([a-zA-Z0-9-]+\.)+([a-zA-Z]{2,3})$/;
		var usernameRegex = /[0-9]+/;
		var passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,50}$/;

		if (regexMail.test($("#email_profile_summary").val()) == false) {
			client_side_errors += "Email isn't in a valid format!   Format: sameple@sample.com  <br>";
		}
		if (usernameRegex.test($("#usr_summary").val()) == false) {
			client_side_errors += "Id isn't in a valid format ! Must be only numbers! <br>";
		}

		if (passwordRegex.test($("#password1_summary").val()) == false) {
			client_side_errors += "Password isn't in a valid format! Must Contain an Uppercase letter, lowercase letter, a number and a special charachter (#?!@$%^&*-)Min 8 Characters Max 50 Characters.<br>";
		}

		if ($("#password1_summary").val() != $("#password2_summary").val()) {
			client_side_errors += "Password's don't match!<br>";
		}

		if (
			!$("#male_check_profile").prop("checked") &&
			!$("#female_check_profile").prop("checked") &&
			!$("#other_check_profile").prop("checked")
		) {
			client_side_errors += "You haven't chosen a gender!<br>";
		}

		$("#errors_profile_update").html(client_side_errors);

		if (client_side_errors == "") {
			update_user();
		}
	});
});
