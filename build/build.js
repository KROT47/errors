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

const BabelOptions = {
    babelrc: false,
    "presets": [
        "es2015",
        "flow",
    ],
    "plugins": [
        "transform-object-rest-spread",
        "babel-plugin-transform-class-properties",
    ],
};


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
