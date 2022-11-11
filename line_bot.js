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
  let meta;
  // リクエストイベントの取得
  const events = JSON.parse( e.postData.contents ).events;
  const event = events[ 0 ];
  console.log( event );
  const token = event.replyToken;
  const msg = event.message.text;
  const uid = event.source.userId;
  sendMsg( uid, '送信中...' );
  // リクエストしてきたユーザーの認証
  if ( !userSet( uid ) ) {
    meta = [ "無効なユーザーです。", 'normal', [] ];
  }
  // リクエストの種類を確認
  if ( !setReqType() ) {
    meta = exitInput();
  }
  // 今まで入力した項目を取得
  getInputVal();
  // 対象の月のシートを取得
  setMonSh();

  if ( msg == "中止" ) {
    meta = exitInput();
  } else if ( reqType == 'start' ) { // 入力なしからの最初のチャット
    meta = flagOn( msg );
  } else if( reqType == 'kc_input' ) { // キッチンの入力中
    meta = putWork( msg, "kitchen" );
  } else if( reqType == 'ld_input' ) { // 洗濯の入力中
    meta = putWork( msg, "laundry" );
  } else if( reqType == 'tl_input' ) { // トイレの入力中
    meta = putWork( msg, "toilet" );
  } else if( reqType == 'bt_input' ) { // お風呂の入力中
    meta = putWork( msg, "bath" );
  } else if( reqType == 'dc_input' ) { // 申告の入力中
    meta = writeDec( msg );
  } else if( reqType == 'al_input' ) { // エイリアスの入力中
    meta = writeAl( msg );
  } else if( reqType == 'conf_dc' ) { // 申告の確認への返信
    meta = declare( msg );
  } else if( reqType == 'conf_al' ) { // エイリアス登録の確認への返信
    meta = registerAl( msg );
  } else { // その他
    clearInputs();
    meta = replyMeta( 'error' );
  }
  doReply( token, meta[ 0 ], meta[ 1 ], meta[ 2 ]);
}

function userSet( uid )
{
  userIndex = uids[ 0 ].indexOf( uid );
  if ( userIndex < 0 ) {
    return false;
  }
  flgInputCol = firstUserFlagColBotSh + userIndex;
  dcInputCol = firstUserDcColBotSh + userIndex;
  alInputCol = firstUserAlColBotSh + userIndex;
  userName = userNames[ 0 ][ userIndex ];
  helloUser = `${ userName }さん、こんにちは。`
  return true;
}

function replyMeta( type )
{
  const metaData = {
    'empty' : [ '', 'normal', [] ],
    'error' : [ `${ helloUser + strGuide }`, 'quick', quickItems[ "start" ] ],
    'exit' : [ `申告を中止しました。${ strGuide }`, 'quick', quickItems[ "start" ] ],

    'date' : [ '申告する日付を入力してください。', 'quick', quickItems[ "date" ] ],
    'key' : [ "キーを送信してください。", 'normal', [] ],
    'genre' : [ addGenres( "ジャンルを教えて下さい。\n" ), 'quick', buildGenreItems() ],
    'tax' : [
      "入力する金額には税金は含みますか？\n・税込\n・軽減\n・通常",
      'quick',
      quickItems[ "tax" ],
    ],
    'price' : [ "金額を教えて下さい。", 'normal', [] ],
    'detail' : [ '備考欄に出力する文言を入力してください。', 'normal', [] ],
    'conf_dc' : [ '', 'quick', quickItems[ "conf" ] ],
    'comp_dc' : [ "申告書への記載が完了しました。", 'normal', [] ],

    'price_al' : [ "金額を教えて下さい。" + blankGuide, 'quick', [ 'blank' ] ],
    'tax_al' : [
      "入力する金額には税金は含みますか？" + blankGuide + "\n・税込\n・軽減\n・通常",
      'quick',
      quickItems[ "taxAlias" ],
    ],
    'conf_al' : [ '', 'quick', quickItems[ "conf" ] ],
    'comp_al' : [ "エイリアスへの登録が完了しました。", 'normal', [] ],

    'invalid_date' : [
      "日付を入力してください。" + stopGuide,
      'quick',
      quickItems[ "date" ],
    ],
    'invalid_genre' : [
      addGenres( "正しいジャンルを入力してください。\n" ) + stopGuide,
      'quick',
      buildGenreItems()
    ],
    'invalid_tax' : [
      "正しい値を入力して下しさい。\n・税込\n・軽減\n・通常" + stopGuide,
      'quick',
      quickItems[ "tax" ]
    ],
    'invalid_price' : [ "金額を入力してください。" + stopGuide, 'normal', [] ],
    
    'invalid_key' : [ "既に使用されているキーです。\n別のキーを入力してください。", 'normal', [] ],
    'invalid_tax_al' : [
      "正しい値を入力して下しさい。" + blankGuide +
        "\n・税込\n・軽減\n・通常\n・blank" + stopGuide,
      'quick',
      quickItems[ "taxAlias" ],
    ],
    'invalid_price_al' : [
      "金額を入力してください。" + blankGuide + stopGuide,
      'quick',
      quickItems[ "priceAlias" ],
    ],

    'kitchen' : [ helloUser + buildGuideMsg( "kitchen" ), 'quick', quickItems[ "kitchen" ] ],
    'toilet' : [ helloUser + "\n「トイレ掃除」を申告しますか？", 'quick', quickItems[ "toilet" ] ],
    'laundry' : [ helloUser + buildGuideMsg( "laundry" ), 'quick', quickItems[ "laundry" ] ],
    'bath' : [ helloUser + "\n「お風呂掃除」を申告しますか？", 'quick', quickItems[ "bath" ] ],
  }
  return metaData[ type ];
}

function registerAl( msg )
{
  let meta;
  if ( msg == "はい" ) {
    if ( inputTax == "blank" ) inputTax = "";
    if ( inputMoney == "blank" ) inputMoney = "";
    let inputs = buildAliasInputs( inputKey, inputGenre, inputTax, inputMoney, inputDetail );
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

function writeAl( msg )
{
  let meta, row;
  if ( inputStage == "key" ) {
    if ( msg == "キッチン" || msg == "申告" || msg == "エイリアス" ||
        msg == "トイレ掃除" || msg == "お風呂掃除" || msg == "洗濯物" || 
        msg == "はい" || msg == "blank" || msg == "中止" ) {
      msg = false;
    }
    if ( !msg ) {
      for ( let i = 0; i < alVals.length; i++ ) {
        let key = alVals[ i ][ 0 ];
        console.log( key );
        if ( key == msg ) {
          msg = false;
          break;
        }
      }
    }
    if ( !msg ) {
      meta = replyMeta( 'invalid_key' );
      meta[ 0 ] = buildAlStrMsg( meta[ 0 ] );
    } else {
      meta = replyMeta( 'genre' );
      row = 2;
    }
  } else if ( inputStage == "genre" ) {
    msg = validateGenre( msg );
    meta = !msg ? replyMeta( 'invalid_genre' ) : replyMeta( 'tax_al' );
    row = 3;
  } else if ( inputStage == "tax" ) {
    msg =
      msg != "通常" && msg != "軽減" && msg != "税込み" && msg != "税込" && msg != "blank" ?
      false :
      msg;
    meta = !msg ? replyMeta( 'invalid_tax_al' ) : replyMeta( 'price_al' );
    row = 4;
  } else if ( inputStage == "price" ) {
    msg = ( isNaN( Number( msg.replace( ",", "" ) ) ) && msg != "blank" ) ?
      false :
      msg;
    meta = !msg ? replyMeta( 'invalid_price_al' ) : replyMeta( 'detail' );
    row = 5;
  } else if ( inputStage == "detail" ) {
    meta = replyMeta( 'conf_al' );
    row = 6;
  }
  if ( msg !== false ) {
    const inputCell = botSh.getRange( row, alInputCol );
    inputCell.setValue( msg );
    if( inputStage == 'detail' ) {
      meta[ 0 ] = buildAlConfMsg();
    }
  }
  return meta;
}

function declare( msg )
{
  let meta;
  console.log( 'inputTax : ' + inputTax );
  if ( msg == "はい" ) {
    let taxCol;
    if ( inputTax == "通常" ) {
      taxCol = tax10ColMonSh;
    } else if ( inputTax == "軽減" ) {
      taxCol = tax8ColMonSh;
    } else if ( inputTax == "税込" || inputTax == "税込み" ) {
      taxCol = taxIncColMonSh;
    } else {
      return exitInput();
    }
    console.log( 'taxCol' + String( taxCol ) );
    const inputs = buildInputs( inputDate, inputGenre, userName, taxCol, inputMoney, inputDetail );
    inputsToMonthSh( inputs ); // botシートから申告シートへ出力
    clearInputs();
    meta = replyMeta( 'comp_dc' );
  } else {
    meta = replyMeta( 'conf_dc' );
    meta[ 0 ] = buildConfMsg();
  }
  return meta;
}

function writeDec( msg )
{
  let meta, row;
  if ( inputStage == "date" ) {
    msg = validateDate( msg );
    if ( !msg ) {
      meta = replyMeta( 'invalid_date' );
    }
    row = 2;
  } else if ( inputStage == "genre" ) {
    msg = validateGenre( msg );
    if ( !msg ) {
      meta = replyMeta( 'invalid_genre' );
    }
    row = 3;
  } else if ( inputStage == "tax" ) {
    msg = msg != "通常" && msg != "軽減" && msg != "税込み" && msg != "税込" ?
      false : msg;
    if ( !msg ) {
      meta = replyMeta( 'invalid_tax' );
    }
    row = 4;
  } else if ( inputStage == "price" ) {
    msg = isNaN( Number( msg.replace( ",", "" ) ) ) ? false : msg;
    if ( !msg ) {
      meta = replyMeta( 'invalid_price' );
    }
    row = 5;
  } else if ( inputStage == "detail" ) {
    row = 6;
  }
  if ( msg !== false ) {
    const inputCell = botSh.getRange( row, dcInputCol );
    inputCell.setValue( msg );
    setReqType();
    meta = replyMeta( inputStage );
    if( inputStage == 'conf_dc' ) {
      meta[ 0 ] = buildConfMsg();
    }
  }
  return meta;
}

function flagOn( msg )
{
  let meta;
  if ( msg == '申告' ) {
    clearInputs();
    flgCellBotSh.setValue( 'on' );
    meta = replyMeta( 'date' );
  } else if ( msg == 'キッチン' ) {
    flgCellBotSh.setValue( "kc" );
    meta = replyMeta( 'kitchen' );
  } else if ( msg == '洗濯' ) {
    flgCellBotSh.setValue( "ld" );
    meta = replyMeta( 'laundry' );
  } else if ( msg == 'トイレ掃除' ) {
    flgCellBotSh.setValue( "tl" );
    meta = replyMeta( 'toilet' );
  } else if ( msg == 'お風呂掃除' ) {
    flgCellBotSh.setValue( "bt" );
    meta = replyMeta( 'bath' );
  } else if ( msg == 'エイリアス' ) {
    flgCellBotSh.setValue( "al" );
    meta = replyMeta( 'key' );
    meta[ 0 ] = buildAlStrMsg( meta[ 0 ] );
  } else {
    alIndex = aliasNum( alVals, msg );
    if( alIndex === false ) {
      return replyMeta( 'error' );
    }
    console.log( "Alias number " + alIndex + " called." );
    flgCellBotSh.setValue( 'on' );
    botSh.getRange( genreRowBotSh, dcInputCol ).setValue( alVals[ alIndex ][ 1 ] );
    botSh.getRange( taxRowBotSh, dcInputCol ).setValue( alVals[ alIndex ][ 2 ] );
    botSh.getRange( moneyRowBotSh, dcInputCol ).setValue( alVals[ alIndex ][ 3 ] );
    botSh.getRange( detailRowBotSh, dcInputCol ).setValue( alVals[ alIndex ][ 4 ] );
    meta = replyMeta( 'date' );
  } 
  return meta;
}

function putWork( msg, type ) {
  let meta;
  const taskVal = taskVals[ type ];
  let val = taskVal ? taskVal[ msg ] : false;
  const items = quickItems[ type ];
  if ( val ) {
    inputs = buildInputs( today, taskVal.name, userName, taxIncColMonSh, val, msg );
    inputsToMonthSh( inputs );
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

function setReqType()
{
  flgCellBotSh = botSh.getRange( flgRowBotSh, flgInputCol );
  const flgVal = flgCellBotSh.getValue();
  if ( flgVal == '' ) {
    reqType = 'start';
    inputStage = '';
  } else if ( flgVal == 'kc' ) {
    reqType = 'kc_input';
    inputStage = 'all';
  } else if ( flgVal == 'ld' ) {
    reqType = 'ld_input';
    inputStage = 'all';
  } else if ( flgVal == 'tl' ) {
    reqType = 'tl_input';
    inputStage = 'all';
  } else if ( flgVal == 'bt' ) {
    reqType = 'bt_input';
    inputStage = 'all';
  } else {
    let col;
    if( flgVal == 'on' ) {
      reqType = 'dc_input';
      col = dcInputCol;
    } else if( flgVal == 'al' ) {
      reqType = 'al_input';
      col = alInputCol;
    } else {
      return false;
    }
    const row2Val = botSh.getRange( 2, col ).getValue();
    const lastRow =
      row2Val == '' ? 1 :
      botSh
        .getRange( 1, col )
        .getNextDataCell( SpreadsheetApp.Direction.DOWN )
        .getRow();
    if ( lastRow == 2 ) {
      inputStage = 'genre';
    } else if ( lastRow == 3 ) {
      inputStage = 'tax';
    } else if ( lastRow == 4 ) {
      inputStage = 'price';
    } else if ( lastRow == 5 ) {
      inputStage = 'detail';
    } else if ( lastRow == 6 ) {
      if ( reqType == 'dc_input' ) {
        reqType = 'conf_dc';
        inputStage = 'conf_dc';
      } else if ( reqType == 'al_input' ) {
        reqType = 'conf_al';
        inputStage = 'conf_al';
      }
    } else {
      inputStage = flgVal == 'on' ? 'date' : 'key';
    }
  }
  if ( reqType != null ) {
    console.log( reqType );
  }
  if( inputStage != null ) {
    console.log( inputStage );
  }
  return true;
}

function getInputVal()
{
  inputDate = botSh.getRange( dateRowBotSh, dcInputCol ).getValue(); // 日付
  inputKey = botSh.getRange( keyRowBotSh, alInputCol ).getValue(); // キー
  let inputColBotSh;
  if( reqType == 'dc_input' || reqType == 'conf_dc' ) {
    inputColBotSh = dcInputCol;
  } else if( reqType == 'al_input' || reqType == 'conf_al' ) {
    inputColBotSh = alInputCol;
  } else {
    return;
  }
  inputGenre = botSh.getRange( genreRowBotSh, inputColBotSh ).getValue(); // ジャンル
  inputTax = botSh.getRange( taxRowBotSh, inputColBotSh ).getValue(); // 税
  inputMoney = botSh.getRange( moneyRowBotSh, inputColBotSh ).getValue(); // 金額
  inputDetail = botSh.getRange( detailRowBotSh, inputColBotSh ).getValue(); // 備考
}

function setMonSh()
{
  sheetMonth = inputDate > today ? thisMonth - 1 : thisMonth;
  sheetName = sheetMonth + "月度";
}

function buildAlStrMsg( msg )
{
  msg = msg + '\n\n【登録済みのエイリアス】';
  alVals.forEach( ( key ) => {
    const val = key[ 0 ];
    msg = msg + "\n・" + val;
  } );
  return msg;
}

function buildGenreItems()
{
  let items = [];
  allGenres: for ( let i = 0; i < genres.length; i++ ) {
    oneGenre: for ( let j = 0; j < genres.length; j++ ) {
      for ( let k = 0; k < genres[j].length; k++ ) {
        if ( items.length > 11 ) {
          break allGenres;
        }
        genre = genres[ j ][ k ];
        if( !genre ) {
          continue oneGenre;
        }
        items.push( genre );
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
  clearRange = botSh.getRange( inputStrRowBotSh, flgInputCol );
  clearRange.clearContent();
  clearRange = botSh.getRange( inputStrRowBotSh, dcInputCol, dcItemsNum );
  clearRange.clearContent();
  clearRange = botSh.getRange( inputStrRowBotSh, alInputCol, alItemsNum );
  clearRange.clearContent();
}

/*
* 文字列にジャンルを追加。
*/
function addGenres( question )
{
  genres.forEach( ( values ) => {
    values.forEach( ( value ) => {
      if ( value != "" ) {
        question = question + "・" + value + "\n";
      }
    } );
  } );
  return question;
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
  const values = botSh.getRange( inputStrRowBotSh, dcLabelCol, dcItemsNum, inputWidthBotSh ).getValues();
  values.forEach( row => {
    const label = row[0];
    let input = row[ userIndex + 1 ];

    if ( label == "日付" ) {
      input = sheetMonth + "月" + input + "日";
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
  var values = botSh.getRange( keyRowBotSh, alLabelCol, alItemsNum - 1, inputWidthBotSh ).getValues();
  console.log( values );
  values.forEach( row => {
    const label = row[ 0 ]; // ラベルを取得
    let input = row[ userIndex + 1 ];
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
  for ( let i = 0; i < genres.length; i++ ) {
    if ( genres[ i ].indexOf( msg ) >= 0 ) {
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
      return today;
    } else if ( msg == "昨日" ) {
      if ( today - 1 < 1 ) {
        return prevMonthLastDay;
      }
      return today - 1;
    } else if ( msg == "一昨日" ) {
      if ( today - 2 < 0 ) {
        return prevMonthLastDay - 1;
      } else if ( today - 2 == 0 ) {
        return prevMonthLastDay;
      }
      return today - 2;
    } else if ( !isNaN( Number( msg.replace( '日', '' ) ) ) ) {
      return Number( msg.replace( '日', '' ) );
    }
    return false;
  }
  return msg;
}

function buildInputs( date, genre, user, taxCol, value, detail )
{
  return {
    'date' : date,
    'genre' : genre,
    'user' : user,
    'taxCol' : taxCol,
    'value' : value,
    'detail' : detail
  };
}

function buildAliasInputs( key, genre, tax, val, detail )
{
  return {
    'key' : key,
    'genre' : genre,
    'tax' : tax,
    'val' : val,
    'detail' : detail,
  };
}

/*
* 申告内容を申告シートへの出力
*/
function inputsToMonthSh( inputs )
{
  let targetRow;
  const targetSheet = thisYearBook.getSheetByName( sheetName );
  const row2Val = targetSheet.getRange( 2, dateColMonSh ).getValue();
  if ( row2Val == '' ) {
    targetRow = 2;
  } else {
    targetRow =
      targetSheet
        .getRange( 1, 1 )
        .getNextDataCell( SpreadsheetApp.Direction.DOWN )
        .getRow()
      + 1;
  }
  targetSheet
    .getRange( targetRow, dateColMonSh )
    .setValue( inputs[ 'date' ] );
  targetSheet
    .getRange( targetRow, genreColMonSh )
    .setValue( inputs[ 'genre' ] );
  targetSheet
    .getRange( targetRow, userColMonSh )
    .setValue( inputs[ 'user' ] );
  targetSheet
    .getRange( targetRow, inputs[ 'taxCol' ] )
    .setValue( inputs[ 'value' ] );
  targetSheet
    .getRange( targetRow, detailColMonSh )
    .setValue( inputs[ 'detail' ] );
  console.log( "申告シート入力完了" );
  calcTax( targetSheet ); // 税込み金額を計算し出力
  sort( targetSheet ) // 日付順に並び替え
}

function inputsToAliase( inputs )
{
  let targetRow =
    aliasSh.getRange( 1, 1 )
      .getNextDataCell( SpreadsheetApp.Direction.DOWN )
      .getRow()
    + 1;
  aliasSh.getRange( targetRow, 1 ).setValue( inputs[ 'key' ] );
  aliasSh.getRange( targetRow, 2 ).setValue( inputs[ 'genre' ] );
  aliasSh.getRange( targetRow, 3 ).setValue( inputs[ 'tax' ] );
  aliasSh.getRange( targetRow, 4 ).setValue( inputs[ 'val' ] );
  aliasSh.getRange( targetRow, 5 ).setValue( inputs[ 'detail' ] );
  console.log( "エイリアス登録完了" );
}

/*
* 返信の処理
*/
function reply( token, msg )
{
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
  UrlFetchApp.fetch( "https://api.line.me/v2/bot/message/reply", replyData );
}

function quickReply( token, msg, items )
{
  let items_json = [];

  items.forEach( function( item )
  {
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
    UrlFetchApp.fetch( "https://api.line.me/v2/bot/message/reply", replyData );
    console.log( "Response: QuickReply has fired." );
  } catch( e ) {
    console.log( "QuickReply error: " + e );
  }
}

function sendMsg( uid, msg )
{
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
    UrlFetchApp.fetch( "https://api.line.me/v2/bot/message/push", replyData );
    console.log( "SendMsg function has fired." );
  } catch( e ) {
    console.log( "SendMsg function error: " + e );
  }
}