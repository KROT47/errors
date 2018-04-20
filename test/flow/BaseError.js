/* @flow */

// =============================================================================
// Imports
// =============================================================================
import Errors, { type ErrorsModuleType } from '../../src/errors';

// Flow types
// --------------------------------------------------------
export type BaseErrorOptionsType = {
    _message?: string,
    myProp?: number,
};
/* To allow any prop
type BaseErrorOptionsType = Object;
*/


// =============================================================================
// Constants
// =============================================================================
const BaseErrors: ErrorsModuleType<BaseErrorOptionsType> = Errors;


// =============================================================================
// BaseError
// =============================================================================
export const BaseError = BaseErrors.create({
    name: 'BaseError',
    _message: 'some message',
    myProp: 1,
});

export default BaseErrors;


// =============================================================================
// Tests
// =============================================================================

// Correct
// --------------------------------------------------------
const baseError = new BaseError();

baseError._message
baseError.myProp

baseError.code
baseError.status
baseError.response
baseError.explanation

// Errors
// --------------------------------------------------------
// $FlowThrowsError: _message1 is unknown
baseError._message1

BaseErrors.create({
    name: 'BaseError',
    // $FlowThrowsError: _message must be a string
    _message: 1,
});

BaseErrors.create({
    name: 'BaseError',
    // $FlowThrowsError: myProp must be a number
    myProp: '1',
});
