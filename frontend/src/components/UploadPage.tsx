import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { booksAPI } from '../services/api';

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState('一年级');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const levelOptions = [
    '学前', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
    '初一', '初二', '初三', '高一', '高二', '高三'
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    setError(null);
    setSuccess(false);

    if (!selectedFile.name.toLowerCase().endsWith('.epub')) {
      setError('只支持 EPUB 格式的文件');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('请选择要上传的文件');
      return;
    }

    if (!level) {
      setError('请选择难度等级');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await booksAPI.uploadBook(file, level);
      setSuccess(true);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // 2秒后跳转到书架
      setTimeout(() => {
        navigate('/shelf');
      }, 2000);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setError(error.response?.data?.detail || '上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="flex-grow w-full max-w-4xl mx-auto px-6 py-10">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/shelf')}
        className="flex items-center gap-2 text-gray-600 hover:text-teal-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回书架</span>
      </button>

      <h1 className="text-3xl font-bold text-gray-800 mb-2">上传书籍</h1>
      <p className="text-gray-600 mb-8">支持上传 EPUB 格式的电子书</p>

      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        {/* 拖拽上传区域 */}
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
            dragActive
              ? 'border-teal-500 bg-teal-50'
              : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            拖拽文件到此处，或
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-teal-700 hover:underline ml-1"
            >
              点击选择文件
            </button>
          </p>
          <p className="text-sm text-gray-500">仅支持 .epub 格式</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".epub"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* 已选择的文件 */}
        {file && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg flex items-center gap-3">
            <FileText className="w-8 h-8 text-teal-600" />
            <div className="flex-grow">
              <p className="font-medium text-gray-800">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}

        {/* 难度等级选择 */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            难度等级
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          >
            {levelOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 成功提示 */}
        {success && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700">上传成功！正在跳转到书架...</p>
          </div>
        )}

        {/* 上传按钮 */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading || success}
          className={`mt-6 w-full py-3 rounded-lg font-medium transition-all ${
            !file || uploading || success
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-teal-700 text-white hover:bg-teal-800 shadow-lg hover:shadow-xl'
          }`}
        >
          {uploading ? '上传中...' : success ? '上传成功' : '开始上传'}
        </button>
      </div>
    </main>
  );
}
