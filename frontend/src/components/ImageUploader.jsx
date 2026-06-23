import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

export default function ImageUploader({ onUpload, currentUrl = '', previewSize = 'h-40' }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    setUploading(true);
    try {
      // 本地预览
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // 上传到服务器（由父组件提供 onUpload 回调）
      if (onUpload) {
        const url = await onUpload(file);
        if (url) setPreview(url);
      }
    } catch (err) {
      alert('上传失败: ' + (err.message || '未知错误'));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div
        className={`relative border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-colors ${previewSize} ${
          dragOver ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="text-center">
            <div className="skeleton w-10 h-10 rounded-full mx-auto mb-2" />
            <p className="text-xs text-text-sub">上传中...</p>
          </div>
        ) : preview ? (
          <div className="relative w-full h-full">
            <img src={preview} alt="预览" className="w-full h-full object-cover rounded-xl" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="text-center px-4">
            <Upload size={28} className="text-gray-300 mx-auto mb-1.5" />
            <p className="text-xs text-text-sub">点击或拖拽上传图片</p>
            <p className="text-xs text-text-sub opacity-60 mt-0.5">JPG/PNG/GIF/WebP，≤5MB</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
      />
    </div>
  );
}
