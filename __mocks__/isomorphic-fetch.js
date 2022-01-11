// Monkey patch fetch function to use absolute urls during testing (required by nock)

const fetch = jest.requireActual("isomorphic-fetch");

module.exports = (url, config) => fetch(`https://localhost${url}`, config);

