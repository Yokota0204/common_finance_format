// judge if today's year and month is same as the valuables
function isThisMonth( year, month )
{
  if ( yearNow == year && monthNow == month ) {
    return true;
  }
  return false;
}

// check if the value is number or not
function isNumber( num )
{
  return Number.isFinite( num );
}

//sort by date method
function sort( sheet = activeSh )
{
  var range = sheet.getRange( 2, 1 );
  var lastRowA = range.getNextDataCell( SpreadsheetApp.Direction.DOWN ).getRow() - 1;
  var sortRange = sheet.getRange( 2, 1, lastRowA, 8 );
  // sort by date
  sortRange.sort( [ { column: 1, ascending: true } ] );

  calcTax();
}

function calcTax( sheet = activeSh )
{
  const funcName = "calcTax";
  const sheetName = sheet.getSheetName();
  if ( debug ) {
    console.log( `[DEBUG: ${ funcName }] sheetName: ${ sheetName }` );
  }
  const monthSh = new MonthSheet( sheetName );
  const calcRange = monthSh.getPriceRange();
  let calcValues = calcRange.getValues();
  if ( debug ) {
    console.log( `[DEBUG ${ funcName }] calcValues ↓` );
    console.log( calcValues );
  }
  for( let i = 0; i < calcValues.length; i++ ) {
    var setValue = 0;
    if ( calcValues[ i ][ 0 ] != "-" && calcValues[ i ][ 0 ] != "" ) {
      setValue = Math.round( calcValues[ i ][ 0 ] * 1.1 );
    } else if ( calcValues[ i ][ 1 ] != "-" && calcValues[ i ][ 1 ] != "" ) {
      setValue = Math.round( calcValues[ i ][ 1 ] * 1.08 );
    } else if ( calcValues[ i ][ 2 ] != "-" && calcValues[ i ][ 2 ] != "" ) {
      setValue = calcValues[ i ][ 2 ];
    } else {
      setValue = "";
    }
    calcValues[ i ][ 3 ] = setValue;
  }
  if ( debug ) {
    console.log( `[DEBUG ${ funcName }] calcValues ↓` );
    console.log( calcValues );
  }
  calcRange.setValues( calcValues );
  // Tax function doesn't include Math.ceil(). So slightly the output is defferent.
}

/*
 * 指定行の「最終列の列番号」を返す
 *
 * @param {object} シートオブジェクト
 * @param {number} 行番号
 * @return {number} 最終列の列番号
 */
function getLastColByRow( sheet, row )
{
  const funcName = "getLastColByRow";
  if ( !sheet || !row ) {
    console.error( `[ERROR] ${ funcName }] sheet ↓` );
    console.error( sheet );
    console.error( `[ERROR: ${ funcName }] row: ${ row }` );
    throw `[ERROR: ${ funcName }] The sheet and row arguments must not be empty.`;
  }
  if ( debug ) {
    console.log( `[DEBUG: ${ funcName }] row : ${ row }` );
    console.log( `[DEBUG: ${ funcName }] sheet.getSheetName : ${ sheet.getSheetName() }` );
  }
  // 指定の行を二次元配列に格納する ※シート全体の最終行までとする
  let rowValues = sheet.getRange( row, 1, 1, sheet.getLastColumn() ).getValues();
  if ( debug ) {
    console.log( `[DEBUG: ${ funcName }] rowValues ↓` );
    console.log( rowValues );
  }
  //二次元配列を一次元配列に変換する
  rowValues = Array.prototype.concat.apply( [], rowValues );
  if ( debug ) {
    console.log( `[DEBUG: ${ funcName }] rowValues ↓` );
    console.log( rowValues );
  }
  let lastCol = rowValues.filter( val => val != "" ).length;
  return lastCol;
}

function transpose( array = [] )
{
  return array[ 0 ].map( ( _, col ) => array.map( row => row[ col ] ) );
}

function monthSheetName( month )
{
  const funcName = `sheetName`;
  if ( !month ) {
    throw `[ERROR: ${ funcName }] The argument must not be empty.`;
  }
  return `${ month }月度`;
}

function isObject( value )
{
  return value !== null && typeof value === 'object'
}