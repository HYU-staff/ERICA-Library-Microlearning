"use client";

import { useState } from "react";

const keyMap: Record<string, string> = {
  "학정관 자료이용.mp4": "hakjeonggwan-resources.mp4",
  "학정관 꿀팁.mp4": "hakjeonggwan-tips.mp4",
  "학정관 첫걸음.mp4": "hakjeonggwan-first-steps.mp4",
  "학정관 시설안내.mp4": "hakjeonggwan-facilities.mp4",
};

export default function VideoUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("영상을 선택해주세요.");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    setUploading(true);
    try {
      for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
        const file = files[fileIndex];
        const key = keyMap[file.name];
        if (!key) throw new Error(`${file.name}은 등록된 영상이 아닙니다.`);
        setStatus(`${file.name} 업로드 준비 중…`);
        const start = await fetch(`/api/video-upload/start?key=${encodeURIComponent(key)}`, { method: "POST" });
        if (!start.ok) throw new Error(await start.text());
        const { uploadId } = await start.json();
        const parts: { partNumber: number; etag: string }[] = [];
        const chunkSize = 20 * 1024 * 1024;
        const totalParts = Math.ceil(file.size / chunkSize);
        for (let index = 0; index < totalParts; index += 1) {
          const partNumber = index + 1;
          const chunk = file.slice(index * chunkSize, Math.min(file.size, (index + 1) * chunkSize));
          setStatus(`${file.name} 업로드 중 · ${partNumber}/${totalParts}`);
          const response = await fetch(`/api/video-upload/part?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}`, { method: "PUT", body: chunk });
          if (!response.ok) throw new Error(await response.text());
          parts.push(await response.json());
          const doneParts = files.slice(0, fileIndex).reduce((sum, item) => sum + Math.ceil(item.size / chunkSize), 0) + partNumber;
          const allParts = files.reduce((sum, item) => sum + Math.ceil(item.size / chunkSize), 0);
          setProgress(Math.round((doneParts / allParts) * 100));
        }
        const complete = await fetch(`/api/video-upload/complete?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ parts }) });
        if (!complete.ok) throw new Error(await complete.text());
      }
      setProgress(100);
      setStatus("네 개 영상 업로드를 완료했습니다.");
    } catch (error) {
      setStatus(`업로드 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  return <main className="upload-page"><section><p className="kicker">VIDEO UPLOAD</p><h1>학정관 교육 영상 업로드</h1><p>지정된 네 개 MP4 파일을 모두 선택한 뒤 업로드를 시작하세요.</p><input id="video-files" type="file" accept="video/mp4" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))}/><div className="upload-list">{files.map((file) => <span key={file.name}>{file.name} · {(file.size / 1024 / 1024).toFixed(1)}MB</span>)}</div><button id="upload-button" disabled={uploading || files.length !== 4} onClick={upload}>{uploading ? "업로드 중…" : "네 개 영상 업로드"}</button><div className="progress-track"><i style={{ width: `${progress}%` }}/></div><output>{status}</output></section></main>;
}
