const express = require('express');
const request = require('request');
const cors = require('cors'); // Import the cors package

const app = express();
const PORT = 8080;
const config = require('./config');


// Enable CORS for all routes
app.use(cors());
app.use(express.json());

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);

var client_id = config.client_id;    
var client_secret = config.client_secret;

var authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
  },
  form: {
    grant_type: 'client_credentials'
  },
  json: true
};

request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
  
      // use the access token to access the Spotify Web API
      var token = body.access_token;
      var options = {
        url: `https://api.spotify.com/v1/users/1pj9484y17ck8ycc82xslq9z1`,
        headers: {
          'Authorization': 'Bearer ' + token
        },
        json: true
      };
      console.log(body);

      request.get(options, function(error, response, body) {
        console.log(body);
      });
    }
  });