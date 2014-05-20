/**
 * Always store coordinates in longitude, latitude order.
 */
'use strict';

var _ = require('underscore');

var name = exports.name = 'Location';

var type = exports.type = {
	POINT: 'Point',
	LINE_STRING: 'LineString',
	POLYGON: 'Polygon',

	MULTI_POINT: 'MultiPoint',
	MULTI_LINE_STRING: 'MultiLineString',
	MULTI_POLYGON: 'MultiPolygon'
};


var schemaData = exports.schemaData = {
	type: {
		type 	: String,
		enum 	: _.values(type),
		default : type.POINT
	},
	coordinates: [Number]
};

var createSchema = exports.createSchema = function (Schema) {
	return new Schema(schemaData);
};

var createModel = exports.createModel = function(db) {
	return db.model(name, createSchema(db.mongoose.Schema));   
};

/**
 * Append location schema structure to another schema
 * @param  {Schema} schema    Instance of schema
 * @param  {String} fieldName Name of field inside schema
 * @param  {Booleand} sparse  True if you need sparse support
 * @return {Schema}           Instance of changed schema
 */
var appendTo = exports.appendTo = function(schema, fieldName, sparse) {
	sparse = sparse || false;

	var data = {};
	var indexData = {};

	data[fieldName] = schemaData;
	indexData[fieldName] = '2dsphere';

	//sparse: sparse 
	
	schema.add(data);

	schema.index(indexData);
	
	return schema;
};

/**
 * Validate point structure
 * @param  {Array}  point Point coordinates [longitude, latitude]
 * @return {Boolean}       [description]
 */
var isPoint = exports.isPoint = function(point) {
	if(!_.isArray(point) || point.length !== 2 
		|| !_.isNumber(point[0]) || !_.isNumber(point[1]) ) {
		return false;
	}

	return true;
};

/**
 * Return true if each of points is valid point
 * @param  {Array}  points Array of points [[longitude1, latitude1], [longitude2, latitude2]]
 * @return {Boolean}        
 */
var arePoints = exports.arePoints = function(points) {
	if(!_.isArray(points) || points.length === 0) {
		return false;
	}

	for(var i=0; i<points.length; i++) {
		if(!isPoint(points[i])) {
			return false;
		}
	}

	return true;
};


/**
 * Create point object that can be stored in mongodb 
 * @param  {Array} point Point coordinates [longitude, latitude]
 * @return {Object}      Object that can be stored as location in mongodb
 */
var createPoint = exports.createPoint = function(point) {
	if(!isPoint(point)) {
		throw new Error('Point has no valid format');	
	}

	return {
		type: type.POINT,
		coordinates: point
	};
};

/**
 * Create line string object that can be stored in mongodb 
 * @param  {Array} point1 First point coordinates [longitude, latitude]
 * @param  {Array} point2 LAst point coordinates [longitude, latitude]
 * @return {Object}      Object that can be stored as location in mongodb
 */
var createLineString = exports.createLineString = function(point1, point2) {
	if(!arePoints([point1, point2])) {
		throw new Error('One of points has no valid format');	
	}

	return {
		type: type.LINE_STRING,
		coordinates: [point1, point2]
	};
};

/**
 * Create polygon object that can be stored in mongodb 
 * @param  {Array} ring Array of points coordinates [longitude, latitude]
 * @return {Object}      Object that can be stored as location in mongodb
 */
var createPolygon = exports.createPolygon = function(ring) {
	if(!arePoints(ring)) {
		throw new Error('One of points has no valid format');	
	}

	return {
		type: type.POLYGON,
		coordinates: [[ring]]
	};
};


var distanceMultiplier = exports.distanceMultiplier = 6378137;

/**
 * Convert meters to radians
 * @param  {Number} m Meters
 * @return {Number}   Radians
 */
var meterToRadian = exports.meterToRadian = function(m) {
	return m/distanceMultiplier;
};


/**
 * Convert polygon to boundary box
 * @param  {Array} points Array of points
 * @return {Array}        Array of [top,left] coordinates and [bottom, right] coordinates
 */
var polygonToBoundary = exports.polygonToBoundary = function(points) {
	var left = null,
		right = null,
		top = null,
		bottom = null;

	if(!arePoints(points)) {
		throw new Error('One of points has no valid format');	
	}

	for(var i=0; i<points.length; i++) {
		var point = points[i];

		if(point.lat<left || left === null) left = point.lat;
		if(point.lat>right || right === null) right = point.lat;

		if(point.lng<top || top === null) top = point.lng;
		if(point.lng>bottom || bottom === null) bottom = point.lng;
	}

	return [[top, left], [bottom, right]];
};

/**
 * Convert polygon to closed boundary polygon
 * @param  {Array} points Array of points
 * @return {Array}        Array of closed boundary points
 */
var polygonToBoundaryPolygon = exports.polygonToBoundary = function(points) {
	var boundary = polygonToBoundary(points);
	var topLeft = boundary[0];
	var bottomRight = boundary[1];

	return [
		topLeft,
		[topLeft[0], bottomRight[1]],
		[bottomRight],
		[bottomRight[0], topLeft[1]],
		topLeft
	];
};