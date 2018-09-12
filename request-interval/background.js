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
function showNotification(info) {
    // Test for notification support.
    if (window.Notification) {
        var time = /(..)(:..)/.exec(new Date()); // The prettyprinted time.
        var hour = time[1] % 12 || 12; // The prettyprinted hour.
        var period = time[1] < 12 ? 'a.m.': 'p.m.'; // The period of the day.
        var opt = {
            type: "basic",
            title: "聊会儿",
            message: info,
            iconUrl: "notifications_active.png",
            requireInteraction: true
        };
        chrome.notifications.create(getNotificationId(), opt,
        function() {});
    } else {
        console.log(info);
    }
}

var liaohuisignin = "liaohuisignin";

// 发送post请求，参考：https://metabroadcast.com/blog/a-chrome-extension-hit-my-api
function postXHR(url, params, contentType, callback, requestName) { // Added data to function
    var xhr = new XMLHttpRequest();

    if (!url) {
        throw new Error('No URL supplied');
    }
    xhr.open("POST", url, true); // Changed "GET" to "POST"
    xhr.setRequestHeader("Content-type", contentType + ";");
    xhr.withCredentials = "true";
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    if (callback) {
                        var result = JSON.parse(xhr.response);
                        // if (result.code == 0) {
                        //     chrome.storage.sync.set({liaohuisignin: new Date().Format("yyyy-MM-dd")}, function() {
                        //     if (chrome.runtime.error) {
                        //         console.log("Runtime error.");
                        //     }else{
                        //         // 通知保存完成。
                        //         callback("今日已签！剩余时长：" + xhr.response + "分钟");
                        //     }
                        // });
                        // } 
                        callback(xhr.response);
                    }
                } catch(e) {
                    throw new Error('Malformed response');
                }
            }
        }
    }
    if (params) {
        //params = JSON.stringify(params); // Stringify the data Object literal
        xhr.send(params); // Added the JSON stringified object.
    } else {
        xhr.send();
    }
}

// 发送get请求
function getXHR(url, contentType, callback, requestName) { // Added data to function
    var xhr = new XMLHttpRequest();

    if (!url) {
        throw new Error('No URL supplied');
    }
    xhr.open("POST", url, true); // Changed "GET" to "POST"
    xhr.setRequestHeader("Content-type", contentType + ";");
    xhr.withCredentials = "true";
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    if (callback) {
                        var result = JSON.parse(xhr.response);
                        // if (result.code == 0) {
                        //     chrome.storage.sync.set({liaohuisignin: new Date().Format("yyyy-MM-dd")}, function() {
                        //     if (chrome.runtime.error) {
                        //         console.log("Runtime error.");
                        //     }else{
                        //         // 通知保存完成。
                        //         callback("今日已签！剩余时长：" + xhr.response + "分钟");
                        //     }
                        // });
                        // } 
                        callback(xhr.response);
                    }
                } catch(e) {
                    throw new Error('Malformed response');
                }
            }
        }
    }

    xhr.send();
}

// 修改 User-Agent 和 Origin
var JDAPP_USER_AGENT = 'Mozilla/5.0 (Linux; Android 8.0; FRD-AL10 Build/HUAWEIFRD-AL10; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.143 Crosswalk/24.53.595.0 XWEB/256 MMWEBSDK/21 Mobile Safari/537.36 MicroMessenger/6.6.7.1321(0x26060739) NetType/WIFI Language/zh_CN';
chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
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
},
{
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

    var requestArr;
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
                if (alarm.name == requestArr[j].timestamp.toString()) {

                    // 执行签到请求
                    var requestName = requestArr[j].requestName;
                    var requestUrl = requestArr[j].requestUrl;
                    var requestParams = requestArr[j].requestParams;
                    var requestContentType = requestArr[j].requestContentType;
                    var requestMethod = requestArr[j].requestMethod;
                    if (requestMethod == "POST") {
                        postXHR(requestUrl, requestParams, requestContentType, showNotification, requestName);
                    } else {
                        getXHR(requestUrl, requestContentType, showNotification, requestName);
                    }

                    requestArr[j].lastRequestTime = new Date().getTime();
                    var jsonString = JSON.stringify(requestArr);  
                    // 设置最后一次请求时间
                    chrome.storage.sync.set({"requestArrData": jsonString}, function() {
                        if (chrome.runtime.error) {
                            console.log("Runtime error.");
                        }else{
                            // 通知保存完成。
                            showNotification("设置最后更新日期成功！");
                        }
                    });

                    break;
                }
            }
        } else {

}
    });

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
    })
}
// 创建定时任务
function createAlarm(alarmName, delayMinutes, periodMinutes) {
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

// 开始执行任务
function startTasks(forceRefresh) {
    var requestArr;
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