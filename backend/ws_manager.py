"""
WebSocket Connection Manager
"""
import asyncio
import logging
import time
from typing import Dict, List, Optional
from fastapi import WebSocket
import json

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.connection_data: Dict[str, dict] = {}
        self.total_messages = 0

    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept WebSocket connection and initialize client data"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        
        # Initialize connection data
        self.connection_data[client_id] = {
            "audio_buffer": bytearray(),
            "is_processing": False,
            "connected_at": time.time(),
            "message_count": 0,
            "last_activity": time.time()
        }
        
        logger.info(f"[WS] Client {client_id} connected. Total: {len(self.active_connections)}")

    async def disconnect(self, client_id: str):
        """Disconnect client and cleanup"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.connection_data:
            del self.connection_data[client_id]
        logger.info(f"[WS] Client {client_id} disconnected. Total: {len(self.active_connections)}")

    async def send_json(self, client_id: str, data: dict):
        """Send JSON data to specific client"""
        try:
            if client_id in self.active_connections:
                websocket = self.active_connections[client_id]
                await websocket.send_json(data)
                self.total_messages += 1
                self.connection_data[client_id]["message_count"] += 1
                self.connection_data[client_id]["last_activity"] = time.time()
                
                # Log important messages
                message_type = data.get("type", "unknown")
                if message_type not in ["ai_audio_chunk", "pong"]:  # Skip verbose logs for frequent messages
                    logger.debug(f"[WS] Sent to {client_id}: {message_type}")
                    
        except Exception as e:
            logger.error(f"[WS] Error sending to {client_id}: {e}")
            # Remove broken connection
            await self.disconnect(client_id)

    async def broadcast(self, data: dict):
        """Broadcast data to all connected clients"""
        disconnected = []
        for client_id in list(self.active_connections.keys()):
            try:
                await self.send_json(client_id, data)
            except:
                disconnected.append(client_id)
        
        # Cleanup disconnected clients
        for client_id in disconnected:
            await self.disconnect(client_id)

    def get_connection(self, client_id: str) -> Optional[dict]:
        """Get connection data for client"""
        return self.connection_data.get(client_id)

    def get_stats(self) -> dict:
        """Get server statistics"""
        now = time.time()
        clients = []
        
        for client_id, data in self.connection_data.items():
            clients.append({
                "client_id": client_id,
                "connected_for": int(now - data["connected_at"]),
                "message_count": data["message_count"],
                "last_activity": int(now - data["last_activity"]),
                "is_processing": data["is_processing"]
            })
        
        return {
            "active_connections": len(self.active_connections),
            "total_messages": self.total_messages,
            "clients": clients
        }

    def is_connected(self, client_id: str) -> bool:
        """Check if client is connected"""
        return client_id in self.active_connections