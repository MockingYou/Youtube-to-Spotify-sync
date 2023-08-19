const baseApiUrl = "https://www.googleapis.com/youtube/v3";  
const axios = require('axios');
const ytdl = require('ytdl-core');
const { google } = require('googleapis');

const { checkFullName, normalizeString } = require('./utils/filter-songs')

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

const createPlaylistOnYoutube = async (oauthClient, playlistTitle, oauthToken) => {
  try {
    if (!oauthToken) {
      console.log("Unauthorized");
      return;
    }
    oauthClient.setCredentials({ access_token: oauthToken });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauthClient,
    });
    const playlistDescription = "This is a new playlist created via the API";

    const response = await youtube.playlists.insert({
      headers: {
        'Authorization': `Bearer ${oauthToken}`,
        'Content-Type': 'application/json',
      },
      part: 'snippet',
      requestBody: {
        snippet: {
          title: playlistTitle,
          description: playlistDescription,
        },
      },
    });
    console.log("New playlist created:", response.data);
    return response.data.id; // Save the playlist ID
  } catch (err) {
    console.error("Error creating playlist:", err);
    throw err; // Rethrow the error to propagate it up
  }
};

const searchSongsYoutube = async (songsArray, apiKey) => {
  try {
    const playlistItems = [];
    const youtube = google.youtube({
      version: 'v3',
      auth: apiKey, // Use your API key here
    });
    for (const song of songsArray) {
      const query = `${song.artist} ${song.track}`;
      console.log('Search Query:', query);
      try {
        const searchResponse = await youtube.search.list({
          part: 'id',
          q: query,
          maxResults: 1,
          type: 'video',
        });
        if (searchResponse.data.items.length > 0) {
          const videoId = searchResponse.data.items[0].id.videoId;
          playlistItems.push(videoId);
        }
      } catch (error) {
        console.log(`Error searching for song: ${query}`, error.message);
        // You can handle the error here, e.g., skip the song or continue
      }
    }
    if (playlistItems.length === 0) {
      console.log('No videos found for the provided artist-song pairs.');
    }
    return playlistItems;
  } catch (error) {
    console.log("Search Error:", error.message);
    throw error; // Rethrow the error to propagate it up
  }
};

const addSongsToPlaylist = async (oauthClient, songsArray, playlistTitle, oauthToken, apiKey) => {
  try {
    let playlistItems = await searchSongsYoutube(songsArray, apiKey);
    console.log('Playlist Items:', playlistItems);
    let playlistId = await createPlaylistOnYoutube(oauthClient, playlistTitle, oauthToken); // Pass oauthClient here
    console.log('Playlist ID:', playlistId);
    oauthClient.setCredentials({ access_token: oauthToken });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauthClient,
    });
    for (const videoId of playlistItems) {
      try {
        const response = await youtube.playlistItems.insert({
          part: 'snippet',
          requestBody: {
            snippet: {
              playlistId: playlistId,
              resourceId: {
                kind: 'youtube#video',
                videoId: videoId,
              },
            },
          },
          headers: {
            'Authorization': `Bearer ${oauthToken}`, // Use oauthToken here
            'Content-Type': 'application/json',
          },
        });
        console.log(`Song with video ID ${videoId} added to playlist`, response.data);
      } catch (error) {
        console.log(`Error adding video ${videoId} to playlist`, error.message);
        // You can handle the error here, e.g., skip the video or continue
      }
    }
    console.log('Playlist created and videos added successfully.');
  } catch (error) {
    console.log("Add Playlist Error:", error.message);
  }
};


// ======================== END Create youtube playlist using spotify data =====================



module.exports =  { searchSongsYoutube, getTotalSongs, getYoutubePlaylistTitle, createPlaylistOnYoutube, addSongsToPlaylist } 
