const dateObjNow= new Date();
const yearNow = dateObjNow.getFullYear();
const monthNow = dateObjNow.getMonth() + 1;
const lastDateObjInThisMonth = new Date( yearNow, monthNow, 0 );
const dateNow = dateObjNow.getDate();
const lastDateObjInLastMonth = new Date( yearNow, monthNow - 1, 0 );
const lastDatePrevMonth = lastDateObjInLastMonth.getDate();

const lastMonth = monthNow - 1 == 0 ? 12 : monthNow - 1;
const sheetNameLastMonth  = monthSheetName( lastMonth );

const activeSs= SpreadsheetApp.getActiveSpreadsheet();
const activeSh = activeSs.getActiveSheet();

const botSh = new BotSheet( "bot" );
const listSh = new ListSheet( "list" );
const formatSh = new FormatSheet( "フォーマット" );
const summarySh = thisSs.getSheetByName("項目ごとまとめ");
const sandboxSh = thisSs.getSheetByName("sandbox");
const aliasSh = new AliasSheet( "alias" );

/*
 * LINE bot
 */

const tasks = {
  kitchen: {
    name : "キッチン",
    "掃除" : 400,
    "皿洗い" : 200,
    "ジップロック" : 120,
    "野菜カット" : 100,
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
const categoryColMonSh = 2;
const userColMonSh = 3;
const tax10ColMonSh = 4;
const tax8ColMonSh = 5;
const taxIncColMonSh = 6;
const detailColMonSh = 8;

// Utility
const u_nl = "\n";
