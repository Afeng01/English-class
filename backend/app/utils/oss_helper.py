"""
阿里云OSS图片存储工具
提供图片上传、删除等功能
"""
import os
import shutil
from typing import Optional
import logging

try:
    import oss2
    OSS_AVAILABLE = True
except ImportError:
    OSS_AVAILABLE = False

from app.config import oss_config

logger = logging.getLogger(__name__)


class OSSHelper:
    """OSS存储助手类"""

    def __init__(self):
        """初始化OSS客户端"""
        self.enabled = False
        self.bucket = None

        if not oss_config.use_oss:
            logger.info("OSS功能未启用，将使用本地存储")
            return

        if not OSS_AVAILABLE:
            logger.warning("oss2库未安装，无法使用OSS功能，将使用本地存储")
            return

        if not oss_config.is_configured():
            logger.warning("OSS配置不完整，将使用本地存储")
            return

        try:
            # 初始化OSS客户端
            auth = oss2.Auth(
                oss_config.access_key_id,
                oss_config.access_key_secret
            )
            self.bucket = oss2.Bucket(
                auth,
                oss_config.endpoint,
                oss_config.bucket_name,
                connect_timeout=30  # 连接超时30秒
            )
            self.enabled = True
            logger.info(f"OSS初始化成功: bucket={oss_config.bucket_name}")
        except Exception as e:
            logger.error(f"OSS初始化失败: {e}，将使用本地存储")
            self.enabled = False

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

        try:
            # 上传到OSS
            result = self.bucket.put_object(object_name, image_data)

            if result.status != 200:
                raise Exception(f"OSS上传失败，状态码: {result.status}")

            # 生成访问URL（不使用CDN的情况下）
            # 格式: https://bucket-name.endpoint/object-name
            url = f"https://{oss_config.bucket_name}.{oss_config.endpoint.replace('http://', '').replace('https://', '')}/{object_name}"

            logger.info(f"图片上传成功: {object_name}")
            return url

        except oss2.exceptions.OssError as e:
            logger.error(f"OSS上传失败: {e}")
            raise Exception(f"OSS上传失败: {e}")
        except Exception as e:
            logger.error(f"图片上传失败: {e}")
            raise

    def delete_images(self, book_id: str) -> bool:
        """
        删除指定书籍的所有图片

        Args:
            book_id: 书籍ID

        Returns:
            是否成功删除
        """
        if not self.enabled:
            logger.info("OSS未启用，跳过OSS删除操作")
            return False

        try:
            # 列出该书籍的所有图片
            prefix = f"{book_id}/"
            objects_to_delete = []

            for obj in oss2.ObjectIterator(self.bucket, prefix=prefix):
                objects_to_delete.append(obj.key)

            if not objects_to_delete:
                logger.info(f"书籍 {book_id} 没有OSS图片需要删除")
                return True

            # 批量删除
            result = self.bucket.batch_delete_objects(objects_to_delete)

            if len(result.deleted_keys) == len(objects_to_delete):
                logger.info(f"成功删除书籍 {book_id} 的 {len(objects_to_delete)} 张图片")
                return True
            else:
                logger.warning(f"部分图片删除失败，成功: {len(result.deleted_keys)}, 总数: {len(objects_to_delete)}")
                return False

        except oss2.exceptions.OssError as e:
            logger.error(f"OSS删除失败: {e}")
            return False
        except Exception as e:
            logger.error(f"删除图片失败: {e}")
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
