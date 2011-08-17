README
------

# HashTable

## Summary

HashTables are associative arrays that can be indexed with almost any type or 
primitive in the language and some from the environment. Object, Function, 
Array, RegExp, String, and Number work, as do DOM Elements. Other DOM types 
haven't been tested yet, nor have JSON objects, but should work. Null, NaN, 
undefined, Infinity, true, and false are not valid keys.

## License

Released under the terms of the GPL3.0 
http://www.opensource.org/licenses/gpl-3.0.html

## Public Properties

 - _len_, the number of keys that exist

## Public Methods
 - _set_, create or update a key
 - _get_, retrieve a value by key
 - _store_, stores one or more key:value pairs, if a single paramater is passed 
    it becomes a key with a value of undefined
 - _unset_, sets a value to `undefined` but leaves the key
 - _del_, returns specified key and associated value in an array and deletes 
    them from the object
 - _keys_, returns a new array of all keys
 - _each_, iterate over the object and call a user supplied callback on 
    each value
 - _flip_, swaps keys and values, can optionally flip one key with its value
 
 
## TODOs
### More Tests

 - in particular, there is a completely untested type-based caching 
mechanism added entirely on a whim that will maintain an index of the indices 
of keys of a given type, in theory allowing much faster retrevials from large 
collections. It is currently configured to kick in once the object contains 
500 pairs, if it works at all. I wrote those bits without any testing and 
there are probably some stupid mistakes I need to fix.

 - performance tests in the major browsers
 
### More Methods

 - add filter, some, and reduce methods 
 
 - consider adding methods to manipulate the keys seperately, although this
   breaks with user expectations for an associative structure


