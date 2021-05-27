const express = require("express");
const addon = express();
const path = require('path');
const SEP = path.sep;
const fs = require("fs");
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

addon.get("/favicon.ico", function (req, res) {
  res.sendFile(path.join(__dirname+'/favicon.ico'));
});

addon.get("/manifest.json", async function (req, res) {
  const resp = {
    id: "legendas-tv-addon",
    version: "0.0.1",
    name: "Legendas.tv Addon",
    logo: "https://imgur.com/lA48YZQ.jpg",
    description: "Unofficial subtitle provider for Legendas.tv",
    types: ["movie", "series"],
    resources: ["subtitles"],
    catalogs: [],
    idPrefixes: ["tt"],
    behaviorHints: {
      configurable: true,
      configurationRequired: true,
    },
  };
  respond(res, resp);
});

addon.get("/:language?/configure", async function (req, res) {
  res.sendFile(path.join(__dirname+'/configure.html'));
});

addon.get("/:credentials/manifest.json", async function (req, res) {
  const credentials = req.params.credentials
  const cookies = await downloadService.getCookies(credentials)
  const resp = await manifestService.getManifest(cookies);
  respond(res, resp);
});

addon.get("/:credentials/subtitles/:type/:imdbId/:query.json", async function (req, appRes) {
  const [imdbId, season, episode] = req.params.imdbId.split(':')
  const credentials = req.params.credentials
  const type = req.params.type
  const release = (req.params.query.split("&")[2].split("=")[1]).slice(0, -4);
  const title = await downloadService.getName(imdbId);
  const Season = (season < 10) ? 'S0' + season : 'S' + season
  const Episode = (episode < 10) ? 'E0' + episode : 'E' + episode
  const name = (type == 'movie') ? title.replace(/ /g, '.') : title.replace(/ /g, '.') + '.' + Season + Episode
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
          const subtitle = {
            id: bestMatch.distance,
            url: `https://legendas-tv-addon.herokuapp.com/${credentials}/app/lib/subs/` + 
            bestMatch.path.split('/subs/')[1]
            .replace(/([/])/g, '[sep]'),
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

addon.get("/:credentials/app/lib/subs/:subtitleLocation", async function (req, res) {
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
