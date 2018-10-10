function getDomainFromUrl(url) {
  var host = "null";
  if (typeof url == "undefined" || null == url) url = window.location.href;
  var regex = /.*\:\/\/([^\/]*).*/;
  var match = url.match(regex);
  if (typeof match != "undefined" && null != match) host = match[1];
  return host;
}

function checkForValidUrl(tabId, changeInfo, tab) {
  if (getDomainFromUrl(tab.url).toLowerCase() == "baidu.com") {
    chrome.pageAction.show(tabId);
  }
};

// Returns a new notification ID used in the notification.
function getNotificationId() {
  var id = Math.floor(Math.random() * 9007199254740992) + 1;
  return id.toString();
}

/*
  Displays a notification with the current time. Requires "notifications"
  permission in the manifest file (or calling
  "Notification.requestPermission" beforehand).
*/
function showNotification(optType, optTitle, optMsg, optinteraction) {
  // Test for notification support.
  if (!optType) {
    optType = "basic";
  }
  if (!optTitle) {
    optTitle = "通知";
  }
  if (window.Notification) {
    // var time = /(..)(:..)/.exec(new Date()); // The prettyprinted    time.
    // var hour = time[1] % 12 || 12; // The prettyprinted hour.
    // var period = time[1] < 12 ? 'a.m.': 'p.m.'; // The period of the day.
    var opt = {
      type: optType,
      title: optTitle + "  " + new Date().Format("yyyy-MM-dd hh:mm"),
      message: optMsg,
      iconUrl: "notifications_active.png",
      // contextMessage: new Date().Format("yyyy-MM-dd hh:mm"),
      requireInteraction: optinteraction
    };
    chrome.notifications.create(getNotificationId(), opt,
                                function() {});
  } else {
    console.log(info);
  }
}

// 请求列表数据
var requestArr = [];

// 发送xhr请求，参考：https://metabroadcast.com/blog/a-chrome-extension-hit-my-api
function excuteXHR(requestItem, callback) { // Added data to function
  // 执行签到请求
  var requestName = requestItem.requestName;
  var requestUrl = requestItem.requestUrl;
  var requestParams = requestItem.requestParams;
  var requestContentType = requestItem.requestContentType;
  var requestMethod = requestItem.requestMethod;

  if (!requestUrl) {
    throw new Error('No URL supplied');
  }

  if (requestParams) {
    requestParams = requestParams.replace("$timestamp$", new Date().getTime());
  }

  var xhr = new XMLHttpRequest();
  xhr.open(requestMethod, requestUrl, true); // Changed "GET" to "POST"
  if (requestMethod == "POST") {
    xhr.setRequestHeader("Content-type", requestContentType + ";"); 
  }
  xhr.withCredentials = "true";
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        if (callback) {
          callback(requestItem, xhr.response);
        }
      }
    }
  }
  if (requestParams) {
    //params = JSON.stringify(params); // Stringify the data Object literal
    xhr.send(requestParams); // Added the JSON stringified object.
  } else {
    xhr.send();
  }
}

function handleResponse(requestItem, respStr) {
  try {
    // 响应格式化字符串
    var respFormat = requestItem.respFormat;
    if (respFormat) {
      // 获取所有以$开头及结尾的字符串，用户获取对应的值
      var re = /\$.*?\$/g;
      // 获取数组字符串进行解析
      var reKey = /\[.*?\]/g;
      var respFormatArr = respFormat.match(re);
      for (i = 0, len = respFormatArr.length; i < len; i++) {
        var formatItem = respFormatArr[i];
        var formatItemSimple = formatItem.replace(/\$/g, "");
        var keysArr = formatItemSimple.split('.');
        var result = JSON.parse(respStr);
        for (j = 0, keysLen = keysArr.length; j < keysLen; j++) {
          var key = keysArr[j];
          var keyArr = key.match(reKey);
          if (keyArr && keyArr.length == 1) {
            // 是数组数据
            var keyItem = keyArr[0].replace(/[\[\]]/g, "");
            var keyItemName = key.replace(reKey, "");
            var keyItemArr = keyItem.split(",");
            if (keyItemArr.length == 1) {
              // 说明只取数组中的一项
              var keyItemArrIndex = parseInt(keyItemArr[0]);
              result = formatResult(result,  keyItemName);
              result = formatResult(result,  keyItemArrIndex);
            }else if (keyItemArr.length == 2) {
              // 说明取数组中的一连续的一组数据
              var keyItemArrIndexPrefix = parseInt(keyItemArr[0]);
              var keyItemArrIndexSuffix = parseInt(keyItemArr[1]);
              result = formatResult(result,  keyItemName);
              var resultArr = [];
              resultArr.push("user");// 添加该标识表示程序创建的数组
              for (var m = keyItemArrIndexPrefix; m < keyItemArrIndexPrefix + keyItemArrIndexSuffix; m++) {
                resultArr.push(formatResult(result,  m));
              }
              result = resultArr;
            }else{
              // 没有按照指定的格式编写响应数据串
            }
          }else{
            result = formatResult(result, keysArr[j]);
          }
        }
        var resultFormat = "";
        if(isArray(result)){
          for (i = 0, len = result.length; i < len; i++) {
            resultFormat += result[i] + "\n";
          }

        }else{
          resultFormat = result;
        }
        respFormat = respFormat.replace(formatItem, resultFormat);
      }
    }else{
      respFormat = respStr;
    }
  } catch(e) {
    throw new Error('Malformed response');
  }

  for (j = 0, len = requestArr.length; j < len; j++) {
    if (requestItem.timestamp.toString() == requestArr[j].timestamp.toString()) {
      requestArr[j].respFormatRst = respFormat.toString();
      requestArr[j].lastRequestTime = new Date().getTime();
      var jsonString = JSON.stringify(requestArr);
      // 设置最后一次请求时间
      chrome.storage.sync.set({
        "requestArrData": jsonString
      }, function() {
        if (chrome.runtime.error) {
          console.log("Runtime error.");
        } else {
          // 通知保存完成。
          // showNotification("", "", "请求结果写入成功！", false);
        }
      });

    }
  }

  showNotification("", requestItem.requestName, respFormat.toString(), requestItem.requireInteraction);
}

// 判断是否是数组
function isArray(arr){
  return Object.prototype.toString.call(arr)=='[object Array]';
}

function formatResult(result, key){
  var resultHandle;
  if (isArray(result) && result.length > 1 && result[0] == "user") {
    for (i = 1, len = result.length; i < len; i++) {
      result[i] = result[i][key];
    }  
    result.shift(); 
    resultHandle = result;
  }else{
    resultHandle = result[key];
  }

  return resultHandle;
  
}

// 修改 User-Agent 和 Origin
var JDAPP_USER_AGENT = 'Mozilla/5.0 (Linux; Android 8.0; FRD-AL10 Build/HUAWEIFRD-AL10; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.143 Crosswalk/24.53.595.0 XWEB/256 MMWEBSDK/21 Mobile Safari/537.36 MicroMessenger/6.6.7.1321(0x26060739) NetType/WIFI Language/zh_CN';
chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
  for (var i = 0; i < details.requestHeaders.length; ++i) {
    if (details.requestHeaders[i].name === 'User-Agent') {
      details.requestHeaders[i].value = JDAPP_USER_AGENT;
    }
    if (details.requestHeaders[i].name === 'Origin') {
      // 删除Origin Header
      details.requestHeaders.splice(i, 1);
    }
  }
  return {
    requestHeaders: details.requestHeaders
  };
}, {
     urls: ["https://www.cytxl.com.cn/*"]
   },
   ['blocking', 'requestHeaders']);


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

// background调用popup中变量或方法，在获取popup变量时，请确认popup已打开。
// var pop = chrome.extension.getViews({type:'popup'});//获取popup页面
// chrome.tabs.onUpdated.addListener(checkForValidUrl);
// 定时任务监听
chrome.alarms.onAlarm.addListener(function(alarm) {

  // 循环查询定时任务
  for (j = 0, len = requestArr.length; j < len; j++) {
    if (alarm.name == requestArr[j].timestamp.toString()) {

      // 执行签到请求
      excuteXHR(requestArr[j], handleResponse);
      break;
    }
  }

});

// 检查定时任务
function checkAlarm(requestItem, callback) {
  chrome.alarms.get(requestItem.timestamp.toString(),
                    function(alarm) {
                      var hasAlarm = false;
                      if (alarm) {
                        hasAlarm = true;
                      }
                      // document.getElementById('toggleAlarm').innerText = newLabel;
                      if (callback) callback(requestItem, hasAlarm);
                    });
}
// 创建定时任务
function createAlarm(alarmName, delayMinutes, periodMinutes) {
  if(periodMinutes == -1){
    return;
  }
  chrome.alarms.create(alarmName, {
    delayInMinutes: delayMinutes,
    periodInMinutes: periodMinutes
  });
}
// 清除定时任务
function cancelAlarm(alarmName) {
  chrome.alarms.clear(alarmName);
}
// 切换定时任务
// function doToggleAlarm() {
//   checkAlarm( function(hasAlarm) {
//     if (hasAlarm) {
//       cancelAlarm();
//     } else {
//       createAlarm();
//     }
//     checkAlarm();
//   });
// }
// 获取消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log(sender.tab ? "来自内容脚本：" + sender.tab.url: "来自扩展程序");
  if (request.msg == "refresh-data") {
    // 需要刷新请求列表数据
    startTasks(true);
    sendResponse({
      result: "success"
    });
  }
});

// 监听storage
chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (key in changes) {
    if (key == "requestArrData") {
      var storageChange = changes[key];

      var newValue = storageChange.newValue;
      if (newValue) {
        requestArr = JSON.parse(newValue);
      } else {
        requestArr = [];
      }
      console.log('Storage key "%s" in namespace "%s" changed. ' +
                  'Old value was "%s", new value is "%s".',
                  key,
                  namespace,
                  storageChange.oldValue,
                  storageChange.newValue);
    }
  }
});

// 开始执行任务
function startTasks(forceRefresh) {
  chrome.storage.sync.get("requestArrData",
                          function(result) {
                            if (!chrome.runtime.error) {
                              if (result.requestArrData) {
                                requestArr = JSON.parse(result.requestArrData);
                              } else {
                                requestArr = [];
                              }
                              // 循环查询定时任务
                              for (j = 0, len = requestArr.length; j < len; j++) {
                                checkAlarm(requestArr[j],
                                           function(requestItem, hasAlarm) {
                                             if (hasAlarm) {
                                               // 闹钟已经执行
                                               if (forceRefresh) {
                                                 // 强制刷新
                                                 // 先取消定时任务
                                                 cancelAlarm(requestItem.timestamp.toString());
                                                 // 重新创建定时任务
                                                 createAlarm(requestItem.timestamp.toString(), 1, requestItem.requestInterval);
                                               }
                                             } else {
                                               // 创建定时任务
                                               createAlarm(requestItem.timestamp.toString(), 1, requestItem.requestInterval);
                                             }
                                           });

                              }

                            }
                          });
}

startTasks(false);
