const express = require("express");
const ptt = require("parse-torrent-title");
const addon = express();
const path = require('path');
const SEP = path.sep;
const fs  = require("fs");
const manifestService = require("./lib/manifest.service")
const subtitleService = require("./lib/subtitle.service");
const extractorService = require("./lib/extractor.service");
const downloadService = require("./lib/download.service");


const respond = function (res, data) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
};

addon.get("/", async function (req, res) {
  res.redirect("/configure")
});

addon.get("/manifest.json", async function (req, res) {
  const credentials = undefined
  const resp = await manifestService.getManifest(credentials);
  respond(res, resp);
});

addon.get("/:language?/configure", async function (req, res) {
  res.sendFile(path.join(__dirname+'/configure.html'));
});

addon.get("/:credentials/manifest.json", async function (req, res) {
  const credentials = req.params.credentials
  const resp = await manifestService.getManifest(credentials);
  respond(res, resp);
});

addon.get("/:credentials/subtitles/:type/:imdbId/:query.json", async function (req, appRes) {
  const credentials = req.params.credentials
  const type = req.params.type
  const release = (req.params.query.split("&")[2].split("=")[1]).slice(0, -4);
  const parse = ptt.parse(release)
  const season = (parse.season < 10) ? 'S0' + parse.season : 'S' + parse.season
  const episode = (parse.episode < 10) ? 'E0' + parse.episode : 'E' + parse.episode
  const name = (type == 'movie') ? parse.title.replace(/ /g, '.') : parse.title.replace(/ /g, '.') + '.' + season + episode
  subtitleService
    .findSubtitle({
      name,
      release
    })
    .then(resSub => {

      const link = resSub[0].result.linkLegenda;

      downloadService.downloadSubtitle(link, credentials).then(res => {
        const subtitleLocation = `${downloadService.subtitlesDir}${SEP}${release}`;
        const successExtraction = () => {
          const bestMatch = subtitleService.findBestSRT(
            subtitleLocation,
            release
          );
          const url = bestMatch.path.replace('/app/lib/subs/', 'https://legendas-tv-addon.herokuapp.com/lib/subs/')
          const sep = url.split('/subs/')
          const new_url = sep[1].replaceAll('/', '[sep]')
          const subtitle = {
            id: bestMatch.distance,
            url: sep[0] + '/subs/' + new_url,
            lang: 'PT-BR [legendas.tv]'
          }
          respond(appRes, { subtitles: [subtitle] });
        };

        extractorService.extractSubtitle(
          res.pathToZip,
          subtitleLocation,
          successExtraction
        );
      });
    })
    .catch(() => {
      appRes.status(404).send("Não encontrado");
    });
})

addon.get("/lib/subs/:subtitleLocation", async function (req, res) {
const subtitleLocation = req.params.subtitleLocation.split('[sep]')
const subtitle = subtitleLocation.filter(i => i.includes('.srt'))[0]
const path = '/app/lib/subs/' + subtitleLocation.join('/')
res.setHeader("content-type", "application/x-subrip");
          res.setHeader(
            "Content-Disposition",
            "attachment;filename=" + subtitle
          );
          fs.createReadStream(path).pipe(res);
})

module.exports = addon;
