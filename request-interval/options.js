// Copyright (c) 2011 The Chromium Authors. All rights reserved.
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

//      popup中调用background中的方法
var bg = chrome.extension.getBackgroundPage(); //获取background页面
// 监听storage
chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (key in changes) {
        if (namespace == "sync" && key == "requestArrData") {
            var storageChange = changes[key];
            var newValue = storageChange.newValue;
            if (newValue) {
                requestArr = JSON.parse(newValue);
            } else {
                requestArr = [];
            }
            // 如果任务名及请求地址不为空，则不刷新
             var requestName = requestForm.requestName.value;
             var requestUrl = requestForm.requestUrl.value;
        if (!requestName.replace(/\s+/g, "") && !requestUrl.replace(/\s+/g, "")) {
           location.reload();
        }   
        }
    }
});

// 复制到剪切版
function copyToClip(id) {
  /* Select the text field */
  var copyText = document.getElementById(id);

  var sel = document.getSelection();
        var range = document.createRange();
        range.selectNodeContents(copyText);
        sel.removeAllRanges();
        sel.addRange(range);
  var te = document.execCommand("copy");

}

window.addEventListener('load',function() {
    chrome.storage.sync.get("requestArrData",
    function(result) {
        if (!chrome.runtime.error) {
            if (result.requestArrData) {
                requestArr = JSON.parse(result.requestArrData);
                // 展示数据
                var listHtml = "";
                for (j = 0, len = requestArr.length; j < len; j++) {
                    var requireInteractionStr = requestArr[j].requireInteraction ? "固定通知":"不固定通知";
                    listHtml += '<li><div>' + requestArr[j].requestName+ ' | ' 
                    + requestArr[j].requestMethod + ' | ' 
                    + new Date(requestArr[j].timestamp).Format("yyyy-MM-dd hh:mm") + ' | ' 
                    + requestArr[j].requestInterval + ' 分钟 | ' 
                    + new Date(requestArr[j].lastRequestTime).Format("yyyy-MM-dd hh:mm") + ' | ' 
                    + requireInteractionStr + ' | </div>'
                    + '<div>请求地址：' + requestArr[j].requestUrl + '</div> ' 
                    + '<div>请求参数：' + requestArr[j].requestParams + '</div> ' 
                    + '<div>响应格式化：' + requestArr[j].respFormat + '</div> ' 
                     + '<div>响应格式化结果：' + requestArr[j].respFormatRst + '</div> ' 
                    + '<div>请求结果：<button data-id="'+ requestArr[j].timestamp.toString() + '"class="show">显示</button>'
                    +'<button data-id="' + requestArr[j].timestamp.toString() + '"class="hide">隐藏</button>'
                    +'<button data-id="' + requestArr[j].timestamp.toString() + '"class="copy">复制</button>'
                    +'<p id="' + requestArr[j].timestamp.toString() + '"></p></div> ' 
                    + '<div><button data-id="' + requestArr[j].timestamp.toString() + '"class="modify">修改</button>' 
                    + '<button data-id="' + requestArr[j].timestamp.toString() + '"class="delete">删除</button></div>' 
                    + '</li>';
                }
                requestList.innerHTML = listHtml;

            } else {
                requestArr = [];
            }
            $(".modify").click(function(e) {
            for (j = 0, len = requestArr.length; j < len; j++) {
                if (e.currentTarget.dataset.id == requestArr[j].timestamp.toString()) {
                    requestForm.timestamp.value = requestArr[j].timestamp;
                    requestForm.requestName.value = requestArr[j].requestName;
                    requestForm.requestUrl.value = requestArr[j].requestUrl;
                    requestForm.requestParams.value = requestArr[j].requestParams;
                    requestForm.requestInterval.value = requestArr[j].requestInterval;
                    requestForm.respFormat.value = requestArr[j].respFormat;
                    requestForm.requestMethod.value = requestArr[j].requestMethod;
                    requestMethod = requestArr[j].requestMethod;
                    switch (requestArr[j].requestContentType) {
                        case "text/palin":
                            requestForm.requestContentType.selectedIndex = 0;
                            requestContentType = "text/palin";
                            break;
                        case "application/json":
                            requestForm.requestContentType.selectedIndex = 1;
                            requestContentType = "application/json";
                            break;
                        }
                    if(requestArr[j].requireInteraction) {
                        requestForm.requireInteraction.selectedIndex = 1;
                            requireInteraction = true;
                        }else{
                            requestForm.requireInteraction.selectedIndex = 0;
                            requireInteraction = false;
                        }

                    break;
                }
            }
        });  

            $(".show").click(function(e) {
            for (j = 0, len = requestArr.length; j < len; j++) {
                if (e.currentTarget.dataset.id == requestArr[j].timestamp.toString()) {
                    bg.excuteXHR(requestArr[j], function(item, resp){
                        $('#'+item.timestamp.toString()).text(resp);
                    });
                    break;
                }
            } 
        });
             $(".hide").click(function(e) {
                 $('#'+e.currentTarget.dataset.id).text("");
        });
              $(".copy").click(function(e) {
                copyToClip(e.currentTarget.dataset.id);
        });

            $(".delete").click(function(e) {
                for (j = 0, len = requestArr.length; j < len; j++) {
                    if (e.currentTarget.dataset.id == requestArr[j].timestamp.toString()) {
                        requestArr.splice(j, 1);
                        break;
                    }
                }
                var jsonString = JSON.stringify(requestArr);
                chrome.storage.sync.set({
                    "requestArrData": jsonString
                },
                function() {
                    if (chrome.runtime.error) {
                        console.log("Runtime error.");
                    } else {
                        // 通知保存完成。
                        bg.showNotification("", "", "数据删除成功！", false);
                        chrome.runtime.sendMessage({
                            msg: "refresh-data"
                        },
                        function(response) {
                            console.log(response.result);
                        });
                    }
                });

            });
        }
    });

    var requestMethod = "GET";
    requestForm.requestMethod.onchange = function() {
        requestMethod = requestForm.requestMethod.value;
    };

    var requireInteraction = false;
    requestForm.requireInteraction.onchange = function() {
        var selectedIndex = requestForm.requireInteraction.selectedIndex;
        switch (selectedIndex) {
        case 0:
            requireInteraction = false;
            break;
        case 1:
            requireInteraction = true;
            break;
        }
       
    };

    var requestContentType = "text/palin";
    requestForm.requestContentType.onchange = function() {
        var selectedIndex = requestForm.requestContentType.selectedIndex;
        switch (selectedIndex) {
        case 0:
            requestContentType = "text/palin";
            break;
        case 1:
            requestContentType = "application/json";
            break;
        }
    };
    //添加按钮响应事件
    add.addEventListener('click', () =>{
        addOrUpdate();
    });
        update.addEventListener('click', () =>{
        addOrUpdate();
    });
        updateCancel.addEventListener('click', () =>{
        clearForm();
    });

        function clearForm(){
            requestForm.timestamp.value = "";
            requestForm.requestName.value = "";
            requestForm.requestUrl.value = "";
            requestForm.requestParams.value = "";
            requestForm.requestInterval.value = "";
            requestForm.respFormat.value = "";
            requestForm.requestMethod.value = "GET";
            requestForm.requestContentType.selectedIndex = 0;
            requestForm.requireInteraction.selectedIndex = 0;
        }

function addOrUpdate(){
      // showNotification();push.removeListener();
        var requestName = requestForm.requestName.value;
        if (!requestName.replace(/\s+/g, "")) {
            alert("任务名不能为空！");
            return;
        }
        var requestUrl = requestForm.requestUrl.value;
        if (!requestUrl.replace(/\s+/g, "")) {
            alert("请求地址不能为空！");
            return;
        }
        var requestParams = requestForm.requestParams.value;
        var requestInterval = requestForm.requestInterval.value;
        if (!requestInterval.replace(/\s+/g, "")) {
            // 默认30分钟请求一次
            requestInterval = "30";
        }
        var respFormat = requestForm.respFormat.value;
        var timestamp = requestForm.timestamp.value;
        if (!timestamp) {
            //添加操作
            timestamp = new Date().getTime();
            var data = {};
            data["requestName"] = requestName;
            data["requestUrl"] = requestUrl.replace(/\s+/g, "");
            data["requestParams"] = requestParams.replace(/\s+/g, "");
            data["requestContentType"] = requestContentType;
            data["requestMethod"] = requestMethod;
            data["requestInterval"] = parseInt(requestInterval.replace(/\s+/g, ""));
            data["lastRequestTime"] = 0;
            data["requireInteraction"] = requireInteraction;
            data["respFormat"] = respFormat.replace(/\s+/g, "");
            data["respFormatRst"] = "";
            data["timestamp"] = timestamp;
            requestArr.push(data);
        }else{
            // 更新操作
            for (j = 0, len = requestArr.length; j < len; j++) {
                if (timestamp == requestArr[j].timestamp.toString()) {
                    requestArr[j].requestName = requestName;
                    requestArr[j].requestUrl = requestUrl.replace(/\s+/g, "");
                    requestArr[j].requestParams = requestParams.replace(/\s+/g, "");
                    requestArr[j].requestContentType = requestContentType;
                    requestArr[j].requestMethod = requestMethod;
                    requestArr[j].respFormat = respFormat.replace(/\s+/g, "");
                    if (!requestArr[j].respFormatRst) {
                        requestArr[j]["respFormatRst"] = "";
                    }
                    requestArr[j].requestInterval = parseInt(requestInterval.replace(/\s+/g, ""));
                    requestArr[j].requireInteraction = requireInteraction;
                    break;
                }
            }
        }

        clearForm();
        var jsonString = JSON.stringify(requestArr);
        chrome.storage.sync.set({
            "requestArrData": jsonString
        },function() {
            if (chrome.runtime.error) {
                console.log("Runtime error.");
            } else {
                // 通知保存完成。
                bg.showNotification("", "", "操作成功！", false);
                chrome.runtime.sendMessage({
                    msg: "refresh-data"
                },function(response) {
                    console.log(response.result);
                });
            }
        });
}

});



