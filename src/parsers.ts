function urlParser(message: string) {
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  const urls = message.match(urlRegex);

  if (urls) {
    return urls.map(url => url.replace(/https?:\/\//g, ""));
  }

  return [];
}

function imgUrlParser(message: string) {
  const imgUrlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  const imgUrls = message.match(imgUrlRegex);

  if (imgUrls) {
    return imgUrls
  }

  return [];
}

export {
  urlParser,
  imgUrlParser
}
