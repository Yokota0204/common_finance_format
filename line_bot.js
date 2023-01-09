/*
 * LINE bot
 *
 * ボットにイベントが発生したときの（メイン）処理
 * （例）メッセージの受信、フォローされた、アンフォローされた
 */
function doGet( e )
{
  doPost( e );
}

function doPost( e )
{
  const funcName = "doPost";
  let meta;
  // リクエストイベントの取得
  const events = JSON.parse( e.postData.contents ).events;
  const event = events[ 0 ];
  if ( debug ) {
    log( funcName, event, { label: "event" } );
  }
  const token = event.replyToken;
  const msg = event.message.text;
  const uid = event.source.userId;
  sendMessage( uid, '送信中...' );
  botSh.setCurrentUser = uid;
  // リクエストしてきたユーザーの認証
  if ( !botSh.currentUser ) {
    meta = [ "無効なユーザーです。", 'normal', [] ];
  }
  botSh.setRequestType = botSh.getFlagValue();
  // 対象の月のシートを取得
  if ( botSh.isDeclarationOrAlias ) {
    botSh.setInputMonthSheet = botSh.getInputRawValues();
  }
  if ( msg == "中止" ) {
    meta = exitInput();
  } else if ( msg == "テンプレ入力" ) {
    meta = exitInput();
  } else if ( botSh.requestType == 'start' ) { // 入力なしからの最初のチャット
    meta = flagOn( msg );
  } else if ( botSh.requestType == "multi" ) {
    log( funcName, typeof msg, { label: "typeof msg", } );
    const number = Number( msg );
    if ( !isNumber( number ) ) {
      meta = [ "数値を入力してください。", "quick", quickItems.number, ];
    } else {
      botSh.putMultiInputNum( number );
      meta = [ "複数入力する操作を選択してください。", 'quick', quickItems.normal ];
    }
  } else if( botSh.requestType == 'kc_input' ) { // キッチンの入力中
    meta = putWork( msg, "kitchen" );
  } else if( botSh.requestType == 'ld_input' ) { // 洗濯の入力中
    meta = putWork( msg, "laundry" );
  } else if( botSh.requestType == 'tl_input' ) { // トイレの入力中
    meta = putWork( msg, "toilet" );
  } else if( botSh.requestType == 'bt_input' ) { // お風呂の入力中
    meta = putWork( msg, "bath" );
  } else if( botSh.requestType == 'dc_input' ) { // 申告の入力中
    meta = botSh.addDeclarationContent( msg );
  } else if( botSh.requestType == 'al_input' ) { // エイリアスの入力中
    meta = botSh.addAliasContent( msg );
  } else if( botSh.requestType == 'conf_dc' ) { // 申告の確認への返信
    meta = declare( msg );
  } else if( botSh.requestType == 'conf_al' ) { // エイリアス登録の確認への返信
    meta = registerAlias( msg );
  }
  if ( !meta ) {
    clearInputs();
    meta = replyMeta( 'error' );
  }
  doReply( token, meta[ 0 ], meta[ 1 ], meta[ 2 ]);
}

function replyMeta( type )
{
  const funcName = "replayMeta";
  if ( type == "empty" ) {
    return [ '', 'normal', [] ];
  } else if ( type == "error" ) {
    return [ `エラーのため、処理を中断しました。\n${ botSh.currentUser.hello + strGuide }`, 'quick', quickItems[ "start" ] ];
  } else if ( type == "exit" ) {
    return [ `申告を中止しました。${ strGuide }`, 'quick', quickItems[ "start" ] ];
  } else if ( type == "maintenance" ) {
    return [ `そのメニューは今準備中です。${ strGuide }`, 'quick', quickItems[ "start" ] ];
  } else if ( type == "date" ) {
    return [ '申告する日付を入力してください。', 'quick', quickItems[ "date" ] ];
  } else if ( type == "key" ) {
    return [ "キーを送信してください。", 'normal', [] ];
  } else if ( type == "category" ) {
    const meta = categoryReplayMeta();
    return [ "カテゴリーを教えて下さい。\n" + buildMenu( meta.menu ), 'quick', meta.items ];
  } else if ( type == "tax" ) {
    return [
      "入力する金額には税金は含みますか？\n・税込\n・軽減\n・通常",
      'quick',
      quickItems[ "tax" ],
    ];
  } else if ( type == "price" ) {
    return [ "金額を教えて下さい。", 'normal', [] ];
  } else if ( type == "detail" ) {
    return [ '備考欄に出力する文言を入力してください。', 'normal', [] ];
  } else if ( type == "comp_dc" ) {
    return [ "申告書への記載が完了しました。", 'normal', [] ];
  } else if ( type == "conf_dc" || type == "conf_al" ) {
    return [ '', 'quick', quickItems[ "conf" ] ];
  } else if ( type == "price_al" ) {
    return [ "金額を教えて下さい。" + blankGuide, 'quick', [ 'blank' ] ];
  } else if ( type == "tax_al" ) {
    return [
      "入力する金額には税金は含みますか？" + blankGuide + "\n・税込\n・軽減\n・通常",
      'quick',
      quickItems[ "taxAlias" ],
    ];
  } else if ( type == "comp_al" ) {
    return [ "エイリアスへの登録が完了しました。", 'normal', [] ];
  } else if ( type == "invalid_date" ) {
    return [
      "日付を入力してください。" + stopGuide,
      'quick',
      quickItems[ "date" ],
    ];
  } else if ( type == "invalid_category" ) {
    const meta = categoryReplayMeta();
    return [
      "正しいカテゴリーを入力してください。\n" + buildMenu( meta.menu ) + stopGuide,
      'quick',
      meta.items
    ];
  } else if ( type == "invalid_tax" ) {
    return [
      "正しい値を入力して下しさい。\n・税込\n・軽減\n・通常" + stopGuide,
      'quick',
      quickItems[ "tax" ]
    ];
  } else if ( type == "invalid_price" ) {
    return [ "金額を入力してください。" + stopGuide, 'normal', [] ];
  } else if ( type == "invalid_key" ) {
    return [ "既に使用されているキーです。\n別のキーを入力してください。", 'normal', [] ];
  } else if ( type == "invalid_tax_al" ) {
    return [
      "正しい値を入力して下しさい。" + blankGuide + "\n・税込\n・軽減\n・通常\n・blank" + stopGuide,
      'quick',
      quickItems[ "taxAlias" ],
    ];
  } else if ( type == "invalid_price_al" ) {
    return [
      "金額を入力してください。" + blankGuide + stopGuide,
      'quick',
      quickItems[ "priceAlias" ],
    ];
  } else if ( type == "kitchen" ) {
    return [ botSh.currentUser.hello + buildGuideMsg( "kitchen" ), 'quick', quickItems[ "kitchen" ] ];
  } else if ( type == "toilet" ) {
    return [ botSh.currentUser.hello + "\n「トイレ掃除」を申告しますか？", 'quick', quickItems[ "toilet" ] ];
  } else if ( type == "laundry" ) {
    return [ botSh.currentUser.hello + buildGuideMsg( "laundry" ), 'quick', quickItems[ "laundry" ] ];
  } else if ( type == "bath" ) {
    return [ botSh.currentUser.hello + "\n「お風呂掃除」を申告しますか？", 'quick', quickItems[ "bath" ] ];
  } else if ( type == "multiInput" ) {
    return [ "入力数は何回ですか？", 'quick', quickItems.number ];
  }
  return [ `${ botSh.currentUser.hello + strGuide }`, 'quick', quickItems[ "start" ] ];
}

function registerAlias( message )
{
  let meta;
  const values = botSh.getInputRawValues();
  if ( message == "はい" ) {
    if ( values.tax == "blank" ) values.tax = "";
    if ( values.price == "blank" ) values.price = "";
    let inputs = [ [ values.key, values.category, values.tax, values.price, values.detail, ], ];
    aliasSh.putAlias( inputs ); // botシートからaliasシートへ出力
    clearInputs();
    meta = replyMeta( 'comp_al' );
  } else if ( message == 'いいえ' ) {
    meta = exitInput();
  } else {
    meta = replyMeta( 'conf_al' );
    meta[ 0 ] = buildAlConfMsg();
  }
  return meta;
}

function declare( message )
{
  const funcName = "declare";
  const values = botSh.getInputRawValues();
  log( funcName, values.tax, { label: "values.tax", } );
  if ( message != "はい" ) {
    let tmp = replyMeta( 'conf_dc' );
    tmp[ 0 ] = buildConfMsg();
    return tmp;
  }
  let inputs = [];
  inputs[ 0 ] = values.date;
  inputs[ 1 ] = values.category;
  inputs[ 2 ] = botSh.currentUser.name;
  inputs[ 3 ] = values.tax == "通常" ? values.price : "-";
  inputs[ 4 ] = values.tax == "軽減" ? values.price : "-";
  inputs[ 5 ] = values.tax == "税込" || values.tax == "税込み" ? values.price : "-";
  inputs[ 6 ] = "";
  inputs[ 7 ] = values.detail;
  inputs = [ inputs ];
  log( funcName, inputs, { label: "inputs", } );
  const monthSh = new MonthSheet( botSh.targetSheet.sheetName );
  const multiInputFlag = botSh.flag.values.multiInput ?? botSh.multiInputFlagValue();
  const multiInputNum = botSh.flag.values.multiInputNum ?? botSh.multiInputNumValue();
  let number = 1;
  if ( multiInputFlag == "on" && multiInputNum ) {
    number = multiInputNum;
  }
  for ( let count_input = 0; count_input < number; count_input++ ) {
    monthSh.putInputs( inputs );
  }
  sort( monthSh.sheet );
  clearInputs();
  return [ `${ number }個の申告を完了しました。`, 'normal', [] ];
}

function flagOn( msg )
{
  const funcName = "flagOn";
  const flagCell = botSh.flag.ranges.valueCell;
  // 通常の申告
  if ( msg == '申告' ) {
    flagCell.setValue( 'on' );
    return replyMeta( 'date' );
  } else if ( msg == 'キッチン' ) {
    flagCell.setValue( "kc" );
    return replyMeta( 'kitchen' );
  } else if ( msg == '洗濯' ) {
    flagCell.setValue( "ld" );
    return replyMeta( 'laundry' );
  } else if ( msg == 'トイレ掃除' ) {
    flagCell.setValue( "tl" );
    return replyMeta( 'toilet' );
  } else if ( msg == 'お風呂掃除' ) {
    flagCell.setValue( "bt" );
    return replyMeta( 'bath' );
  }
  // エイリアス作成時
  const multiInputFlagValue = botSh.flag.values.multiInput ?? botSh.multiInputFlagValue();
  if ( msg == 'エイリアス' && multiInputFlagValue != "on" ) {
    flagCell.setValue( "al" );
    let tmp = replyMeta( 'key' );
    tmp[ 0 ] = buildAlStrMsg( tmp[ 0 ] );
    return tmp;
  } else if ( msg == "エイリアス" ) {
    return [ "エイリアスは複数入力できません。\n複数入力する操作を選択してください。", 'quick', quickItems.normal, ];
  }
  // 複数入力時
  if ( msg == "複数入力" && multiInputFlagValue != "on" ) {
    const multiInputFlagCellRange = botSh.flag.ranges.multiInput ?? botSh.multiInputFlagCellRange();
    multiInputFlagCellRange.setValue( "on" );
    return replyMeta( "multiInput" );
  } else if ( msg == "複数入力" ) {
    return [ "複数入力する操作を選択してください。", 'quick', quickItems.normal, ];
  }
  // それ以外のとき（エイリアスの検索）
  const values = aliasSh.getRawAliases();
  alIndex = aliasNum( values, msg );
  if ( alIndex === false ) {
    return replyMeta( 'error' );
  }
  log( funcName, "Alias number " + alIndex + " called.", "", { type : "info" } );
  let inputs = [
    [ '' ],
    [ values[ alIndex ][ 1 ] ],
    [ values[ alIndex ][ 2 ] ],
    [ values[ alIndex ][ 3 ] ],
    [ values[ alIndex ][ 4 ] ],
  ];
  log( funcName, inputs, { label: "inputs", } );
  flagCell.setValue( 'on' );
  botSh.getRawDeclarationInputsRange().setValues( inputs );
  return replyMeta( 'date' );
}

function putWork( msg, type ) {
  const funcName = "putWork";
  const taskVal = tasks[ type ];
  let val = taskVal ? taskVal[ msg ] : false;
  const items = quickItems[ type ];
  if ( !val ) {
    return [ "入力が間違っています。" + buildGuideMsg( type ), 'quick', items ];
  }
  const inputs = [
    [
      dateNow,
      taskVal.name,
      botSh.currentUser.name,
      "-",
      "-",
      val,
      "",
      msg,
    ],
  ];
  if ( debug ) {
    log( funcName, inputs, { label: "inputs", } );
  }
  const sheetName = botSh.targetSheet.sheetName;
  if ( debug ) {
    log( funcName, sheetName, { label: "sheetName", } );
  }
  const multiInputFlag = botSh.flag.values.multiInput ?? botSh.multiInputFlagValue();
  const multiInputNum = botSh.flag.values.multiInputNum ?? botSh.multiInputNumValue();
  let number = 1;
  if ( multiInputFlag == "on" && multiInputNum ) {
    number = multiInputNum;
  }
  const monthSh = new MonthSheet( sheetName );
  for ( let count_input = 0; count_input < number; count_input++ ) {
    monthSh.putInputs( inputs );
  }
  sort( monthSh.sheet );
  clearInputs();
  return [ taskVal.name + "の「" + msg + "」を" + number + "つ申告しました。", 'normal', [] ];
}

function doReply( token, msg, type, arr )
{
  if ( type == 'normal' ) {
    reply( token, msg );
  } else if ( type == 'quick' ) {
    quickReply( token, msg, arr );
  }
} // function doReply

function exitInput()
{
  clearInputs();
  return replyMeta( 'exit' );
}

function buildAlStrMsg( msg )
{
  msg = msg + '\n\n【登録済みのエイリアス】';
  const values = aliasSh.getRawAliases();
  values.forEach( ( key ) => {
    const val = key[ 0 ];
    msg = msg + "\n・" + val;
  } );
  return msg;
}

function buildGenreItems()
{
  let items = [];
  const categories = listSh.getRawCategoryValues();
  allGenres: for ( let i = 0; i < categories.length; i++ ) {
    oneGenre: for ( let j = 0; j < categories.length; j++ ) {
      for ( let k = 0; k < categories[j].length; k++ ) {
        if ( items.length > 11 ) {
          break allGenres;
        }
        category = categories[ j ][ k ];
        if( !category ) {
          continue oneGenre;
        }
        items.push( category );
      }
    }
  }
  items.push( "中止" );
  return items;
}

function aliasNum( aliases, msg )
{
  for ( let i = 0; i < aliases.length; i++ ) {
    if ( aliases[ i ][ 0 ] == msg ) {
      return i;
    }
  }
  return false;
}

/*
* 入力内容のクリア
*/
function clearInputs()
{
  let clearRange;
  clearRange = botSh.allFlagCellsRange();
  clearRange.clearContent();
  clearRange = botSh.getRawDeclarationInputsRange();
  clearRange.clearContent();
  clearRange = botSh.gerRawAliasInputsRange();
  clearRange.clearContent();
}

/*
* 文字列にジャンルを追加。
*/
function addGenres( question )
{
  const categories = listSh.getRawCategoryValues();
  categories.forEach( ( values ) => {
    values.forEach( ( value ) => {
      if ( value != "" ) {
        question = question + "・" + value + "\n";
      }
    } );
  } );
  return question;
}

function categoryReplayMeta()
{
  const funcName = "categoryReplayMeta";
  const categories = listSh.getRawCategoryValues();
  const set_categories = new Set( categories.flat() );
  set_categories.delete( "" );
  const menu = Array.from( set_categories );
  if ( debug ) {
    log( funcName, menu, { label: "menu", } );
  }
  let categories_short = menu;
  categories_short.length = 13;
  const set_categories_short = new Set( categories_short );
  if ( set_categories_short.has( "" ) ) {
    set_categories_short.delete( "" );
  }
  const items = Array.from( set_categories_short );
  return { menu: menu, items: items, };
}

function buildMenu( items )
{
  let message = "";
  items.forEach( ( item ) => {
    message += "・" + item + "\n";
  } );
  return message;
}

function buildGuideMsg( type )
{
  let guide = "\n下記の中から申告内容を選択し送信してください。";
  const items = quickItems[ type ];
  if ( items ) {
    items.forEach( ( item ) => {
      guide = guide + "\n・" + item;
    } );
  }
  return guide;
}

function buildConfMsg()
{
  let question = "下記の内容を申告シートへ出力します。よろしいですか？\nよろしければ「はい」と送信してください。\n";
  const values = botSh.getInputValues();
  values.forEach( row => {
    const label = row[ 0 ];
    let input = row[ botSh.currentUser.index + 1 ];
    if ( label == "日付" ) {
      input = botSh.targetSheet.month  + "月" + input + "日";
    } else if ( label == "金額" ) {
      input = "¥" + input.toLocaleString();
    }
    question = question + "・" + label + "：" + input + "\n";
  } );
  return question + stopGuide;
}

function buildAlConfMsg()
{
  let question = "下記の内容をエイリアスとして登録します。よろしいですか？\nよろしければ「はい」と送信してください。\n";
  var values = botSh.sheet.getRange( botSh.alias.rows.keyInput, botSh.alias.cols.labelInput, botSh.alias.rows.num - 1, botSh.input.cols.numOnePart ).getValues();
  console.log( values );
  values.forEach( row => {
    const label = row[ 0 ]; // ラベルを取得
    let input = row[ botSh.currentUser.index + 1 ];
    if ( input == "blank" ) {
      input = "";
    } else if ( label == "金額" ) {
      input = "¥" + input.toLocaleString();
    }
    question = question + "・" + label + "：" + input + "\n";
  });
  return question + stopGuide;
}

/*
* 入力されたジャンルのバリデーション
*/
function validateGenre( msg )
{
  const categories = listSh.getRawCategoryValues();
  for ( let i = 0; i < categories.length; i++ ) {
    if ( categories[ i ].indexOf( msg ) >= 0 ) {
      return msg;
    }
  }
  return false;
}

/*
* 入力された日付のバリデーション
*/
function validateDate( msg )
{
  if( isNaN( msg ) ) {
    if ( msg == "今日" ) {
      return dateNow;
    } else if ( msg == "昨日" ) {
      if ( dateNow - 1 < 1 ) {
        return lastDatePrevMonth;
      }
      return dateNow - 1;
    } else if ( msg == "一昨日" ) {
      if ( dateNow - 2 < 0 ) {
        return lastDatePrevMonth - 1;
      } else if ( dateNow - 2 == 0 ) {
        return lastDatePrevMonth;
      }
      return dateNow - 2;
    } else if ( !isNaN( Number( msg.replace( '日', '' ) ) ) ) {
      return Number( msg.replace( '日', '' ) );
    }
    return false;
  }
  return msg;
}

function buildInputs( date, category, user, taxCol, value, detail )
{
  return {
    'date' : date,
    'category' : category,
    'user' : user,
    'taxCol' : taxCol,
    'value' : value,
    'detail' : detail
  };
}

function buildAliasInputs( key, category, tax, val, detail )
{
  return {
    'key' : key,
    'category' : category,
    'tax' : tax,
    'val' : val,
    'detail' : detail,
  };
}

/*
* 返信の処理
*/
function reply( token, msg )
{
  const funcName = "reply";
  // 受信したメッセージをそのまま送信
  const msgJson = {
    "replyToken": token,
    "messages": [
      {
        "type": "text",
        "text": msg
      }
    ]
  };
  // 送信のための諸準備
  const replyData = optionsRequest( "post", msgJson, "application/json" );
  // JSON形式でAPIにポスト
  try {
    const response = UrlFetchApp.fetch( URL_REPLY_API, replyData );
    if ( debug ) {
      log( funcName, msg, "msg" );
    }
    log( funcName, "Response: " + funcName + " has fired.", "", { type : "info" } );
    log( funcName, response.getResponseCode(), "response code", { type : "info" } );
    if ( debug ) {
      log( funcName, response.getContentText(), "response text" );
    }
  } catch( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}

function quickReply( token, msg, items )
{
  const funcName = "quickReply";
  if ( debug ) {
    log( funcName, msg, { label: "msg", } );
    log( funcName, items, { label: "items", } );
  }
  let items_json = [];
  items.forEach( ( item ) => {
    let item_json = {
      "type": "action",
      "action": {
        "type": "message",
        "label": item,
        "text": item,
      }
    };
    items_json.push( item_json );
  } );
  const msgJson = {
    "replyToken": token,
    "messages": [
      {
        "type": "text",
        "text": msg,
        "quickReply": {
          "items": items_json,
        }
      },
    ],
    "notificationDisabled": true,
  };
  const replyData = optionsRequest( "post", msgJson, "application/json" );
  try {
    const response = UrlFetchApp.fetch( URL_REPLY_API, replyData );
    log( funcName, response.getResponseCode(), "response code", { type : "info" } );
    if ( debug ) {
      log( funcName, response.getContentText(), "response text" );
    }
  } catch( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}

function sendMessage( uid, msg )
{
  const funcName = "sendMessage";
  if ( debug ) {
    log( funcName, msg, { label: "msg", } );
  }
  // 受信したメッセージをそのまま送信
  const msgJson = {
    'to' : uid,
    "messages": [ { "type": "text", "text": msg }, ],
  };
  // 送信のための諸準備
  const replyData = optionsRequest( "post", msgJson, "application/json" );
  try {
    const response = UrlFetchApp.fetch( URL_LINE_BOT_API + "message/push", replyData );
    log( funcName, response.getResponseCode(), "response code", { type : "info" } );
    if ( debug ) {
      log( funcName, response.getContentText(), "response text" );
    }
  } catch( e ) {
    throw buildLogLabel( funcName, "error" ) + e;
  }
}

function isReserved( message )
{
  if (
    message == "キッチン" || message == "申告" || message == "エイリアス" ||
    message == "トイレ掃除" || message == "お風呂掃除" || message == "洗濯物" ||
    message == "はい" || message == "blank" || message == "中止"
  ) {
    return true;
  }
  return false;
}
