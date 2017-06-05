import { List, Map } from 'immutable';

// https://github.com/facebook/immutable-js/blob/master/src/List.js#L381

export function makeList(origin = 0, capacity = 0, level = 5, root, tail, ownerID, hash) {
  const list = Object.create(List.prototype);
  list.size = capacity - origin;
  list._origin = origin;
  list._capacity = capacity;
  list._level = level;
  list._root = root;
  list._tail = tail;
  list.__ownerID = ownerID;
  list.__hash = hash;
  list.__altered = false;
  return list;
}

// https://github.com/facebook/immutable-js/blob/master/src/Map.js#L689

export function makeMap(size = 0, root, ownerID, hash) {
  const map = Object.create(Map.prototype);
  map.size = size;
  map._root = root;
  map.__ownerID = ownerID;
  map.__hash = hash;
  map.__altered = false;
  return map;
}

export default function clone( type ) {
  return type === List
    ? makeList()
    : makeMap();
}
