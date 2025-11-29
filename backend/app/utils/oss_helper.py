"""
图片存储工具：优先使用云端（阿里云OSS或Supabase Storage），失败时退回本地
"""
import io
import os
import shutil
from typing import List, Optional
import logging

try:
    import oss2
    OSS_AVAILABLE = True
except ImportError:
    OSS_AVAILABLE = False

from app.config import oss_config
from app.utils.supabase_client import supabase_client

logger = logging.getLogger(__name__)


class OSSHelper:
    """OSS存储助手类"""

    def __init__(self):
        """初始化OSS客户端"""
        self.enabled = False
        self.bucket = None
        self.backend: str = "local"  # ali_oss / supabase / local
        self.supabase_bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "book-images")
        self.supabase_storage = None

        # 优先尝试阿里云OSS
        if oss_config.use_oss:
            if not OSS_AVAILABLE:
                logger.warning("❌ oss2库未安装，无法使用阿里云OSS。请执行: pip3 install oss2==2.18.4")
                logger.warning("   如需指定Python版本，可执行: python3 -m pip install oss2==2.18.4")
            elif not oss_config.is_configured():
                logger.warning("❌ OSS配置不完整，请检查 .env 中的 OSS_ACCESS_KEY_ID/SECRET/ENDPOINT/BUCKET 配置")
            else:
                try:
                    auth = oss2.Auth(
                        oss_config.access_key_id,
                        oss_config.access_key_secret
                    )
                    self.bucket = oss2.Bucket(
                        auth,
                        oss_config.endpoint,
                        oss_config.bucket_name,
                        connect_timeout=30
                    )
                    self.enabled = True
                    self.backend = "ali_oss"
                    logger.info(f"✅ 阿里云OSS初始化成功: bucket={oss_config.bucket_name}")
                    return
                except Exception as e:
                    logger.error(f"❌ OSS初始化失败: {e}，将尝试Supabase或本地存储")

        # 其次尝试Supabase Storage（无需额外配置）
        if supabase_client.enabled and supabase_client.client:
            try:
                self.supabase_storage = supabase_client.client.storage
                self.enabled = True
                self.backend = "supabase"
                logger.info(f"使用Supabase Storage作为图片存储，bucket={self.supabase_bucket}")
                return
            except Exception as e:
                logger.error(f"Supabase Storage 初始化失败: {e}，将使用本地存储")

        logger.info("未启用任何云端图片存储，将使用本地存储")

    def upload_image(self, image_data: bytes, object_name: str) -> str:
        """
        上传图片到OSS

        Args:
            image_data: 图片二进制数据
            object_name: OSS对象名称（如：book_id/unique_name.jpg）

        Returns:
            图片访问URL

        Raises:
            Exception: 上传失败时抛出异常
        """
        if not self.enabled:
            raise RuntimeError("OSS未启用或初始化失败")

        if self.backend == "ali_oss":
            try:
                result = self.bucket.put_object(object_name, image_data)
                if result.status != 200:
                    raise Exception(f"OSS上传失败，状态码: {result.status}")

                url = f"https://{oss_config.bucket_name}.{oss_config.endpoint.replace('http://', '').replace('https://', '')}/{object_name}"
                logger.info(f"图片上传成功: {object_name}")
                return url

            except oss2.exceptions.OssError as e:
                logger.error(f"OSS上传失败: {e}")
                raise Exception(f"OSS上传失败: {e}")
            except Exception as e:
                logger.error(f"图片上传失败: {e}")
                raise

        if self.backend == "supabase":
            try:
                storage_bucket = self.supabase_storage.from_(self.supabase_bucket)
                response = storage_bucket.upload(
                    path=object_name,
                    file=image_data,
                    file_options={"content-type": "image/jpeg"}
                )

                # Supabase Python SDK返回dict或具有error属性的对象
                error_obj = None
                if isinstance(response, dict):
                    error_obj = response.get("error")
                elif hasattr(response, "error"):
                    error_obj = getattr(response, "error")
                if error_obj:
                    raise Exception(getattr(error_obj, "message", str(error_obj)))

                public_url_data = storage_bucket.get_public_url(object_name)
                url = None
                if isinstance(public_url_data, dict):
                    url = public_url_data.get("publicUrl") or public_url_data.get("data", {}).get("publicUrl")
                elif isinstance(public_url_data, str):
                    url = public_url_data

                if not url:
                    raise Exception("无法获取Supabase公共URL，请确认Bucket为public")

                logger.info(f"图片上传成功: {object_name}")
                return url
            except Exception as e:
                logger.error(f"Supabase Storage 上传失败: {e}")
                raise

        raise RuntimeError("未找到可用的云存储后端")

    def delete_images(self, book_id: str) -> bool:
        """
        删除指定书籍的所有图片

        Args:
            book_id: 书籍ID

        Returns:
            是否成功删除
        """
        if not self.enabled:
            logger.info("云存储未启用，跳过远程删除")
            return False

        if self.backend == "ali_oss":
            try:
                prefix = f"{book_id}/"
                objects_to_delete = [obj.key for obj in oss2.ObjectIterator(self.bucket, prefix=prefix)]

                if not objects_to_delete:
                    logger.info(f"书籍 {book_id} 没有OSS图片需要删除")
                    return True

                result = self.bucket.batch_delete_objects(objects_to_delete)
                if len(result.deleted_keys) == len(objects_to_delete):
                    logger.info(f"成功删除书籍 {book_id} 的 {len(objects_to_delete)} 张图片")
                    return True
                logger.warning(f"部分图片删除失败，成功: {len(result.deleted_keys)}, 总数: {len(objects_to_delete)}")
                return False
            except oss2.exceptions.OssError as e:
                logger.error(f"OSS删除失败: {e}")
                return False
            except Exception as e:
                logger.error(f"删除图片失败: {e}")
                return False

        if self.backend == "supabase":
            try:
                prefix = f"{book_id}"
                storage_bucket = self.supabase_storage.from_(self.supabase_bucket)
                response = storage_bucket.list(prefix)
                file_list = []
                if isinstance(response, dict):
                    file_list = response.get("data") or []
                elif isinstance(response, list):
                    file_list = response

                if not file_list:
                    logger.info(f"Supabase Storage 中没有书籍 {book_id} 的图片")
                    return True

                paths_to_delete = [f"{prefix}/{file.get('name')}" for file in file_list if file.get('name')]
                if not paths_to_delete:
                    logger.info(f"Supabase Storage 找不到可删除的图片: {book_id}")
                    return True

                delete_response = storage_bucket.remove(paths_to_delete)
                if isinstance(delete_response, dict) and delete_response.get("error"):
                    logger.warning(f"Supabase 删除部分失败: {delete_response['error']}")
                    return False

                logger.info(f"已删除 Supabase Storage 中书籍 {book_id} 的 {len(paths_to_delete)} 张图片")
                return True
            except Exception as e:
                logger.error(f"Supabase Storage 删除失败: {e}")
                return False
        return False

    def save_image_local(self, image_data: bytes, save_path: str) -> str:
        """
        保存图片到本地（fallback方案）

        Args:
            image_data: 图片二进制数据
            save_path: 本地保存路径

        Returns:
            本地访问URL
        """
        try:
            # 确保目录存在
            os.makedirs(os.path.dirname(save_path), exist_ok=True)

            # 保存文件
            with open(save_path, 'wb') as f:
                f.write(image_data)

            # 生成相对URL
            # 假设save_path格式: backend/data/images/book_id/file.jpg
            # 返回: /static/images/book_id/file.jpg
            parts = save_path.split(os.sep)
            if 'images' in parts:
                idx = parts.index('images')
                relative_path = '/'.join(parts[idx:])
                return f"/static/{relative_path}"

            return save_path

        except Exception as e:
            logger.error(f"本地保存图片失败: {e}")
            raise

    def delete_local_images(self, book_id: str, backend_dir: str) -> bool:
        """
        删除本地图片目录

        Args:
            book_id: 书籍ID
            backend_dir: backend目录路径

        Returns:
            是否成功删除
        """
        try:
            images_dir = os.path.join(backend_dir, "data", "images", book_id)
            if os.path.exists(images_dir):
                shutil.rmtree(images_dir)
                logger.info(f"成功删除本地图片目录: {images_dir}")
                return True
            else:
                logger.info(f"本地图片目录不存在: {images_dir}")
                return True
        except Exception as e:
            logger.error(f"删除本地图片目录失败: {e}")
            return False


# 全局实例
oss_helper = OSSHelper()
