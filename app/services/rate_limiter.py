import time
from collections import defaultdict
from typing import Dict, List, Tuple
import threading

class RateLimiter:
    """
    A simple in-memory rate limiter that limits requests based on client IP.
    For production use, consider using Redis or another distributed solution.
    """
    
    def __init__(self, max_requests: int, time_window: int):
        """
        Initialize the rate limiter.
        
        Args:
            max_requests (int): Maximum number of requests allowed in the time window
            time_window (int): Time window in seconds
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self.request_records: Dict[str, List[float]] = defaultdict(list)
        self.lock = threading.Lock()
        
    def is_allowed(self, client_ip: str) -> bool:
        """
        Check if a request from the given client IP is allowed.
        
        Args:
            client_ip (str): The client IP address
            
        Returns:
            bool: True if the request is allowed, False otherwise
        """
        current_time = time.time()
        
        with self.lock:
            # Remove expired records
            self.request_records[client_ip] = [
                timestamp for timestamp in self.request_records[client_ip]
                if current_time - timestamp < self.time_window
            ]
            
            # Check if the client has exceeded the limit
            if len(self.request_records[client_ip]) >= self.max_requests:
                return False
            
            # Record the current request
            self.request_records[client_ip].append(current_time)
            return True
            
    def get_remaining(self, client_ip: str) -> Tuple[int, int]:
        """
        Get the number of remaining requests for the client and reset time.
        
        Args:
            client_ip (str): The client IP address
            
        Returns:
            Tuple[int, int]: (remaining requests, seconds until reset)
        """
        current_time = time.time()
        
        with self.lock:
            # Remove expired records
            valid_requests = [
                timestamp for timestamp in self.request_records[client_ip]
                if current_time - timestamp < self.time_window
            ]
            
            # Calculate remaining requests
            remaining = max(0, self.max_requests - len(valid_requests))
            
            # Calculate reset time
            if valid_requests:
                oldest_request = min(valid_requests)
                reset_in = int(self.time_window - (current_time - oldest_request))
            else:
                reset_in = 0
                
            return remaining, reset_in 