const now = new Date();
const thisYear = now.getFullYear();
const thisMonth = now.getMonth() + 1;
const thisMonthLastDate = new Date(thisYear, thisMonth, 0);
const today = now.getDate();
const thisMonthLastDay = thisMonthLastDate.getDate();
const prevMonthLastDate = new Date(thisYear, thisMonth - 1, 0);
const prevMonthLastDay = prevMonthLastDate.getDate();

const ss = SpreadsheetApp.getActiveSpreadsheet();
const sh = ss.getActiveSheet();

const botSh = thisYearBook.getSheetByName("bot");
const listSh = thisYearBook.getSheetByName("list");
const formatSh = thisYearBook.getSheetByName("フォーマット");
const summarySh = thisYearBook.getSheetByName("項目ごとまとめ");
const sandboxSh = thisYearBook.getSheetByName("sandbox");
const aliasSh = thisYearBook.getSheetByName("alias");

// calculate included tax
var colDate = 1;
var strRow = 2;
var strPriceCol = 4;
var cntPriceRow = 3;
var setValueCol = 7;

// listシートの情報
const strColList = 2;
const rowUidListSh = 7;
const rowUserName = 8;
const genres = listSh.getRange( 1, 2, 4, 13 ).getValues(); // listシートのジャンルを取得

const lastColListSh = listSh.getLastColumn();
let userNum = () => {
  const vals = listSh.getRange( rowUidListSh, 1, rowUidListSh, lastColListSh ).getValues();

  for( var i = 1; i < lastColListSh; i++ )
  {
    if( vals[0][i] == "" ) return i - 1;
  }
}
const uids = listSh.getRange( rowUidListSh, strColList, 1, userNum() ).getValues();
const userNames = listSh.getRange( rowUserName, strColList, 1, userNum() ).getValues();

/*
* LINE Notify
*/

var mon = thisMonth - 1;
if (mon == 0) mon = 12;
var shNameLastMon = mon + "月度";

/* 
* LINE bot
*/

let inputDate, inputGenre, inputUser, inputTax, inputMoney, inputDetail;
let inputKey;
let inputStrRow, inputLastRow, flgInputCol, dcInputCol, alInputCol, numItems;
let reqType, inputStage;
let sheetMonth, sheetName;
let userIndex, userName;

// botシートの情報
const flgRowBotSh = 2;
const inputStrRowBotSh = 2;
const userInputRowBotSh = 5;
const inputWidthBotSh = userNum() + 1;

const dateRowBotSh = inputStrRowBotSh;
const keyRowBotSh = inputStrRowBotSh;
const genreRowBotSh = inputStrRowBotSh + 1;
const taxRowBotSh = genreRowBotSh + 1;
const moneyRowBotSh = taxRowBotSh + 1;
const detailRowBotSh = moneyRowBotSh + 1;

const flgLabelCol = 1;
const dcLabelCol = flgLabelCol + inputWidthBotSh + 1;
const alLabelCol = dcLabelCol + inputWidthBotSh + 1;

const firstUserInputColBotSh = 2;
const firstUserFlagColBotSh = firstUserInputColBotSh;
const firstUserDcColBotSh = dcLabelCol + 1;
const firstUserAlColBotSh = alLabelCol + 1;

// 申告内容入力欄
const dcInputLastRow = botSh.getRange( 1, dcLabelCol ).getNextDataCell( SpreadsheetApp.Direction.DOWN ).getRow();
const dcItemsNum = dcInputLastRow - inputStrRowBotSh + 1; // 項目数

// エイリアス入力欄
const alLastInputRow = 7; // 最終行
const alItemsNum = alLastInputRow - inputStrRowBotSh + 1;

// 入力フラグ
let flgCellBotSh;

// エイリアスシートの情報
let alStrCol = 1;
let alLastCol = 5;
let alStrRow = 2;
let alLastRow = aliasSh.getRange( 1, alStrCol ).getNextDataCell( SpreadsheetApp.Direction.DOWN ).getRow();

const alVals = aliasSh.getRange( alStrRow, alStrCol, alLastRow - alStrRow + 1, alLastCol - alStrCol + 1 ).getValues();

const taskVals = {
  kitchen: {
    name : "キッチン",
    "掃除" : 400,
    "皿洗い" : 200,
    "ジップロック" : 120,
  },
  laundry: {
    name : "洗濯",
    "洗濯機" : 200,
    "干す" : 400,
  },
  toilet : {
    name : "トイレ",
    "掃除" : 800,
  },
  bath : {
    name : "お風呂",
    "掃除" : 800,
  }
};

// quick選択肢配列
const quickItems = {
  start : [ '申告', 'キッチン', '洗濯', 'お風呂掃除', 'トイレ掃除', 'エイリアス' ],
  date : [ "今日", "昨日", "一昨日", "中止" ],
  tax : [ "税込み", "通常", "軽減", "中止" ],
  conf : [ "はい", "中止" ],
  kitchen : [ '掃除', '皿洗い', 'ジップロック', '中止' ],
  laundry : [ "洗濯機", "干す", "中止" ],
  toilet : [ "掃除", "中止" ],
  bath : [ "掃除", "中止" ],
  priceAlias : [ 'blank' ],
  taxAlias : [ '税込み', '軽減', '通常', 'blank', '中止' ],
}

// 文言
let helloUser;
const stopGuide = "\n申告を中止する場合は「中止」と送信してください。";
let strGuideString = "\n申告を始める場合は、下記から申告項目を選択し送信してください。";
const blankGuide = "\n空白にしたい場合は、「blank」と送信してください。"
const invalidAliasGuide = "既に使用されているキーです。\n最初からやりなおしてください。";

for ( let i = 0; i < quickItems[ "start" ].length; i++ ) {
  const item = quickItems[ "start" ][ i ];
  strGuideString = strGuideString + "\n・"
  if ( item == "申告" ) {
    strGuideString = strGuideString + "通常の申告 → " + item;
  } else if ( item == "エイリアス" ) {
    strGuideString = strGuideString + "エイリアスの登録 → " + item;
  } else {
    strGuideString = strGuideString + item + "についての申告 → " + item;
  }
}
const strGuide = strGuideString;

// 月ごとのシート
const dateColMonSh = 1;
const genreColMonSh = 2;
const userColMonSh = 3;
const tax10ColMonSh = 4;
const tax8ColMonSh = 5;
const taxIncColMonSh = 6;
const detailColMonSh = 8;

// Utility
const u_nl = "\n";
