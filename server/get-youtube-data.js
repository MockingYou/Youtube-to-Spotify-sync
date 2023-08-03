const config = require('./config');
const { google } = require('googleapis');
const {authenticate} = require('@google-cloud/local-auth');
const apiKey = config.youtube_api_key;    
var client_id_youtube = config.client_id_youtube;    
var client_secret_youtube = config.client_secret_youtube;    
const youtube = google.youtube({
  version: 'v3',
  auth: apiKey
})




const auth = async () => {
    const oauth2Client = new google.auth.OAuth2( 
        client_id_youtube,
        client_secret_youtube,
        'http://localhost:5050'
    );
    const scopes = 'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'
    const localAuth = await authenticate({
      // 'online' (default) or 'offline' (gets refresh_token)
      keyfilePath: '/path/to/keys.json',
      // If you only need one scope you can pass it as a string
      scope: scopes
    });
    console.log('Tokens:', localAuth.credentials);
    // const {tokens} = oauth2Client.getToken(youtube_api_key)
    // oauth2Client.setCredentials(tokens);
}

module.exports = { authenticate }
