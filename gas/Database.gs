// ============================================================
// Database.gs — Sheets CRUD ユーティリティ
// ============================================================
// シート名→カラム定義は各 .gs ファイルで定義する
// ここでは汎用 CRUD ヘルパーのみ提供

/**
 * シートの全行をオブジェクト配列として返す
 * @param {Sheet} sheet
 * @returns {Object[]}
 */
function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

/**
 * 行オブジェクトをシートに追加する
 * @param {Sheet} sheet
 * @param {Object} obj
 * @param {string[]} headers - シートのヘッダー順
 */
function appendRow(sheet, obj, headers) {
  const row = headers.map(h => (obj[h] !== undefined ? obj[h] : ''));
  sheet.appendRow(row);
}

/**
 * IDが一致する行を更新する
 * @param {Sheet} sheet
 * @param {string} id
 * @param {Object} updates
 * @param {string[]} headers
 * @returns {boolean} 更新成功かどうか
 */
function updateRowById(sheet, id, updates, headers) {
  const data = sheet.getDataRange().getValues();
  const hdrs = data[0];
  const idCol = hdrs.indexOf('id');
  if (idCol < 0) return false;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      Object.keys(updates).forEach(key => {
        const col = hdrs.indexOf(key);
        if (col >= 0) {
          sheet.getRange(i + 1, col + 1).setValue(updates[key]);
        }
      });
      return true;
    }
  }
  return false;
}

/**
 * IDが一致する行を取得する
 * @param {Sheet} sheet
 * @param {string} id
 * @returns {Object|null}
 */
function findRowById(sheet, id) {
  const rows = sheetToObjects(sheet);
  return rows.find(r => String(r.id) === String(id)) || null;
}

/**
 * 条件に一致する最初の行を返す
 * @param {Sheet} sheet
 * @param {Function} predicate
 * @returns {Object|null}
 */
function findRow(sheet, predicate) {
  const rows = sheetToObjects(sheet);
  return rows.find(predicate) || null;
}

/**
 * IDが一致する行を削除する（論理削除: deletedAt に日時を設定）
 */
function softDeleteById(sheet, id) {
  return updateRowById(sheet, id, { deletedAt: nowIso() }, []);
}

/**
 * シートを名前で取得する（存在しなければ作成）
 * @param {Spreadsheet} ss
 * @param {string} name
 * @param {string[]} [headers] - 新規作成時のヘッダー行
 * @returns {Sheet}
 */
function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
  }
  return sheet;
}
