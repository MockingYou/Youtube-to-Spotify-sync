const axios = require('axios');
const baseUrl = 'https://api.spotify.com/v1/';

const getAccessToken = async (spotifyClientId, spotifyClientSecret) => {
  try {
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': 'Basic ' + (Buffer.from(spotifyClientId + ':' + spotifyClientSecret).toString('base64'))
      },
      form: {
        grant_type: 'client_credentials',
        scope: 'playlist-modify-public', // Add any additional scopes you need
      },
      json: true
    };

    const response = await axios.post(authOptions.url, null, {
      headers: authOptions.headers,
      params: authOptions.form
    });
    const accessToken = response.data.access_token;

    return accessToken;
  } catch (error) {
    throw new Error('Failed to get access token');
  }
};

const getSpotifyUserId = async (token) => {
  try {
    const response = await axios.get(`${baseUrl}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      form: {
        grant_type: 'client_credentials',
        scope: 'user-read-private', // Add any additional scopes you need
      },
      json: true
    });
    return response.data.id;
  } catch (error) {
    console.error('Error getting ID:', error.message); // Log the error for debugging
    throw new Error('Failed to get user ID from Spotify API');
  }
};

const createPlaylistOnSpotify = async (playlistName, spotifyClientId, spotifyClientSecret) => {
  try {
    const userId = '1pj9484y17ck8ycc82xslq9z1';
    const token = await getAccessToken(spotifyClientId, spotifyClientSecret)
    const request_body = {
      name: playlistName,
      description: 'Youtube Playlist',
      public: true,
    };

    const query = `${baseUrl}users/${userId}/playlists`;
    console.log('Request URL:', query); // Log the request URL for debugging
    console.log('Request Body:', request_body); // Log the request body for debugging
    console.log('Access Token:', token); // Log the token for debugging

    const response = await axios.post(query, request_body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Playlist created on Spotify:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('Error creating playlist:', error.message); // Log the error for debugging
    throw new Error('Failed to create playlist on Spotify');
  }
};













// async function searchSongsOnSpotify(songName) {
//   try {
//     const response = await axios.get(`${SPOTIFY_API_BASE_URL}/search`, {
//       params: {
//         q: songName,
//         type: 'track',
//         market: 'US', // Change this to your desired market
//       },
//       headers: {
//         Authorization: `Bearer ${SPOTIFY_ACCESS_TOKEN}`,
//       },
//     });w

//     const tracks = response.data.tracks.items;
//     const songs = tracks.map(track => ({
//       name: track.name,
//       artists: track.artists.map(artist => artist.name).join(', '),
//       album: track.album.name,
//       externalUrl: track.external_urls.spotify,
//     }));

//     return songs;
//   } catch (error) {
//     throw new Error('Failed to search songs on Spotify');
//   }
// }

// // Example usage:
// const songName = 'Enter Sandman'; // Replace with the song name you want to search
// searchSongsOnSpotify(songName)
//   .then(songs => {
//     console.log(songs);
//   })
//   .catch(error => {
//     console.error(error.message);
//   });

  module.exports = { createPlaylistOnSpotify };