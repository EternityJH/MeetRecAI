document.getElementById('uploadBtn').onclick = async function() {
    // 假設這裡有一個函數，它會返回一個 Promise
    // 文件上傳成功後，將返回的數據傳遞給 parseFile 函數
    var progressBar = document.getElementById('progressBar');
    progressBar.style.width = '100%';
    progressBar.textContent = '100%';
    
    // 當文件上傳完成後，啟用下載按鈕
    if(progressBar.textContent === '100%') {
        document.getElementById('downloadParsedFileBtn').disabled = false;
    }
};

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

    // 停止屏幕流和麥克風流
    displayStream.getTracks().forEach(track => track.stop());
}

// 下載視頻文件
function downloadVideo() {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm'
    });
    const url = URL.createObjectURL(blob);

    // 獲取當前時間並格式化
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
                      (now.getMonth() + 1).toString().padStart(2, '0') +
                      now.getDate().toString().padStart(2, '0') +
                      now.getHours().toString().padStart(2, '0') +
                      now.getMinutes().toString().padStart(2, '0') +
                      now.getSeconds().toString().padStart(2, '0');
    const filename = `錄製_${timestamp}.mp4`;

    // 創建並觸發下載
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // 清理資源
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

// 為按鈕添加事件監聽器
startRecordingBtn.onclick = startRecording;
stopRecordingBtn.onclick = stopRecording;

async function uploadFile() {
    const ip = document.getElementById('ipInput').value; // 獲取 IP 地址
    const token = document.getElementById('tokenInput').value; // 獲取 token
    const file = document.getElementById('fileInput').files[0];
    const formData = new FormData();
    const participantsInputValue = parseInt(document.getElementById('participantsInput').value, 10);
    const maxSpeakers = participantsInputValue + 3;
    formData.append('file', file);

    // 使用動態 IP 構建 API URL
    const baseUrl = `http://${ip}:5000`;
    const steps = [
        { url: `${baseUrl}/convert-video-to-audio`, message: '影片轉音檔完成，音檔轉文字進行中...' },
        { url: `${baseUrl}/process-audio-to-text`, message: '音檔轉文字完成，分辨發話者進行中...' },
        { 
          url: `${baseUrl}/diarize-audio-to-speakers`, 
          message: '分辨發話者完成，檔案整合中...',
          formData: function() {
            const fd = new FormData();
            fd.append('min_speakers', participantsInputValue.toString()); // 從前端獲取參與者數量
            fd.append('max_speakers', maxSpeakers.toString()); // 將參與者數量加3;
            return fd;
          }()
        },
        { url: `${baseUrl}/integrate-speaker-info-to-text`, message: '檔案整合完成' },
    ];

    // 上傳文件
    try {
        const uploadResponse = await fetch(`${baseUrl}/upload-file`, {
            method: 'POST',
            body: formData,
            headers: {
                "Authorization": "Bearer " + token,
            },
        });

        if (!uploadResponse.ok) {
            throw new Error('文件上傳失敗');
        }
        updateProgressAndMessage(25, '文件上傳成功');

        // 執行後續操作
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const response = await fetch(step.url, {
                method: 'POST',
                body: step.formData || null,
                headers: {
                    "Authorization": "Bearer " + token,
                },
            });

            if (!response.ok) {
                throw new Error(`${step.message} 失敗`);
            }
            updateProgressAndMessage(25 + ((i + 1) * 75 / steps.length), step.message);
        }

        // 啟用下載按鈕
        document.getElementById('downloadParsedFileBtn').disabled = false;

    } catch (error) {
        console.error("過程中出現錯誤：", error);
        document.getElementById('uploadStatus').textContent = error.message;
    }
}

function updateProgressAndMessage(percentage, message) {
    var progressBar = document.getElementById('progressBar');
    var uploadStatus = document.getElementById('uploadStatus');
    
    progressBar.style.width = percentage + '%';
    progressBar.textContent = Math.round(percentage) + '%';
    uploadStatus.textContent = message;
}

document.getElementById('uploadBtn').onclick = uploadFile;


function copyText() {
    var copyText = document.getElementById("copyText");
    copyText.select();
    copyText.setSelectionRange(0, 99999); /* For mobile devices */
    document.execCommand("copy");
    alert("已複製文字: " + copyText.value);
}

// 下載解析後的檔案
document.getElementById('downloadParsedFileBtn').onclick = async function() {
    const ip = document.getElementById('ipInput').value; // 從 IP 輸入欄位獲取 IP 地址
    const baseUrl = `http://${ip}:5000`; // 使用動態 IP 構建 API URL
    const token = document.getElementById('tokenInput').value; // 獲取 token

    // 首先獲取文件信息
    try {
        const fileInfoResponse = await fetch(`${baseUrl}/get-zip-file-info`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (fileInfoResponse.ok) {
            const fileInfo = await fileInfoResponse.json();
            const zipFileName = fileInfo.zip_file_name; // 從響應中獲取文件名

            // 然後使用文件名信息下載文件
            const downloadResponse = await fetch(`${baseUrl}/download-directory`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (downloadResponse.ok) {
                const blob = await downloadResponse.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = zipFileName; // 使用從第一個請求中獲取的文件名
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert('下載失敗');
            }
        } else {
            alert('獲取文件信息失敗');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('請求過程中發生錯誤');
    }
};
