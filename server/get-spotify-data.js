const axios = require('axios');

// Create spotify playlist
const createPlaylistOnSpotify = async (playlistTitle, spotifyApi) => {
  try {
    const playlistData = await spotifyApi.createPlaylist(playlistTitle, { 'description': 'Youtube Playlist', 'public': true });
    const spotifyPlaylistId = playlistData.body.id;
    console.log('Created playlist with ID:', spotifyPlaylistId);
    // Save the playlist ID to the global variable

    // Now you can use the spotifyPlaylistId for other operations
    // For example, you can make another API call using this playlist ID:
    const userPlaylists = await spotifyApi.getPlaylist(spotifyPlaylistId);
    console.log('Retrieved playlists', userPlaylists.body);
    // Do something with the retrieved playlists

    return spotifyPlaylistId; // Return the playlist ID if needed
  } catch (error) {
    console.log('Failed to create or retrieve playlist', error);
    throw error;
  }
}











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