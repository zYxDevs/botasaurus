from datetime import timedelta
from typing import Any, Optional, Dict
from .cache import (
    Cache, _get_cache_path, _has, _get, CacheMissException
)

class FileCacheStorage:
    """File-based cache storage using existing cache.py helpers."""
    
    @staticmethod
    def get(func_name: str, key_data, expires_in: Optional[timedelta] = None) -> Optional[Dict[str, Any]]:
        """
        Returns:
            {"data": value} if cache hit (value can be None)
            None if cache miss or expired
        """
        path = _get_cache_path(func_name, key_data)
        if _has(path):
            if expires_in is not None:
                if Cache.is_item_older_than(
                        func_name,
                        key_data,
                        days=expires_in.days,
                        seconds=expires_in.seconds,
                        microseconds=expires_in.microseconds,
                    ):
                        Cache.delete(func_name, key_data)
                        return None
            try:
                return {"data": _get(path)}
            except CacheMissException:
                return None
        return None
    
    @staticmethod
    def put(func_name: str, key_data, data: Any) -> None:
        Cache.put(func_name, key_data, data)
    
    @staticmethod
    def delete(func_name: str, key_data) -> None:
        Cache.delete(func_name, key_data)

