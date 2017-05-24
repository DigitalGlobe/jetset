import config from '../config';

const methodDict = {
  create: 'post',
  list:   'get',
  get:    'get',
  update: 'put',
  delete: 'delete',
  search: 'get'
};

const logRoutes = ( routes, resource, ns ) => {
  if ( config.mode === 'development' ) {
    /* eslint-disable no-console */
    console.groupCollapsed( `Rendering Api component for %c${resource}`, 'color: green', `with these routes`);
    console.table(
      Object.keys( routes ).reduce(( memo, key ) => {
        const val = typeof routes[ key ] === 'function'
          ? routes[ key ]( 'id', {} )
          : routes[ key ];
        const def = typeof val === 'string'
          ? { method: methodDict[ key ], route: val }
          : val;
        const arg = key === 'get' ? 'id' : '';
        return Object.assign(memo, {[key]: Object.assign( def, {[`props.${ns}...`]: `\$${key}(${arg})` })});
      }, {})
    );
    console.groupEnd();
  }
};

export default function configureRoutes( key, rootPath, options = {} ) {

  const routes = Object.assign({
    create: () => ({ method: 'post', route: rootPath }),
    list:   () => ({ method: 'get', route: rootPath }),
    search: () => ({ method: 'get', route: rootPath }),
    get:    id => ({ method: 'get', route: `${rootPath}/${id}` }),
    update: id => ({ method: 'put', route: `${rootPath}/${id}` }),
    delete: id => ({ method: 'delete', route: `${rootPath}/${id}` })
  }, options.routes || {} );

  logRoutes( routes, rootPath, key );

  return {
    isCustomRoute: key => !methodDict[ key ],
    getRouteConfig: ( methodKey, ...args ) => {
      const config = routes[ methodKey ]( ...args );
      return typeof config === 'string'
        ? { method: methodDict[ methodKey ], route: config, getData: options.getData || ( data => data ) }
        : {
          ...config,
          method:  ( config.method || methodDict[ methodKey ] || 'get' ).toLowerCase(),
          route:   config.route || routes.default || rootPath,
          getData: config.getData || options.getData || ( data => data )
        };
    }
  };
}
