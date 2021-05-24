async function getManifest(credentials) {
  if (credentials === undefined) {
    return {
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
  } else {
    return {
      id: "legendas-tv-addon",
      version: "0.0.1",
      name: "Legendas.tv Addon",
      logo: "https://imgur.com/lA48YZQ.jpg",
      description: "Unofficial subtitle provider for Legendas.tv",
      types: ["movie", "series"],
      resources: ["subtitles"],
      catalogs: [],
      idPrefixes: ["tt"],
    };
  }
}

module.exports = { getManifest };
