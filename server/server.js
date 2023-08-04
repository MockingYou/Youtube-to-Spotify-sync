const express = require('express');
const cors = require('cors'); // Import the cors package
const axios = require('axios');
const app = express();
const PORT = 5050;

const config = require('./config.js')
const { getTotalSongs, getPlaylistTitle } = require('./get-youtube-data');
const { getAccessToken } = require('./get-spotify-data');

const apiKey = config.youtube_api_key;
const client_id_spotify = config.client_id_spotify;    
const client_secret_spotify = config.client_secret_spotify;
const baseApiUrl = "https://www.googleapis.com/youtube/v3"; 

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

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);


// var authOptions = {
//   url: 'https://accounts.spotify.com/api/token',
//   headers: {
//     'Authorization': 'Basic ' + (new Buffer.from(client_id_spotify + ':' + client_secret_spotify).toString('base64'))
//   },
//   form: {
//     grant_type: 'client_credentials'
//   },
//   json: true
// };

// request.post(authOptions, function(error, response, body) {
//     if (!error && response.statusCode === 200) {
  
//       // use the access token to access the Spotify Web API
//       var token = body.access_token;
//       console.log(token)
//       var options = {
//         url: `https://api.spotify.com/v1/users/1pj9484y17ck8ycc82xslq9z1`,
//         headers: {
//           'Authorization': 'Bearer ' + token
//         },
//         json: true
//       };
//       request.get(options, function(error, response, body) {
//         console.log(body);
//       });
//     }
//   });

// Route to handle creating a new playlist on Spotify
app.post('/api/create-playlist/:ytPlaylistId', async (req, res) => {
  try {
    const ytPlaylistId = req.params.ytPlaylistId;
    const playlistTitle = await getPlaylistTitle(ytPlaylistId, apiKey);
    const playlistId = await getAccessToken(playlistTitle, client_id_spotify, client_secret_spotify);
    res.json({ playlistId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create playlist on Spotify' });
  }
});


  app.get('/search-spotify/')