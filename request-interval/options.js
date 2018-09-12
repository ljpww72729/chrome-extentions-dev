// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
  Grays out or [whatever the opposite of graying out is called] the option
  field.
*/
function ghost(isDeactivated) {
  options.style.color = isDeactivated ? 'graytext' : 'black';
                                              // The label color.
  options.frequency.disabled = isDeactivated; // The control manipulability.
}

function updateRequest(timestamp){
  alert(timestamp);
}

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

//      popup中调用background中的方法
    var bg = chrome.extension.getBackgroundPage();//获取background页面


window.addEventListener('load', function() {
  // Initialize the option controls.
  // options.isActivated.checked = JSON.parse(localStorage.isActivated);
  //                                        // The display activation.
  // options.frequency.value = localStorage.frequency;
  //                                        // The display frequency, in minutes.

  // if (!options.isActivated.checked) { ghost(true); }

  // // Set the display activation and frequency.
  // options.isActivated.onchange = function() {
  //   localStorage.isActivated = options.isActivated.checked;
  //   ghost(!options.isActivated.checked);
  // };

  // options.frequency.onchange = function() {
  //   localStorage.frequency = options.frequency.value;
  // };
  var requestArr;
  chrome.storage.sync.get("requestArrData",function(result){
        if (!chrome.runtime.error) {
            if(result.requestArrData){
               requestArr = JSON.parse(result.requestArrData);
              // 展示数据
              var popContent =
                '<li class="monitory-point-li" indexcode="00000000001310013631">'+
                  '<span class="checkbox-unchecked"></span>'+
                  '<span class="monitory-text" title="'+requestArr[0].requestName+'">'+requestArr[0].requestMethod+'</span>'+
                '</li>';
                var listHtml = "";
                for(j = 0,len=requestArr.length; j < len; j++) {
                  listHtml += '<li><div>' + requestArr[j].requestName + ' | '
                         + requestArr[j].requestMethod + ' | ' 
                         + new Date(requestArr[j].timestamp).Format("yyyy-MM-dd hh:mm") + ' | ' 
                         + requestArr[j].requestInterval + ' 分钟 | '
                         + new Date(requestArr[j].lastRequestTime).Format("yyyy-MM-dd hh:mm")  + ' | </div>'
                         + '<div>请求地址：'+ requestArr[j].requestUrl + '</div> '
                         + '<div>请求参数：'+ requestArr[j].requestParams + '</div> '
                         + '<div><button data-id="' + j + '"class="modify">修改</button>' 
                         + '<button data-id="' + j + '"class="delete">删除</button></div>' 
                         + '</li>';
                }
            requestList.innerHTML = listHtml;

            }else{
                requestArr = [];
            }
            $(".modify").click(function(e){
    console.log(e.currentTarget.dataset.id)
  });
             $(".delete").click(function(e){
    console.log(e.currentTarget.dataset.id)
    requestArr.splice(e.currentTarget.dataset.id,1);
    var jsonString = JSON.stringify(requestArr);
    chrome.storage.sync.set({"requestArrData": jsonString}, function() {
        if (chrome.runtime.error) {
            console.log("Runtime error.");
        }else{
            // 通知保存完成。
            bg.showNotification("数据删除成功！");
            chrome.runtime.sendMessage({msg: "refresh-data"}, function(response) {
             console.log(response.result);
            });
            location.reload();
        }
    });
    
  });
        }
  });

  // var modify = document.getElementsByName('modify');
  //   modify[0].addEventListener('click', (e) => {
  //     e.currentTarget
  //   });
  
  var requestMethod = "GET";
  requestForm.requestMethod.onchange = function() {
    requestMethod = requestForm.requestMethod.value;
  };
  var requestContentType = "text/palin";
  requestForm.requestContentType.onchange = function() {
    var selectedIndex = requestForm.requestContentType.selectedIndex;
    switch(selectedIndex){
      case 0 :
      requestContentType = "text/palin";
      break;
      case 1 :
      requestContentType = "application/json";
      break;
    }
  };
   //添加按钮响应事件
    add.addEventListener('click', () => {
      
      // showNotification();push.removeListener();

    var requestName = requestForm.requestName.value;
    if (!requestName.replace(/\s+/g,"")) {
        alert("任务名不能为空！");
        return;
    }
    var requestUrl = requestForm.requestUrl.value;
    if (!requestUrl.replace(/\s+/g,"")) {
        alert("请求地址不能为空！");
        return;
    }
    var requestParams = requestForm.requestParams.value;
    var requestInterval = requestForm.requestInterval.value;
    var timestamp = new Date().getTime();
    
    var data = {};
    data["requestName"] = requestName;
    data["requestUrl"] = requestUrl.replace(/\s+/g,"");
    data["requestParams"] = requestParams.replace(/\s+/g,"");
    data["requestContentType"] = requestContentType;
    data["requestMethod"] = requestMethod; 
    data["requestInterval"] = parseInt(requestInterval.replace(/\s+/g,""));
    data["lastRequestTime"] = 0;
    data["timestamp"] = timestamp;

    

    requestArr.push(data);
    var jsonString = JSON.stringify(requestArr);  //[{"id":1,"name":"test1","age":2}]
     console.log(jsonString);
    chrome.storage.sync.set({"requestArrData": jsonString}, function() {
        if (chrome.runtime.error) {
            console.log("Runtime error.");
        }else{
            // 通知保存完成。
            bg.showNotification("数据添加成功！");
            chrome.runtime.sendMessage({msg: "refresh-data"}, function(response) {
             console.log(response.result);
            });
            location.reload();
        }
    });
   
  


    });
});
