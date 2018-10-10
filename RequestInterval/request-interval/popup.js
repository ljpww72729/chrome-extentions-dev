// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
Date.prototype.Format = function(fmt) { // author: meizz
    var o = {
        "M+": this.getMonth() + 1,
        // 月份
        "d+": this.getDate(),
        // 日
        "h+": this.getHours(),
        // 小时
        "m+": this.getMinutes(),
        // 分
        "s+": this.getSeconds(),
        // 秒
        "q+": Math.floor((this.getMonth() + 3) / 3),
        // 季度
        "S": this.getMilliseconds() // 毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o) if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

/**
 * Get the current URL.
 *
 * @param {function(string)} callback called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, (tabs) => {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

/**
 * Change the background color of the current page.
 *
 * @param {string} color The new background color.
 */
function changeBackgroundColor(color) {
  var script = 'document.body.style.backgroundColor="' + color + '";';
  // See https://developer.chrome.com/extensions/tabs#method-executeScript.
  // chrome.tabs.executeScript allows us to programmatically inject JavaScript
  // into a page. Since we omit the optional first argument "tabId", the script
  // is inserted into the active tab of the current window, which serves as the
  // default.
  chrome.tabs.executeScript({
    code: script
  });
}

/**
 * Gets the saved background color for url.
 *
 * @param {string} url URL whose background color is to be retrieved.
 * @param {function(string)} callback called with the saved background color for
 *     the given url on success, or a falsy value if no color is retrieved.
 */
function getSavedBackgroundColor(url, callback) {
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We check
  // for chrome.runtime.lastError to ensure correctness even when the API call
  // fails.
  chrome.storage.sync.get(url, (items) => {
    callback(chrome.runtime.lastError ? null : items[url]);
  });
}

/**
 * Sets the given background color for url.
 *
 * @param {string} url URL for which background color is to be saved.
 * @param {string} color The background color to be saved.
 */
function saveBackgroundColor(url, color) {
  var items = {};
  items[url] = color;
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We omit the
  // optional callback since we don't need to perform any action once the
  // background color is saved.
  chrome.storage.sync.set(items);
}

// Returns a new notification ID used in the notification.
function getNotificationId() {
    var id = Math.floor(Math.random() * 9007199254740992) + 1;
    return id.toString();
} 

chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex){
  console.log("notificationId = " + notificationId + "buttonIndex = " + buttonIndex);
})

function showNotification(optType, optTitle, optMsg, optinteraction) {
    // Test for notification support.
    if (!optType) {
        optType = "basic";
    }
    if (!optTitle) {
        optTitle = "通知";
    }
    var buttons = [{"title":"close"},{"title":"open"}];
    if (window.Notification) {
        var opt = {
            type: optType,
            title: optTitle ,
            message: optMsg,
            iconUrl: "notifications_active.png",
            buttons:buttons,
            // contextMessage: new Date().Format("yyyy-MM-dd hh:mm"),
            requireInteraction: optinteraction
        };
        chrome.notifications.create(getNotificationId(), opt,
        function() {});
    } else {
        console.log(info);
    }
}

 // popup中调用background中的方法
 var bg = chrome.extension.getBackgroundPage();//获取background页面

// This extension loads the saved background color for the current tab if one
// exists. The user can select a new background color from the dropdown for the
// current page, and it will be saved as part of the extension's isolated
// storage. The chrome.storage API is used for this purpose. This is different
// from the window.localStorage API, which is synchronous and stores data bound
// to a document's origin. Also, using chrome.storage.sync instead of
// chrome.storage.local allows the extension data to be synced across multiple
// user devices.

var requestArr;
document.addEventListener('DOMContentLoaded', () => {


  chrome.storage.sync.get("requestArrData",
    function(result) {
        if (!chrome.runtime.error) {
            if (result.requestArrData) {
                requestArr = JSON.parse(result.requestArrData);
                // 展示数据
                var listHtml = "";
                for (j = 0, len = requestArr.length; j < len; j++) {
            
                    listHtml += '<li><div>' + requestArr[j].requestName+ ' | ' 
                    + new Date(requestArr[j].lastRequestTime).Format("yyyy-MM-dd hh:mm") + '</div> ' 
                     + '<div>请求格式化结果：' + requestArr[j].respFormatRst + '</div> ' 
                    + '</li>';
                }
                requestList.innerHTML = listHtml;

            } else {
                requestArr = [];
            }

        }
      });  
    // var dropdown = document.getElementById('dropdown');
    var addRequest = document.getElementById('addRequest');

    // // Load the saved background color for this page and modify the dropdown
    // // value, if needed.
    // getSavedBackgroundColor(url, (savedColor) => {
    //   if (savedColor) {
    //     changeBackgroundColor(savedColor);
    //     dropdown.value = savedColor;
    //   }
    // });

    // // Ensure the background color is changed and saved when the dropdown
    // // selection changes.
    // dropdown.addEventListener('change', () => {
    //   changeBackgroundColor(dropdown.value);
    //   saveBackgroundColor(url, dropdown.value);
    // });
    //添加按钮响应事件
    addRequest.addEventListener('click', () => {
  



    // console.log(myArray);


    bg.showNotification("","","提示提示提示提示提示提示提示提示提示提示提示提示提示提示提示提示提示提示提示提示提示提示提示", true);
    bg.startTasks(false);

//     chrome.runtime.sendMessage({greeting: "您好"}, function(response) {
//   console.log(response.farewell);
// });

    });
});
