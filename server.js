const http = require('http');
const fs = require('fs');
const { url } = require('inspector');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    // Your code here
    // 1: GET /
    if (req.method === "GET" && req.url === "/") {
      res.statusCode = 200;
      return res.end("Home page");
    }

    // 2: Get all the artists. (GET /artist)
    if (req.method === "GET" && req.url === "/artists") {
      res.statusCode = 200;
      return res.end(JSON.stringify(artists));
    }

    // 3: Get a specific artist's details based on artistId  (GET /artists/:artistId)
    if (req.method === "GET" && req.url.startsWith("/artists")) {
      const urlPath = req.url.split("/");
      const artistId = urlPath[2];

      if (urlPath.length === 3) {
        const artist = artists[artistId];

        if (!artist) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ "message": "Artist not found" }));
        }

        res.statusCode = 200;
        return res.end(JSON.stringify(artist));
      }
    }

    // 4: Add an artist  (POST /artists)
    if (req.method === "POST" && req.url === "/artists") {
      const newArtist = {
        artistId: getNewArtistId(),
        ...req.body
      };
      artists[newArtist.artistId] = newArtist;

      res.statusCode = 201;
      return res.end(JSON.stringify(artists));
    }

    // 5: Edit a specified artist by artistId (PUT or PATCH /artists/:artistId)
    if (req.method === "PUT" || req.method === "PATCH" && req.url.startsWith("/artists")) {
      const urlPath = req.url.split("/");
      const artistId = urlPath[2];

      if (urlPath.length === 3) {
        const artist = artists[artistId];

        Object.entries(req.body).forEach(([key, value]) => {
          artist[key] = value;
        });

        res.statusCode = 200;
        return res.end(JSON.stringify(artist));
      }
    }

    // 6: Delete a specified artist by artistId  (DELETE /artists/:artistId)
    if (req.method === "DELETE" && req.url.startsWith("/artists")) {
      const urlPath = req.url.split("/");
      const artistId = urlPath[2];
      if (urlPath.length === 3) {
        const artist = artists[artistId];

        if (artist) {
          artists[artistId] = undefined;
          res.statusCode = 200;
          return res.end(JSON.stringify({ "message": "Successfully deleted" }));
        } else {
          res.statusCode = 404;
          return res.end(JSON.stringify({ "message": "Artist not found" }));
        }
      }
    }

    // 7: Get all albums of a specific artist based on artistId
    if (req.method === "GET" && req.url.startsWith("/artists")) {
      const urlPath = req.url.split("/");
      if (urlPath.length === 4 && urlPath[3] === "albums") {
        const artistId = urlPath[2];
        let artistAlbum = {};
        for (const album in albums) {
          if (albums[album].artistId == artistId) {
            artistAlbum[album] = albums[album];
          }
        }

        res.statusCode = 200;
        return res.end(JSON.stringify(artistAlbum));
      }

    }


    // 8 Get a specific album's details based on albumId (GET /albums:albumId)
    if (req.method === "GET" && req.url.startsWith("/albums")) {
      const urlPath = req.url.split("/");
      if (urlPath.length === 3) {
        const albumId = urlPath[2];

        req.statusCode = 200;
        return res.end(JSON.stringify(albums[albumId]));
      }
    }

    // 9: Add an album to a specific artist based on artistId (POST /artists/:artistId/albums)
    if (req.method === "POST" && req.url.startsWith("/artists")) {
      const urlPath = req.url.split("/");
      if (urlPath.length === 4) {
        const artistId = urlPath[2];

        const newAlbum = {
          albumId: getNewAlbumId(),
          ...req.body,
          artistId: parseInt(artistId)
        };
        albums[newAlbum.albumId] = newAlbum;

        res.statusCode = 201;
        return res.end(JSON.stringify(albums));
      }
    }

    // 10: Edit a specified album by albumId (PUT or PATCH /albums/:albumId)
    if (req.method === "PUT" || req.method === "PATCH" && req.url.startsWith("/albums")) {
      const urlPath = req.url.split("/");
      if (urlPath.length === 3) {
        const albumId = urlPath[2];

        if (!albums[albumId]) {
          res.statusCode = 404;
          return res.end({ "Message": "Album not found" });
        } else {
          for (const [key, value] of Object.entries(req.body)) {
            albums[albumId][key] = value;
          }
        }

        res.statusCode = 200;
        return res.end(JSON.stringify(albums[albumId]));
      }
    }


    // 11: Delete a specified album by albumId (DELETE /albums/:albumId)
    if (req.method === "DELETE" && req.url.startsWith("/albums")) {
      const urlPath = req.url.split("/");
      if (urlPath.length === 3) {
        const albumId = urlPath[2];

        if (!albums[albumId]) {
          res.statusCode = 404;
          return res.end({ "Message": "Album not found" });
        }

        albums[albumId] = undefined;

        res.statusCode = 200;
        return res.end(JSON.stringify({ "message": "Successfully deleted" }));
      }
    }


    // 12: Get all songs of a specific artist based on artistId (GET /artists/:artistId/songs)
    if (req.method === "GET" && req.url.startsWith("/artists")) {
      const urlPath = req.url.split("/");
      const artistId = urlPath[2];
      if (urlPath.length === 4 && urlPath[3] === "songs") {
        const artistSongs = {};
        for (const song in songs) {
          const albumId = songs[song].albumId;
          if (albums[albumId].artistId === parseInt(artistId)) {
            artistSongs[song] = songs[song];
          }
        }

        res.statusCode = 200;
        return res.end(JSON.stringify(artistSongs));
      }
    }


    // 13: Get all songs of a specific album based on albumId (GET /albums/:albumId/songs)
    if (req.method === "GET" && req.url.startsWith("/albums")) {
      const urlPath = req.url.split("/");
      const albumId = urlPath[2];
      if (urlPath.length === 4 && urlPath[3] === "songs") {
        const albumId = urlPath[2];
        let albumSongs = {};
        for (const song in songs) {
          if (songs[song].albumId === parseInt(albumId)) {
            albumSongs[song] = songs[song];
          }
        }

        res.statusCode = 200;
        return res.end(JSON.stringify(albumSongs));
      }
    }

    // 14: Get all songs of a specified trackNumber (GET /trackNumbers/:trackNumber/songs)
    if (req.method === "GET" && req.url.startsWith("/trackNumbers")) {
      const urlPath = req.url.split("/")
      const trackNumber = urlPath[2];
      if (urlPath.length === 4 && urlPath[3] === "songs") {
        const songsWithTrackNumber = {};

        for (const song in songs) {
          if (songs[song].trackNumber === parseInt(trackNumber)) {
            songsWithTrackNumber[song] = songs[song];
          }
        }

        res.statusCode = 200;
        return res.end(JSON.stringify(songsWithTrackNumber));
      }
    }


    // 15: Get a specific song's details based on songId (GET /songs/:songId)
    if (req.method === "GET" && req.url.startsWith("/songs")) {
      const urlPath = req.url.split("/");
      const songId = urlPath[2];
      if (urlPath.length === 3) {
        const song = songs[songId];

        if (!song) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ "message": "Song not found" }));
        }

        res.statusCode = 200;
        return res.end(JSON.stringify(song));
      }
    }


    // 16: Add a song to a specific album based on albumId (POST /albums/:albumId/songs)
    if (req.method === "POST" && req.url.startsWith("/albums") && req.url.split("/").length === 4) {
      const albumId = req.url.split("/")[2];
      const song = {
        songId: getNewSongId(),
        ...req.body,
        albumId: albumId
      };
      songs[song.songId] = song;
      let songsList = {};
      for (const song in songs) {
        if (songs[song].albumId == albumId) {
          songsList[song] = songs[song];
        }
      }
      res.statusCode = 201;
      return res.end(JSON.stringify(songsList));
    }


    // 17: Edit a specified song by songId (PUT or PATCH /songs/:songId)
    if ((req.method === "PUT" || req.method === "PATCH") && req.url.startsWith("/songs")) {
      const urlPath = req.url.split("/");
      const songId = urlPath[2];

      if (urlPath.length === 3) {
        const song = songs[songId];

        if (!song) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ "message": "Song not found" }));
        }

        Object.entries(req.body).forEach(([key, value]) => {
          song[key] = value;
        });


        res.statusCode = 200;
        return res.end(JSON.stringify(song));
      }

    }


    // 18: Delete a specified song by songId (DELETE /songs/:songId)
    if (req.method === "DELETE" && req.url.startsWith("/songs")) {
      const urlPath = req.url.split("/");
      const songId = urlPath[2];
      if (urlPath.length === 3) {
        const song = songs[songId];

        if (!song) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ "message": "Song not found" }));
        }

        songs[songId] = undefined;

        res.statusCode = 200;
        return res.end(JSON.stringify({ "message": "Successfully deleted" }));
      }
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));
