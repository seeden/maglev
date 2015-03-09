"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var auth = _interopRequireWildcard(require("./auth"));

var facebook = _interopRequireWildcard(require("./facebook"));

var file = _interopRequireWildcard(require("./file"));

var logic = _interopRequireWildcard(require("./logic"));

var page = _interopRequireWildcard(require("./page"));

var password = _interopRequireWildcard(require("./password"));

var permission = _interopRequireWildcard(require("./permission"));

var rbac = _interopRequireWildcard(require("./rbac"));

var role = _interopRequireWildcard(require("./role"));

var token = _interopRequireWildcard(require("./token"));

var user = _interopRequireWildcard(require("./user"));

var userPermission = _interopRequireWildcard(require("./userpermission"));

exports.auth = auth;
exports.facebook = facebook;
exports.file = file;
exports.logic = logic;
exports.page = page;
exports.password = password;
exports.permission = permission;
exports.rbac = rbac;
exports.role = role;
exports.token = token;
exports.user = user;
exports.userPermission = userPermission;
Object.defineProperty(exports, "__esModule", {
	value: true
});