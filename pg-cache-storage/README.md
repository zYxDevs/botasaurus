# pg-cache-storage

PostgreSQL cache storage backend for botasaurus.

## Installation

```bash
pip install pg-cache-storage
```

## Usage

### With decorators like `@task`, `@request`, `@browser`

```python
from pg_cache_storage import PostgresCacheStorage
from botasaurus.task import task
from datetime import timedelta

# Create storage instance
pg_storage = PostgresCacheStorage(
    host="localhost",
    port=5432,
    username="postgres",
    password="postgres",
    db_name="cache"
)

@task(cache=True, expires_in=timedelta(days=1), cache_storage=pg_storage)
def my_scraper(data):
    # scraping logic
    return result
```

### With `@cache` decorator

```python
from pg_cache_storage import PostgresCacheStorage
from botasaurus.decorator_helpers import cache
from datetime import timedelta

# Create storage instance
pg_storage = PostgresCacheStorage(
    host="localhost",
    port=5432,
    username="postgres",
    password="postgres",
    db_name="cache"
)

# Use the decorator
@cache(expires_in=timedelta(days=1), cache_storage=pg_storage)
def my_function(data):
    # time-consuming operation
    return result
```


## API

### PostgresCacheStorage

```python
PostgresCacheStorage(
    host: str = 'localhost',
    port: int = 5432,
    username: str = 'postgres',
    password: str = 'postgres',
    db_name: str = 'cache',
    table_name: str = 'botasaurus_cache'
)
```

#### Methods

- `get(func_name, key_data, expires_in=None)` - Get cached value. Returns `{"data": value}` or `None`
- `put(func_name, key_data, data)` - Store value in cache
- `delete(func_name, key_data)` - Delete cached value

## License

MIT


