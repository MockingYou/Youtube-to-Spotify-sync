const express = require('express');
const cors = require('cors'); // Import the cors package
const app = express();
const { google } = require('googleapis');
const fs = require('fs');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const credentials = JSON.parse(fs.readFileSync('./credentials/credentials.json'));

const PORT = 5050;
let SpotifyWebApi = require('spotify-web-api-node');

const config = require('./config.js')
const { getTotalSongs, getYoutubePlaylistTitle, createPlaylistOnYoutube, addSongsToPlaylist } = require('./get-youtube-data');
const { createPlaylistOnSpotify, searchSongs, addTracksToPlaylist, getSpotifyPlaylistData, getSpotifyPlaylistTitle } = require('./get-spotify-data');

// Spotify data
const client_id_spotify = config.client_id_spotify;    
const client_secret_spotify = config.client_secret_spotify;
let spotifyApi = new SpotifyWebApi({
  clientId: client_id_spotify,
  clientSecret: client_secret_spotify,
  redirectUri: 'http://localhost:5050/spotify/callback'
});
let spotify_token = ""
const spotify_scopes = [
  'ugc-image-upload',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'app-remote-control',
  'user-read-email',
  'user-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-read-private',
  'playlist-modify-private',
  'user-library-modify',
  'user-library-read',
  'user-top-read',
  'user-read-playback-position',
  'user-read-recently-played',
  'user-follow-read',
  'user-follow-modify'
];

//Youtube data
const apiKey = credentials.web.api_key;
const client_id_youtube = config.client_id_youtube;    
const client_secret_youtube = config.client_secret_youtube;
const redirectUriYoutube = 'http://localhost:5050/youtube/callback'
const oauthClient = new google.auth.OAuth2(    
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]);

const yt_scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/youtubepartner",
  "https://www.googleapis.com/auth/youtube.upload", // Add this scope for playlist management
  "https://www.googleapis.com/auth/youtube.readonly", // Add this scope for reading playlist information
];
let youtube_token = null;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

//  ================== Google APIs ======================

app.get("/auth", (req, res) => {
  const authUrl = oauthClient.generateAuthUrl({
      access_type: 'offline',
      scope: yt_scopes,
  });

  res.redirect(authUrl);
});

app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;

  try {
      const tokenResponse = await oauthClient.getToken(code);
      youtube_token = tokenResponse.tokens.access_token;
      console.log("Your token: " + youtube_token)
      res.redirect("/protected");
  } catch (err) {
      console.error("Error exchanging code for token:", err);
      res.status(500).send("Error");
  }
});

app.get("/protected", (req, res) => {
  if (!youtube_token) {
      res.redirect("/auth");
  } else {
      res.send("Welcome to the protected route!");
  }
});

// -------- END Google APIS ----------

// GET endpoint to list all songs in a YouTube playlist
app.get('/api/youtube/playlist/:playlistId', async (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    const songs = await getTotalSongs(playlistId, apiKey);
    res.json(songs);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

app.post("/search-songs", async (req, res) => {
  try {
      const youtube = google.youtube({
          version: 'v3',
          auth: apiKey, // Use your API key here
      });

      const songTitles = req.body.songTitles; // Array of song titles

      const videoIds = [];

      for (const songTitle of songTitles) {
          const response = await youtube.search.list({
              part: 'id',
              q: songTitle,
              maxResults: 1,
          });

          if (response.data.items.length > 0) {
              const videoId = response.data.items[0].id.videoId;
              videoIds.push(videoId);
          }
      }

      res.json({ videoIds: videoIds });
  } catch (err) {
      console.error("Error searching songs:", err);
      res.status(500).json({ error: "Error searching songs" });
  }
});

app.post('/api/youtube/create-playlist/:playlistId', async (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    
    const playlistTitle = await getSpotifyPlaylistTitle(playlistId, spotifyApi);
    let spotifyData = await getSpotifyPlaylistData(spotifyApi, playlistId)
    await addSongsToPlaylist(oauthClient, spotifyData, playlistTitle, youtube_token, apiKey);
    
    res.send('Playlist created and videos added successfully.');
  } catch (error) {
    console.error('Error fetching or creating playlist:', error);
    res.status(500).json({ error: 'Failed to fetch or create playlist' });
  }
});
//  ================== END Google APIs ======================

//  ================== Spotify APIs ======================

app.get('/spotify/login', (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(spotify_scopes));
});

app.get('/spotify/callback', (req, res) => {
  const error = req.query.error;
  const code = req.query.code;
  const state = req.query.state;

  if (error) {
    console.error('Callback Error:', error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      spotify_token = data.body['access_token'];
      const refresh_token = data.body['refresh_token'];
      const expires_in = data.body['expires_in'];

      spotifyApi.setAccessToken(spotify_token);
      spotifyApi.setRefreshToken(refresh_token);

      console.log(
        `Sucessfully retreived access token. Expires in ${expires_in} s.`
      );
      res.send('Success! You can now close the window.');

      setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken();
        spotify_token = data.body['access_token'];
        console.log('The access token has been refreshed!');
        // console.log('access_token:', spotify_token);
        spotifyApi.setAccessToken(spotify_token);
      }, expires_in / 2 * 1000);
    })
    .catch(error => {
      console.error('Error getting Tokens:', error);
      res.send(`Error getting Tokens: ${error}`);
    });
}); 

// GET endpoint to list all songs in a Spotify playlist
app.get('/api/spotify/playlist/:playlistId', async (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    // const playlistTitle = getPlaylistTitle(playlistId, apiKey);
    const songs = await getSpotifyPlaylistData(spotifyApi, playlistId)
    // console.log(songs.length)
    res.json(songs);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

// Route to handle creating a new playlist on Spotify using the youtube playlist id
app.post('/api/spotify/create-playlist/:ytPlaylistId', async (req, res) => {
  try {
    const ytPlaylistId = req.params.ytPlaylistId;
    const playlistTitle = await getYoutubePlaylistTitle(ytPlaylistId, apiKey);
    let playlistId = await createPlaylistOnSpotify(playlistTitle, spotifyApi)
  
    const songs = await getTotalSongs(ytPlaylistId, apiKey)
    let searchArray = []
    for (const song of songs) {
      try {
        const searchedSong = await searchSongs(spotifyApi, song.track, song.artist);
        searchArray.push(searchedSong);
      } catch (error) {
        console.log('Error searching song:', error);
      }
    }
    addTracksToPlaylist(spotifyApi, playlistId, searchArray)
    // console.log('Playlist ID:', playlistId);
    res.send("Success")
  } catch (error) {
    // Handle errors
    res.status(500).json({ error: 'Failed to create playlist on Spotify' });
    console.log('Error:', error.message);
  }
});

//  ================== END Spotify APIs ======================

app.listen(PORT, (error) =>{
  if(!error)
      console.log("Server is Successfully Running, and App is listening on port "+ PORT)
  else 
      console.log("Error occurred, server can't start", error);
  }
);

module.exports = youtube_token