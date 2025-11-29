import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Database, Loader2, ShieldAlert, Trash2 } from 'lucide-react';

import Table from '../components/ui/Table';
import Dialog from '../components/ui/Dialog';
import Toast from '../components/Toast';
import { adminAPI } from '../services/api';
import type {
  AdminBackupResponse,
  AdminDeleteResponse,
  Book,
} from '../types';

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const AdminPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBackupEnabled, setDeleteBackupEnabled] = useState(true);

  const [operationLoading, setOperationLoading] = useState<'backup' | 'delete' | null>(null);
  const [backupResult, setBackupResult] = useState<AdminBackupResponse | null>(null);
  const [deleteBackupSummary, setDeleteBackupSummary] = useState<AdminBackupResponse | null>(null);
  const [deleteResult, setDeleteResult] = useState<AdminDeleteResponse | null>(null);

  const selectedBooks = useMemo(
    () => books.filter(book => selectedIds.includes(book.id)),
    [books, selectedIds]
  );
  const hasSelection = selectedIds.length > 0;
  const allSelected = books.length > 0 && selectedIds.length === books.length;

  const showToast = (message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type });
  };

  const extractError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      return (error.response?.data as { detail?: string })?.detail || error.message || '请求失败';
    }
    return '操作失败，请稍后重试';
  };

  const loadBooks = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getAllBooks();
      setBooks(data);
    } catch (error) {
      showToast(extractError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(books.map(book => book.id));
    }
  };

  const handleOpenBackupDialog = () => {
    if (!hasSelection) {
      showToast('请先选择书籍', 'info');
      return;
    }
    setBackupResult(null);
    setBackupDialogOpen(true);
  };

  const handleOpenDeleteDialog = () => {
    if (!hasSelection) {
      showToast('请先选择书籍', 'info');
      return;
    }
    setDeleteResult(null);
    setDeleteBackupSummary(null);
    setDeleteDialogOpen(true);
  };

  const closeBackupDialog = () => {
    if (operationLoading === 'backup') return;
    setBackupDialogOpen(false);
    setBackupResult(null);
  };

  const closeDeleteDialog = () => {
    if (operationLoading === 'delete') return;
    setDeleteDialogOpen(false);
    setDeleteResult(null);
    setDeleteBackupSummary(null);
  };

  const handleConfirmBackup = async () => {
    if (!hasSelection) {
      showToast('请先选择书籍', 'info');
      return;
    }
    setOperationLoading('backup');
    setBackupResult(null);
    try {
      const { data } = await adminAPI.backupBooks(selectedIds);
      setBackupResult(data);
      const successCount = data.backups.length;
      const failureCount = data.failed.length;
      showToast(
        failureCount
          ? `已备份 ${successCount} 本书籍，${failureCount} 本失败`
          : `成功备份 ${successCount} 本书籍`,
        failureCount ? 'info' : 'success'
      );
    } catch (error) {
      showToast(extractError(error), 'error');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!hasSelection) {
      showToast('请先选择书籍', 'info');
      return;
    }
    setOperationLoading('delete');
    setDeleteBackupSummary(null);
    setDeleteResult(null);

    try {
      if (deleteBackupEnabled) {
        const { data } = await adminAPI.backupBooks(selectedIds);
        setDeleteBackupSummary(data);
        if (data.failed.length) {
          showToast(`部分书籍备份失败（${data.failed.length}）`, 'info');
        }
      }

      const { data } = await adminAPI.deleteBooks(selectedIds, deleteBackupEnabled);
      setDeleteResult(data);
      await loadBooks();
      setSelectedIds([]);

      const failureCount = data.failed.length;
      showToast(
        failureCount
          ? `删除完成：成功 ${data.deleted.length} 本，失败 ${failureCount} 本`
          : `已成功删除 ${data.deleted.length} 本书籍`,
        failureCount ? 'info' : 'success'
      );
    } catch (error) {
      showToast(extractError(error), 'error');
    } finally {
      setOperationLoading(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'cover',
        title: '封面',
        width: '120px',
        render: (_: unknown, row: Book) => (
          <div className="flex items-center gap-3">
            <div className="h-16 w-12 overflow-hidden rounded-md bg-gray-100 shadow-inner">
              {row.cover ? (
                <img src={row.cover} alt={row.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">无封面</div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'title',
        title: '标题',
        className: 'min-w-[180px]',
        render: (_: unknown, row: Book) => (
          <div>
            <p className="font-semibold text-gray-900">{row.title}</p>
            <p className="text-xs text-gray-500">ID: {row.id}</p>
          </div>
        ),
      },
      {
        key: 'author',
        title: '作者',
        className: 'min-w-[140px]',
        render: (value: string | undefined) => value || '--',
      },
      {
        key: 'level',
        title: '难度',
        width: '110px',
        render: (value: string | undefined) => value || '--',
      },
      {
        key: 'lexile',
        title: '蓝思值',
        width: '110px',
        render: (value: string | undefined) => value || '--',
      },
      {
        key: 'series',
        title: '系列',
        width: '140px',
        render: (value: string | undefined) => value || '--',
      },
      {
        key: 'category',
        title: '分类',
        width: '120px',
        render: (value: Book['category']) => {
          if (value === 'fiction') return '虚构类';
          if (value === 'non-fiction') return '非虚构类';
          return '--';
        },
      },
      {
        key: 'word_count',
        title: '词数',
        width: '120px',
        render: (value: number | undefined) => (value ? value.toLocaleString('zh-CN') : '--'),
      },
      {
        key: 'created_at',
        title: '导入时间',
        width: '180px',
        render: (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false }),
      },
    ],
    []
  );

  const renderBackupDialogContent = () => {
    if (operationLoading === 'backup') {
      return (
        <div className="flex items-center gap-3 text-gray-700">
          <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
          正在备份选中的 {selectedIds.length} 本书籍，请稍候...
        </div>
      );
    }

    if (backupResult) {
      return (
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-green-700">成功备份 {backupResult.backups.length} 本书籍</p>
            <ul className="mt-2 space-y-2 rounded-md border border-green-100 bg-green-50/60 p-3 text-gray-700">
              {backupResult.backups.map(item => (
                <li key={item.book_id} className="text-xs">
                  <span className="font-semibold text-gray-900">{item.book_id}</span> → {item.backup_path}（{formatFileSize(item.backup_size)}）
                </li>
              ))}
            </ul>
          </div>
          {!!backupResult.failed.length && (
            <div>
              <p className="font-medium text-red-600">备份失败 {backupResult.failed.length} 本：</p>
              <ul className="mt-2 space-y-2 rounded-md border border-red-100 bg-red-50/60 p-3 text-gray-700">
                {backupResult.failed.map(item => (
                  <li key={item.book_id} className="text-xs">
                    <span className="font-semibold text-gray-900">{item.book_id}</span>：{item.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-gray-700">
          即将备份 <span className="font-semibold text-gray-900">{selectedIds.length}</span> 本书籍，备份文件会保存到
          <span className="font-semibold text-gray-900"> backend/data/backups </span>目录。
        </p>
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-gray-100 bg-gray-50/60 p-3 text-xs text-gray-600">
          {selectedBooks.map(book => (
            <li key={book.id}>{book.title}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderDeleteDialogContent = () => {
    if (operationLoading === 'delete') {
      return (
        <div className="flex items-center gap-3 text-gray-700">
          <Loader2 className="h-4 w-4 animate-spin text-red-600" />
          正在执行删除操作，请勿关闭此窗口...
        </div>
      );
    }

    if (deleteResult) {
      return (
        <div className="space-y-4">
          {deleteBackupSummary && (
            <div className="rounded-md border border-teal-100 bg-teal-50/60 p-3 text-sm">
              <p className="font-medium text-teal-700">
                备份完成：成功 {deleteBackupSummary.backups.length} 本，失败 {deleteBackupSummary.failed.length} 本
              </p>
              {!!deleteBackupSummary.failed.length && (
                <ul className="mt-2 space-y-1 text-xs text-gray-600">
                  {deleteBackupSummary.failed.map(item => (
                    <li key={item.book_id}>
                      {item.book_id}：{item.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="rounded-md border border-red-100 bg-red-50/60 p-3 text-sm">
            <p className="font-semibold text-red-700">
              删除结果：成功 {deleteResult.deleted.length} 本，失败 {deleteResult.failed.length} 本
            </p>
            {!!deleteResult.failed.length && (
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                {deleteResult.failed.map(item => (
                  <li key={item.book_id}>
                    {item.book_id}：{item.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 text-sm text-gray-700">
        <div className="flex items-start gap-3 rounded-md border border-red-100 bg-red-50/70 p-3 text-red-700">
          <AlertTriangle className="mt-0.5 h-5 w-5" />
          <div>
            <p className="font-semibold">危险操作：即将删除 {selectedIds.length} 本书籍，此操作不可撤销！</p>
            <p className="text-xs text-red-500">删除后书籍及其章节、词汇将永久移除。</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            checked={deleteBackupEnabled}
            onChange={(event) => setDeleteBackupEnabled(event.target.checked)}
          />
          删除前自动备份（推荐）
        </label>
        <div>
          <p className="mb-2 text-xs text-gray-500">待删除书籍：</p>
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-gray-100 bg-gray-50/60 p-3 text-xs text-gray-600">
            {selectedBooks.map(book => (
              <li key={book.id}>{book.title}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const backupDialogFooter = backupResult ? (
    <button
      onClick={closeBackupDialog}
      className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
    >
      完成
    </button>
  ) : (
    <>
      <button
        onClick={closeBackupDialog}
        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
      >
        取消
      </button>
      <button
        onClick={handleConfirmBackup}
        className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:opacity-70"
        disabled={operationLoading === 'backup'}
      >
        {operationLoading === 'backup' && <Loader2 className="h-4 w-4 animate-spin" />}
        开始备份
      </button>
    </>
  );

  const deleteDialogFooter = deleteResult ? (
    <button
      onClick={closeDeleteDialog}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
    >
      关闭
    </button>
  ) : (
    <>
      <button
        onClick={closeDeleteDialog}
        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
      >
        取消
      </button>
      <button
        onClick={handleConfirmDelete}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-70"
        disabled={operationLoading === 'delete'}
      >
        {operationLoading === 'delete' && <Loader2 className="h-4 w-4 animate-spin" />}
        确认删除
      </button>
    </>
  );

  return (
    <main className="flex-1 bg-[#F8F6EF] px-4 py-8 lg:px-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={4000}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50/80 p-4">
          <ShieldAlert className="h-6 w-6 text-yellow-600" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">⚠️ 管理员模式 - 请谨慎操作</p>
            <p className="text-xs text-yellow-700">
              所有操作将直接作用于线上数据库，务必确认书籍与备份结果。
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
            <button
              onClick={handleSelectAll}
              className="rounded-md border border-gray-200 px-3 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {allSelected ? '取消全选' : '全选全部书籍'}
            </button>
            <span>
              已选择：
              <span className="font-semibold text-gray-900">{selectedIds.length}</span>
              本书
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenBackupDialog}
              disabled={!hasSelection || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-teal-600 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-60"
            >
              <Database className="h-4 w-4" />
              备份选中书籍
            </button>
            <button
              onClick={handleOpenDeleteDialog}
              disabled={!hasSelection || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              删除选中书籍
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">书籍列表</h2>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在加载...
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
              <span className="ml-2 text-sm">数据加载中...</span>
            </div>
          ) : (
            <Table<Book>
              columns={columns}
              data={books}
              rowKey="id"
              selectable
              selectedRows={selectedIds}
              onSelectionChange={setSelectedIds}
              emptyText="暂无书籍，请先在后台导入数据"
            />
          )}
        </div>
      </div>

      <Dialog
        open={backupDialogOpen}
        onClose={closeBackupDialog}
        title="备份选中书籍"
        footer={backupDialogFooter}
      >
        {renderBackupDialogContent()}
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        title="删除选中书籍"
        footer={deleteDialogFooter}
      >
        {renderDeleteDialogContent()}
      </Dialog>
    </main>
  );
};

export default AdminPage;
