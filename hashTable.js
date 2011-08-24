/**
 * @fileOverview The HashTable type implements simple associative arrays.  
 * An associative array is an array that can be indexed with almost any type  
 * or primitive in the language. Object, Function, Array, RegExp, String, 
 * useful DOM Objects, etc, almost everything except null, undefined, NaN, 
 * infinity, true, and false should work as keys. Check the tests to see what 
 * is currently known to work.
 * @author Noah Feldman <nfeldman@nsfdesign.com>
 * @copyright 2011
 */

// TODO write a higher order function to return proxied constructors
// TODO add map, reduce, reduce recursive, filter, diff, combine... maybe

var Table = (function (G, U) {

var undef = typeof U,
    splice = Array.prototype.splice,
    slice = Array.prototype.slice,
    push = Array.prototype.push,
    toStr = Object.prototype.toString,
    publik = 'set|unset|store|get|del|remove|keys|each|flip', // list of methods that we'll allow the wrapper to interact with
    pubtest = RegExp('^(' + publik + ')$'), typeCheck;

// utilities
function exists(obj, prop) {
    return typeof obj[prop] != undef && obj[prop] !== U;
}

function indexOfKey (array, key, space) {
    var len = (!space ? array.length : space.length) >>> 0;
    
    if (space)
        while (len--) {
            if (array[space[len]] === key)
                return len;
        }
    else
        for ( var i = 0; i < len; i += 2) {
            if (array[i] === key)
                return i;
        }
    return -1;
}

// super basic `each`
function each (list, callback) {
    for (var i = 0, len = list.length; i < len; i++)
        callback.call(U, list[i], i);
}

typeCheck = (function () {
// TODO simplify, toStr.call(arg).slice(8, -1) would do it, but we want to be 
// less specific here
    var simple = /^(?:string|number|function)$/,
        element = /^\[object HTML.+Element\]$/,
        collection = /^\[object (?:HTMLCollection|NamedNodeMap|NodeList)\]$/,
        hostMethod = /^(?:function|object|unknown)$/, // David Mark's test
        protolist = {
            '[object Array]': 'array',
            '[object Date]': 'date',
            '[object RegExp]': 'regexp'
        };

    return {
        simple: function () {
            var a = arguments.length == 1 ? [arguments[0]] : Array.apply(null, arguments),
                i = a.length;
            // no boolean, undefined, null, NaN or Infinity keys allowed
            while (i--)
                if (!a[i] || a[i] === true || a[i] !== a[i] || a[i] == Infinity)
                    return false;
            return true;
        },
        full: function (key) {
            var type, ret;
            if (!typeCheck.simple(key))
                return false;

            type = typeof key;
            ret = simple.test(type) ? type : protolist[toStr.call(key)];
            if (ret !== U)
                return ret;

            if (element.test(key) || exists(key, 'nodeType') && key.nodeType == 1)
                return 'element';

            if (collection.test(key) || exists(key, 'length') && hostMethod.test(typeof key.namedIndex))
                return 'collection';

            return 'object'; // give up and return 'object' as a catch all
        }
    };
}());


// Constructor for the wrapped object that is the actual hashtable
function PL (/* cacheByTypeIfLengthGreaterThan */) {
    if (this == G)
        return new PL(arguments);

    this.list = [];
    this.len = 0;
    this.cache = {}; 
    this.flipped = 0; // added when I realized (again) that I'm an idiot
    this.minBeforeCache = 1E3; // arbitrary choice
    this.useCache = false;
    if (arguments.length == 1 && typeof arguments[0] == 'number')
        this.minBeforeCache = arguments[0];
 
    return this;

}

PL.prototype = {
    typeIndex: function (key, idx, end) {
        if (!end) {
            for (var i = 0, len = key.length, j = idx - 2; i < len; i += 2) {
                var t = typeCheck.full(key[i]);
                if (t) {
                    if (this.cache[t] == U)
                        this.cache[t] = [];
                    this.cache[t].push( j += 2);
                }
            }
        } else if (end > idx) { // we don't actually use end for anything 
            for (var i = 0, len = key.length, j = idx - 2; i < len; i += 2) {
                var t = typeCheck.full(key[i]);
                if (this.cache[t])
                    this.cache[t].splice(j += 2, 1);
            }
        }
    },

    // updates len as reported to the proxy object
    setLen: function () {
        if (this.len * 2 != this.list.length - this.flipped)
            this.len = this.list.length > 1 ? this.list.length / 2 : 0;

        if (!this.useCache && this.list.length >= this.minBeforeCache) {
            this.useCache = true;
            this.typeIndex(this.keys(), 0);
        }
    },

    // set 1 key:value, if no value is provided and the key exists, set
    // value to undefined, otherwise create a new key with a value of undefined
    set: function (key, value) {
        var idx;
        if (!typeCheck.simple(key))
                throw new TypeError(toString.call(key).slice(8, -1) + ' is not a valid key type');
        idx = this.list[indexOfKey(this.list, key)];
        if (idx > -1)
            this.list[idx + 1] = value;
        else
            this.list.push(key, value);
        if (this.useCache)
            this.typeIndex([key, value], this.len * 2);
        this.setLen();
        return true;
    }, 
    // `set` will also unset (i.e. key: U), but I prefer doing so explicitly 
    unset: function (key) {
        var idx = indexOfKey(this.list, key);
        if (idx == -1)
            this.list.push(key, U);
        else
            this.list[idx + 1] = U;
    },
    // store a list of key value pairs. requires an even number of arguments. 
    // If odd, it seems more reasonable to assume a mistake and throw an error 
    // than to silently ignore one value, so that's what we do.
    store: function () {
        var len = arguments.length,
            test = [];

        for (var i = 0; i < len; i += 2)
            if (!typeCheck.simple(arguments[i]))
                throw new TypeError(toString.call(key).slice(8, -1) + ' is not a valid key type');

        if (len && len < 3) {
            this.list[arguments[0]] = arguments[1];
            if (this.useCache)
                this.typeIndex(arguments, this.len * 2);
        } else {
            if (arguments.length % 2 && arguments.length > 1)
                throw new Error('store requires an even number of arguments if adding more than one key');
            push.apply(this.list, arguments);
            if (this.useCache)
                this.typeIndex(slice.call(arguments), this.len * 2);
        }
        this.setLen();
        return true;
    },
    remove: function (startKey, endKey) {
        var startPos = indexOfKey(this.list, startKey),
            endPos = endKey ? indexOfKey(this.list, endKey) : 2,
            ret = 0 > startPos ? startPos : splice.call(this.list, startPos, endPos - startPos);
        if (ret !== -1) {
            if (this.useCache)
                this.typeIndex(ret, startKey, endKey);
            this.setLen();
        }
        return ret;
    },

    // completely remove a key and its value, returning them in a plain array
    /*
    del: function (key) {
        var pos = indexOfKey(this.list, key),
            ret = this.list.splice(pos, 2);
        if (this.useCache)
            this.typeIndex(ret, pos, pos + 1);
        this.setLen();
        return ret;
    },
*/
// actually, the important distinction is whether you get something back
    del: function (startKey, endKey) {
        var ret = this.splice(startKey, endKey);
        for (var i = 0, len = ret.length; i < len; i++)
            ret[i] = null;
        return;
    },

    get: function (key) {
        if (this.useCache)
            return this.list[indexOfKey(this.list, key, this.cache[typeOf[key]]) + 1];
        else // default case, just get the value for a given key
            return this.list[indexOfKey(this.list, key) + 1];
    },

    // unlike a native forEach, this each does not give you access to the Object
    // in the callback, it does pass current value, current index, and iteration
    each: function (callback) {
        var array = this.list,
            i = -1, j = 0, len = array.length;
        while (len > (i += 2))
            callback.call(U, array[i], array[i - 1], j++);
    },

    keys: function () {
        var array = this.list, ret = [];
        for (var i = 0, k = 0, len = array.length; i < len; i += 2)
            if (array[i])
                ret[k++] = array[i];
        return ret;
    },

    // the complicated version
//  flip: function (key) {
//      var tmp, idx, len;
//      if (key) {
//          idx = indexOfKey(this.list, key);
//          tmp = this.list[idx + 1];
//          this.list[idx + 1] = this.list[idx];
//          this.list[idx] = tmp;
//          // TODO update cache without rebuilding the whole thing 
//      } else {
//          for (idx = 0, len = this.list.length; idx < len; idx += 2) {
//              tmp = this.list[idx + 1];
//              this.list[idx + 1] = this.list[idx];
//              this.list[idx] = tmp;
//          }
//      }
//      // rebuild entire cache, only makes sense when flipping entire table
//      if (this.useCache) {
//          this.cache = null;
//          this.cache = {};
//          this.typeIndex(this.keys(), this.list.length);
//      }
//  }

    flip: function (key) {
        if (key) {
            idx = indexOfKey(this.list, key);
            tmp = this.list[idx + 1];
            this.list[idx + 1] = this.list[idx];
            this.list[idx] = tmp;
        } else { // normal case
            this.flipped = +!this.flipped;
        }
    }
};

// constructor that is exported for public use
function Table () {
    var list;
    if (this == G)
        return new Table(arguments);
    list = new PL(arguments);

    this.len = 0;
    // this is only way for code outside the IIFE from which Table is returned 
    // to interact with an instance of PL
    this.__ = function (name, args) {
        var ret;
        if (this[name] && pubtest.test(name)) {
            if (typeof list[name] == 'function') {
                ret = list[name].apply(list, args);
                if (this.len != list.len)
                    this.len = list.len;
            }
            return ret; // result or undefined
        }
    }

}

Table.prototype = {};
// expose selected PL methods through Table's prototype. There are other ways to
// allow access to white listed properties/methods, but I like the explicitness 
// of this, since it allows a useful level of reflection without exposing the
// the real object to scrutiny.
each(publik.split('|'), function(name) {
    Table.prototype[name] = function () {
        var n = name, ret = this.__(n, arguments);
        if (ret === true)
            return this;
        else
            return ret;
    };
});


// return the newly minted constructor 
return Table;


}(window || this));