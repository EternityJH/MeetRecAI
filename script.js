// document.getElementById('uploadBtn').onclick = async function() {
//     // 假设这里是处理文件上传的逻辑...
//     // 文件上传完成后，进度条更新到100%
//     var progressBar = document.getElementById('progressBar');
//     progressBar.style.width = '100%';
//     progressBar.textContent = '100%';
    
//     // 当进度条达到100%时，启用下载按钮
//     if(progressBar.textContent === '100%') {
//         document.getElementById('downloadParsedFileBtn').disabled = false;
//     }
// };

// // 示例：下载按钮的点击事件处理器
// document.getElementById('downloadParsedFileBtn').onclick = function() {
//     alert('假设这里处理下载解析完成的文件...');
//     // 这里添加实际的下载文件逻辑
// };




// // 为语言选择菜单添加事件监听器
// document.getElementById('languageSelect').addEventListener('change', function() {
//     var selectedLanguage = this.value;
//     alert('你选择的语言是：' + selectedLanguage);
//     // 根据选择的语言执行更多操作...
// });


// 增加開始錄製和停止錄製按鈕
var startRecordingBtn = document.getElementById('startRecordingBtn');
var stopRecordingBtn = document.getElementById('stopRecordingBtn');

var mediaRecorder;
var recordedChunks = [];

async function startRecording() {
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = false;

    // 獲取屏幕流（包含系統音效）
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true // 確保包含系統音效
    });

    // 獲取麥克風流
    const microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: true
    });

    // 混合音頻流
    const audioContext = new AudioContext();
    const microphoneSource = audioContext.createMediaStreamSource(microphoneStream);
    const displaySource = audioContext.createMediaStreamSource(displayStream);
    const destination = audioContext.createMediaStreamDestination();
    microphoneSource.connect(destination);
    displaySource.connect(destination);

    // 混合屏幕流和音頻流
    const mixedStream = new MediaStream([...displayStream.getVideoTracks(), ...destination.stream.getTracks()]);

    // 使用MediaRecorder開始錄製
    mediaRecorder = new MediaRecorder(mixedStream);
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
    mediaRecorder.start();

    // 監聽錄製停止事件
    mediaRecorder.onstop = downloadVideo;
}

// 停止錄製
function stopRecording() {
    stopRecordingBtn.disabled = true;
    startRecordingBtn.disabled = false;
    mediaRecorder.stop();
}

// 下載視頻文件
function downloadVideo() {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recording.mp4';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

// 為按鈕添加事件監聽器
startRecordingBtn.onclick = startRecording;
stopRecordingBtn.onclick = stopRecording;

function uploadFile() {
    var file = document.getElementById('fileInput').files[0];
    var formData = new FormData();
    formData.append('file', file);

    var xhr = new XMLHttpRequest();
    // 將URL更改為包含完整主機地址和端口號
    xhr.open('POST', 'http://localhost:5000/upload', true);

    // 進度條事件
    xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
            var percentComplete = (e.loaded / e.total) * 100;
            var progressBar = document.getElementById('progressBar');
            progressBar.style.width = percentComplete + '%';
            progressBar.textContent = Math.round(percentComplete) + '%';
        }
    };

    // 上傳完成處理
    xhr.onload = function() {
        if (xhr.status === 200) {
            // 更新進度條
            var progressBar = document.getElementById('progressBar');
            progressBar.style.width = '100%';
            progressBar.textContent = '100%';

            // 顯示上傳完成消息
            document.getElementById('uploadStatus').innerHTML = '上傳完成！';
        } else {
            document.getElementById('uploadStatus').innerHTML = '上傳失敗。';
        }
    };

    xhr.send(formData);
}
// 確保其餘代碼不變，只需添加以下行到 script.js 的底部
document.getElementById('uploadBtn').onclick = uploadFile;
