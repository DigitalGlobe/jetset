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
export function getIdField( schema ) {
  return Object.keys( schema.properties )
    .find( field => /^_?id$/.test( field ) ) || 'id';
}

export function isSchema( maybeSchema ) {
  return (
    maybeSchema && ( 
      typeof maybeSchema === 'object' && 
      ( !!maybeSchema.$schema || !!maybeSchema.schema )
    ) || (
      typeof maybeSchema === 'string' &&
      maybeSchema.indexOf( '/' ) === 0
    )
  );
}

export function getSchema( maybeSchema ) {
  return (
    maybeSchema && typeof maybeSchema === 'object' && ( maybeSchema.$schema || maybeSchema.schema )
      ? maybeSchema.schema || maybeSchema
      : typeof maybeSchema === 'string' && maybeSchema.indexOf( '/' ) === 0
        ? { title: maybeSchema.slice( 1 ), properties: { id: { type: 'string' } } }
        : null
  );

}
