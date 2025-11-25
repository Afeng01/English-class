import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksAPI } from '../services/api';
import { Navigation, Button, Card } from '../components';

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState('');
  const [levelOptions, setLevelOptions] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadLevelOptions();
  }, []);

  const loadLevelOptions = async () => {
    try {
      const response = await booksAPI.getLevelOptions();
      setLevelOptions(response.data.levels);
      if (response.data.levels.length > 0) {
        setLevel(response.data.levels[0]);
      }
    } catch (error) {
      console.error('Failed to load level options:', error);
      // 使用默认选项
      const defaultLevels = [
        '学前', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
        '初一', '初二', '初三', '高一', '高二', '高三'
      ];
      setLevelOptions(defaultLevels);
      setLevel(defaultLevels[0]);
    }
  };

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
    setSuccess(null);

    if (!selectedFile.name.toLowerCase().endsWith('.epub')) {
      setError('只支持EPUB格式的文件');
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
      const response = await booksAPI.uploadBook(file, level);
      setSuccess(response.data);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || '上传失败，请重试';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)]">
      <Navigation />

      <div className="container-section py-12">
        <div className="max-w-2xl mx-auto">
          {/* 标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--color-text)] mb-4">
              上传书籍
            </h1>
            <p className="text-[var(--color-text-secondary)] text-lg">
              上传EPUB格式的英文书籍，开始你的阅读之旅
            </p>
          </div>

          {/* 成功提示 */}
          {success && (
            <Card variant="elevated" className="mb-8 bg-green-50 border border-green-200">
              <div className="flex items-start gap-4">
                <div className="text-3xl">✅</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    上传成功！
                  </h3>
                  <div className="text-green-700 space-y-1">
                    <p><strong>书名：</strong>{success.book.title}</p>
                    <p><strong>作者：</strong>{success.book.author}</p>
                    <p><strong>难度：</strong>{success.book.level}</p>
                    <p><strong>章节数：</strong>{success.book.chapter_count}</p>
                    <p><strong>总词数：</strong>{success.book.word_count.toLocaleString()}</p>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/books/${success.book.id}`)}
                    >
                      查看书籍
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setSuccess(null)}
                    >
                      继续上传
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 上传区域 */}
          {!success && (
            <Card variant="elevated" elevation="lg" className="p-8">
              {/* 文件拖拽区域 */}
              <div
                className={`
                  border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
                  ${dragActive
                    ? 'border-[var(--color-primary)] bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                  }
                  ${file ? 'bg-gray-50' : ''}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".epub"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-4">
                    <div className="text-6xl">📚</div>
                    <div>
                      <p className="text-xl font-semibold text-[var(--color-text)]">
                        {file.name}
                      </p>
                      <p className="text-[var(--color-text-secondary)] mt-1">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      移除文件
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-6xl opacity-50">📖</div>
                    <div>
                      <p className="text-xl font-semibold text-[var(--color-text)]">
                        拖放EPUB文件到这里
                      </p>
                      <p className="text-[var(--color-text-secondary)] mt-2">
                        或者点击选择文件
                      </p>
                    </div>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      支持 .epub 格式，建议文件大小不超过 50MB
                    </p>
                  </div>
                )}
              </div>

              {/* 难度等级选择 */}
              <div className="mt-8">
                <label className="block text-sm font-medium text-[var(--color-text)] mb-3">
                  选择难度等级
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {levelOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setLevel(opt)}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${level === opt
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-gray-100 text-[var(--color-text-secondary)] hover:bg-gray-200'
                        }
                      `}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {/* 上传按钮 */}
              <div className="mt-8">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleUpload}
                  disabled={!file || !level || uploading}
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      正在上传...
                    </span>
                  ) : (
                    '上传书籍'
                  )}
                </Button>
              </div>

              {/* 提示信息 */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">上传说明</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 仅支持EPUB格式的电子书文件</li>
                  <li>• 系统会自动提取书籍信息、章节内容和高频词汇</li>
                  <li>• 上传过程可能需要几秒到几十秒，请耐心等待</li>
                  <li>• 建议选择与书籍实际难度相匹配的等级</li>
                </ul>
              </div>
            </Card>
          )}

          {/* 返回按钮 */}
          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/books')}
            >
              ← 返回书库
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
