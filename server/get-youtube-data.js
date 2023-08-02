const config = require('./config');
const { google } = require('googleapis');

var youtube_api_key = config.youtube_api_key;    
var client_id_youtube = config.client_id_youtube;    
var client_secret_youtube = config.client_secret_youtube;    


const authenticate = () => {
    const oauth2Client = new google.auth.OAuth2( 
        client_id_youtube,
        client_secret_youtube,
        'http://localhost:5050'
    );
    const scopes = 'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'
    const url = oauth2Client.generateAuthUrl({
      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: 'offline',
      // If you only need one scope you can pass it as a string
      scope: scopes
    });

    // const {tokens} = oauth2Client.getToken(youtube_api_key)
    // oauth2Client.setCredentials(tokens);
}


// const loadClient = () => {
//     gapi.client.setApiKey(youtube_api_key);
//     return gapi.client.load()
//         .then(function() { console.log("GAPI client loaded for API"); },
//               function(err) { console.error("Error loading GAPI client for API", err); });
//   }
//   // Make sure the client is loaded and sign-in is complete before calling this method.
// const execute = () => {
//     return gapi.client.youtube.playlistItems.list({})
//         .then(function(response) {
//                 // Handle the results here (response.result has the parsed body).
//                 console.log("Response", response);
//               },
//               function(err) { console.error("Execute error", err); });
//   }
//   gapi.load("client:auth2", function() {
//     gapi.auth2.init({client_id: client_id_youtube});
//   });

module.exports = { authenticate }
