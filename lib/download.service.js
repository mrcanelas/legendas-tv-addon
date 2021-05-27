const needle = require("needle");
const fs = require("fs");
const _path = require("path");
const SEP = _path.sep;
const subtitlesDir = `${__dirname + SEP}subs`;

if (!fs.existsSync(subtitlesDir)) {
  fs.mkdirSync(subtitlesDir, { recursive: true });
}

async function getCookies(credentials) {
  const [username, password] = credentials.split(':')

  const login = {
    url: "http://legendas.tv/login",
    data: `data[User][username]=${username}&data[User][password]=${password}&data[lembrar]=on`,
    opts: {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
        origin: "http://legendas.tv",
        referer: "http://legendas.tv/",
      },
      follow_max: 1,
      follow_set_cookies: true,
    },
  };

  return new Promise((resolve, reject) => {
    needle.post(login.url, login.data, login.opts, function (error, resp) {
      if (!error && (resp || {}).statusCode == 200) {
        if (resp.cookies) resolve(resp.cookies);
        else {
          console.error(
            Error("Could not Retrieve Cookies During Login Procedure")
          );
          resolve();
        }
      } else {
        console.error(error || Error("Unknown Login Error"));
        resolve();
      }
    });
  });
}

function downloadSubtitle(link, credentials) {
  const subOpts = {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
      origin: "http://legendas.tv",
      referer: "http://legendas.tv/",
    },
    follow_max: 1,
    follow_set_cookies: true,
  };
  
  return new Promise(async (resolve, reject) => {
    if (!subOpts.cookies) {
      subOpts.cookies = await getCookies(credentials);
      if (!subOpts.cookies) {
        res.status(500).send("Could not get required cookies");
        return;
      } else {
        // refresh cookies every 24h
        setTimeout(() => {
          delete subOpts.cookies;
        }, 24 * 60 * 60 * 1000);
      }
    }

    let filename = "";

    const myStream = needle
      .get(link, subOpts, (_, response) => {
        let path = response.rawHeaders.filter(i => i.includes("filename"))[0]
        .replace(/attachment; filename=/g, '')
        .replace(/"/g, '')
        filename = path
      })
      .pipe(fs.createWriteStream(subtitlesDir + SEP + "download"));

    myStream.on("finish", () => {
      fs.renameSync(
        subtitlesDir + SEP + "download",
        subtitlesDir + SEP + filename
      );

      resolve({
        pathToZip: subtitlesDir + SEP + filename,
        subtitleFile: filename,
      });
    });
  });
}

module.exports = {
  getCookies,
  downloadSubtitle,
  subtitlesDir,
};
