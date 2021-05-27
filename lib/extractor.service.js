const unzip = require("unzip-stream");
const unrar = require("node-unrar-js");
const fs = require("fs");

function extractSubtitle(pathToZip, subtitleLocation, successExtraction) {
  if (pathToZip.endsWith("zip")) {
    fs.createReadStream(pathToZip)
      .pipe(
        unzip.Extract({
          path: subtitleLocation
        })
      )
      .on("close", successExtraction);
  } else if (pathToZip.endsWith("rar")) {
    const extractor = unrar.createExtractorFromFile(
      pathToZip,
      subtitleLocation
    );
    const result = extractor.extractAll();
    if (result[1]) {
      successExtraction();
    }
  } else {
    console.log("Error")
  }
}

module.exports = {
  extractSubtitle
};
