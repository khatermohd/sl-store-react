/**
 * Google Apps Script: Google Form to Telegram Instant Notifications
 * 
 * CONFIGURATION CREDENTIALS:
 * - Bot Token: 8916933189:AAHVanwyES7TU9K2654GhzX0CetHn2gvRKk
 * - Chat ID: 1624655854
 * 
 * This code must be pasted into the Apps Script editor attached to your Google Form.
 * Instructions on how to set it up are detailed below the code block.
 */

function sendTelegramNotification(e) {
  // Telegram API configuration details
  var botToken = "8916933189:AAHVanwyES7TU9K2654GhzX0CetHn2gvRKk";
  var chatId = "1624655854";
  
  try {
    if (!e || !e.response) {
      Logger.log("Error: Test execution or event source missing. This function must be triggered by 'On Form Submit'.");
      return;
    }
    
    // 1. Retrieve submission responses
    var formResponse = e.response;
    var itemResponses = formResponse.getItemResponses();
    var submitterEmail = formResponse.getSubmitterEmail() || "";
    
    // Get timestamps of the submission
    var timestamp = formResponse.getTimestamp().toLocaleString('ar-BH', { timeZone: 'Asia/Bahrain' });
    if (!timestamp) {
      timestamp = new Date().toLocaleString();
    }
    
    // 2. Build the beautiful HTMl message
    var message = "🔔 <b>إشعار جديد: استلام رد على النموذج!</b>\n";
    message += "<b>New Form Submission Received!</b>\n";
    message += "━━━━━━━━━━━━━━━━━━━━━\n\n";
    message += "⏰ <b>التوقيت / Time:</b> <code>" + timestamp + "</code>\n";
    
    if (submitterEmail) {
      message += "📧 <b>البريد الإلكتروني / Submitter:</b> <code>" + submitterEmail + "</code>\n";
    }
    
    message += "\n📋 <b>تفاصيل الرد المتلقى / Submission Data:</b>\n";
    message += "━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    // Loop through answers inside the submitted response
    for (var i = 0; i < itemResponses.length; i++) {
      var itemResponse = itemResponses[i];
      var question = itemResponse.getItem().getTitle();
      var answer = itemResponse.getResponse();
      
      // Safety: If response is an array (e.g. checkbox options), join them with commas
      if (Array.isArray(answer)) {
        answer = answer.join(", ");
      }
      
      message += "▫️ <b>" + question + "</b>\n";
      message += "➔ <i>" + answer + "</i>\n\n";
    }
    
    message += "━━━━━━━━━━━━━━━━━━━━━\n";
    message += "💻 <code>Google Apps Script Integrator</code>";
    
    // 3. Prepare the request URL & options
    var url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
    
    var payload = {
      "chat_id": chatId,
      "text": message,
      "parse_mode": "HTML",
      "disable_web_page_preview": true
    };
    
    var options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };
    
    // 4. Send the POST Request to Telegram
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    Logger.log("Telegram response code: " + responseCode);
    Logger.log("Telegram response: " + responseText);
    
  } catch (error) {
    Logger.log("Execution error caught: " + error.toString());
  }
}
