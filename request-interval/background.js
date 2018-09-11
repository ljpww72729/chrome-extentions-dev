function getDomainFromUrl(url){
     var host = "null";
     if(typeof url == "undefined" || null == url)
          url = window.location.href;
     var regex = /.*\:\/\/([^\/]*).*/;
     var match = url.match(regex);
     if(typeof match != "undefined" && null != match)
          host = match[1];
     return host;
}

function checkForValidUrl(tabId, changeInfo, tab) {
     if(getDomainFromUrl(tab.url).toLowerCase()=="baidu.com"){
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
function showNotification(info) {
     // Test for notification support.
    if (window.Notification) {
        var time = /(..)(:..)/.exec(new Date());     // The prettyprinted time.
        var hour = time[1] % 12 || 12;               // The prettyprinted hour.
        var period = time[1] < 12 ? 'a.m.' : 'p.m.'; // The period of the day.
        var opt = {
        type: "basic",
        title: "聊会儿",
        message: info,
        iconUrl: "notifications_active.png",
        requireInteraction:true
        };
        chrome.notifications.create(getNotificationId(), opt, function() {});
    }else{
        console.log(info);
    }
}

var liaohuisignin = "liaohuisignin";

function postXHR(url, data, callback) {  // Added data to function
    var xhr = new XMLHttpRequest();

    if (!url) {
        throw new Error('No URL supplied');
    }
    xhr.open("POST", url, true);         // Changed "GET" to "POST"
    xhr.setRequestHeader("Content-type",
        "application/json;");
    xhr.withCredentials = "true";
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    if (callback) {
                         var result = JSON.parse(xhr.response);
                         if (result.code == 0) {
                             chrome.storage.sync.set({liaohuisignin: new Date().Format("yyyy-MM-dd")}, function() {
                             if (chrome.runtime.error) {
                                 console.log("Runtime error.");
                             }else{
                                 // 通知保存完成。
                                 callback("今日已签！剩余时长：" + result.data.leftTime + "分钟");
                             }
                         });
                              
                         }   
                    }
                } catch(e) {
                    throw new Error('Malformed response');
                }
            }
        }
    }
    if (data) {
        data = JSON.stringify(data);         // Stringify the data Object literal
        xhr.send(data);                      // Added the JSON stringified object.
    } else {
        xhr.send();
    }
}

// 修改 User-Agent 和 Origin
var JDAPP_USER_AGENT = 'Mozilla/5.0 (Linux; Android 8.0; FRD-AL10 Build/HUAWEIFRD-AL10; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.143 Crosswalk/24.53.595.0 XWEB/256 MMWEBSDK/21 Mobile Safari/537.36 MicroMessenger/6.6.7.1321(0x26060739) NetType/WIFI Language/zh_CN';
chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    for (var i = 0; i < details.requestHeaders.length; ++i) {
      if (details.requestHeaders[i].name === 'User-Agent') {
        details.requestHeaders[i].value = JDAPP_USER_AGENT;
      }
      if (details.requestHeaders[i].name === 'Origin') {
        details.requestHeaders[i].value = "";
      }   
    }
    return {
      requestHeaders: details.requestHeaders
    };
  }, {
    urls: ["https://www.cytxl.com.cn/*"]
  }, ['blocking', 'requestHeaders']);



// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18

Date.prototype.Format = function (fmt) { // author: meizz
    var o = {
        "M+": this.getMonth() + 1, // 月份
        "d+": this.getDate(), // 日
        "h+": this.getHours(), // 小时
        "m+": this.getMinutes(), // 分
        "s+": this.getSeconds(), // 秒
        "q+": Math.floor((this.getMonth() + 3) / 3), // 季度
        "S": this.getMilliseconds() // 毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            return fmt;
}


// background调用popup中变量或方法，在获取popup变量时，请确认popup已打开。
// var pop = chrome.extension.getViews({type:'popup'});//获取popup页面

// chrome.tabs.onUpdated.addListener(checkForValidUrl);

// 定时监听
chrome.alarms.onAlarm.addListener(function( alarm ) {
  
    chrome.storage.sync.get(liaohuisignin,function(result){
        if (!chrome.runtime.error) {
            if(result.liaohuisignin == new Date().Format("yyyy-MM-dd")){
                  // 日期相同说明，今天已签到，不执行签到请求
            }else{
                // 执行签到请求
                var obj = {"requestId":new Date().getTime(),"params":{"openid":"o94RG40Q86dyDFrAGxoUDB5P6YP0","type":"set"}};
                postXHR('https://www.cytxl.com.cn/multitalk/dayClock.php',obj,showNotification);
            }
        }
    })
});


var alarmName = 'request-interval-alarm';
// 检查定时任务
function checkAlarm(callback) {
  chrome.alarms.getAll(function(alarms) {
    var hasAlarm = alarms.some(function(a) {
      return a.name == alarmName;
    });
    var newLabel;
    if (hasAlarm) {
      newLabel = 'Cancel alarm';
    } else {
      newLabel = 'Activate alarm';
    }
    // document.getElementById('toggleAlarm').innerText = newLabel;
    if (callback) callback(hasAlarm);
  })
}
// 创建定时任务
function createAlarm() {
     chrome.alarms.create(alarmName, {
     delayInMinutes: 1, periodInMinutes: 30});
}
// 清除定时任务
function cancelAlarm() {
     chrome.alarms.clear(alarmName);
}
// 切换定时任务
function doToggleAlarm() {
  checkAlarm( function(hasAlarm) {
    if (hasAlarm) {
      cancelAlarm();
    } else {
      createAlarm();
    }
    checkAlarm();
  });
}

// 开始执行任务
function startTasks(){
  checkAlarm( function(hasAlarm) {
    if (hasAlarm) {
      // 闹钟已经执行，无操作
    } else {
      createAlarm();
    }
  });
   // 使用 Chrome 扩展程序的存储 API 保存它。
}

startTasks();

