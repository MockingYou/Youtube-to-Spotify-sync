const express = require('express');
const cors = require('cors'); // Import the cors package
const axios = require('axios');
const app = express();
const PORT = 5050;
let SpotifyWebApi = require('spotify-web-api-node');

const config = require('./config.js')
const { getTotalSongs, getPlaylistTitle } = require('./get-youtube-data');
const { createPlaylistOnSpotify, searchSongs, addTracksToPlaylist } = require('./get-spotify-data');

const apiKey = config.youtube_api_key;
const client_id_spotify = config.client_id_spotify;    
const client_secret_spotify = config.client_secret_spotify;
const baseApiUrl = "https://www.googleapis.com/youtube/v3"; 
let spotify_token = ""
// https://www.googleapis.com/youtube/v3/search?key=apiKey&type=video&part=snippet&q=foo   ---> change type for playlist

// -------- Google APIS ----------

const { google } = require('googleapis');

const youtube = google.youtube({
  version: 'v3',
  auth: apiKey
})

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


// Enable CORS for all routes
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

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
app.get('/api/playlist/:playlistId', async (req, res) => {
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

//  ================== Spotify APIs ======================
const scopes = [
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

app.get('/login', (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
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
      // console.log(spotify_token)
      const refresh_token = data.body['refresh_token'];
      const expires_in = data.body['expires_in'];

      spotifyApi.setAccessToken(spotify_token);
      spotifyApi.setRefreshToken(refresh_token);

      // console.log('access_token:', spotify_token);
      // console.log('refresh_token:', refresh_token);

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

// Route to handle creating a new playlist on Spotify
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
    console.log(searchArray)
    addTracksToPlaylist(spotifyApi, playlistId, searchArray)
    // console.log('Playlist ID:', playlistId);
    res.send("Success")
  } catch (error) {
    // Handle errors
    res.status(500).json({ error: 'Failed to create playlist on Spotify' });
    console.log('Error:', error.message);
  }
});

// // Get a user's playlists
// spotifyApi.getUserPlaylists('thelinmichael')
//   .then(function(data) {
//     console.log('Retrieved playlists', data.body);
//   },function(err) {
//     console.log('Something went wrong!', err);
//   });
// // Add tracks to a playlist
// spotifyApi.addTracksToPlaylist('5ieJqeLJjjI8iJWaxeBLuK', ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh", "spotify:track:1301WleyT98MSxVHPZCA6M"])
//   .then(function(data) {
//     console.log('Added tracks to playlist!');
//   }, function(err) {
//     console.log('Something went wrong!', err);
//   });
//   // Upload a custom playlist cover image
// spotifyApi.uploadCustomPlaylistCoverImage('5ieJqeLJjjI8iJWaxeBLuK','longbase64uri')
// .then(function(data) {
//    console.log('Playlsit cover image uploaded!');
// }, function(err) {
//   console.log('Something went wrong!', err);
// });

app.listen(PORT, (error) =>{
  if(!error)
      console.log("Server is Successfully Running, and App is listening on port "+ PORT)
  else 
      console.log("Error occurred, server can't start", error);
  }
);