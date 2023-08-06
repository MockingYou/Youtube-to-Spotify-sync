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
    spotifyApi.addTracksToPlaylist(playlistId, tracks)
    console.log('Added tracks to playlist!');
  } catch (error) {
    console.log('Something went wrong!', error);
    throw error;
  }
}

const getSpotifyPlaylistData = async (spotifyApi, playlistId) => {
  const info = []
  const playlistTracks = await spotifyApi.getPlaylistTracks(playlistId, {
    offset: 0,
    limit: 5,
    fields: 'items'
  })
  let playlistItems = playlistTracks.body.items
  let track = ''
  let artist = ''
  playlistItems.forEach(item => {
    track = item.track.name
    artist = item.track.artists[0].name
    info.push({ track, artist });
  });
  console.log(info)

  return info
}
module.exports = { createPlaylistOnSpotify, searchSongs, addTracksToPlaylist, getSpotifyPlaylistData };