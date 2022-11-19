const template = () => {
  return { rows: {}, cols: {}, ranges: {}, values: {}, numbers: {}, };
}

class SheetInfo {
  constructor( sheetName ) {
    this._sheetName = sheetName;
    this._sheet = thisSs.getSheetByName( this._sheetName );
    this._className = "SheetInfo";
    this.input = template();
  }

  get sheet() {
    return this._sheet;
  }

  get className() {
    return this._className;
  }

  getLastInputCol() {
    this.input.cols.last = this._sheet.getLastColumn();
    return this.input.cols.last;
  }

  getLastInputRow() {
    this.input.rows.last = this._sheet.getLastRow();
    return this.input.rows.last;
  }
}

class ListSheet extends SheetInfo {
  constructor( sheetName ) {
    super( sheetName );
    this._className = "ListSheet";
    this.category = template();
    this.user = template();
    this.input.cols.label = 1;
    this.input.cols.first = 2;
    this.input.rows.first = 1;
    this.category.rows.firstInput = 1;
    this.user.cols.labelInput = 1;
    this.user.cols.firstInput = 2;
    this.user.rows.firstInput = 7;
  }

  getCategoryCols() {
    this.category.cols.labelInput = this.input.cols.label;
    this.category.cols.firstInput = this.input.cols.first;
    this.category.cols.lastInput = this.getLastInputCol();
    return this.category.cols;
  }

  getUserCols() {
    this.user.cols.labelInput = this.input.cols.label;
    this.user.cols.firstInput = this.input.cols.first;
    return this.user.cols;
  }

  getCategoryRows() {
    const lastRow = this.getLastInputRow();
    const nowRow = this._sheet
      .getRange( this.category.rows.firstInput, this.category.cols.labelInput )
      .getNextDataCell( SpreadsheetApp.Direction.DOWN )
      .getRow();
    if ( nowRow < 2 || nowRow == this.user.rows.firstInput || nowRow == lastRow ) {
      this.category.rows.nowInput = 0;
    } else {
      this.category.rows.nowInput = nowRow;
    }
    return this.category.rows;
  }

  getUserRows() {
    this.user.rows.id = this.user.rows.firstInput;
    this.user.rows.name = this.user.rows.id + 1;
    this.user.rows.lastInput = this.user.rows.name;
    this.user.rows.num = this.user.rows.lastInput - this.user.rows.firstInput + 1;
    return this.user.rows;
  }

  getGenreNum() {
    const nowRow = this.getCategoryRows().nowInput;
    this.category.numbers.category = nowRow;
    return this.category.numbers.category;
  }

  getUserNum() {
    this.user.cols.nowInput = getLastColByRow( this._sheet, this.user.rows.firstInput );
    this.user.numbers.raw = this.user.cols.nowInput - this.user.cols.labelInput;
    return this.user.numbers.raw;
  }

  getRawCategoriesRange() {
    const cols = this.getCategoryCols();
    const number = this.getGenreNum();
    this.category.ranges.raw = this._sheet.getRange(
      this.category.rows.firstInput,
      cols.firstInput,
      number,
      cols.lastInput
    );
    return this.category.ranges.raw;
  }

  getRawCategoryValues() {
    const range = this.getRawCategoriesRange();
    this.category.values.raw = range.getValues();
    return this.category.values.raw;
  }

  getRawUsersRange() {
    const funcName = `${ this.className }.getRawUsersRange`;
    const rows = this.getUserRows();
    const num = this.getUserNum();
    if ( rows.firstInput < 1 || this.user.cols.firstInput < 1 || rows.num < 1 || num < 1 ) {
      console.error( `[ERROR: ${ funcName }] rows.firstInput: ${ rows.firstInput }` );
      console.error( `[ERROR: ${ funcName }] this.user.cols.firstInput: ${ this.user.cols.firstInput }` );
      console.error( `[ERROR: ${ funcName }] rows.num: ${ rows.num }` );
      console.error( `[ERROR: ${ funcName }] num: ${ num }` );
      throw `[ERROR: ${ funcName }] Rows, cols or numbers is invalid.`;
    }
    this.user.ranges.raw = this._sheet.getRange(
      rows.firstInput,
      this.user.cols.firstInput,
      rows.num,
      num
    );
    return this.user.ranges.raw;
  }

  getRawUserValues() {
    const funcName = `${ this.className }.getRawUserValues`;
    const range = this.getRawUsersRange();
    if ( !range ) {
      throw `[ERROR: ${ funcName }] range is not valid.`;
    }
    const values = range.getValues();
    if ( values.length > 0 ) {
      this.user.values.uid = values[ 0 ];
      this.user.values.name = values[ 1 ];
    } else {
      this.user.values.uid = [];
      this.user.values.name = [];
    }
    this.user.values.raw = transpose( values );
    return this.user.values.raw;
  }

  getUserUidValues() {
    this.getRawUserValues();
    return this.user.values.uid;
  }

  getUserNameValues() {
    this.getRawUserValues();
    return this.user.values.name;
  }
}

class BotSheet extends SheetInfo {
  constructor( sheetName ) {
    super( sheetName );
    this._className = "BotSheet";
    this._inputStage = "";
    this._requestType = "";
    this._currentUser = { uid: "", name: "", index: 0, cols: {}, hello: "", };
    this._targetSheet = {};
    this.input.indexes = {};
    this.input.cols.first = 2;
    this.input.rows.label = 1;
    this.input.rows.first = 2;
    this.flag = template();
    this.declaration = template();
    this.alias = template();
    this.flag.cols.labelInput = 1;
    this.flag.cols.firstInput = 2;
    this.flag.rows.firstInput = 2;
    this.flag.rows.flagInput = 2;
    this.flag.rows.lastInput = 2;
    this.declaration.rows.labelInput = 1;
    this.declaration.rows.firstInput = 2;
    this.declaration.rows.dateInput = 2;
    this.declaration.rows.categoryInput = 3;
    this.declaration.rows.taxInput = 4;
    this.declaration.rows.priceInput = 5;
    this.declaration.rows.detailInput = 6;
    this.declaration.rows.lastInput = 6;
    this.alias.rows.labelInput = 1;
    this.alias.rows.firstInput = 2;
    this.alias.rows.keyInput = 2;
    this.alias.rows.categoryInput = 3;
    this.alias.rows.taxInput = 4;
    this.alias.rows.priceInput = 5;
    this.alias.rows.detailInput = 6;
    this.alias.rows.lastInput = 6;
  }

  set setRequestType ( flagValue ) {
    const funcName = `${ this.className }.setRequestType`
    if ( flagValue == '' ) {
      this._requestType = 'start';
      this._inputStage = '';
    } else if ( flagValue == 'kc' ) {
      this._requestType = 'kc_input';
      this._inputStage = 'all';
      this.input.cols.now= this._currentUser.cols.declaration;
      this.isDeclarationOrAlias = true;
      this.isDeclaration = true;
      this.isAlias = false;
    } else if ( flagValue == 'ld' ) {
      this._requestType = 'ld_input';
      this._inputStage = 'all';
      this.input.cols.now= this._currentUser.cols.declaration;
      this.isDeclarationOrAlias = true;
      this.isDeclaration = true;
      this.isAlias = false;
    } else if ( flagValue == 'tl' ) {
      this._requestType = 'tl_input';
      this._inputStage = 'all';
      this.input.cols.now= this._currentUser.cols.declaration;
      this.isDeclarationOrAlias = true;
      this.isDeclaration = true;
      this.isAlias = false;
    } else if ( flagValue == 'bt' ) {
      this._requestType = 'bt_input';
      this._inputStage = 'all';
      this.input.cols.now= this._currentUser.cols.declaration;
      this.isDeclarationOrAlias = true;
      this.isDeclaration = true;
      this.isAlias = false;
    } else {
      if( flagValue == 'on' ) {
        this._requestType = 'dc_input';
        this.input.cols.now= this._currentUser.cols.declaration;
        this.isDeclarationOrAlias = true;
        this.isDeclaration = true;
        this.isAlias = false;
      } else if( flagValue == 'al' ) {
        this._requestType = 'al_input';
        this.input.cols.now= this._currentUser.cols.alias;
        this.isDeclarationOrAlias = true;
        this.isDeclaration = false;
        this.isAlias = true;
      } else {
        this.isDeclarationOrAlias = false;
        this.isDeclaration = false;
        this.isAlias = false;
        return;
      }
      const nowRow = this.getNowInputRow();
      if ( debug ) {
        log( funcName, nowRow, "nowRow" );
      }
      if ( nowRow == 2 ) {
        this._inputStage = 'category';
      } else if ( nowRow == 3 ) {
        this._inputStage = 'tax';
      } else if ( nowRow == 4 ) {
        this._inputStage = 'price';
      } else if ( nowRow == 5 ) {
        this._inputStage = 'detail';
      } else if ( nowRow == 6 ) {
        if ( this._requestType == 'dc_input' ) {
          this._requestType = 'conf_dc';
          this._inputStage = 'conf_dc';
        } else if ( this._requestType == 'al_input' ) {
          this._requestType = 'conf_al';
          this._inputStage = 'conf_al';
        }
      } else {
        if ( this._requestType == "dc_input" ) {
          this._inputStage = "date";
        } else if ( this._requestType == "al_input" ) {
          this._inputStage = "key";
        }
      }
    }
    if ( debug ) {
      log( funcName, this._requestType, "this._requestType" );
      log( funcName, this._inputStage, "this._inputStage" );
      log( funcName, this.input.cols.now, "this.input.cols.now" );
    }
  }

  set setCurrentUser( uid ) {
    const funcName = `${ this.className }.setCurrentUser`;
    const users = listSh.getRawUserValues();
    const ids = listSh.user.values.uid;
    if ( debug ) {
      log( funcName, ids, "ids" );
    }
    this._currentUser.index = ids.indexOf( uid );
    if ( this._currentUser.index < 0 ) {
      log( funcName, "Request from invalid user.", "", { type: "warn" } );
      log( funcName, uid, "uid", { type: "warn" } );
      this._currentUser = false;
    }
    const cols = this.getAliasCols();
    this._currentUser.cols.flag = this.flag.cols.firstInput + this._currentUser.index;
    this._currentUser.cols.declaration = this.declaration.cols.firstInput + this._currentUser.index;
    this._currentUser.cols.alias = cols.firstInput + this._currentUser.index;
    this._currentUser.name = users[ this._currentUser.index ][ 1 ];
    this._currentUser.hello = `${ this._currentUser.name }さん、こんにちは。`;
    if ( debug ) {
      log( funcName, this._currentUser, "this._currentUser" );
    }
  }

  set setInputMonthSheet( values ) {
    this._targetSheet.month = values.date > dateNow ? monthNow - 1 : monthNow;
    this._targetSheet.sheetName = monthSheetName( this._targetSheet.month );
  }

  get inputStage() {
    return this._inputStage;
  }

  get requestType() {
    return this._requestType;
  }

  get currentUser() {
    return this._currentUser;
  }

  get targetSheet() {
    return this._targetSheet;
  }

  getInputCols() {
    this.input.cols.numOnePart = listSh.getUserNum() + 1;
    return this.input.cols;
  }

  getFlagCols() {
    const cols = this.getInputCols();
    this.flag.cols.lastInput = cols.numOnePart;
    return this.flag.cols;
  }

  getDeclarationCols() {
    const cols = this.getInputCols();
    this.declaration.cols.firstInput = this.flag.cols.firstInput + cols.numOnePart + 1;
    this.declaration.cols.labelInput = this.flag.cols.labelInput + cols.numOnePart + 1;
    this.declaration.cols.lastInput = this.declaration.cols.firstInput + cols.numOnePart - 1;
    return this.declaration.cols;
  }

  getAliasCols() {
    const cols = this.getDeclarationCols();
    this.alias.cols.firstInput = cols.firstInput + this.input.cols.numOnePart + 1;
    this.alias.cols.labelInput = cols.labelInput + this.input.cols.numOnePart + 1;
    this.alias.cols.lastInput = this.alias.cols.firstInput + this.input.cols.numOnePart - 1;
    return this.alias.cols;
  }

  getFlagRows() {
    this.flag.rows.num = this.flag.rows.lastInput - this.flag.rows.labelInput + 1;
    return this.flag.rows;
  }

  getDeclarationRows() {
    this.declaration.rows.num = this.declaration.rows.lastInput - this.declaration.rows.labelInput;
    return this.declaration.rows;
  }

  getAliasRows() {
    this.alias.rows.num = this.alias.rows.lastInput - this.alias.rows.labelInput;
    const nowInputRow = this.sheet
      .getRange( this.alias.rows.labelInput, this._currentUser.cols.alias )
      .getNextDataCell( SpreadsheetApp.Direction.DOWN )
      .getRow();
    if ( nowInputRow > this.alias.rows.labelInput && nowInputRow <= this.alias.rows.lastInput ) {
      this.alias.rows.nowInput = nowInputRow;
    } else {
      this.alias.rows.nowInput = this.alias.rows.labelInput;
    }
    return this.alias.rows;
  }

  getInputRowsNum() {
    const funcName = `${ this.className }.getInputRowsNum`;
    if ( this.isDeclaration ) {
      this.input.rows.num = this.getDeclarationRows().num;
    } else if ( this.isAlias ) {
      this.input.rows.num = this.getAliasRows().num;
    } else {
      throw `[ERROR: ${ funcName }] The argument value is invalid.`;
    }
    return this.input.rows.num;
  }

  getNowInputRow() {
    const funcName = `${ this.className }.getNowInputRow`;
    const lastRow = this.getLastInputRow();
    const nowInputRow = this.sheet
      .getRange( this.input.rows.label, this.input.cols.now )
      .getNextDataCell( SpreadsheetApp.Direction.DOWN )
      .getRow();
    if ( debug ) {
      log( funcName, nowInputRow, "nowInputRow" );
    }
    this.input.rows.now= nowInputRow && nowInputRow > this.input.rows.label && lastRow >= nowInputRow
      ? nowInputRow
      : this.input.rows.label;
    this.input.rows.next = this.input.rows.now + 1;
    return this.input.rows.now;
  }

  getFlagCell() {
    this.flag.ranges.valueCell = this.sheet.getRange(
      this.flag.rows.firstInput,
      this._currentUser.cols.flag
    );
    return this.flag.ranges.valueCell;
  }

  getFlagValue() {
    const cell = this.getFlagCell();
    this.flag.values.raw = cell.getValue();
    return this.flag.values.raw;
  }

  getInputRawRange() {
    const num = this.getInputRowsNum();
    this.input.ranges.raw = this.sheet.getRange(
      this.input.rows.first,
      this.input.cols.now,
      num,
      1
    );
    return this.input.ranges.raw;
  }

  getRawDeclarationInputsRange() {
    const rows = this.getDeclarationRows();
    this.declaration.ranges.raw = this.sheet.getRange(
      rows.firstInput,
      this._currentUser.cols.declaration,
      rows.num,
      1
    );
    return this.declaration.ranges.raw;
  }

  gerRawAliasInputsRange() {
    const rows = this.getAliasRows();
    this.alias.ranges.raw = this.sheet.getRange(
      rows.firstInput,
      this._currentUser.cols.alias,
      rows.num,
      1
    );
    return this.alias.ranges.raw;
  }

  getInputRawValues() {
    const range = this.getInputRawRange();
    this.input.values.raw = range.getValues();
    if ( this.isDeclaration ) {
      this.input.values.date = this.input.values.raw[ 0 ][ 0 ]; // 日付
    } else if ( this.isAlias ) {
      this.input.values.key = this.input.values.raw[ 0 ][ 0 ] // エイリアスキー
    }
    this.input.values.category = this.input.values.raw[ 1 ][ 0 ] // ジャンル
    this.input.values.tax = this.input.values.raw[ 2 ][ 0 ]; // 税
    this.input.values.price = this.input.values.raw[ 3 ][ 0 ]; // 金額
    this.input.values.detail = this.input.values.raw[ 4 ][ 0 ]; // 備考
    return this.input.values;
  }

  getInputRange() {
    this.input.ranges.all = this.sheet.getRange(
      this.input.rows.first,
      this.declaration.cols.labelInput,
      this.declaration.rows.num,
      this.input.cols.numOnePart
    );
    return this.input.ranges.all;
  }

  getInputValues() {
    const range = this.getInputRange();
    this.input.values.all = range.getValues();
    return this.input.values.all;
  }

  addDeclarationContent( message ) {
    let meta;
    if ( this._inputStage == "date" ) {
      message = validateDate( message );
      if ( !message ) {
        meta = replyMeta( 'invalid_date' );
      }
    } else if ( this._inputStage == "category" ) {
      message = validateGenre( message );
      if ( !message ) {
        meta = replyMeta( 'invalid_category' );
      }
    } else if ( this._inputStage == "tax" ) {
      message = message != "通常" && message != "軽減" && message != "税込み" && message != "税込" ?
        false : message;
      if ( !message ) {
        meta = replyMeta( 'invalid_tax' );
      }
    } else if ( this._inputStage == "price" ) {
      message = isNaN( Number( message.replace( ",", "" ) ) ) ? false : message;
      if ( !message ) {
        meta = replyMeta( 'invalid_price' );
      }
    }
    if ( message !== false ) {
      const inputCell = this.sheet.getRange( this.input.rows.next, this._currentUser.cols.declaration );
      inputCell.setValue( message );
      this.setRequestType = this.flag.values.raw;
      meta = replyMeta( this._inputStage );
      if ( this._inputStage == 'conf_dc' ) {
        meta[ 0 ] = buildConfMsg();
      }
    }
    return meta;
  }

  addAliasContent( message ) {
    let meta;
    if ( this._inputStage == "key" ) {
      if ( isReserved( message ) ) {
        message = false;
      }
      if ( !message ) {
        for ( let i = 0; i < alVals.length; i++ ) {
          let key = alVals[ i ][ 0 ];
          console.log( key );
          if ( key == message ) {
            message = false;
            break;
          }
        }
      }
      if ( !message ) {
        meta = replyMeta( 'invalid_key' );
        meta[ 0 ] = buildAlStrMsg( meta[ 0 ] );
      } else {
        meta = replyMeta( 'category' );
      }
    } else if ( this._inputStage == "category" ) {
      message = validateGenre( message );
      meta = !message ? replyMeta( 'invalid_category' ) : replyMeta( 'tax_al' );
    } else if ( this._inputStage == "tax" ) {
      message =
        message != "通常" && message != "軽減" && message != "税込み" && message != "税込" && message != "blank" ?
        false :
        message;
      meta = !message ? replyMeta( 'invalid_tax_al' ) : replyMeta( 'price_al' );
    } else if ( this._inputStage == "price" ) {
      message = ( isNaN( Number( message.replace( ",", "" ) ) ) && message != "blank" ) ?
        false :
        message;
      meta = !message ? replyMeta( 'invalid_price_al' ) : replyMeta( 'detail' );
    } else if ( this._inputStage == "detail" ) {
      meta = replyMeta( 'conf_al' );
    }
    if ( message !== false ) {
      const inputCell = this.sheet.getRange( this.input.rows.next, this._currentUser.cols.alias );
      inputCell.setValue( message );
      if ( this._inputStage == 'detail' ) {
        meta[ 0 ] = buildAlConfMsg();
      }
    }
    return meta;
  }
}

class FormatSheet extends SheetInfo {
  constructor( sheetName ) {
    super( sheetName );
    this._className = "FormatSheet";
    this.input.rows.label = 1;
    this.input.rows.first = 2;
    this.consumption = template();
    this.consumption.cols.firstInput = 1;
    this.consumption.cols.dateInput = 1;
    this.consumption.rows.labelInput = 1;
    this.consumption.rows.firstInput = 2;
  }

  getConsumptionCols() {
    const funcName = `${ this.className }.getConsumptionCols`;
    this.consumption.cols.categoryInput = this.consumption.cols.dateInput + 1;
    this.consumption.cols.userInput = this.consumption.cols.categoryInput + 1;
    this.consumption.cols.tax10Input = this.consumption.cols.userInput + 1;
    this.consumption.cols.tax8Input = this.consumption.cols.tax10Input + 1;
    this.consumption.cols.taxIncludeInput = this.consumption.cols.tax8Input + 1;
    this.consumption.cols.priceInput = this.consumption.cols.taxIncludeInput + 1;
    this.consumption.cols.detailInput = this.consumption.cols.priceInput + 1;
    this.consumption.cols.lastInput = this.consumption.cols.detailInput;
    this.consumption.cols.firstPriceInput = this.consumption.cols.tax10Input;
    this.consumption.cols.lastPriceInput = this.consumption.cols.priceInput;
    this.consumption.cols.num = this.consumption.cols.lastInput - this.consumption.cols.firstInput + 1;
    if ( debug ) {
      console.log( `[DEBUG: ${ funcName }] this.consumption.cols ↓` );
      console.log( this.consumption.cols );
    }
    return this.consumption.cols;
  }

  getConsumptionPriceColsNum() {
    const funcName = `${ this.className }.getConsumptionPriceColsNum`;
    const cols = this.getConsumptionCols();
    this.consumption.numbers.priceCols = cols.lastPriceInput - cols.firstPriceInput + 1;
    if ( debug ) {
      console.log( `[DEBUG: ${ funcName }] this.consumption.numbers.priceCols: ${ this.consumption.numbers.priceCols }` );
    }
    return this.consumption.numbers.priceCols;
  }
}

class MonthSheet extends FormatSheet {
  constructor( sheetName ) {
    super( sheetName );
  }

  getConsumptionNowRow() {
    const funcName = `${ this.className }.getConsumptionNowRow`;
    const lastRow = this.getLastInputRow();
    const nowRow = this.sheet
      .getRange( this.consumption.rows.firstInput, this.consumption.cols.dateInput )
      .getNextDataCell( SpreadsheetApp.Direction.DOWN )
      .getRow();
    if ( debug ) {
      console.log( `[DEBUG: ${ funcName }] nowRow : ${ nowRow }` );
    }
    this.consumption.rows.nowInput = nowRow > this.consumption.rows.firstInput && nowRow < lastRow
      ? nowRow : this.consumption.rows.labelInput;
    this.consumption.rows.nextInput = this.consumption.rows.nowInput + 1;
    return this.consumption.rows.nowInput;
  }

  getRawConsumptionsNum() {
    const funcName = `${ this.className }.getRawConsumptionsNum`;
    const nowInputRow = this.getConsumptionNowRow();
    if ( debug ) {
      console.log( `[DEBUG: ${ funcName }] nowInputRow : ${ nowInputRow }` );
    }
    this.consumption.numbers.raw = nowInputRow - this.consumption.rows.labelInput;
    if ( debug ) {
      console.log( `[DEBUG: ${ funcName }] this.consumption.numbers.raw : ${ this.consumption.numbers.raw }` );
    }
    return this.consumption.numbers.raw;
  }

  getPriceRange() {
    const funcName = `${ this.className }.getPriceRange`;
    this.consumption.ranges.price = this.sheet.getRange(
      this.input.rows.first,
      this.getConsumptionCols().firstPriceInput,
      this.getRawConsumptionsNum(),
      this.getConsumptionPriceColsNum()
    );
    if ( debug ) {
      log( funcName, this.consumption.ranges.price, "this.consumption.ranges.price" );
    }
    return this.consumption.ranges.price;
  }

  getFirstInputCell() {
    const funcName = `${ this.className }.getFirstInputCell`;
    this.consumption.ranges.firstInput = this.sheet.getRange(
      this.consumption.rows.firstInput,
      this.consumption.cols.firstInput,
      1, 1
    );
    if ( debug ) {
      log( funcName, this.consumption.ranges.firstInput, "this.consumption.ranges.firstInput" );
    }
    return this.consumption.ranges.firstInput;
  }

  getFirstInputCellValue() {
    const range = this.getFirstInputCell();
    this.consumption.values.firstInput = range.getValue();
    return this.consumption.values.firstInput;
  }

  /*
  * 申告内容を申告シートへの出力
  */
  putInputs( inputs )
  {
    const funcName = `${ this.className }.putInputs`;
    if ( this.getFirstInputCellValue() == '' ) {
      this.input.rows.next = 2;
    } else {
      this.getConsumptionNowRow();
      this.input.rows.next = this.consumption.rows.nextInput;
    }
    if ( debug ) {
      log( funcName, this.input.rows.next, "this.input.rows.next" );
    }
    const targetRange = this.sheet.getRange(
      this.input.rows.next,
      this.consumption.cols.firstInput,
      1,
      this.getConsumptionCols().num
    );
    if ( debug ) {
      log( funcName, targetRange.getValues(), "targetRange.getValues" );
    }
    targetRange.setValues( inputs );
    log( funcName, "申告シート入力完了", "", { type: "info" } );
    calcTax( this.sheet ); // 税込み金額を計算し出力
    sort( this.sheet ) // 日付順に並び替え
  }
}