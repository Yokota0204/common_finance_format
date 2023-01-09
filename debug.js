function test()
{
  // const before = getAliasMenus();
  // console.log( before );
  clearRichMenus();
  // const after = getRichmenus();
  // console.log( after );
}

function log( functionName, value, options = {} )
{
  const funcName = "log";
  if ( !functionName ) {
    throw`[ERROR: ${ funcName }] The argument functionName must not be empty.`;
  }
  // オプションの値を設定
  const label = options.label || "";
  const type = options.type || "debug";
  const output = options.output || "console";

  // ログラベルの組み立て
  const logLabel = buildLogLabel( functionName, type );

  // 出力する値がオブジェクトの場合、2行で出力する。
  const isObj = isObject( value );
  if ( isObj && !label ) {
    throw `[ERROR: ${ funcName }] The argument label must not be empty when value is object.`;
  } else if ( isObj && output == "return" ) {
    throw `[ERROR: ${ funcName }] When value is object, return output can not used.`;
  } else if ( isObj && type == "error" ) {
    console.error( `${ logLabel }${ label } ↓` );
    console.error( value );
    return;
  } else if ( isObj && type == "warn" ) {
    console.warn( `${ logLabel }${ label } ↓` );
    console.warn( value );
    return;
  } else if ( isObj && type == "info" ) {
    console.info( `${ logLabel }${ label } ↓` );
    console.info( value );
    return;
  } else if ( isObj && debug ) {
    console.log( `${ logLabel }${ label } ↓` );
    console.log( value );
    return;
  } else if ( isObj ) {
    return;
  }
  // 出力する値がオブジェクトではない場合、1行で出力。
  let message;
  if ( !label ) {
    message = `${ logLabel }${ value }`;
  } else {
    message = `${ logLabel }${ label } : ${ value }`;
  }
  if ( output == "return" ) {
    return message;
  }
  if ( type == "error" ) {
    console.error( message );
    return;
  } else if ( type == "warn" ) {
    console.warn( message );
    return;
  } else if ( type == "info" ) {
    console.info( message );
    return;
  } else if ( debug ) {
    console.log( message );
    return;
  } else {
    return;
  }
}

function buildLogLabel( functionName, type = "debug" )
{
  if ( !functionName ) {
    throw`[ERROR: ${ funcName }] The argument functionName must not be empty.`;
  }
  if ( type == "error" ) {
    return `[ERROR: ${ functionName }] `;
  } else if ( type == "info" ) {
    return `[INFO: ${ functionName }] `;
  } else if ( type == "warn" ) {
    return `[WARNING: ${ functionName }] `;
  } else {
    return `[DEBUG: ${ functionName }] `;
  }
}
