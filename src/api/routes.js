import config from '../config';

if (typeof window !== 'undefined') {
  window.console.table = window.console.table || window.console.log || (() => {});
}

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
        if ( key === 'default' ) {
          return memo;
        } else {
          const val = typeof routes[ key ] === 'function'
            ? routes[ key ]( 'id', {} )
            : routes[ key ];
          const def = typeof val === 'string'
            ? { method: methodDict[ key ], route: val }
            : val;
          const arg = key === 'get' ? 'id' : '';
          return Object.assign(memo, {[key]: Object.assign( def, {[`props.${ns}...`]: `${key}(${arg})` })});
        }
      }, {})
    );
    console.groupEnd();
  }
};

export default function configureRoutes( key, rootPath, options = {}, main = {} ) {

  const routes = Object.assign({
    create: () => ({ method: 'post', route: rootPath }),
    list:   () => ({ method: 'get', route: rootPath }),
    search: () => ({ method: 'get', route: rootPath }),
    get:    id => ({ method: 'get', route: `${rootPath}/${id}` }),
    update: id => ({ method: 'put', route: `${rootPath}/${id}` }),
    delete: id => ({ method: 'delete', route: `${rootPath}/${id}` })
  }, options.routes || {} );

  logRoutes( routes, rootPath, key );

  const initSuccess = onSuccess => response => {
    if ( onSuccess ) {
      if ( typeof onSuccess === 'function' ) {
        const route = Object.entries( routes ).find(([, fn]) => onSuccess === fn );
        if ( route ) {
          return main[ `${route[0]}` ]( response, { force: true } );
        } else {
          return onSuccess( response );
        }
      } else if ( onSuccess instanceof Promise ) {
        return onSuccess;
      } else if ( typeof onSuccess === 'string' ) {
        return main[ `${onSuccess}` ]( response, { force: true } );
      }
    } else {
      return response;
    }
  };

  const initError = onError => err =>
    onError
      ? onError( err )
      : Promise.reject( err );

  return {
    isCustomRoute: key => !methodDict[ key ],
    getRouteConfig: ( methodKey, ...args ) => {
      const config = routes[ methodKey ]( ...args );
      return typeof config === 'string'
        ? {
          method:    methodDict[ methodKey ],
          route:     config,
          onSuccess: initSuccess( options.onSuccess || options.getData ),
          onError:   initError( options.onError )
        } : {
          ...config,
          method:    ( config.method || methodDict[ methodKey ] || 'get' ).toLowerCase(),
          route:     config.route || routes.default || rootPath,
          // .getData properties are in here for backwards compatibility
          onSuccess: initSuccess( config.onSuccess || options.onSuccess || config.getData || options.getData ),
          onError:   initError( config.onError || options.onError )
        };
    }
  };
}
