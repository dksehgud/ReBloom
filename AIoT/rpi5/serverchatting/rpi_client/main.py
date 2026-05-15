import asyncio
import logging

from rpi_client.core.config import get_settings
from rpi_client.services.conversation_manager import ConversationManager
from rpi_client.services.ir_sensor_monitor import IRSensorMonitor
from rpi_client.services.mqtt_conversation_subscriber import MQTTConversationSubscriber
from rpi_client.services.session_event_sender import SessionEventSender
from rpi_client.services.stt_service import LocalSTTService, MockSTTService
from rpi_client.services.tts_service import LocalTTSService, MockTTSService
from rpi_client.services.trigger_http_server import ConversationTriggerHTTPServer
from rpi_client.services.wake_word_detector import OpenWakeWordDetector
from rpi_client.services.websocket_client import LLMWebSocketClient
from rpi_client.utils.logger import setup_logger


async def async_main() -> None:
    config = get_settings()
    logger = setup_logger(config.log_level)

    logger.info("앱 시작")

    stt = MockSTTService() if config.use_mock_stt else LocalSTTService(config)
    tts = MockTTSService(config.tts_sentence_delay) if config.use_mock_tts else LocalTTSService(config)
    websocket_client = LLMWebSocketClient(
        url=config.llm_server_ws_url,
        reconnect_max_retries=config.reconnect_max_retries,
        reconnect_interval_seconds=config.reconnect_interval_seconds,
    )
    session_sender = SessionEventSender(
        url=config.session_events_url,
        device_id=config.device_id,
        window_seconds=config.session_window_seconds,
        timeout=config.session_send_timeout,
    )
    wake_word_detector = (
        OpenWakeWordDetector(config)
        if config.wake_word_enabled and config.wake_word_engine == "openwakeword" and not config.use_mock_stt
        else None
    )
    conversation_manager = ConversationManager(
        config,
        stt,
        tts,
        websocket_client,
        session_sender,
        wake_word_detector,
    )

    ir_monitor: IRSensorMonitor | None = None
    if config.ir_sensor_enabled:
        ir_monitor = IRSensorMonitor(gpio_pin=config.ir_sensor_gpio_pin)
        ir_monitor.start()

    trigger_http_server = ConversationTriggerHTTPServer(config, conversation_manager)
    mqtt_subscriber = MQTTConversationSubscriber(config, conversation_manager, ir_monitor)

    tts.start_worker()
    await trigger_http_server.start()
    await mqtt_subscriber.start()

    try:
        await conversation_manager.run()
    except KeyboardInterrupt:
        logger.info("키보드 인터럽트 수신")
    finally:
        await mqtt_subscriber.stop()
        await trigger_http_server.stop()
        await session_sender.flush(force=True)
        await websocket_client.close()
        await tts.stop()
        if ir_monitor is not None:
            ir_monitor.stop()
        logger.info("앱 종료")


def main() -> None:
    try:
        asyncio.run(async_main())
    except KeyboardInterrupt:
        logging.getLogger(__name__).info("앱 종료")


if __name__ == "__main__":
    main()
