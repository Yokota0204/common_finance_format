const debug = false;

// 年ごとにシートのidを変更。
const thisYearBook = SpreadsheetApp.openById( '' );

/*
 * Messaging APIのチャネルアクセストークン
 */
const CHANNEL_ACCESS_TOKEN = "";

// LINE notify用トークン
const notify_token = debug ? "" : ""; // 本番用