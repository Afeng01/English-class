import logging
import os
from fastapi import HTTPException, Request

logger = logging.getLogger(__name__)
ENV_ADMIN_MODE = "ADMIN_MODE"


async def require_admin_mode(request: Request) -> None:
    """
    管理员模式检测中间件：
    - 依赖环境变量 ADMIN_MODE=true
    - 未启用时返回 403，防止误用
    - 所有访问都会记录审计日志
    """
    admin_mode = os.getenv(ENV_ADMIN_MODE, "false").lower() == "true"
    client_host = request.client.host if request.client else "unknown"
    path = request.url.path

    if not admin_mode:
        logger.warning("🚫 非管理员访问被拒绝 path=%s client=%s", path, client_host)
        raise HTTPException(status_code=403, detail="管理员模式未开启")

    logger.info("🔐 管理员访问 path=%s client=%s", path, client_host)
