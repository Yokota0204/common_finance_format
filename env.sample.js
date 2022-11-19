const debug = false;

// 年ごとにシートのidを変更。
const thisSs = SpreadsheetApp.openById( 'SPREAD SHEET ID' );

/*
 * Messaging APIのチャネルアクセストークン
 */
const CHANNEL_ACCESS_TOKEN = "LINE MESSAGING API CHANNEL ACCESS TOKEN";

// LINE notify用トークン
const notify_token = debug ? "LINE NOTIFY TOKEN FOR TEST" : "LINE NOTIFY TOKEN FOR PRODUCTION";