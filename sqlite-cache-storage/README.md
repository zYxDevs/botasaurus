# sqlite-cache-storage

SQLite cache storage backend for botasaurus.

## Installation

```bash
pip install sqlite-cache-storage
```

## Usage

### With decorators like `@task`, `@request`, `@browser`

```python
from sqlite_cache_storage import SqliteCacheStorage
from botasaurus.task import task
from datetime import timedelta

# Create storage instance
sqlite_storage = SqliteCacheStorage(
    db_path="cache.db"
)

@task(cache=True, expires_in=timedelta(days=1), cache_storage=sqlite_storage)
def my_scraper(data):
    # scraping logic
    return result
```

### With `@cache` decorator

```python
from sqlite_cache_storage import SqliteCacheStorage
from botasaurus.decorator_helpers import cache
from datetime import timedelta

# Create storage instance
sqlite_storage = SqliteCacheStorage(
    db_path="cache.db"
)

# Use the decorator
@cache(expires_in=timedelta(days=1), cache_storage=sqlite_storage)
def my_function(data):
    # time-consuming operation
    return result
```


## API

### SqliteCacheStorage

```python
SqliteCacheStorage(
    db_path: str = 'cache.db',
    table_name: str = 'botasaurus_cache'
)
```

#### Methods

- `get(func_name, key_data, expires_in=None)` - Get cached value. Returns `{"data": value}` or `None`
- `put(func_name, key_data, data)` - Store value in cache
- `delete(func_name, key_data)` - Delete cached value

## License

MIT



