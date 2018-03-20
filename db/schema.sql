--- load with 
--- sqlite3 database.db < schema.sql

CREATE TABLE appuser (	
	id VARCHAR(20) PRIMARY KEY,
	password VARCHAR(20),
	name VARCHAR(20),
	email VARCHAR(20),
	GENDER VARCHAR(20)
	
);

CREATE TABLE notes (
	noteid VARCHAR(20) PRIMARY KEY,
	userid VARCHAR(20),
	title TEXT,
	data TEXT
);
