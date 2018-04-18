[![Build Status](https://secure.travis-ci.org/bodenr/errors.png)](http://travis-ci.org/bodenr/errors)
# errors
    
Errors is a comprehensive and robust, yet lightweight, set of error utilities for 
[node.js](http://nodejs.org) enabling you to _do_ errors more effectively.

## Features

* Parameterized error factory allowing you do define how errors should behave 
based on your project needs.
* Support for enterprise level error attributes including more detailed error cause
and operator response messages.
* Predefined error constructors for all HTTP 4xx-5xx based errors allowing you to leverage
HTTP errors out of the box.
* Error mapping via registered mapping function permitting you to map between 
errors when needed.

## Installation

Install using `npm`:

    $ npm install @bubblehunt/errors

## Running the tests

From the `errors` directory first install the dev dependencies:
```
npm install
```

Then run the tests:
```
npm test
```

## API Docs

The API docs are provided in html and md format and are located under
`errors/docs/`. If you want to rebuild them for any reason, you can
run the following from the `errors` directory:
```
make doc
```

## Defining error messages

The examples assume you've `require`d the errors module like so:
```js
const errors = require('@bubblehunt/errors').default;
```

or
```js
import errors from '@bubblehunt/errors';
```

#### Override flow types

See example at `test/flow.js`


#### Create new errors

Create a very barebones error -- you must specify at least the error name:

```js
// barebones
errors.create({name: 'RuntimeError'});
console.log(new errors.RuntimeError().toString());
```

produces:
```
RuntimeError: An unexpected RuntimeError occurred.
Code: 601
```

You can define a default message for the error:

```js
// default message
errors.create({
    name: 'RuntimeError',
    defaultMessage: 'A runtime error occurred during processing'
});
console.log(new errors.RuntimeError().toString());
```

which outputs:
```
RuntimeError: A runtime error occurred during processing
Code: 602

```

Define a default message, explanation and response:

```js
// default message, explanation and response
errors.create({
    name: 'FileNotFoundError',
    defaultMessage: 'The requested file could not be found',
    defaultExplanation: 'The file /home/boden/foo could not be found',
    defaultResponse: 'Verify the file exists and retry the operation'
});
console.log(new errors.FileNotFoundError().toString());
```

gives us:
```
FileNotFoundError: The requested file could not be found
Code: 603
Explanation: The file /home/boden/foo could not be found
Response: Verify the file exists and retry the operation

```

Override messages on instantiation:
```js
// override messages
console.log(new errors.FileNotFoundError(
        'Cannot read file'
        , 'You do not have access to read /root/foo'
        , 'Request a file you have permissions to access').toString());
```

outputs:
```
FileNotFoundError: Cannot read file
Code: 603
Explanation: You do not have access to read /root/foo
Response: Request a file you have permissions to access

```

Use the options style constructor to assign standard properties:
```js
console.log(new errors.Http401Error({
	message: "Expired Token",
	explanation: "Your token has expired"}).toString());
```

outputs:
```
Http401Error: Expired Token
Code: 401
Explanation: Your token has expired
Error: Expired Token
```

Using the options style constructor you can also assign
arbitrary non-standard properties:
```js
console.log(new errors.Http401Error({
	message: "Expired Token",
	explanation: "Your token has expired",
	expired: new Date()}).toString());
```

outputs:
```
Http401Error: Expired Token
Code: 401
Explanation: Your token has expired
expired: Fri Jun 20 2014 04:19:41 GMT-0400 (EDT)
```

Note however that you cannot assign values to the
`stack`, `name` or `code` standard property:
```js
console.log(new errors.Http401Error({
	name: "ExpiredToken"}).toString());
```

outputs:
```
/home/boden/workspace/errors/lib/errors.js:261
    			throw Error("Properties 'stack', 'name' or 'code' " +
    			      ^
Error: Properties 'stack', 'name' or 'code' cannot be overridden
    at Error (<anonymous>)
    at new scope.(anonymous function) (/home/boden/workspace/errors/lib/errors.js:261:14)
    at Object.<anonymous> (/home/boden/workspace/errors/examples/basic/usage.js:126:13)
    at Module._compile (module.js:456:26)
    at Object.Module._extensions..js (module.js:474:10)
    at Module.load (module.js:356:32)
    at Function.Module._load (module.js:312:12)
    at Function.Module.runMain (module.js:497:10)
    at startup (node.js:119:16)
    at node.js:906:3
```

## Error codes

If you don't provide a `code` when defining the error, a unique code will
be assigned for you. Unique codes start at 600 and increase by 1 for each
error defined.

If you prefer to manage your own error codes, for example to group related
errors into blocks of codes, just specify a `code`:
```js
// define code
errors.create({
    name: 'SecurityError',
    code: 1100
});
console.log(new errors.SecurityError().toString());
```

which logs:
```
SecurityError: An unexpected SecurityError occurred.
Code: 1100

```

## Inheritance

You can build a hierarchy of errors by specifying the `parent` your
error should inherit from. If no `parent` is specified, the error
will inherit from `Error`.

For example:
```js
// inheritance
errors.create({
    name: 'FatalError',
    defaultMessage: 'A fatal error occurred',
});
errors.create({
    name: 'FatalSecurityError',
    defaultMessage: 'A security error occurred, the app must exit',
    parent: errors.FatalError
});
try {
    throw new errors.FatalSecurityError();
} catch (e) {
    if (e instanceof errors.FatalError) {
        // exit
        console.log("Application is shutting down...");
    }
}
```

will produce:
```
Application is shutting down...
```

## Namespacing

By default, newly defined errors are created on the `exports` of
the errors module, but you can specify where the error should
be defined.

For example to define an error on your module's `exports`:
```js
// namespace
errors.create({
    name: 'MalformedExpressionError',
    scope: exports
});
console.log(new exports.MalformedExpressionError().toString());
```

## Looking up errors

For convenience, errors keeps track of all the errors you've defined
via the errors module and allows you to look them up via `name` or
`code`.

So from our previous example:
```js
errors.find(1100);
errors.find('SecurityError')
```

Will both return the `SecutiryError` we defined.

## Stack traces

By default stack traces are disabled which means that error methods
like `toString()` and `toJSON()` return representation without stack 
traces. You can enable stack traces by leveraging the `errors.stacks()`
method.

For example:
```js
errors.stacks(true);
new errors.Http413Error().toString();
// => includes stack trace
new errors.Http413Error().toJSON();
// => includes a 'stack' property
```

You can also use the `errors.stacks()` method without arguments to 
retrieve the current value of stacks.

This allows you to write code like:
```js
if (errors.stacks()) {
    // => stack traces enabled
}
```

## Mappers

You can register and leverage mapper functions which allow you to
map from one (or more) error types into another.

For example if you wanted to mask invalid user and password errors into
a generic credentials error:
```js
// mappers
errors.create({name: 'InvalidUsernameError'});
errors.create({name: 'InvalidPasswordError'});
errors.mapper(['InvalidUsernameError', 'InvalidPasswordError'], function(err) {
    return new errors.SecurityError('Invalid credentials supplied');
});
console.log(errors.mapError(new errors.InvalidUsernameError()).toString());
console.log(errors.mapError(new errors.InvalidPasswordError()).toString());
```

outputs:
```
SecurityError: Invalid credentials supplied
Code: 1100
SecurityError: Invalid credentials supplied
Code: 1100

```

## Native errors

Often times you need to extract 'errors-like' properties from native error
objects. For example you have a native JS or node error and you want to 
extract it's errors-like properties. An error's module-level function
called `errors.errorToJSON()` allows you to do this.

For example to extract error properties from a native error (`errors.stacks`
is set to `false` in this example):
```js
console.log("%j", errors.errorToJSON(new TypeError("Bad type")));
```

outputs:
```
{"message":"Bad type","name":"TypeError"}
```

You can also remap error attributes which may be nested. For example:

```js
console.log("%j", errors.errorToJSON(new TypeError("Bad type"), 
    {'className': ['constructor.name'], 'message': ['message']}));
```

outputs:
```
{"className":"TypeError","message":"Bad type"}
```


## Predefined HTTP 4xx-5xx errors

The errors module predefines a set of errors which represent HTTP
4xx-5xx responses. These errors are exported by the errors module and use the
naming convention `Http[code]Error`. For example `Http401Error` and 
`Http500Error` which have a code of `401` and `500` respectively.

For example to leverage the HTTP errors:
```js
throw new errors.Http401Error();
// ...
throw new errors.Http500Error('Something bad happened');
```


## License

(The MIT License)

Copyright (c) 2012 Boden Russell &lt;bodensemail@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
