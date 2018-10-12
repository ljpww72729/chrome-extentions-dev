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
          var requestName =  document.getElementById('requestName').value;
          var requestUrl = document.getElementById('requestUrl').value;
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

var savedFileEntry, fileDisplayPath;

function getDataAsText(callback) {
  chrome.storage.sync.get("requestArrData", function(result) {
    var text = '';

    if (!chrome.runtime.error) {
      if (result.requestArrData) {
        text = result.requestArrData;
      }
    }

    callback(text);

  }.bind(this));
}

    function utf8_to_b64(str) {
        return window.btoa(unescape(encodeURIComponent(str)));
    }

    function b64_to_utf8(str) {
        return decodeURIComponent(escape(window.atob(str)));
    }

// 导出备份
function doExportToDisk() {
getDataAsText( function(contents) {

  // create a temporary anchor to navigate to data uri
            var a = document.createElement("a");

            a.download = chrome.i18n.getMessage("backup_name");
            a.href = "data:text;base64," + utf8_to_b64(contents);

            // a.href = "data:text/plain;charset=utf-8;," + encodeURIComponent(dumpedString);
            // a.href = "data:text;base64," + utf8_to_b64(dumpedString);
            // a.href = "data:text;base64," + utf8_to_b64(dumpedString);
            //window.btoa(dumpedString);

            // create & dispatch mouse event to hidden anchor
            var mEvent = document.createEvent("MouseEvent");
            mEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

  a.dispatchEvent(mEvent);
});

}

// 导入备份
    function doImportFromDisk(evt) {
        var file = evt.target.files[0];	// FileList object
        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = function (e) {
            // newline delimited json
            var dumpedString = e.target.result;

          importData(dumpedString);
        };

        // Read in the image file as a data URL.
        reader.readAsText(file, "utf-8");
        // reader.readAsDataURL(file);
    }

function importData(data){
  if(data){
     chrome.storage.sync.set({
       "requestArrData": data
                },
                function() {
                    if (chrome.runtime.error) {
                        console.log("Runtime error.");
                    } else {
                        // 通知保存完成。
                        bg.showNotification("", "", "数据导入成功！", false);
                        chrome.runtime.sendMessage({
                            msg: "refresh-data"
                        },
                        function(response) {
                            console.log(response.result);
                        });
                    }
                });
  }
  
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
                    + '<div>请求结果：<button data-id="'+ requestArr[j].timestamp.toString() + '"class="show button">显示</button>'
                    +'<button data-id="' + requestArr[j].timestamp.toString() + '"class="hide button">隐藏</button>'
                    +'<button data-id="' + requestArr[j].timestamp.toString() + '"class="copy button">复制</button>'
                    +'<p id="' + requestArr[j].timestamp.toString() + '"></p></div> ' 
                    + '<div><button data-id="' + requestArr[j].timestamp.toString() + '"class="modify button">修改</button>' 
                    + '<button data-id="' + requestArr[j].timestamp.toString() + '"class="delete button">删除</button></div>' 
                    + '</li>';
                }
              requestList.innerHTML = listHtml;

            } else {
              requestArr = [];
            }
          $(".modify").click(function(e) {
            for (j = 0, len = requestArr.length; j < len; j++) {
                if (e.currentTarget.dataset.id == requestArr[j].timestamp.toString()) {
                    document.getElementById('timestamp').value = requestArr[j].timestamp;
                  document.getElementById('requestName').value = requestArr[j].requestName;
                  document.getElementById('requestUrl').value = requestArr[j].requestUrl;
                  document.getElementById('requestParams').value = requestArr[j].requestParams;
                  document.getElementById('requestInterval').value = requestArr[j].requestInterval;
                  document.getElementById('respFormat').value = requestArr[j].respFormat;
                  document.getElementById('requestMethod').value = requestArr[j].requestMethod;
                    requestMethod = requestArr[j].requestMethod;
                    switch (requestArr[j].requestContentType) {
                        case "text/palin":
                            document.getElementById('requestContentType').selectedIndex = 0;
                            requestContentType = "text/palin";
                            break;
                        case "application/json":
                            document.getElementById('requestContentType').selectedIndex = 1;
                            requestContentType = "application/json";
                            break;
                        }
                    if(requestArr[j].requireInteraction) {
                        document.getElementById('requireInteraction').selectedIndex = 1;
                            requireInteraction = true;
                        }else{
                            document.getElementById('requireInteraction').selectedIndex = 0;
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
   document.getElementById('requestMethod').addEventListener('change', function() {
        requestMethod = document.getElementById('requestMethod').value;
   });

    var requireInteraction = false;
  document.getElementById('requireInteraction').addEventListener('change', function() {
        var selectedIndex = document.getElementById('requireInteraction').selectedIndex;
        switch (selectedIndex) {
        case 0:
            requireInteraction = false;
            break;
        case 1:
            requireInteraction = true;
            break;
        }
       
  });

    var requestContentType = "text/palin";
  document.getElementById('requestContentType').addEventListener('change', function() {
        var selectedIndex = document.getElementById('requestContentType').selectedIndex;
        switch (selectedIndex) {
        case 0:
            requestContentType = "text/palin";
            break;
        case 1:
            requestContentType = "application/json";
            break;
        }
  });
    //添加按钮响应事件
  document.getElementById('add').addEventListener('click', () =>{
        addOrUpdate();
    });

  document.getElementById('exportData').addEventListener('click', () =>{
  
    doExportToDisk();
  });
  document.getElementById('importData').addEventListener('change', doImportFromDisk, false);
  
  document.getElementById('update').addEventListener('click', () =>{
        addOrUpdate();
    });
  document.getElementById('updateCancel').addEventListener('click', () =>{
        clearForm();
        });

        function clearForm(){
          document.getElementById('timestamp').value = "";
          document.getElementById('requestName').value = "";
          document.getElementById('requestUrl').value = "";
          document.getElementById('requestParams').value = "";
          document.getElementById('requestInterval').value = "";
          document.getElementById('respFormat').value = "";
          document.getElementById('requestMethod').value = "GET";
          document.getElementById('requestContentType').selectedIndex = 0;
          document.getElementById('requireInteraction').selectedIndex = 0;
        }

function addOrUpdate(){
      // showNotification();push.removeListener();
  var requestName = document.getElementById('requestName').value;
        if (!requestName.replace(/\s+/g, "")) {
            alert("任务名不能为空！");
            return;
        }
  var requestUrl = document.getElementById('requestUrl').value;
        if (!requestUrl.replace(/\s+/g, "")) {
            alert("请求地址不能为空！");
            return;
        }
        var requestParams = document.getElementById('requestParams').value;
        var requestInterval = document.getElementById('requestInterval').value;
  if (requestInterval && (requestInterval == -1 || requestInterval >= 1)) {
        requestInterval = parseInt(requestInterval);
  }else{
      // 默认30分钟请求一次
            requestInterval = 30;
  }
        var respFormat = document.getElementById('respFormat').value;
        var timestamp = document.getElementById('timestamp').value;
        if (!timestamp) {
            //添加操作
            timestamp = new Date().getTime();
            var data = {};
            data["requestName"] = requestName;
            data["requestUrl"] = requestUrl.replace(/\s+/g, "");
            data["requestParams"] = requestParams.replace(/\s+/g, "");
            data["requestContentType"] = requestContentType;
            data["requestMethod"] = requestMethod;
            data["requestInterval"] = requestInterval;
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
                    requestArr[j].requestInterval = requestInterval;
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



