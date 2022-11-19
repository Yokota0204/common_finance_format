/*
* 月初めの自動処理
*/

// シート自動作成
function autoMakeSheet()
{
  if ( monthNow > 1 ) {
    // 今月分のシートを作成。
    let newSheet = formatSh.sheet.copyTo( thisSs );
    const shName = debug ? "99" + "月度" : monthNow + "月度";
    try {
      newSheet.setName( shName ).activate();
      let position = formatSh.sheet.getIndex() + 1;
      thisSs.moveActiveSheet( position ); // 2番目の位置にシートを移動。
      console.log( "新シート作成完了" );

      // 今月分の項目ごとのまとめをコピー
      autoCopy();
    } catch(e) {
      Logger.log(`[autoMakeSheet:Error]${e}`);
    }
  }
}

function autoCopy()
{
  if ( monthNow > 1 ) {
    const lastRow = summarySh.getLastRow();
    const categoryLength = ( lastRow / 17 ) - 1; // コピーするジャンル数
    var copyRow, copyRange, pasteRange;
    for ( let i = 0; i < categoryLength; i++ ) {
      copyRow = monthNow + 17 * i; // コピー行
      pasteRow = copyRow + 1; // ペースト行
      copyRange = debug ? summarySh.getRange(copyRow, 3) : summarySh.getRange(copyRow, 3, 1, 34);
      pasteRange = debug ? summarySh.getRange(pasteRow, 3) : summarySh.getRange(pasteRow, 3, 1, 34);
      copyRange.copyTo( pasteRange );
    }
    console.log( "サマリーシートへ新しい月の関数コピー完了" );
  }
}

/*
* LINE Notify
*/
function line_notify( message )
{
  url = "https://notify-api.line.me/api/notify";

  data = {
    "message": message
  };

  options = {
    "method": "post",
    "contentType": "application/x-www-form-urlencoded",
    "muteHttpExceptions": true,
    "headers": {
      "Authorization": "Bearer " + notify_token
    },
    "payload": data
  };

  try {
    const res = UrlFetchApp.fetch(url, options);
    Logger.log( res );
  } catch(e) {
    Logger.log('Error:' + e);
  }
}

function remind_deadline()
{
  console.log("remind_deadline() has been called.");
  const message = u_nl + "おはようございます。"
    + u_nl + "本日は" + sheetNameLastMonth  + "の申告締切日です。"
    + u_nl + "申告漏れのないようご注意ください。";
  line_notify( message );
}

function remind_collect()
{
  console.log("remind_collect() has been called.");
  const message = u_nl + "おはようございます。"
    + u_nl + "本日は経費徴収日です。"
    + u_nl + "金額を話し合い経費の徴収を行ってください。"
    + u_nl + "また謝金の支払いも同時に行ってください。";
  line_notify(message);
}

function notify_result()
{
  console.log( "notify_result() has been called." );

  let sum = half_sum = 0;
  let reward_kentaro = reward_yohei = 0;
  let pay_kentaro = pay_yohei = 0;
  let value;
  let message = u_nl + "おはようございます。"
    + u_nl + sheetNameLastMonth  + "の申告内容が確定されました。" + u_nl + u_nl;
  // 報酬額の集計
  const sheet = thisSs.getSheetByName(sheetNameLastMonth );
  value = sheet.getRange("K33").getValue();
  value = Math.floor(value).toLocaleString();
  message = message + "出費額の合計は" + value + "円でした。" + u_nl + u_nl;
  message = message + "報酬額は、" + u_nl;
  reward_kentaro = sheet.getRange("L36").getValue();
  reward_kentaro = Math.ceil(reward_kentaro);
  const reward_kentaro_str = reward_kentaro.toLocaleString();
  sum = sum + reward_kentaro;
  message = message + "健太郎：" + reward_kentaro_str + "円" + u_nl;
  reward_yohei = sheet.getRange("L37").getValue();
  reward_yohei = Math.ceil(reward_yohei);
  const reward_yohei_str = reward_yohei.toLocaleString();
  sum = sum + reward_yohei;
  message = message + "陽平：" + reward_yohei_str + "円" + u_nl + u_nl;
  sum = orgCeil(sum, 10000);
  const sum_str = sum.toLocaleString();
  half_sum = sum / 2;
  const half_sum_str = half_sum.toLocaleString();
  message = message + "徴収額の合計は" + sum_str + "円です。" + u_nl;
  message = message + "一人あたりの徴収額は" + half_sum_str + "円です。" + u_nl + u_nl;
  pay_kentaro = Math.floor( half_sum - reward_kentaro );
  const pay_kentaro_str = pay_kentaro.toLocaleString();
  pay_yohei = Math.floor( half_sum - reward_yohei );
  const pay_yohei_str = pay_yohei.toLocaleString();
  message = message + "支払額は、" + u_nl;
  message = message + "健太郎： " + half_sum_str + " - " + reward_kentaro_str + " = " + pay_kentaro_str + "円" + u_nl;
  message = message + "陽平： " + half_sum_str + " - " + reward_yohei_str + " = " + pay_yohei_str + "円" + u_nl + u_nl + u_nl;
  message = message + "◯ まとめ" + u_nl;
  const fixedPayment = [
    {
      name: '野菜カット代',
      label: 'cutVeg',
      fee: 3000,
      owe: 'yohei',
    },
    {
      name: '借金返済',
      label: 'dept',
      fee: 10000,
      owe: 'yohei',
    },
    {
      name: 'YouTube利用料',
      label: 'youtube',
      fee: 200,
      owe: 'kentaro',
    },
  ];
  let calc_str_label;
  let calc_str_fee = operator = payment_fee_str = "";
  if (reward_kentaro > reward_yohei) {
    const reward = Math.floor(pay_kentaro * -1);
    const reward_str = reward.toLocaleString();
    let sum_reward = reward;
    calc_str_label = '陽平の支払額';
    fixedPayment.forEach((payment) => {
      payment_fee_str = payment.fee.toLocaleString();
      if (payment.owe == 'yohei') {
        sum_reward += payment.fee;
        operator = " + ";
      } else if (payment.owe == 'kentaro') {
        sum_reward -= payment.fee;
        operator = " - ";
      }
      calc_str_fee += operator + payment_fee_str + "円";
      calc_str_label += operator + payment.name;
    });
    const sum_reward_str = sum_reward.toLocaleString();
    message = message + "・陽平→健太郎： " + u_nl
      + calc_str_label + u_nl
      + " = " + reward_str + "円" + calc_str_fee + u_nl
      + " = " + sum_reward_str + "円" + u_nl + u_nl;
    const tax = Math.floor(pay_yohei - reward);
    const tax_str = tax.toLocaleString();
    message = message + "・陽平→共通： " + u_nl
      + pay_yohei_str + " - " + reward_str + " = " + tax_str + "円" + u_nl + u_nl;
  } else if (reward_yohei > reward_kentaro) {
    const reward = Math.floor( pay_yohei * -1 );
    const reward_str = reward.toLocaleString();
    let sum_reward = reward;
    calc_str_label = '健太郎の支払額';
    fixedPayment.forEach((payment) => {
      payment_fee_str = payment.fee.toLocaleString();
      if (payment.owe == 'kentaro') {
        sum_reward += payment.fee;
        operator = " + ";
      } else if (payment.owe == 'yohei') {
        sum_reward -= payment.fee;
        operator = " - ";
      }
      calc_str_fee += operator + payment_fee_str + "円";
      calc_str_label += operator + payment.name;
    });
    const sum_reward_str = sum_reward.toLocaleString();
    message = message + "・健太郎→陽平： " + u_nl
      + calc_str_label + u_nl
      + " = " + reward_str + "円" + calc_str_fee + u_nl
      + " = " + sum_reward_str + "円" + u_nl + u_nl;
    const tax = Math.floor( pay_kentaro - reward );
    const tax_str = tax.toLocaleString();
    message = message + "・健太郎→共通： " + pay_kentaro_str + " - " + reward_str + " = " + tax_str + "円" + u_nl + u_nl;
  } else {
    message = message + "資金移動なし" + u_nl + u_nl;
  }
  message = message + "今月15日に上記支払いを行ってください。" + u_nl;
  line_notify( message );
}

function orgCeil( value, base )
{
  return Math.ceil( value / base ) * base;
}