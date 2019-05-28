console.log('KK: Loading utilities...');

async function request(method, url) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method,
      url,
      onload: resolve,
      onerror: reject,
    });
  }); // end new Promise()
} // end request()
