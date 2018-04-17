/* @flow */

// =============================================================================
// Imports
// =============================================================================
import _ from 'lodash';
import FS from 'fs';
import Path from 'path';
import KlawSync from 'klaw-sync';

import { transformFileSync } from 'babel-core';


// =============================================================================
// Constants
// =============================================================================
const RootDir = process.cwd();

const InputDirPath = `${ RootDir }/src`;
const OutputDirPath = `${ RootDir }/dist`;

const DefaultBabelOptions = {
    babelrc: false,
    "presets": [
        "flow",
    ],
    "plugins": [
        "transform-object-rest-spread",
        "babel-plugin-transform-class-properties",
    ],
};

const BabelOptions = prepareBabelOptions( DefaultBabelOptions, {
    "presets": [
        "es2015",
    ],
})

const MinifyBabelOptions = prepareBabelOptions( DefaultBabelOptions, {
    "presets": [
        "babel-preset-babili",
    ],
});


// =============================================================================
// Build
// =============================================================================
console.log( 'Build started!' );

const inputJsFiles = KlawSync( InputDirPath );

for ( var i = inputJsFiles.length; i--; ) {
    const { path: inputFilePath } = inputJsFiles[ i ];
    const fileName = Path.basename( inputFilePath );

    const outputFilePath = `${ OutputDirPath }/${ fileName }`;

    const ext = Path.extname( inputFilePath );

    switch ( ext ) {

        case '.js':
            // Compile js with babel
            // --------------------------------------------------------
            var compiledCode =
                    babelTransform( inputFilePath, BabelOptions );

            FS.writeFileSync( outputFilePath, compiledCode );

            // Plus minified version
            // --------------------------------------------------------
            var compiledCode =
                    babelTransform( inputFilePath, MinifyBabelOptions );

            FS.writeFileSync(
                changeExt( outputFilePath, '.min.js' ),
                compiledCode
            );
        break;

        case '.flow':
        case '.json':
            // $FlowFixMe
            FS.copyFileSync( inputFilePath, outputFilePath );
        break;

        default:
            throw Error( `Unknown file extension: ${ ext }` );
    }
}


console.log( 'Build finished!' );


// =============================================================================
// Helpers
// =============================================================================
function babelTransform( jsFilePath, BabelOptions ) {
    const { code, map, ast } = transformFileSync( jsFilePath, BabelOptions );

    return code;
}

function prepareBabelOptions( defaultOptions, options ) {
    // $FlowFixMe
    return _.mergeWith( {}, defaultOptions, options, concatArrays );
}

function concatArrays( objValue, srcValue ) {
    if ( _.isArray( objValue ) ) return objValue.concat( srcValue );
}

function changeExt( path, newExt ) {
    return path.replace( /\.[^/.]+$/, newExt );
}
