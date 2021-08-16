const express = require('express');
const bodyParser = require('body-parser');

config = require('./config/all.config.js')
//Create a connection to database
const server = require('./database/connector.js')
server.db

// create express app
const app = express();

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))

// parse requests of content-type - application/json
app.use(bodyParser.json())

// home route
app.get('/', (req, res) => {
    res.json({"message": "Welcome to SimpleBilling application. "});
});


//Set Authentication Request Middleware for the app
let Auth = require('./middleware/middleware.app.auth.js')
app.use(Auth)
//Application Data Routes
require('./routes/app.data.route.js')(app)
// listen for requests
app.listen(config.port,config.host, () => {

    console.log(`Server is listening on port ${config.port} and host ${config.host}`);
});