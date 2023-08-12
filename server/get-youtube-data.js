const baseApiUrl = "https://www.googleapis.com/youtube/v3";  
const axios = require('axios');
const ytdl = require('ytdl-core');

const { checkFullName, normalizeString } = require('./utils/filter-songs')

const redirectUri = 'http://localhost:5050/youtube/callback'

const getToken = async (clientId, clientSecret) => {
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        code: authorizationCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      },
    });

    const accessToken = response.data.access_token;
    console.log('Access Token:', accessToken);
    return accessToken;
  } catch (error) {
    console.error('Error getting access token:', error.message);
    throw error;
  }
};


// ======================== Get youtube data from playlist =============================

// Function to get the playlist name
const getYoutubePlaylistTitle = async (playlistId, apiKey) => {
  try {
    const url = `${baseApiUrl}/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
    const response = await axios.get(url);
    const playlist = response.data.items[0];
    if (playlist) {
      return playlist.snippet.title;
    } else {
      return null; // Playlist not found or private
    }
  } catch (error) {
    console.log(error)
    throw new Error('Failed to fetch playlist information');
  }
}

// Function to get the artist and song name 
// Function to extract song names and artists from YouTube API response
const extractSongsFromYouTube = async (item) => {
  const url = "https://www.youtube.com/watch?v=";
  const songs = [];

  for (let i = 0; i < item.length; i++) {
    const videoId = item[i].snippet.resourceId.videoId;
    const video_url = url + videoId;
    try {
      const details = await ytdl.getBasicInfo(video_url);
      let filter = checkFullName(details)
      let track = normalizeString(filter.track)
      let artist = normalizeString(filter.artist)
      songs.push({ track, artist });
    } catch (error) {
      console.log(error)
     }
  }
  return songs;
}

const getTotalSongs = async (playlistId, apiKey, nextPageToken = null, totalSongs = 0, songs = []) => {
  try {
    const maxResults = 50; // Maximum results per page (50 is the maximum allowed by the YouTube Data API).
    let url = `${baseApiUrl}/playlistItems?part=snippet&playlistId=${playlistId}&key=${apiKey}&maxResults=${maxResults}`;
    if (nextPageToken) {
      url += `&pageToken=${nextPageToken}`;
    }
    const response = await axios.get(url);
    const { items, nextPageToken: newNextPageToken } = response.data;

    const info = await extractSongsFromYouTube(items)
    songs.push(...info)
    totalSongs += items.length;
    // If there are more items to fetch, recursively call the function with the new nextPageToken.
    if (newNextPageToken) {
      return getTotalSongs(playlistId, apiKey, newNextPageToken, totalSongs, songs)  
    } else {
      // Return the final total when all items have been fetched.
      return songs;
    }
  } catch (error) {
    console.log(error)
    throw new Error('Failed to fetch playlist data');
  }
}

// ======================== END Get youtube data from playlist =============================


// ======================== Create youtube playlist using spotify data =====================

const searchSongsYoutube = async (songsArray, apiKey) => {
  try {
    const playlistItems = [];
    for (const song of songsArray) {
      const query = `${song.artist} ${song.track}`;
      // console.log(query)
      const searchResponse = await axios.get(`${baseApiUrl}/search`, {
        params: {
          key: apiKey,
          q: query,
          part: 'id',
          type: 'video',
          maxResults: 1,
        },
      });
      if (searchResponse.data.items.length > 0) {
        const videoId = searchResponse.data.items[0].id.videoId;
        playlistItems.push(videoId);
      }
    }
    if (playlistItems.length === 0) {
      console.log('No videos found for the provided artist-song pairs.');
      return;
    }
    // console.log(playlistItems)
    return playlistItems
  } catch (error) {
    console.log("Search Error: " + error.message)
  }
}


const createPlaylistOnYoutube = async (playlistTitle, oauthToken) => {
  try {
    const response = await axios.post(
      `${baseApiUrl}/playlists`,
      {
        snippet: {
          title: playlistTitle,
          description: 'My playlist created using the YouTube Data API',
        },
        status: {
          privacyStatus: 'private', // Change privacy status as needed
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${oauthToken}`,
        },
        params: {
          part: 'snippet,status',
        },
      }
    );
    console.log("Playlist created succesfully (Empty).  " + response.data.id)
    return response.data.id; // Return the created playlist's ID
  } catch (error) {
    console.log("Create Playlist Error: " + error.message);
    throw error;
  }
};

const addSongsToPlaylist = async (songsArray, playlistTitle, oauthToken, apiKey) => {
  console.log(songsArray)
  console.log(playlistTitle)
  try {
    let playlistItems = await searchSongsYoutube(songsArray, apiKey);
    let playlistId = await createPlaylistOnYoutube(playlistTitle, oauthToken);
    for (const videoId of playlistItems) {
      console.log(videoId)
      await axios.post(
        `${baseApiUrl}/playlistItems`,
        {
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId,
            },
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${oauthToken}`,
          },
          params: {
            part: 'snippet',
          },
        }
      );
    }
    console.log('Playlist created and videos added successfully.');
  } catch (error) {
    console.log("Add Playlist Error: " + error.message);
  }
};
























// ======================== END Create youtube playlist using spotify data =====================



module.exports =  { searchSongsYoutube, getTotalSongs, getYoutubePlaylistTitle, createPlaylistOnYoutube, addSongsToPlaylist } 
