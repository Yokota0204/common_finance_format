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
    "皿洗い" : 200 * 2,
    "ジップロック" : 120,
    "野菜カット" : 100,
    "野菜洗う" : 200 * 2,
    "野菜皮むき" : 100,
  },
  laundry: {
    name : "洗濯",
    "洗濯機" : 200,
    "干す" : 400 * 2,
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
  start : [ '複数入力', 'キッチン', '洗濯', 'お風呂掃除', 'トイレ掃除', 'エイリアス', '申告' ],
  normal: [ 'キッチン', '洗濯', 'お風呂掃除', 'トイレ掃除', '申告', '中止', ],
  number: [ "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "中止", ],
  date : [ "今日", "昨日", "一昨日", "中止" ],
  tax : [ "税込み", "通常", "軽減", "中止" ],
  conf : [ "はい", "中止" ],
  kitchen : [ '掃除', '皿洗い', 'ジップロック', '野菜カット', '野菜洗う', '野菜皮むき', '中止' ],
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

// Utility
const u_nl = "\n";

const URL_LINE_BOT_API = "https://api.line.me/v2/bot/";
const URL_REPLY_API = URL_LINE_BOT_API + "message/reply";
const URL_RICHMENU_API = URL_LINE_BOT_API + 'richmenu/';
const URL_CHECK_RICHMENU_API = URL_RICHMENU_API + "validate";
const URL_RICHMENU_ALIAS_API = URL_RICHMENU_API + "alias/";
const URL_RICHMENU_DATA_API = 'https://api-data.line.me/v2/bot/richmenu/';
const URL_RICHMENU_DEFAULT_API = URL_LINE_BOT_API + "user/all/richmenu/";

const tasksRichMenu = {
  'size': {
    'width': 2500,
    'height': 1563,
  },
  'selected': true,
  'name': "others-menu",
  'chatBarText': "メニュー",
  'areas': [
    {
      'bounds': {
        'x': 19,
        'y': 20,
        'width': 1216,
        'height': 193,
      },
      'action': {
        'type': 'richmenuswitch',
        'richMenuAliasId' : "tasks-menu",
        "data" : "switch-tasks-tab",
      },
    },
    {
      'bounds': {
        'x': 1265,
        'y': 20,
        'width': 1216,
        'height': 193,
      },
      'action': {
        'type': 'richmenuswitch',
        'richMenuAliasId' : "others-menu",
        "data" : "switch-others-tab",
      },
    },
    {
      'bounds': {
        'x': 0,
        'y': 213,
        'width': 1250,
        'height': 510,
      },
      'action': {
        'type': 'message',
        'text': 'トイレ掃除',
      },
    },
    {
      'bounds': {
        'x': 1250,
        'y': 213,
        'width': 1250,
        'height': 510,
      },
      'action': {
        'type': 'message',
        'text': 'キッチン',
      },
    },
    {
      'bounds': {
        'x': 0,
        'y': 213 + 510,
        'width': 1250,
        'height': 510,
      },
      'action': {
        'type': 'message',
        'text': 'お風呂掃除',
      },
    },
    {
      'bounds': {
        'x': 1250,
        'y': 213 + 510,
        'width': 1250,
        'height': 510,
      },
      'action': {
        'type': 'message',
        'text': '洗濯',
      },
    },
    {
      'bounds': {
        'x': 0,
        'y': 213 + 510 * 2,
        'width': 2500,
        'height': 326,
      },
      'action': {
        'type': 'message',
        'text': '複数入力',
      },
    },
  ],
};

const othersRichMenu = {
  'size': {
    'width': 2500,
    'height': 1563,
  },
  'selected': false,
  'name': "others-menu",
  'chatBarText': "メニュー",
  'areas': [
    {
      'bounds': {
        'x': 19,
        'y': 20,
        'width': 1216,
        'height': 193,
      },
      'action': {
        'type': 'richmenuswitch',
        'richMenuAliasId' : "tasks-menu",
        "data" : "switch-tasks-tab",
      },
    },
    {
      'bounds': {
        'x': 1265,
        'y': 20,
        'width': 1216,
        'height': 193,
      },
      'action': {
        'type': 'richmenuswitch',
        'richMenuAliasId' : "others-menu",
        "data" : "switch-others-tab",
      },
    },
    {
      'bounds': {
        'x': 0,
        'y': 213,
        'width': 1250,
        'height': 912,
      },
      'action': {
        'type': 'message',
        'text': '申告',
      },
    },
    {
      'bounds': {
        'x': 1250,
        'y': 213,
        'width': 1250,
        'height': 912,
      },
      'action': {
        'type': 'message',
        'text': '中止',
      },
    },
    {
      'bounds': {
        'x': 0,
        'y': 213 + 912,
        'width': 2500,
        'height': 438,
      },
      'action': {
        'type': 'message',
        'text': 'テンプレ入力',
      },
    },
  ],
};