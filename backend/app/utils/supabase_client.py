"""
Supabase客户端封装
用于后端与Supabase数据库交互
"""
import os
import logging
from typing import Optional, List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Supabase客户端单例"""

    _instance: Optional['SupabaseClient'] = None
    _client: Optional[Client] = None
    _enabled: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            self._initialize()

    def _initialize(self):
        """初始化Supabase客户端"""
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')

        if not supabase_url or not supabase_key:
            logger.warning("⚠️ Supabase配置未找到，将仅使用SQLite本地数据库")
            logger.warning("   请在.env文件中配置SUPABASE_URL和SUPABASE_SERVICE_KEY")
            self._enabled = False
            return

        # 检查是否是placeholder
        if 'placeholder' in supabase_key or supabase_key == 'your_service_role_key_here':
            logger.warning("⚠️ Supabase Service Key为placeholder，请配置真实的Service Role Key")
            self._enabled = False
            return

        try:
            self._client = create_client(supabase_url, supabase_key)
            self._enabled = True
            logger.info("✅ Supabase客户端初始化成功")
        except Exception as e:
            logger.error(f"❌ Supabase客户端初始化失败: {e}")
            self._enabled = False

    @property
    def enabled(self) -> bool:
        """Supabase是否已启用"""
        return self._enabled

    @property
    def client(self) -> Optional[Client]:
        """获取Supabase客户端实例"""
        return self._client if self._enabled else None

    # ==================== 书籍操作 ====================

    def insert_book(self, book_data: Dict[str, Any]) -> bool:
        """插入书籍数据"""
        if not self.enabled:
            return False

        try:
            result = self.client.table('books').insert(book_data).execute()
            logger.info(f"✅ 书籍已插入Supabase: {book_data.get('title')}")
            return True
        except Exception as e:
            logger.error(f"❌ 插入书籍失败: {e}")
            return False

    def get_book(self, book_id: str) -> Optional[Dict[str, Any]]:
        """获取书籍信息（附带章节列表，供目录展示）"""
        if not self.enabled:
            return None

        try:
            result = self.client.table('books').select('*').eq('id', book_id).single().execute()
            book_data = result.data
            if not book_data:
                return None

            # 同步查询章节并附带到返回结果，避免前端目录缺失
            chapters_result = self.client.table('chapters')\
                .select('*')\
                .eq('book_id', book_id)\
                .order('chapter_number')\
                .execute()
            book_data['chapters'] = chapters_result.data or []

            return book_data
        except Exception as e:
            logger.error(f"获取书籍失败: {e}")
            return None

    def list_books(self, level: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        """获取书籍列表"""
        if not self.enabled:
            return []

        try:
            query = self.client.table('books').select('*')

            if level:
                query = query.eq('level', level)
            if search:
                query = query.ilike('title', f'%{search}%')

            result = query.order('created_at', desc=True).execute()
            return result.data
        except Exception as e:
            logger.error(f"获取书籍列表失败: {e}")
            return []

    def delete_book(self, book_id: str) -> bool:
        """删除书籍"""
        if not self.enabled:
            return False

        try:
            self.client.table('books').delete().eq('id', book_id).execute()
            logger.info(f"✅ 书籍已从Supabase删除: {book_id}")
            return True
        except Exception as e:
            logger.error(f"删除书籍失败: {e}")
            return False

    # ==================== 章节操作 ====================

    def insert_chapter(self, chapter_data: Dict[str, Any]) -> bool:
        """插入章节数据"""
        if not self.enabled:
            return False

        try:
            self.client.table('chapters').insert(chapter_data).execute()
            return True
        except Exception as e:
            logger.error(f"插入章节失败: {e}")
            return False

    def bulk_insert_chapters(self, chapters_data: List[Dict[str, Any]]) -> bool:
        """批量插入章节数据"""
        if not self.enabled:
            return False

        try:
            self.client.table('chapters').insert(chapters_data).execute()
            logger.info(f"✅ {len(chapters_data)} 个章节已插入Supabase")
            return True
        except Exception as e:
            logger.error(f"批量插入章节失败: {e}")
            return False

    def get_chapters(self, book_id: str) -> List[Dict[str, Any]]:
        """获取书籍的所有章节"""
        if not self.enabled:
            return []

        try:
            result = self.client.table('chapters')\
                .select('*')\
                .eq('book_id', book_id)\
                .order('chapter_number')\
                .execute()
            return result.data
        except Exception as e:
            logger.error(f"获取章节失败: {e}")
            return []

    def get_chapter(self, book_id: str, chapter_number: int) -> Optional[Dict[str, Any]]:
        """获取指定章节"""
        if not self.enabled:
            return None

        try:
            result = self.client.table('chapters')\
                .select('*')\
                .eq('book_id', book_id)\
                .eq('chapter_number', chapter_number)\
                .single()\
                .execute()
            return result.data
        except Exception as e:
            logger.error(f"获取章节失败: {e}")
            return None

    # ==================== 词汇操作 ====================

    def insert_vocabulary(self, vocab_data: Dict[str, Any]) -> bool:
        """插入词汇数据"""
        if not self.enabled:
            return False

        try:
            self.client.table('book_vocabulary').insert(vocab_data).execute()
            return True
        except Exception as e:
            logger.error(f"插入词汇失败: {e}")
            return False

    def bulk_insert_vocabulary(self, vocab_data_list: List[Dict[str, Any]]) -> bool:
        """批量插入词汇数据"""
        if not self.enabled:
            return False

        try:
            self.client.table('book_vocabulary').insert(vocab_data_list).execute()
            logger.info(f"✅ {len(vocab_data_list)} 个词汇已插入Supabase")
            return True
        except Exception as e:
            logger.error(f"批量插入词汇失败: {e}")
            return False

    def get_book_vocabulary(self, book_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """获取书籍词汇"""
        if not self.enabled:
            return []

        try:
            result = self.client.table('book_vocabulary')\
                .select('*')\
                .eq('book_id', book_id)\
                .order('frequency', desc=True)\
                .limit(limit)\
                .execute()
            return result.data
        except Exception as e:
            logger.error(f"获取书籍词汇失败: {e}")
            return []


# 创建全局单例实例
supabase_client = SupabaseClient()
