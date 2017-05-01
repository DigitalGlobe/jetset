# Jetset

## Install

```
$ npm i --save DigitalGlobe/jetset
```

## Use

```
import Api from 'jetset';
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
