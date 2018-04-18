/* @flow */

/**
 * Base taken from https://www.npmjs.com/package/errors
 * Refactored with Flow and ES6
 */

// =============================================================================
// Imports
// =============================================================================
import HTTP_STATUS_CODES from './http-status-codes.json';


// Flow types
// --------------------------------------------------------
type ErrorOptionsType = {
    name: string,
    scope?: Object,
    parent?: Function,
    defaultMessage?: string,
    code?: number,
    status?: number,
    defaultExplanation?: string,
    defaultResponse?: string,
};

type DefaultErrorType = Error;

type ErrorType = DefaultErrorType;

type MapperFunctionType = ( err: ErrorType ) => ErrorType;


// =============================================================================
// Constants
// =============================================================================

/*!
 * error constructors indexed by name
 */
const Names = {};

/*!
 * error constructors indexed by code
 */
const Codes = {};

/*!
 * options error classes were built from indexed by name
 */
const Options = {};


/*!
 * Module global to track if we should use stack traces.
 */

var useStack = false;

/*!
 * cache of error mapper functions indexed by error name
 */
const mappers = {};

/*!
 * next free error code
 */
let freeCode = 600;

const _DEFAULT_ERROR_MAPPING = {
    stack: [ 'stack' ],
    message: [ 'message' ],
    name: [ 'constructor.name' ],
    code: [ 'code' ],
};


// =============================================================================
// Errors
// =============================================================================
const Errors: Object = {
    /**
     * Returns the error constructor by the given code or
     * name.
     *
     * Examples:
     *
     *  errors.find(404);
     *  // => Http404Error
     *
     *  errors.find(500);
     *  // => Http500Error
     *
     *  errors.find('Http401Error');
     *  // => http401Error
     *
     *
     * @param {String|Number} err
     * @returns {Function}
     * @api public
     */
    find( err: string ): ErrorType {
        return ( typeof err === 'number' ) ? Codes[ err ] : Names[ err ];
    },

    /**
     * Determines if the given `Error` object was created using
     * the errors framework.
     *
     * @param {Object} err The error to check
     * @returns {Boolean}
     * @api private
     */
    isError( err: Object ): boolean {
        return (
            err
            && err.hasOwnProperty( 'explanation' )
            && err.hasOwnProperty( 'code' )
        );
    },

    /**
     * Extracts error attributes into a formatted JSON
     * object. Useful for capturing 'errors like' properties
     * from a native error object (e.g. not an errors error).
     *
     * @param {Object} err The error to extract attrs from.
     * @param {Object} attrMap A mapping of source to dest
     * attributes where formatted dest property names are
     * the keys of the map and the src attribute names are
     * given as an array value. The src attribute (array)
     * can have multiple elements in which case each attr
     * is tried 1-by-1 until one is no null. These attrs
     * can also be in dotted notion which indicates nested
     * attributes (e.g. constructor.name).
     * @api public
     */
    errorToJSON( err: ErrorType, attrMap: Object ): Object {
        let attrs = attrMap || _DEFAULT_ERROR_MAPPING,
            formatted = {};

        for ( const dest in attrs ) {
            for ( const attr_index in attrs[ dest ] ) {
                let val = err,
                    src = attrs[ dest ][ attr_index ],
                    segs = src.split( '.' );
                for ( const seg_index in segs ) {
                    if ( segs[ seg_index ] == 'stack' && !useStack ) {
                        val = null;
                        break;
                    }

                    // $FlowFixMe
                    val = segs[ seg_index ] in val ? val[ segs[ seg_index ] ] : null;
                }
                if ( val != null ) {
                    formatted[ dest ] = val;
                }
            }
        }
        return formatted;
    },

    create,

    /**
     * Get/set the module default behavior in terms of if
     * stack traces should be included in `toString()`,
     * `send()`ing errors, etc.
     *
     * When called with no parameters this method will return
     * if the errors module is set to use stacks or not.
     *
     * When called with a single boolean parameter this
     * method will interally set if stack traces should be used.
     *
     * @param {Boolean} useStacks
     * @api public
     */
    stacks( useStacks?: boolean ): ?boolean {
        if ( useStacks == null || useStacks == undefined ) {
            return useStack;
        }
        useStack = useStacks;
    },

    /**
     * Adds or retrieves an error mappers.
     *
     * When called with 2 arguments, this method is used to
     * add error mappers for the given error names.
     *
     * When called with a single argument it's used to
     * retrieve the registered mapper for the given
     * error name.
     *
     * Any bound mappers will be invoked
     * for `express.send()` integration and hence you
     * can define mappers used when sending error responses
     * with Express.
     *
     * Examples:
     *
     *  // adding mappers
     *  errors.mapper('RangeError', function(rangeError) {
     *      return new errors.Http412Error('Invalid range requested');
     *  })
     *  .addmapper('ReferenceError', function(refError) {
     *      return new errors.Http424Error('Bad reference given');
     *  });
     *
     *  errors.mapper(['RangeError', 'ReferenceError'], function(err) {
     *      return new errors.Http500Error(err.message);
     *  });
     *
     *  // retrieve error mapper
     *  var rangeError = errors.mapper('RangeError');
     *
     * @param {String|Array} errName The error name(s) to attach the mapper to.
     * @param {Function} fn The function to call for the mapping.
     * @returns {Object} The exports of errors for chaining or the
     * retrieved error.
     * @api public
     */
    mapper(
        errName: string | Array<string>,
        fn?: MapperFunctionType
    ): ?MapperFunctionType {
        if ( arguments.length > 1 ) {
            asArray( errName ).forEach( name => mappers[ name ] = fn );
            return;
        }

        if ( Array.isArray( errName ) ) {
            console.log( 'errName:', errName );
            throw Error( 'errName must be string' );
        }

        return mappers[ errName ];
    },

    /**
     * Maps the given error using the bound error mapper
     * and returns the mapped error as per the mappers
     * return value. If no mapper is bound to the given
     * errors name, the argument error is returned unchanged.
     *
     * Examples:
     *
     *  errors.mapError(new RangeError());
     *
     * @param {Object} err The error instance to map.
     * @returns {Object} The mapped error.
     * @api public
     */
    mapError( err: ErrorType ): ErrorType {
        const mapper = Errors.mapper( err.name );
        return mapper ? mapper( err ) : err;
    },
};

export default Errors;


// =============================================================================
// Default Errors
// =============================================================================

// JSErrors
// --------------------------------------------------------
/**
 * JavaScript Error constructors indexed by name
 * for convenience.
 *
 * Examples:
 *
 *  new Errors.URIError('Malformed URI');
 *
 */
const JS_ERRORS = {
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
};

for ( const name in JS_ERRORS ) {
    Errors.create({
        name,
        parent: JS_ERRORS[ name ],
    });
}

// HttpErrors
// --------------------------------------------------------
/**
 * Base `Error` for web app HTTP based
 * exceptions -- all 4xx and 5xx wrappered
 * errors are instances of `HttpError`.
 */
Errors.create({ name: 'HttpError' });

/**
 * `HttpError`s for all 4xx-5xx HTTP based status codes
 * defined as `Http[code]Error` for convenience.
 *
 * Examples:
 *
 *  // Accept: text/html
 *  res.send(new errors.Http404Error('Resource not found'));
 *  // => text/html
 *  // => "Resource not found"
 *
 *  // Accept: application/json
 *  res.send(new errors.Http423Error('Resource is currently locked'));
 *  // => application/json
 *  // {
 *  //      "name": "Http423Error",
 *  //      "code": 423,
 *  //      "status": 423,
 *  //      "message": "Resource is currently locked"
 *  // }
 *
 *  // Accept: text/plain
 *  // res.send(new errors.Http401Error('You do not have access'));
 *  // => text/plain
 *  // "You do not have access"
 */
for ( var i = 0; i < HTTP_STATUS_CODES.length; ++i ) {
    const { code, message } = HTTP_STATUS_CODES[ i ];

    // TODO: provide default explanation & response
    Errors.create({
        name: `Http${ code }Error`,
        code,
        status: code,
        parent: Errors.HttpError,
        defaultMessage: message,
    });
}



// =============================================================================
// create
// =============================================================================
/**
 * Create a new constructor instance based
 * on the given options.
 *
 * This factory method allows consumers to build
 * parameterized error constructor function instances
 * which can then be used to instantiate new concrete
 * instances of the given error.
 *
 * This method accepts jQuery style `options` argument
 * with the following properties (note that `name` is
 * the only required property, all others are optional).
 *
 * The `scope` option can be used to change the default
 * namespace to create the constructor in. If unspecified
 * it defaults to the `exports` object of this module
 * (i.e. `errors.exports`).
 *
 * The `parent` option specifies the parent to inherit
 * from. If unspecified it defaults to `Error`.
 *
 * The `defaultMessage`, `defaultExplanation` and
 * `defaultResponse` define the default text to use
 * for the new errors `message`, `explanation` and
 * `response` respectively. These values can be
 * overridden at construction time.
 *
 * The `code` specifies the error code for the new
 * error. If unspecified it defaults to a generated
 * error number which is greater than or equal to
 * 600.
 *
 * Examples:
 *
 *  // use all defaults
 *  errors.create({name: 'FileNotFoundError'});
 *  throw new errors.FileNotFoundError("Could not find file x");
 *
 *  // inheritance
 *  errors.create({
 *      name: 'FatalError',
 *      code: 900
 *  });
 *  errors.create({
 *      name: 'DatabaseError',
 *      parent: errors.FatalError
 *      code: 901
 *  });
 *  var dbe = new errors.DatabaseError("Internal database error");
 *  dbe instanceof errors.FatalError;
 *  // => true
 *
 *  // scoping to current module exports
 *  var MalformedEncodingError = errors.create({
 *      name: 'MalformedEncodingError',
 *      scope: exports
 *  });
 *  throw new MalformedEncodingError("Encoding not supported");
 *
 *  // default message
 *  errors.create({
 *      name: 'SocketReadError',
 *      code: 4000,
 *      defaultMessage: 'Could not read from socket'
 *  });
 *  var sre = new errors.SocketReadError();
 *  sre.message;
 *  // => 'Could not read from socket'
 *  sre.code;
 *  // => 4000
 *  sre instanceof Error;
 *  // => true
 *
 *  // explanation and response
 *  errors.create({
 *      name: 'SocketReadError',
 *      code: 4000,
 *      defaultMessage: 'Could not read from socket',
 *      defaultExplanation: 'Unable to obtain a reference to the socket',
 *      defaultResponse: 'Specify a different port or socket and retry the operation'
 *  });
 *  var sre = new errors.SocketReadError();
 *  sre.explanation;
 *  // => 'Unable to obtain a reference to the socket'
 *  sre.response;
 *  // => 'Specify a different port or socket and retry the operation'
 *
 * @param {String} name The constructor name.
 * @param {Object} scope The scope (i.e. namespace).
 * @param {Function} parent The parent to inherit from.
 * @param {String} defaultMessage The default message.
 * @param {Number} code The error code.
 * @param {Number} status The status code.
 * @param {String} defaultExplanation The default explanation.
 * @param {String} defaultResponse The default operator response.
 * @return {Function} the newly created constructor
 * @api public
 */
function create( options: ErrorOptionsType ): Class<ErrorType> {
    var options = options || {},
        scope = options.scope || Errors,
        parent = options.parent || Error,
        defaultMessage =
            options.defaultMessage
            || `An unexpected ${ options.name } occurred.`,
        className = options.name,
        errorCode = options.code || nextCode(),
        statusCode = options.status,
        defaultExplanation = options.defaultExplanation,
        defaultResponse = options.defaultResponse,
        formattedStack,
        stack = {};


    if ( className in scope ) {
        if ( errorWasBuiltWithSameOptions( className, options ) ) {
            return Names[ className ];
        }

        throw Error( `Error ${ className } already defined` );
    }

    /**
     * Create a new instance of the exception which accepts
     * 2 forms of parameters.
     *
     * (a) Passing the message, explanation and response
     * as individual argument strings:
     * Create a new instance of the exception optionally
     * specifying a message, explanation and response
     * for the new instance. If any of the arguments are
     * null, their value will default to their respective
     * default value use on the `create` call, or will
     * be null if no default was specified.
     *
     * (b) Passing an options style object which contains
     * key / value pairs. In this form keys map to the
     * attributes of the error object. Note that the properties
     * 'stack', 'name' and 'code' cannot be set via the options
     * style object in this form.
     *
     * @param {String|Object} msg The message to use for the error.
     * @param {String} expl The explanation to use for the error.
     * @param {String} fix The response to use for the error.
     * @return {Object} The newly created error.
     */
    const newErrorClass = scope[ className ] =
        function ( msg, expl, fix ) {
            let attrs = {};
            if ( typeof msg !== null && typeof msg === 'object' ) {
                attrs = msg;
                msg = attrs.message || defaultMessage;

                if ( attrs.hasOwnProperty( 'stack' )
                    || attrs.hasOwnProperty( 'name' )
                    || attrs.hasOwnProperty( 'code' )
                ) {
                    throw Error(
                        `Properties 'stack', 'name' or 'code' ` +
                        'cannot be overridden'
                    );
                }
            }
            attrs.status = attrs.status || statusCode;
            msg = msg || defaultMessage;
            expl = expl || defaultExplanation;
            fix = fix || defaultResponse;

            parent.call( this, msg );

            // hack around the defineProperty for stack so
            // we can delay stack formatting until access
            // for performance reasons
            Error.captureStackTrace( stack, scope[ className ] );

            /**
             * Return the stack tracks for the error.
             *
             * @return {String}
             * @api public
             */
            // $FlowFixMe
            Object.defineProperty( this, 'stack', {
                configurable: true,
                enumerable: false,
                get() {
                    if ( !formattedStack ) {
                        formattedStack =
                            stack.stack.replace(
                                '[object Object]',
                                `Error: ${ this.message }`
                            );
                    }
                    return formattedStack;
                },
            });

            /**
             * Return the explanation for this error.
             *
             * @return {String}
             * @api public
             */
            Object.defineProperty( this, 'explanation', {
                value: attrs.explanation || expl,
                configurable: true,
                enumerable: true,
            });

            /**
             * Return the operator response for this error.
             *
             * @return {String}
             * @api public
             */
            Object.defineProperty( this, 'response', {
                value: attrs.response || fix,
                configurable: true,
                enumerable: true,
            });

            /**
             * Return the error code.
             *
             * @return {Number}
             * @api public
             */
            Object.defineProperty( this, 'code', {
                value: attrs.code || errorCode,
                configurable: true,
                enumerable: true,
            });

            /**
             * HTTP status code of this error.
             *
             * If the instance's `code` is not a valid
             * HTTP status code it's normalized to 500.s
             *
             * @return {Number}
             * @api public
             */
            Object.defineProperty( this, 'status', {
                value: attrs.status || 500,
                configurable: true,
                // normalize for http status code and connect compat
                enumerable: true,
            });

            /**
             * Name of this error.
             *
             * @return {String}
             * @api public
             */
            Object.defineProperty( this, 'name', {
                value: className,
                configurable: true,
                enumerable: true,
            });

            /**
             * Message for this error.
             *
             * @return {String}
             * @api public
             */
            Object.defineProperty( this, 'message', {
                value: attrs.message || msg,
                configurable: true,
                enumerable: true,
            });

            // expose extra conf attrs as properties
            for ( const key in attrs ) {
                if ( !this.hasOwnProperty( key ) ) {
                    Object.defineProperty( this, key, {
                        value: attrs[ key ],
                        configurable: true,
                        enumerable: true,
                    });
                }
            }
        };

    newErrorClass.prototype = Object.create( parent.prototype, {
        constructor: {
            value: newErrorClass,
            enumerable: false,
            writable: true,
            configurable: true,
        },
    });

    /**
     * Return the name of the prototype.
     *
     * @return {String}
     * @api public
     */
    Object.defineProperty( newErrorClass.prototype, 'name', {
        value: className,
        enumerable: true,
    });

    /**
     * Return a formatted string for this error which
     * includes the error's `name`, `message` and `code`.
     * The string will also include the `explanation` and
     * `response` if they are set for this instance.
     *
     * Can be redefined by consumers to change formatting.
     *
     * @return {String}
     * @api public
     */
    // $FlowFixMe
    newErrorClass.prototype.toString = function () {
        /*!

        The snippet below would allow us to provide connect errorHandler()
        middleware compatible errors, but is too costly. In a 1000 executions
        of toString() it adds ~25% overhead.

        var e = Error();
        Error.captureStackTrace(e);
        if (~e.stack.indexOf("connect/lib/middleware/errorHandler.js")) {
            return this.message;
        }
        */
        // TODO externalization
        let msg =
            `${ this.name }: ${ this.message }
            Code: ${ this.code }`;

        if ( this.explanation ) {
            msg += `\nExplanation: ${ this.explanation }`;
        }
        if ( this.response ) {
            msg += `\nResponse: ${ this.response }`;
        }

        function isExtra( key ) {
            return [ 'name', 'message', 'status', 'code',
                'response', 'explanation', 'stack' ].indexOf( key ) < 0;
        }

        // extra properties
        Object.keys( this ).filter( isExtra ).forEach( function ( key ) {
            msg += `\n${ key }: ${ this[ key ] }`;
        }, this );

        if ( useStack ) {
            msg += `\n${ this.stack }`;
        }
        return msg;
    };

    /**
     * Return the JSON representation of this error
     * which includes it's `name`, `code`, `message`
     * and `status`. The JSON object returned will
     * also include the `explanation` and `response`
     * if defined for this instance.
     *
     * This method can be redefined for customized
     * behavior of `JSON.stringify()`.
     *
     * @return {Object}
     * @api public
     */
    newErrorClass.prototype.toJSON = function () {
        // TODO externalization
        return useStack
            ? mixin( this, { stack: this.stack }, true )
            : mixin( this, {}, true );
    };

    cache( className, errorCode, newErrorClass, options );

    // $FlowFixMe
    return newErrorClass;
}


// =============================================================================
// Helpers
// =============================================================================

/**
 * Cache the given error constructor indexed by the
 * given name and code.
 *
 * @param name {String} name
 * @param code {Number} code
 * @param err {Function} err
 * @api private
 */
function cache( name, code, err, options ) {
    Names[ name ] = err;
    Codes[ code ] = err;
    Options[ name ] = options;
}

/**
 * Check if options were used to build the new error class with same name
 */
function errorWasBuiltWithSameOptions( name: string, options: Object ) {
    return isEqual( Options[ name ], options );
}

function isEqual( a, b ) {
    const keysA = Object.keys( a );
    const keysB = Object.keys( b );

    if ( keysA.length !== keysB.length ) return false;

    for ( var i = keysA.length; i--; ) {
        const key = keysA[ i ];

        if ( a[ key ] !== b[ key ] ) return false;
    }

    return true;
}

/**
 * Return the next free error code.
 *
 * @returns {Number}
 * @api private
 */
function nextCode() {
    while ( Codes[ freeCode ] ) {
        freeCode += 1;
    }
    return freeCode;
}

/**
 * Perform a top level mixing between and source
 * and destination object optionally skipping
 * undefined/null properties.
 *
 * Examples:
 *
 *  mixin({a: 'A'}, {b: 'B});
 *  // => {a: 'A', b: 'B'}
 *
 *  mixin({'a': null}, {b: 'B}, true);
 *  // => {b: 'B'}
 *
 * @param {Object} src
 * @param {Object} dest
 * @param {Boolean} skipEmpty
 * @returns {Object}
 * @api private
 */

function mixin( src, dest, skipEmpty ) {
    // TODO: refactor into common module
    dest = dest || {}, src = src || {};
    Object.keys( src ).forEach( key => {
        if ( !dest[ key ] && ( skipEmpty && src[ key ] != null && src[ key ] != undefined ) ) {
            dest[ key ] = src[ key ];
        }
    });
    return dest;
}

/**
 * Returns the argument as an `Array`. If
 * the argument is already an `Array`, it's
 * returned unchanged. Otherwise the given
 * argument is returned in a new `Array`.
 *
 * Examples:
 *
 *  asArray('a');
 *  // => ['a']
 *
 *  asArray(null);
 *  // => []
 *
 *  asArray(['a', 'b']);
 *  // => ['a', 'b']
 *
 * @param {Object|Array} obj The object to wrap in an array.
 * @returns {Array}
 * @api private
 */

function asArray( obj ) {
    // TODO: refactor into common module
    return obj instanceof Array ? obj : [ obj ];
}
