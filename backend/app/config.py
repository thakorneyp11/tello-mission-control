from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Drone connection
    tello_host: str = "192.168.10.1"
    tello_retry_count: int = 3

    # Server
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Telemetry
    telemetry_poll_hz: float = 4.0

    # Video
    video_fps: int = 30
    video_jpeg_quality: int = 70

    # Mock mode (for development/testing without a physical drone)
    use_mock_drone: bool = False

    model_config = {"env_prefix": "TELLO_"}


settings = Settings()
