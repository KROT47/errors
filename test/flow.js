/* @flow */

// =============================================================================
// Imports
// =============================================================================
import
    Errors, {
        type ErrorsModuleType,
        type DefaultErrorType,
        type DefaultErrorOptionsType,
    }
from '../src/errors';

// Flow types
// --------------------------------------------------------

type MyErrorPropsType = {
    _message?: string,
    myProp?: number,
};

/* To allow any prop
type MyErrorPropsType = Object;
*/

type MyErrorType =
    & DefaultErrorType
    & MyErrorPropsType;

type MyOptionsType =
    & DefaultErrorOptionsType
    & MyErrorPropsType;


// =============================================================================
// Constants
// =============================================================================
const MyErrors: ErrorsModuleType<MyErrorType, MyOptionsType> = Errors;


// =============================================================================
// Tests
// =============================================================================

// Correct
// --------------------------------------------------------
var MyError = MyErrors.create({
    name: 'MYERROR',
    _message: 'some message',
    myProp: 1,
});

var myError = new MyError();

myError._message
myError.myProp

// Errors
// --------------------------------------------------------
// $FlowThrowsError
myError._message1

MyErrors.create({
    name: 'MYERROR',
    // $FlowThrowsError
    _message: 1,
});

MyErrors.create({
    name: 'MYERROR',
    // $FlowThrowsError
    myProp: '1',
});


