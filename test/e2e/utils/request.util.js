const { getUrl } = require('../setup/config');

/**
 * Function to ease the creation of requests based on fetch
 * @param url : url of the endpoint that we want to use (without the server uri)
 * @param options : the options that will contain the request
 * @returns the response of the request
 */
const fetchRequest = async (url, options = {}) => {
    const response = await fetch(`${getUrl()}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    const text = await response.text();
    let body = null;
    if (text) {
        try {
            body = JSON.parse(text);
        } catch {
            body = text;
        }
    }

    return {
        status: response.status,
        body
    };
}

module.exports = fetchRequest;
