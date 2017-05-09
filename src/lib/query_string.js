export default function( args ) {
  return Object.keys( args ).sort().reduce(( memo, key ) => {
    memo.append( key, args[ key ] );
    return memo;
  }, new URLSearchParams()).toString();
}
