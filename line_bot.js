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
    log( funcName, event, "event" );
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
  } else if ( botSh.requestType == 'start' ) { // 入力なしからの最初のチャット
    meta = flagOn( msg );
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
    meta = registerAl( msg );
  } else { // その他
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
    return [ `${ botSh.currentUser.hello + strGuide }`, 'quick', quickItems[ "start" ] ];
  } else if ( type == "exit" ) {
    return [ `申告を中止しました。${ strGuide }`, 'quick', quickItems[ "start" ] ];
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
  }
  return [ `${ botSh.currentUser.hello + strGuide }`, 'quick', quickItems[ "start" ] ];
}

function registerAl( msg )
{
  let meta;
  const values = botSh.getInputRawValues();
  if ( msg == "はい" ) {
    if ( values.tax == "blank" ) values.tax = "";
    if ( values.price == "blank" ) values.price = "";
    let inputs = buildAliasInputs( values.key, values.category, values.tax, values.price, values.detail );
    inputsToAliase( inputs ); // botシートからaliasシートへ出力
    clearInputs();
    meta = replyMeta( 'comp_al' );
  } else if ( msg == 'いいえ' ) {
    meta = exitInput();
  } else {
    meta = replyMeta( 'conf_al' );
    meta[ 0 ] = buildAlConfMsg();
  }
  return meta;
}

function declare( msg )
{
  const funcName = "declare";
  let meta;
  const values = botSh.getInputRawValues();
  if ( debug ) {
    log( funcName, values.tax, "values.tax" );
  }
  if ( msg == "はい" ) {
    let inputs = [
      values.date,
      values.category,
      botSh.currentUser.name,
    ];
    if ( values.tax == "通常" ) {
      inputs[ 3 ] = values.price;
    } else {
      inputs[ 3 ] = "-";
    }
    if ( values.tax == "軽減" ) {
      inputs[ 4 ] = values.price;
    } else {
      inputs[ 4 ] = "-";
    }
    if ( values.tax == "税込" || values.tax == "税込み" ) {
      inputs[ 5 ] = values.price;
    } else {
      inputs[ 5 ] = "-";
    }
    inputs[ 6 ] = "";
    inputs[ 7 ] = values.detail;
    inputs = [ inputs ];
    if ( debug ) {
      log( funcName, inputs, "inputs" );
    }
    const monthSh = new MonthSheet( botSh.targetSheet.sheetName );
    monthSh.putInputs( inputs ); // botシートから申告シートへ出力
    clearInputs();
    meta = replyMeta( 'comp_dc' );
  } else {
    meta = replyMeta( 'conf_dc' );
    meta[ 0 ] = buildConfMsg();
  }
  return meta;
}

function flagOn( msg )
{
  const funcName = "flagOn";
  let meta;
  const flagCell = botSh.flag.ranges.valueCell;
  if ( msg == '申告' ) {
    clearInputs();
    flagCell.setValue( 'on' );
    meta = replyMeta( 'date' );
  } else if ( msg == 'キッチン' ) {
    flagCell.setValue( "kc" );
    meta = replyMeta( 'kitchen' );
  } else if ( msg == '洗濯' ) {
    flagCell.setValue( "ld" );
    meta = replyMeta( 'laundry' );
  } else if ( msg == 'トイレ掃除' ) {
    flagCell.setValue( "tl" );
    meta = replyMeta( 'toilet' );
  } else if ( msg == 'お風呂掃除' ) {
    flagCell.setValue( "bt" );
    meta = replyMeta( 'bath' );
  } else if ( msg == 'エイリアス' ) {
    flagCell.setValue( "al" );
    meta = replyMeta( 'key' );
    meta[ 0 ] = buildAlStrMsg( meta[ 0 ] );
  } else {
    const values = aliasSh.getRawAliases();
    alIndex = aliasNum( values, msg );
    if( alIndex === false ) {
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
    if ( debug ) {
      log( funcName, inputs, "inputs" );
    }
    flagCell.setValue( 'on' );
    botSh.getRawDeclarationInputsRange().setValues( inputs );
    // botSh.sheet.getRange( botSh.declaration.rows.categoryInput, botSh.currentUser.cols.declaration ).setValue( values[ alIndex ][ 1 ] );
    // botSh.sheet.getRange( botSh.declaration.rows.taxInput, botSh.currentUser.cols.declaration ).setValue( values[ alIndex ][ 2 ] );
    // botSh.sheet.getRange( botSh.declaration.rows.priceInput, botSh.currentUser.cols.declaration ).setValue( values[ alIndex ][ 3 ] );
    // botSh.sheet.getRange( botSh.declaration.rows.detailInput, botSh.currentUser.cols.declaration ).setValue( values[ alIndex ][ 4 ] );
    meta = replyMeta( 'date' );
  }
  return meta;
}

function putWork( msg, type ) {
  const funcName = "putWork";
  let meta;
  const taskVal = tasks[ type ];
  let val = taskVal ? taskVal[ msg ] : false;
  const items = quickItems[ type ];
  if ( val ) {
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
      log( funcName, inputs, "inputs" );
    }
    const sheetName = botSh.targetSheet.sheetName;
    if ( debug ) {
      log( funcName, sheetName, "sheetName" );
    }
    const monthSh = new MonthSheet( sheetName );
    monthSh.putInputs( inputs );
    clearInputs();
    meta = [ taskVal.name + "の「" + msg + "」を申告しました。", 'normal', [] ];
  } else {
    meta = [ "入力が間違っています。" + buildGuideMsg( type ), 'quick', items ];
  }
  return meta;
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
  clearRange = botSh.getFlagCell();
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
    log( funcName, menu, "menu" );
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

function inputsToAliase( inputs )
{
  let targetRow =
    aliasSh.sheet.getRange( 1, 1 )
      .getNextDataCell( SpreadsheetApp.Direction.DOWN )
      .getRow()
    + 1;
  aliasSh.sheet.getRange( targetRow, 1 ).setValue( inputs[ 'key' ] );
  aliasSh.sheet.getRange( targetRow, 2 ).setValue( inputs[ 'category' ] );
  aliasSh.sheet.getRange( targetRow, 3 ).setValue( inputs[ 'tax' ] );
  aliasSh.sheet.getRange( targetRow, 4 ).setValue( inputs[ 'val' ] );
  aliasSh.sheet.getRange( targetRow, 5 ).setValue( inputs[ 'detail' ] );
  console.log( "エイリアス登録完了" );
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
  const replyData = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    "payload": JSON.stringify(msgJson),
    "muteHttpExceptions" : true,
  };
  // JSON形式でAPIにポスト
  try {
    const response = UrlFetchApp.fetch( "https://api.line.me/v2/bot/message/reply", replyData );
    if ( debug ) {
      log( funcName, msg, "msg" );
      log( funcName, items, "items" );
    }
    log( funcName, "Response: " + funcName + " has fired.", "", { type : "info" } );
    log( funcName, response.getResponseCode(), "response code", { type : "info" } );
    if ( debug ) {
      log( funcName, response.getContentText(), "response text" );
    }
  } catch( e ) {
    log( funcName, e, "error", { type : "error" } );
  }
}

function quickReply( token, msg, items )
{
  const funcName = "quickReply";
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
  const replyData = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    "payload": JSON.stringify( msgJson ),
    "muteHttpExceptions" : true,
  };
  try {
    const response = UrlFetchApp.fetch( "https://api.line.me/v2/bot/message/reply", replyData );
    if ( debug ) {
      log( funcName, msg, "msg" );
      log( funcName, items, "items" );
    }
    log( funcName, "Response: " + funcName + " has fired.", "", { type : "info" } );
    log( funcName, response.getResponseCode(), "response code", { type : "info" } );
    if ( debug ) {
      log( funcName, response.getContentText(), "response text" );
    }
  } catch( e ) {
    log( funcName, e, "error", { type : "error" } );
  }
}

function sendMessage( uid, msg )
{
  const funcName = "sendMessage";
  // 受信したメッセージをそのまま送信
  const msgJson = {
    'to' : uid,
    "messages": [
      {
        "type": "text",
        "text": msg
      }
    ]
  };
  // 送信のための諸準備
  const replyData = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    "payload": JSON.stringify( msgJson ),
    "muteHttpExceptions" : true,
  };
  try {
    const response = UrlFetchApp.fetch( "https://api.line.me/v2/bot/message/push", replyData );
    if ( debug ) {
      log( funcName, msg, "msg" );
    }
    log( funcName, "Response: " + funcName + " has fired.", "", { type : "info" } );
    log( funcName, response.getResponseCode(), "response code", { type : "info" } );
    if ( debug ) {
      log( funcName, response.getContentText(), "response text" );
    }
  } catch( e ) {
    log( funcName, e, "error", { type : "error" } );
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