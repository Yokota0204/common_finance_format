/**
 * リッチメニューを作成し、固有IDを返す
 * タップ領域は、全体2500*1686px、6分割での例
 * また、タップ領域のサイズ・アクション例を2つ載せている
 *
 * @return {Object} json - LINEから返されたJSONの値
 */
function createRichmenu( data, type = "" )
{
  const funcName = "createRichmenu";
  let url = isReleased && debug ? URL_CHECK_RICHMENU_API : URL_RICHMENU_API;
  url = type == "test" ? URL_CHECK_RICHMENU_API : url;
  try {
    const options = optionsRequest( "post", data, "application/json" );
    const response = UrlFetchApp.fetch( url, options );
    log( funcName, response.getResponseCode(), "response code", { type : "info" } );
    if ( debug ) {
      log( funcName, response.getContentText(), "response text" );
    }
    return JSON.parse( response );
  } catch ( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}

function deleteRichMenu( richMenuId )
{
  const funcName = "deleteRichMenu";
  try {
    const options = optionsRequest( "delete" );
    const response = UrlFetchApp.fetch( URL_RICHMENU_API + richMenuId, options );
    log( funcName, response.getResponseCode(), "response code", { type : "info" } );
    if ( debug ) {
      log( funcName, response.getContentText(), "response text" );
    }
  } catch( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}

function optionsRequest( method, postData = {}, contentType = "", toString = true )
{
  const funcName = "optionsRequest";
  if ( !method ) {
    throw buildLogLabel( funcName, "error" ) + "The argument method must not be empty.";
  }
  let options = {
    'method' : method,
    'headers' : { "Authorization" : "Bearer " + CHANNEL_ACCESS_TOKEN, },
    "muteHttpExceptions" : true,
  };
  if ( contentType ) {
    options[ "headers" ][ "Content-Type" ] = contentType;
  }
  if ( isEmptyObject( postData ) ) {
    if ( debug ) {
      log( funcName, options, { label: "options", } );
    }
    return options;
  }
  if ( toString ) {
    options[ "payload" ] = JSON.stringify( postData );
  } else {
    options[ "payload" ] = postData;
  }
  if ( debug ) {
    log( funcName, options, { label: "options", } );
  }
  return options;
}

/**
 * MessagingAPIから作成したリッチメニューを取得
 *
 * @return {Object} jsonRes - 取得したリッチメニュー一覧
 */
function getRichmenus() {
  const funcName = "getRichmenus";
  const url = URL_RICHMENU_API + '/list';
  try {
    const response = UrlFetchApp.fetch( url, optionsRequest( "get" ) );
    log( funcName, response.getResponseCode(), "response code", { type : "info" } );
    if ( debug ) {
      log( funcName, response.getContentText(), "response text" );
    }
    const jsonRes = JSON.parse( response );
    return jsonRes;
  } catch ( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}

/**
 * 作成済リッチメニューに画像ファイルを紐づけ
 * GoogleDriveに格納している画像ファイルを、PNGファイルとしてアップロードする例
 *
 * @param {string} richmenuId - リッチメニュー固有のID
 * @param {string} driveFileId - GoogleDriveのファイルID
 * @return {Object} json - 結果
 */
function setRichmenuImage( richmenuId, driveFileId )
{
  const funcName = "setRichmenuImage";
  const url = URL_RICHMENU_DATA_API + '/' + richmenuId + '/content';
  try {
    const image = DriveApp.getFileById( driveFileId );
    if ( debug ) {
      log( funcName, image, { label: "image", } );
    }
    const blob = image.getAs( "image/jpeg" );
    if ( debug ) {
      log( funcName, blob, { label: "blob", } );
    }
    const options = optionsRequest( "post", blob, "image/jpeg", false );
    const response = UrlFetchApp.fetch( url, options );
    log( funcName, response.getResponseCode(), "response code", { type : "info" } );
    if ( debug ) {
      log( funcName, response.getContentText(), "response text" );
    }
  } catch( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}

function setDefaultRichMenu( richMenuId )
{
  const funcName = "setDefaultRichMenu";
  const url = URL_RICHMENU_DEFAULT_API + richMenuId;
  try {
    const options = optionsRequest( "post" );
    const response = UrlFetchApp.fetch( url, options );
    log( funcName, response.getResponseCode(), "response code", { type : "info" } );
    if ( debug ) {
      log( funcName, response.getContentText(), "response text" );
    }
  } catch( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}

function getDefaultRichMenuId()
{
  const funcName = "getDefaultRichMenuId";
  try {
    const options = optionsRequest( "get" );
    const response = UrlFetchApp.fetch( URL_RICHMENU_DEFAULT_API, options );
    log( funcName, response.getResponseCode(), "response code", { type : "info" } );
    if ( debug ) {
      log( funcName, response.getContentText(), "response text" );
    }
    const jsonRes = JSON.parse( response );
    return jsonRes;
  } catch ( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}

function createRichMenuAlias( richMenuId, aliasId )
{
  const funcName = "createRichMenuAlias";
  const url = URL_RICHMENU_API + "alias";
  const postData = {
    'richMenuAliasId': aliasId,
    'richMenuId': richMenuId,
  };
  try {
    const options = optionsRequest( "post", postData, "application/json" );
    const response = UrlFetchApp.fetch( url, options );
    log( funcName, response.getResponseCode(), "response code", { type : "info" } );
    if ( debug ) {
      log( funcName, response.getContentText(), "response text" );
    }
  } catch( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}

function deleteAllRichMenus()
{
  const funcName = "deleteAllRichMenus";
  try {
    const menus = getRichmenus();
    if ( debug ) {
      log( funcName, menus, { label: "before" } );
    }
    for ( let i = 0; i < menus.richmenus.length; i++ ) {
      const menu = menus.richmenus[ i ];
      deleteRichMenu( menu.richMenuId );
    }
    if ( debug ) {
      const after = getRichmenus();
      log( funcName, after, { label: "after" } );
    }
  } catch ( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}

function getAliasMenus()
{
  const funcName = "getAliasMenus";
  const url = URL_RICHMENU_ALIAS_API + "list/";
  try {
    const options = optionsRequest( "get" );
    const response = UrlFetchApp.fetch( url, options );
    log( funcName, response.getResponseCode(), "response code", { type : "info" } );
    if ( debug ) {
      log( funcName, response.getContentText(), "response text" );
    }
    return JSON.parse( response );
  } catch( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}

function deleteAllAliasMenus()
{
  const funcName = "deleteAllAliasMenus";
  try {
    const menus = getAliasMenus();
    if ( debug ) {
      log( funcName, menus, { label : "before" } );
    }
    for ( let i = 0; i < menus.aliases.length; i++ ) {
      deleteAliasMenu( menus.aliases[ i ].richMenuAliasId );
    }
    if ( debug ) {
      const after = getAliasMenus();
      log( funcName, after, { label : "after" } );
    }
  } catch( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}

function deleteAliasMenu( aliasMenuId )
{
  const funcName = "deleteAliasMenu";
  const url = URL_RICHMENU_ALIAS_API + aliasMenuId;
  try {
    const options = optionsRequest( "delete" );
    const response = UrlFetchApp.fetch( url, options );
    log( funcName, response.getResponseCode(), "response code", { type : "info" } );
    if ( debug ) {
      log( funcName, response.getContentText(), "response text" );
    }
  } catch( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}
