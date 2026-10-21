function validarId(users, newUser) {
    return !users.some(user => user.id === newUser.id);
}

function validarNombre(newUser) {
    return newUser.name && newUser.name.length >= 3;
}

function validarMail(regex, newUser) {
    return regex.test(newUser.email);
}

module.exports = {
    validarId,
    validarMail,
    validarNombre
}