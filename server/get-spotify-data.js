const axios = require('axios');

// Create spotify playlist
const createPlaylistOnSpotify = async (playlistTitle, spotifyApi) => {
  try {
    const playlistData = await spotifyApi.createPlaylist(playlistTitle, { 'description': 'Youtube Playlist', 'public': true });
    const spotifyPlaylistId = playlistData.body.id;
    console.log('Created playlist with ID:', spotifyPlaylistId);
    // Save the playlist ID to the global variable
    // const userPlaylists = await spotifyApi.getPlaylist(spotifyPlaylistId);
    // console.log('Retrieved playlists', userPlaylists.body);
  
    return spotifyPlaylistId; // Return the playlist ID if needed
  } catch (error) {
    console.log('Failed to create or retrieve playlist', error);
    throw error;
  }
}

// Search tracks whose artist's name contains 'Kendrick Lamar', and track name contains 'Alright'
const searchSongs = async (spotifyApi, track, artist) => {
  try {
    const song = await spotifyApi.searchTracks(`${track} ${artist}`)
    // console.log(`Search tracks by "${track}" in the track name and "${artist}" in the artist name`);
    let trackId = `spotify:track:${song.body.tracks.items[0].id}`
    return trackId;
  } catch (error) {
    console.log('Something went wrong!', error);
    throw error;
  }
}

const addTracksToPlaylist = async (spotifyApi, playlistId, tracks) => {
  try {
    const maxTracksPerRequest = 100;
    const batches = [];
    for (let i = 0; i < tracks.length; i += maxTracksPerRequest) {
      batches.push(tracks.slice(i, i + maxTracksPerRequest));
    }
    for (const batch of batches) {
      spotifyApi.addTracksToPlaylist(playlistId, batch)
      console.log('Added tracks to playlist!');
    }
  } catch (error) {
    console.log('Something went wrong!', error);
    throw error;
  }
}

const getSpotifyPlaylistData = async (spotifyApi, playlistId) => {
  try {
    const allSongs = []
    const maxResults = 100;
    let offset = 0;
    let hasSongs = true; // Set initially to true to start the loop
    const playlistTracks = await spotifyApi.getPlaylistTracks(playlistId, {
      fields: 'total',
    });
    let playlistLength = playlistTracks.body.total;
    do {
      const playlistTracks = await spotifyApi.getPlaylistTracks(playlistId, {
        offset: offset,
        limit: maxResults,
        fields: 'items(track(name,artists(name)))'
      });
      let playlistItems = playlistTracks.body.items
      const songs = playlistItems.map(item => ({
        track: item.track.name,
        artist: item.track.artists[0].name
      }));
      allSongs.push(...songs);
      if(offset >= playlistLength) {
        hasSongs = false;
      } else {
        offset += maxResults;
      }
    } while (hasSongs)
    return allSongs
  } catch (error) {
    console.log(error.message)
  }
}



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




module.exports = { createPlaylistOnSpotify, searchSongs, addTracksToPlaylist, getSpotifyPlaylistData };