const baseApiUrl = "https://www.googleapis.com/youtube/v3";  
const axios = require('axios');
const ytdl = require('ytdl-core');

const { checkFullName, normalizeString } = require('./utils/filter-songs')

// Function to get the playlist name
const getPlaylistTitle = async (playlistId, apiKey) => {
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

// Function to extract song names and artists from YouTube API response
const extractSongsFromYouTube = async (item) => {
  const url = "https://www.youtube.com/watch?v=";
  const info = [];

  for (let i = 0; i < item.length; i++) {
    const videoId = item[i].snippet.resourceId.videoId;
    const video_url = url + videoId;
    try {
      const details = await ytdl.getBasicInfo(video_url);
      let filter = checkFullName(details)
      let track = normalizeString(filter.track)
      let artist = normalizeString(filter.artist)
      info.push({ track, artist });
    } catch (error) {
      console.log(error)
     }
  }
  return info;
}

module.exports =  { getTotalSongs, getPlaylistTitle } 
