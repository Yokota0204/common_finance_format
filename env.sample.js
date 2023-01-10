const debug = false;

const isReleased = false;

// 年ごとにシートのidを変更。
const thisSs = SpreadsheetApp.openById( 'SPREAD SHEET ID' );

/*
 * Messaging APIのチャネルアクセストークン
 */
const CHANNEL_ACCESS_TOKEN = "LINE MESSAGING API CHANNEL ACCESS TOKEN";

// LINE notify用トークン
const notify_token = debug ? "LINE NOTIFY TOKEN FOR TEST" : "LINE NOTIFY TOKEN FOR PRODUCTION";

function reflectRichMenus()
{
  const funcName = "reflectRichMenus";
  try {
    const newRichMenu1Id = createRichmenu( tasksRichMenu );
    const newRichMenu2Id = createRichmenu( othersRichMenu );
    setRichmenuImage( newRichMenu1Id.richMenuId, "Google Drive image id" );
    createRichMenuAlias( newRichMenu1Id.richMenuId, "tasks-menu" );
    setRichmenuImage( newRichMenu2Id.richMenuId, "Google Drive image id" );
    createRichMenuAlias( newRichMenu2Id.richMenuId, "others-menu" );
    setDefaultRichMenu( newRichMenu1Id.richMenuId );
  } catch( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}

function clearRichMenus()
{
  const funcName = "clearRichMenus";
  try {
    deleteAllRichMenus();
    deleteAllAliasMenus();
  } catch( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}
