from fastapi import APIRouter

router = APIRouter(prefix="/api/sequences", tags=["sequences"])


@router.get("")
async def list_sequences():
    """Stub: returns empty list until sequences are implemented."""
    return []
