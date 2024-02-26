document.getElementById('startRecording').onclick = async () => {
    // 獲取螢幕錄影和音頻的權限
    const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // 啟用視頻錄影
        audio: true  // 啟用音頻錄製（包括麥克風和系統音）
    });

    // 初始化MediaRecorder
    const mediaRecorder = new MediaRecorder(stream);
    let chunks = [];

    mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
            chunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        chunks = [];

        const url = URL.createObjectURL(blob);
        const video = document.querySelector('video');
        video.src = url;

        // 下載錄影檔案
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recording.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // 開始錄影
    mediaRecorder.start();
    document.getElementById('startRecording').disabled = true;
    document.getElementById('stopRecording').disabled = false;
};

document.getElementById('stopRecording').onclick = () => {
    // 停止MediaRecorder
    mediaRecorder.stop();
    document.getElementById('startRecording').disabled = false;
    document.getElementById('stopRecording').disabled = true;
};
