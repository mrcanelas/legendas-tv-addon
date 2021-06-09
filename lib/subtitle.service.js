const fs = require("fs");
const path = require("path");
const legendastv = require("legendas-tv");
const levenshtein = require("fast-levenshtein");
const { sep } = require("path");

const buscaExample = {
  name: "",
  release: ""
};

function findSubtitle(busca) {
  busca.name = busca.name.replace(new RegExp(":"), "");
  return new Promise((resolve, reject) => {
    let search = {
      distance: Number.MAX_VALUE,
      value: null
    };
    let equalFindings = [];

    legendastv.search(busca.release, function(err, results) {
      if (err || results.length === 0) {
        legendastv.search(busca.name, function(err, results) {
          if (results.length !== 0) {
            pickSubtitle(results);
          } else {
            reject({});
          }
        });
      } else {
        pickSubtitle(results);
      }
    });

    function pickSubtitle(results) {
      results.forEach(result => {
        const distance = levenshtein.get(
          result.titulo.toLowerCase(),
          busca.release.toLowerCase()
        );
        if (distance < search.distance) {
          search = {
            distance,
            result
          };
        }
      });

      results.forEach(result => {
        const distance = levenshtein.get(
          result.titulo.toLowerCase(),
          busca.release.toLowerCase()
        );

        if (distance === search.distance) {
          equalFindings.push({
            distance,
            result
          });
        }
      });

      resolve(equalFindings);
    }
  });
}

function getAllFiles(subPath, arrayOfFiles) {
  files = fs.readdirSync(subPath)

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function(file) {
    if (fs.statSync(subPath + sep + file).isDirectory()) {
      arrayOfFiles = getAllFiles(subPath + sep + file, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(subPath, sep, file))
    }
  })

  return arrayOfFiles
}

function findBestSRT(arrayOfFiles, movieName) {
  const allSubs = arrayOfFiles.map(obj => {
    const fileName = obj.split(sep).pop()
    if (fileName.endsWith(".srt") || fileName.endsWith(".ass")) {
      const distance = levenshtein.get(fileName, movieName);
      return {
        distance,
        path: obj
      }
    }
  })
  return allSubs.sort(function(a,b) {
    if (!undefined) {
    return a.distance - b.distance
    }
  })
}

module.exports = {
  findSubtitle,
  getAllFiles,
  findBestSRT
};
