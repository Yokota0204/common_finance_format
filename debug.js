function test()
{
  console.log( listSh.getRawUserValues() );
  // console.log( listSh.user.cols.nowInput)
}

function log( functionName, value, label = "", options = {} )
{
  const funcName = "log";
  if ( !functionName ) {
    throw`[ERROR: ${ funcName }] The argument functionName must not be empty.`;
  }
  let logLabel;
  if ( options.type == "error" ) {
    logLabel = `[ERROR: ${ functionName }] `;
  } else if ( options.type == "info" ) {
    logLabel = `[INFO: ${ functionName }] `;
  } else if ( options.type == "warn" ) {
    logLabel = `[WARNING: ${ functionName }] `;
  } else {
    logLabel = `[DEBUG: ${ functionName }] `;
  }
  if ( isObject( value ) ) {
    if ( !label ) {
      throw `[ERROR: ${ funcName }] The argument label must not be empty when value is object.`;
    }
    console.log( `${ logLabel }${ label } ↓` );
    console.log( value );
  } else {
    if ( !label ) {
      console.log( `${ logLabel }${ value }` );
    } else {
      console.log( `${ logLabel }${ label } : ${ value }` );
    }
  }
}