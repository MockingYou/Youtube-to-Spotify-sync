const express = require('express');
const cors = require('cors'); // Import the cors package
const axios = require('axios');
const app = express();
const session = require('express-session');
const PORT = 5050;
let SpotifyWebApi = require('spotify-web-api-node');
const { google } = require('googleapis');

const config = require('./config.js')
const { searchSongsYoutube, getTotalSongs, getPlaylistTitle, createPlaylistOnYoutube, addSongsToPlaylist } = require('./get-youtube-data');
const { createPlaylistOnSpotify, searchSongs, addTracksToPlaylist, getSpotifyPlaylistData } = require('./get-spotify-data');

// Spotify data
const client_id_spotify = config.client_id_spotify;    
const client_secret_spotify = config.client_secret_spotify;
let spotify_token = ""

//Youtube data
const apiKey = config.youtube_api_key;
const client_id_youtube = config.client_id_youtube;    
const client_secret_youtube = config.client_secret_youtube;
const baseApiUrl = "https://www.googleapis.com/youtube/v3"; 
const redirectUriYoutube = 'http://localhost:5050/youtube/callback'
const oauth2Client = new google.auth.OAuth2(
  client_id_youtube,
  client_secret_youtube,
  redirectUriYoutube
);
let youtube_token = ""
const yt_scopes = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/youtubepartner",
  "https://www.googleapis.com/auth/youtube.upload", // Add this scope for playlist management
  "https://www.googleapis.com/auth/youtube.readonly", // Add this scope for reading playlist information
];
// https://www.googleapis.com/youtube/v3/search?key=apiKey&type=video&part=snippet&q=foo   ---> change type for playlist

// Enable CORS for all routes
app.use(cors());
app.use(express.json());
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: true }));



app.get("/", (req, res) => {
  res.send("Hello World!");
});

//  ================== Google APIs ======================


const youtube = google.youtube({
  version: 'v3',
  auth: apiKey
})
app.get('/youtube/login', (req, res) => {
  if (!req.session.tokens) {
    // Redirect to Google's authorization URL
    const authUrl = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: yt_scopes });
    return res.redirect(authUrl);
  } else {
    // Tokens are already stored in the session
    res.send('Logged in!');
  }
});

app.get('/youtube/callback', async (req, res) => {
  const code = req.query.code;
  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens;
    youtube_token = tokens.access_token
    console.log(tokens)
    res.redirect('/');
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).send('Error getting tokens');
  }
});

app.get('/search-with-googleapis', async (req, res, next) => {
  try {
    const searchQuery = req.query.search_query
    const response = await youtube.search.list({
      part: 'snippet',
      q: searchQuery,
      type: 'video'
    })
    const titles = response.data.items.map((item) => item.snippet.title)
    res.send(titles)
  } catch (error) {
    next(error)
  }
})


// -------- END Google APIS ----------

app.get('/search', async (req, res, next) => {
  try {
    const searchQuery = req.query.search_query
    const url = `${baseApiUrl}/search?key=${apiKey}&type=video&part=snippet&q=${searchQuery}`
    const response = await axios.get(url)
    const titles = response.data.items.map((item) => item.snippet.title)
    res.send(titles)
  } catch (error) {
    next(error)
  }
})

// GET endpoint to list all songs in a YouTube playlist
app.get('/api/youtube/playlist/:playlistId', async (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    // const playlistTitle = getPlaylistTitle(playlistId, apiKey);
    const songs = await getTotalSongs(playlistId, apiKey)
    res.json(songs);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

app.post('/playlist', async (req, res) => {
  try {
    await createPlaylistOnYoutube("CACAT DE PLAYLIST", youtube_token)
    res.send("Success")
  } catch (error) {
    console.error('Error fetching playlist:', error);
  }
})

app.get('/playlist/:playlistId', async (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    let spotifyData = await getSpotifyPlaylistData(spotifyApi, playlistId)
    console.log(spotifyData)
    let songs = await searchSongsYoutube(spotifyData, apiKey)
    console.log(songs)
    res.send("Success")
  } catch (error) {
    console.error('Error fetching playlist:', error);
  }
})

app.post('/api/youtube/create-playlist/:playlistId', async (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    let spotifyData = await getSpotifyPlaylistData(spotifyApi, playlistId)
    let songs = await addSongsToPlaylist(spotifyData, "Test", youtube_token, apiKey)
    res.send(songs)
  } catch (error) {
    console.error('Error fetching playlist:', error);
  }
})
//  ================== END Google APIs ======================


//  ================== Spotify APIs ======================
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

// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId: client_id_spotify,
  clientSecret: client_secret_spotify,
  redirectUri: 'http://localhost:5050/callback'
});

app.get('/spotify/login', (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(spotify_scopes));
});

app.get('/callback', (req, res) => {
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
app.post('/api/create-playlist/:ytPlaylistId', async (req, res) => {
  try {
    const ytPlaylistId = req.params.ytPlaylistId;
    const playlistTitle = await getPlaylistTitle(ytPlaylistId, apiKey);
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