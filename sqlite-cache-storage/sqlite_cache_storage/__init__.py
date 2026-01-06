import json
from hashlib import sha256

__all__ = ['SqliteCacheStorage']


class SqliteCacheStorage:
    """SQLite cache storage using sqlite3."""
    
    def __init__(self, db_path: str = 'cache.db', table_name: str = "botasaurus_cache"):
        self.db_path = db_path
        self.table_name = table_name
        self._ensure_table()
    
    def _get_connection(self):
        import sqlite3
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _hash(self, data) -> str:
        """Generate sha256 hash from data."""
        serialized = json.dumps(data).encode('utf-8')
        return sha256(serialized).hexdigest()
    
    def _make_key(self, func_name: str, key_data) -> str:
        """Create cache key from func_name and key_data."""
        return self._hash([func_name, key_data])
    
    def _ensure_table(self):
        """Create cache table if not exists."""
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS %s (
                    key CHAR(64) PRIMARY KEY,
                    data TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """ % self.table_name)
            conn.commit()
    
    def get(self, func_name: str, key_data, expires_in=None):
        """
        Returns:
            {"data": value} if cache hit (value can be None)
            None if cache miss or expired
        """
        key = self._make_key(func_name, key_data)
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if expires_in is not None:
                cursor.execute(
                    f"""SELECT data FROM {self.table_name} 
                       WHERE key = ? AND created_at > datetime('now', ?)""",
                    (key, f'-{int(expires_in.total_seconds())} seconds')
                )
                row = cursor.fetchone()
                if row is None:
                    cursor.execute(
                        "DELETE FROM %s WHERE key = ?" % self.table_name, 
                        (key,)
                    )
                    conn.commit()
                    return None
            else:
                cursor.execute(
                    "SELECT data FROM %s WHERE key = ?" % self.table_name,
                    (key,)
                )
                row = cursor.fetchone()
            
            if row:
                return {"data": json.loads(row["data"])}
            return None
    
    def put(self, func_name: str, key_data, data) -> None:
        key = self._make_key(func_name, key_data)
        data_json = json.dumps(data)
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO %s (key, data, created_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT (key) DO UPDATE SET 
                    data = excluded.data,
                    created_at = CURRENT_TIMESTAMP
            """ % self.table_name, (key, data_json))
            conn.commit()
    
    def delete(self, func_name: str, key_data) -> None:
        key = self._make_key(func_name, key_data)
        with self._get_connection() as conn:
            conn.execute(
                "DELETE FROM %s WHERE key = ?" % self.table_name,
                (key,)
            )
            conn.commit()


