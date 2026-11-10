/**
 * ============================================================================
 * GOOGLE APPS SCRIPT v2 - SERVER AKTIVASI & DASHBOARD API (SemangkaX4)
 * ============================================================================
 * Fitur:
 * 1. Mendukung Aktivasi dari Aplikasi Android SoalPintar
 * 2. Mendukung Pengelolaan Lengkap dari Website Dashboard (Mobile & Desktop):
 *    - Melihat daftar semua kode & status (List)
 *    - Menambahkan kode baru (Add & Batch Add)
 *    - Reset Perangkat / Ganti HP (Reset Device ID)
 *    - Mengaktifkan / Menonaktifkan kode (Toggle Status)
 *    - Menghapus kode (Delete)
 *    - Statistik real-time
 * ============================================================================
 */

function setupSheetAwal() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Aktivasi") || ss.insertSheet("Aktivasi");
  
  var headers = [["Kode Aktivasi", "Device ID", "Model Perangkat", "Status", "Nama / Catatan", "Tanggal Aktivasi"]];
  sheet.getRange(1, 1, 1, 6).setValues(headers)
    .setBackground("#0F172A")
    .setFontColor("#38BDF8")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
    
  var sampleRows = [
    ["SMK-1001", "", "", "AKTIF", "Siswa 1 (Contoh)", ""],
    ["SMK-1002", "", "", "AKTIF", "Siswa 2 (Contoh)", ""],
    ["SMK-1003", "", "", "AKTIF", "Siswa 3 (Contoh)", ""],
    ["SMK-VIP01", "", "", "AKTIF", "Pengawas (Contoh)", ""]
  ];
  sheet.getRange(2, 1, sampleRows.length, 6).setValues(sampleRows);
  sheet.autoResizeColumns(1, 6);
  Logger.log("Tabel Aktivasi berhasil disiapkan!");
}

function doGet(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var params = e ? e.parameter : {};
    var action = (params.action || "list").toLowerCase();
    var code = (params.code || "").trim().toUpperCase();
    var deviceId = (params.deviceId || "").trim().toUpperCase();
    var deviceModel = (params.deviceModel || "").trim();
    var name = (params.name || "").trim();
    var status = (params.status || "").trim().toUpperCase();
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Aktivasi");
    if (!sheet) {
      // Auto-create jika belum ada
      setupSheetAwal();
      sheet = ss.getSheetByName("Aktivasi");
    }
    
    var data = sheet.getDataRange().getValues();
    
    // ====================================================
    // 1. ACTION: LIST (Digunakan oleh Website Dashboard)
    // ====================================================
    if (action === "list" || action === "get_all") {
      var items = [];
      var total = 0;
      var used = 0;
      var available = 0;
      var disabled = 0;
      
      for (var i = 1; i < data.length; i++) {
        var rowCode = String(data[i][0]).trim().toUpperCase();
        if (!rowCode) continue;
        
        var rowDevId = String(data[i][1]).trim();
        var rowModel = String(data[i][2]).trim();
        var rowStatus = String(data[i][3]).trim().toUpperCase() || "AKTIF";
        var rowName = String(data[i][4]).trim();
        var rowDate = String(data[i][5]).trim();
        
        total++;
        if (rowStatus === "NONAKTIF") {
          disabled++;
        } else if (rowDevId) {
          used++;
        } else {
          available++;
        }
        
        items.push({
          row: i + 1,
          code: rowCode,
          deviceId: rowDevId,
          deviceModel: rowModel,
          status: rowStatus,
          name: rowName,
          date: rowDate
        });
      }
      
      return responseJson({
        status: "success",
        stats: {
          total: total,
          used: used,
          available: available,
          disabled: disabled
        },
        data: items
      });
    }
    
    // ====================================================
    // 2. ACTION: ACTIVATE (Digunakan oleh Aplikasi Android)
    // ====================================================
    if (action === "activate") {
      if (!code) return responseJson({ status: "error", message: "Kode aktivasi tidak boleh kosong!" });
      if (!deviceId) return responseJson({ status: "error", message: "ID Perangkat tidak terdeteksi!" });
      
      for (var i = 1; i < data.length; i++) {
        var rowCode = String(data[i][0]).trim().toUpperCase();
        if (rowCode === code) {
          var foundRow = i + 1;
          var rowDevId = String(data[i][1]).trim().toUpperCase();
          var rowModel = String(data[i][2]);
          var rowStatus = String(data[i][3]).trim().toUpperCase();
          
          if (rowStatus === "NONAKTIF") {
            return responseJson({ status: "error", message: "Kode aktivasi ini telah dinonaktifkan oleh admin." });
          }
          if (rowDevId === deviceId) {
            return responseJson({ status: "success", message: "Perangkat ini sudah teraktivasi sebelumnya." });
          }
          if (!rowDevId) {
            sheet.getRange(foundRow, 2).setValue(deviceId);
            sheet.getRange(foundRow, 3).setValue(deviceModel);
            sheet.getRange(foundRow, 4).setValue("TERPAKAI");
            sheet.getRange(foundRow, 6).setValue(Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss"));
            return responseJson({ status: "success", message: "Aktivasi berhasil! Perangkat telah terdaftar." });
          }
          return responseJson({
            status: "error", 
            message: "Kode sudah digunakan di perangkat lain (" + (rowModel || "Device lain") + "). Hubungi admin untuk kode baru!"
          });
        }
      }
      return responseJson({ status: "error", message: "Kode aktivasi salah atau belum dibuat admin. Hubungi admin terlebih dahulu." });
    }
    
    // ====================================================
    // 3. ACTION: ADD (Tambah Kode Baru dari Dashboard)
    // ====================================================
    if (action === "add" || action === "create") {
      if (!code) return responseJson({ status: "error", message: "Kode aktivasi tidak boleh kosong!" });
      
      // Cek apakah kode sudah ada
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim().toUpperCase() === code) {
          return responseJson({ status: "error", message: "Kode '" + code + "' sudah ada di tabel!" });
        }
      }
      
      var newRow = [code, "", "", "AKTIF", name || "-", ""];
      sheet.appendRow(newRow);
      return responseJson({ status: "success", message: "Kode '" + code + "' berhasil ditambahkan!" });
    }
    
    // ====================================================
    // 4. ACTION: RESET_DEVICE (Unbind Perangkat / Ganti HP)
    // ====================================================
    if (action === "reset_device" || action === "unbind") {
      if (!code) return responseJson({ status: "error", message: "Parameter kode wajib diisi!" });
      
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim().toUpperCase() === code) {
          var targetRow = i + 1;
          sheet.getRange(targetRow, 2).setValue(""); // Kosongkan Device ID
          sheet.getRange(targetRow, 3).setValue(""); // Kosongkan Model
          sheet.getRange(targetRow, 4).setValue("AKTIF"); // Kembalikan ke AKTIF
          sheet.getRange(targetRow, 6).setValue(""); // Kosongkan tanggal
          return responseJson({ status: "success", message: "Perangkat pada kode '" + code + "' berhasil direset! Kode bisa digunakan di HP baru." });
        }
      }
      return responseJson({ status: "error", message: "Kode tidak ditemukan." });
    }
    
    // ====================================================
    // 5. ACTION: TOGGLE_STATUS (Aktifkan / Nonaktifkan)
    // ====================================================
    if (action === "toggle_status") {
      if (!code) return responseJson({ status: "error", message: "Parameter kode wajib diisi!" });
      
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim().toUpperCase() === code) {
          var targetRow = i + 1;
          var curStatus = String(data[i][3]).trim().toUpperCase();
          var newStatus = (curStatus === "NONAKTIF") ? "AKTIF" : "NONAKTIF";
          sheet.getRange(targetRow, 4).setValue(newStatus);
          return responseJson({ status: "success", message: "Status kode '" + code + "' diubah menjadi " + newStatus });
        }
      }
      return responseJson({ status: "error", message: "Kode tidak ditemukan." });
    }
    
    // ====================================================
    // 6. ACTION: DELETE (Hapus Kode)
    // ====================================================
    if (action === "delete") {
      if (!code) return responseJson({ status: "error", message: "Parameter kode wajib diisi!" });
      
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim().toUpperCase() === code) {
          sheet.deleteRow(i + 1);
          return responseJson({ status: "success", message: "Kode '" + code + "' berhasil dihapus dari tabel!" });
        }
      }
      return responseJson({ status: "error", message: "Kode tidak ditemukan." });
    }
    
    // ====================================================
    // 7. ACTION: CHECK
    // ====================================================
    if (action === "check") {
      for (var i = 1; i < data.length; i++) {
        var rowDevId = String(data[i][1]).trim().toUpperCase();
        var rowStatus = String(data[i][3]).trim().toUpperCase();
        if (rowDevId === deviceId && rowStatus !== "NONAKTIF") {
          return responseJson({ status: "success", message: "Perangkat terdaftar dan aktif." });
        }
      }
      return responseJson({ status: "error", message: "Perangkat belum terdaftar." });
    }
    
    return responseJson({ status: "error", message: "Aksi '" + action + "' tidak dikenali." });
  } catch (err) {
    return responseJson({ status: "error", message: "Terjadi error di server: " + err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  return doGet(e);
}

function responseJson(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
