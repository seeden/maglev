'use strict';

var keymirror = require('keymirror');

var FailedLogin = module.exports = keymirror({
    NOT_FOUND: null,
    PASSWORD_INCORRECT: null,
    MAX_ATTEMPTS: null
});