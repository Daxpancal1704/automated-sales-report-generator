import time
import threading
from typing import Optional, Dict, Any
import pandas as pd

class SessionData:
    def __init__(self, session_id: str):
        self.session_id: str = session_id
        self.created_at: float = time.time()
        self.last_accessed: float = time.time()
        self.currency: str = "INR"
        self.filename: str = ""
        self.file_size_bytes: int = 0
        
        # Raw parsed dataframe before confirmation
        self.raw_df: Optional[pd.DataFrame] = None
        self.suggested_mapping: Dict[str, str] = {}
        
        # Processed & confirmed data
        self.confirmed_df: Optional[pd.DataFrame] = None
        self.rejected_records: list = []
        self.validation_summary: Optional[Dict[str, Any]] = None
        self.column_mapping: Optional[Dict[str, Any]] = None
        self.is_demo: bool = False

    def touch(self):
        self.last_accessed = time.time()

class SessionStore:
    def __init__(self, ttl_seconds: int = 7200):  # 2 hours TTL
        self._sessions: Dict[str, SessionData] = {}
        self._lock = threading.Lock()
        self.ttl_seconds = ttl_seconds

    def get_or_create(self, session_id: str) -> SessionData:
        with self._lock:
            self._cleanup_expired()
            if session_id not in self._sessions:
                self._sessions[session_id] = SessionData(session_id)
            else:
                self._sessions[session_id].touch()
            return self._sessions[session_id]

    def get(self, session_id: str) -> Optional[SessionData]:
        with self._lock:
            self._cleanup_expired()
            sess = self._sessions.get(session_id)
            if sess:
                sess.touch()
            return sess

    def remove(self, session_id: str):
        with self._lock:
            if session_id in self._sessions:
                del self._sessions[session_id]

    def _cleanup_expired(self):
        now = time.time()
        expired_ids = [
            sid for sid, sdata in self._sessions.items()
            if (now - sdata.last_accessed) > self.ttl_seconds
        ]
        for sid in expired_ids:
            del self._sessions[sid]

# Global singleton session store instance
session_store = SessionStore()
