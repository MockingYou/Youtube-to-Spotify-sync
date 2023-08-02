require('dotenv').config();

const config = {
    client_id_spotify: process.env.CLIENT_ID_SPOTIFY,
    client_secret_spotify: process.env.CLIENT_SECRET_SPOTIFY,
    youtube_api_key: process.env.YOUTUBE_API_KEY,
    client_id_youtube: process.env.CLIENT_ID_YOUTUBE,
    client_secret_youtube: process.env.CLIENT_SECRET_YOUTUBE
};

module.exports = config;