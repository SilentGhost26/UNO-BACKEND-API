const ApiRequest = require('../models/api-request.model');

const create = async (requestData) => {
    return await ApiRequest.create(requestData);
}

const findAll = async () => {
    return await ApiRequest.findAll();
}

module.exports = {
    create,
    findAll,
};