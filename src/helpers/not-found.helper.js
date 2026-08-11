const throwError404 = (id, component) => {
    const error = new Error(`${component} with ID ${id} not found`);
    error.statusCode = 404;
    throw error;
}

module.exports = { throwError404 };