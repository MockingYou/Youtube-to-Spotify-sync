const checkFullName = (details) => {
    let track = '';
    let artist = '';
    if(details.videoDetails.title.includes(' - ')) {
      let newTrack = details.videoDetails.title.split(' - ')
      artist = newTrack[0].trim()
      track = newTrack[1].trim()
    } else {
      track = details.videoDetails.title;
      artist = details.videoDetails.author.name;
      if(artist.includes(' - Topic')) {
        artist = artist.replace(/\s*-\s*Topic$/, '')
      }
    }
    return { track, artist };
}
const normalizeString = (str) => {
    // Remove special characters, convert to lowercase, and trim leading/trailing spaces
    return str.replace(/[^\w\s]/gi, '').replace(/\sfeat(?:\.|uring)?[\s\S]*$|[\s\S]*\sremix$|\slyrics$|\smusic\s*video$/gi, '').toLowerCase().trim();
  }

module.exports = { checkFullName, normalizeString }