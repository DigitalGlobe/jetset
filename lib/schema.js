'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.getIdField = getIdField;
exports.isSchema = isSchema;
/**
 * example schemas
 *
 * - bare minimum
 *
 * {
 *   "$schema": "http://json-schema.org/draft-04/schema#",
 *   "title": "sources",
 *   "properties": {
 *     "_id": { "type": "string" }
 *   }
 * };
 *
 * title is assumed to be the resource route. the above will get converted into
 * something like the following:
 *
 * sources() // GET '/sources'
 * sources.$create() // POST '/sources'
 * sources({ _id: 'foo' }).$update() // PUT '/sources/foo'
 * sources({ _id: 'foo' }).$delete() // DELETE '/sources/foo'
 *
 */
function getIdField(schema) {
  return Object.keys(schema.properties).find(function (field) {
    return (/^_?id$/.test(field)
    );
  }) || 'id';
}

function isSchema(maybeSchema) {
  return maybeSchema && (typeof maybeSchema === 'undefined' ? 'undefined' : _typeof(maybeSchema)) === 'object' && !!maybeSchema.$schema;
}