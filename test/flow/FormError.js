/* @flow */

// =============================================================================
// Imports
// =============================================================================
import Errors, { type ErrorsModuleType } from '../../src/errors';

import { BaseError, type BaseErrorOptionsType } from './BaseError';

// Flow types
// --------------------------------------------------------
type FormErrorOptionsType =
    & BaseErrorOptionsType
    & {
        fields: Object,
    };


// =============================================================================
// Constants
// =============================================================================
// $FlowFixMe
const FormErrors: ErrorsModuleType<FormErrorOptionsType> = Errors;


// =============================================================================
// FormError
// =============================================================================
const FormError = FormErrors.create({
    name: 'FormError',
    fields: {},
    parent: BaseError,
});


// =============================================================================
// Tests
// =============================================================================

// Correct
// --------------------------------------------------------
const formError = new FormError;

formError._message
formError.myProp

formError.code
formError.status
formError.response
formError.explanation

formError.fields

// Errors
// --------------------------------------------------------
// $FlowThrowsError: fields1 is unknown
formError.fields1

FormErrors.create({
    name: 'FormError',
    // $FlowThrowsError: _message must be a string
    _message: 1,
});

// $FlowThrowsError: fields must be defined
FormErrors.create({
    name: 'FormError',
});

FormErrors.create({
    name: 'FormError',
    // $FlowThrowsError: fields must be an object
    fields: '1',
});
