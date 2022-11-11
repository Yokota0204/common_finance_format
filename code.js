// judge if today's year and month is same as the valuables
function isThisMonth( year, month )
{
  if( thisYear == year && thisMonth == month ) // thisYear and thisMonth from line 3 and 4
  {
    return true;
  }
  else
  {
    return false;
  }
}

// check if the value is number or not
function isNumber( num )
{
  return Number.isFinite(num);
}

// get the last day of the month of the year and month valuables
function getLastDay( year, month )
{
  //Logger.log(new Date(2020, 3, 0).getDate());
  return new Date( year, month, 0 ).getDate();
}

// calculation of consumed money a day
function AverageConsume( year, month, sum )
{
  return sum/getLastDay( year, month ); //getLastDay(year, month) from line 33
}

// calculation of remained money a day
function getRemainedMoney( year, month, income, outgo )
{
  if( isThisMonth( year, month ) )
  {
    return ( income-10000-outgo ) / ( getLastDay( year, month ) - today + 1 ); //getLastDay(year, month) from line 33
  }
  else
  {
    return ( income - 10000 - outgo ) / ( getLastDay( year, month ) + 1 ); //getLastDay(year, month) from line 33
  }
}

// calculation of how many months to finish payment
function whenFinishPay( theDay )
{
  var year = theDay.getFullYear();
  var month = theDay.getMonth() + 1;
  var whenFinish = ( 12 * ( year - thisYear ) + month ) - thisMonth; // thisYear and thisMonth from line 3 and 4

  if( theDay > now )
  { // now from line 2
    return whenFinish;
  }
  else
  {
    return "Paid";
  }
}

// calculation of when is the last day of payment
function getLastPayment( year, month, date, count )
{
  var payDay = new Date( year, month - 1, date );
  payDay.setMonth( payDay.getMonth() - 1 + count );
  return payDay;
}

//sort by date method
function sort( sheet = sh )
{
  var range = sheet.getRange( 2, 1 );
  var lastRowA = range.getNextDataCell( SpreadsheetApp.Direction.DOWN ).getRow() - 1;
  var sortRange = sheet.getRange( 2, 1, lastRowA, 8 );
  
  // sort by date
  sortRange.sort( [ { column: 1, ascending: true } ] );

  calcTax();
}

//check （仮） or not
function checkKari( target )
{
  var listRange = listSh.getRange( 'B:B' );
  var listValues = listRange.getValues();
  var listValuesNotEmpty = listValues.filter( String );
  var listValuesFlat = listValuesNotEmpty.flat();
  
  if( target == "" )
  {
    return "";
  }
  else if ( listValuesFlat.indexOf(target) < 0 )
  {
    return false;
  }
  else
  {
    return true;
  }
}

// clear checkkari that returns false
function clearFalse()
{
  console.log( "clearFalse() has been called." );
  var lastRowRange = sh.getRange( 2, 1 );
  var lastRow = lastRowRange.getNextDataCell( SpreadsheetApp.Direction.DOWN ).getRow();
  var checkRange = sh.getRange( 2, 8, lastRow - 1, 1 );
  var valuesCheckRange = checkRange.getValues();
  for( var i = 0; i < valuesCheckRange.length; i++ )
  {
    var value = valuesCheckRange[i][0];
    console.log( 'Row ' + String( i + 2 ) + " is " + value );
    if( value == 0 )
    {
      var cell = sh.getRange( i + 2, 8 );
      cell.clearContent();
      console.log( 'Cleared row ' + String(i) + "!" );
    }
  }
}

function calcTax( sheet = sh )
{
  var lastRowRange = sheet.getRange( strRow, colDate );
  var lastRow = lastRowRange.getNextDataCell( SpreadsheetApp.Direction.DOWN ).getRow();
  var calcRange = sheet.getRange( strRow, strPriceCol, lastRow - 1, cntPriceRow );
  var calcValues = calcRange.getValues();

  for( i = 0; i < calcValues.length; i++ )
  {
    var setValue = 0;

    if( calcValues[i][0] != "-" && calcValues[i][0] != "" )
    {
      setValue = Math.round( calcValues[i][0]*1.1 );
    }
    else if( calcValues[i][1] != "-" && calcValues[i][1] != "" )
    {
      setValue = Math.round( calcValues[i][1]*1.08 );
    }
    else if( calcValues[i][2] != "-" && calcValues[i][2] != "" )
    {
      setValue = calcValues[i][2];
    }
    else
    {
      setValue = "";
    }

    sheet.getRange( i + 2, setValueCol ).setValue( setValue );
  }
  // Tax function doesn't include Math.ceil(). So slightly the output is defferent.
}

// ビジーwaitを使う方法
function sleep(waitMsec) {
  var startMsec = new Date();
 
  // 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
  while (new Date() - startMsec < waitMsec);
}