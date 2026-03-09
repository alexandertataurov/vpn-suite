"""Tests for API client retry and error handling."""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

bot_root = Path(__file__).resolve().parent.parent
if str(bot_root) not in sys.path:
    sys.path.insert(0, str(bot_root))

from api_client import ApiClient


@pytest.mark.asyncio
async def test_retry_on_timeout():
    """API client retries on timeout and eventually succeeds."""
    client = ApiClient()
    mock_200 = MagicMock()
    mock_200.status_code = 200
    mock_200.json.return_value = {"data": {"id": 1}}
    mock_200.content = b'{"data":{"id":1}}'

    async def request_side_effect(*args, **kwargs):
        if request_side_effect.call_count < 2:
            request_side_effect.call_count += 1
            raise httpx.TimeoutException("timeout")
        return mock_200

    request_side_effect.call_count = 0
    client._client.request = AsyncMock(side_effect=request_side_effect)

    with patch("api_client.asyncio.sleep", new_callable=AsyncMock):
        result = await client.get_user_by_tg(12345)
    assert result.success
    assert result.data == {"id": 1}
    assert client._client.request.call_count == 3


@pytest.mark.asyncio
async def test_no_retry_on_404():
    """404 returns immediately with Result.ok(None), no retries."""
    client = ApiClient()
    mock_404 = MagicMock()
    mock_404.status_code = 404
    client._request_with_retry = AsyncMock(
        return_value=(mock_404, "error_device_not_found")
    )
    result = await client.get_user_by_tg(99999)
    assert result.success
    assert result.data is None
    client._request_with_retry.assert_called_once()
