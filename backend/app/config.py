"""
应用配置模块
管理OSS和其他服务的配置
"""
import os
from typing import Optional
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()


class OSSConfig:
    """阿里云OSS配置"""

    def __init__(self):
        self.access_key_id: Optional[str] = os.getenv("OSS_ACCESS_KEY_ID")
        self.access_key_secret: Optional[str] = os.getenv("OSS_ACCESS_KEY_SECRET")
        self.endpoint: Optional[str] = os.getenv("OSS_ENDPOINT")
        self.bucket_name: Optional[str] = os.getenv("OSS_BUCKET_NAME")
        self.use_oss: bool = os.getenv("USE_OSS", "false").lower() == "true"

    def is_configured(self) -> bool:
        """检查OSS是否已正确配置"""
        if not self.use_oss:
            return False

        return all([
            self.access_key_id,
            self.access_key_secret,
            self.endpoint,
            self.bucket_name
        ])

    def validate(self) -> None:
        """验证配置，如果启用OSS但配置不完整则抛出异常"""
        if self.use_oss and not self.is_configured():
            missing = []
            if not self.access_key_id:
                missing.append("OSS_ACCESS_KEY_ID")
            if not self.access_key_secret:
                missing.append("OSS_ACCESS_KEY_SECRET")
            if not self.endpoint:
                missing.append("OSS_ENDPOINT")
            if not self.bucket_name:
                missing.append("OSS_BUCKET_NAME")

            raise ValueError(
                f"OSS已启用但配置不完整，缺少以下环境变量: {', '.join(missing)}"
            )


# 全局配置实例
oss_config = OSSConfig()
