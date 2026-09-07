const saveUrl = (url) => {
    process.env.BASE_URL = url;
}

const getUrl = () => {
    return process.env.BASE_URL || `http://localhost:${process.env.PORT || 4001}`;
}
module.exports = { saveUrl, getUrl };
