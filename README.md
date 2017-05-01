# Jetset
> Multi-faceted library of tools built around an immutable state tree

## Install

```
$ npm i --save DigitalGlobe/jetset
```

## Api
> Jetset the fetching, state management, and rendering of your api data!

```javascript
import Api from 'jetset/api';

function MyComponent({ myresource }) {
  return (
    <div>
      { myresource().map( item => (
        <div>
          <span>{ item.get( 'name' ) }</span>
          <button onClick={ item.$update({ title: 'renamed' }) }>Rename</button>
          <button onClick={ item.$delete }>Delete</button>
        </div>
      ))}
      <button onClick={ myresource.$create({ title: 'foo' }) }>Create new item</button>
    </div>
  );
}

function MyApi( props ) {
  return (
    <Api url="https://somehost.com/api" myresource={ jsonschema }>
      <MyComponent />
    </Api>
  );
}
```

## Reference
```
props.sources()                         //-> GET /sources 
props.sources.$create({...})            //-> POST /sources
props.sources.$search({...})            //-> GET /sources?...
props.sources.$get( id )                //-> GET /sources/id
props.sources.$get( id ).$update({...}) //-> PUT /sources/id
props.sources.$delete( id )             //-> DELETE /sources/id
```
Note that all GET requests will only be executed once no matter how many times
you call them... 
