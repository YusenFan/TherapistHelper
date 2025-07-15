from sqlalchemy import Column, Integer, String, Text, DateTime, func
from sqlalchemy.ext.hybrid import hybrid_property
from app.core.database import Base
from app.core.config import encryption_manager
import uuid


class Client(Base):
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    
    # Encrypted personal information
    _full_name_encrypted = Column("full_name_encrypted", Text, nullable=False)
    _background_encrypted = Column("background_encrypted", Text, nullable=True)
    
    # Non-sensitive data (not encrypted)
    age = Column(Integer, nullable=False)
    gender = Column(String(50), nullable=False)
    custom_gender = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Hybrid properties for encryption/decryption
    @hybrid_property
    def full_name(self):
        """Decrypt and return the full name"""
        if self._full_name_encrypted:
            return encryption_manager.decrypt(self._full_name_encrypted)
        return None
    
    @full_name.setter
    def full_name(self, value):
        """Encrypt and store the full name"""
        if value:
            self._full_name_encrypted = encryption_manager.encrypt(value)
        else:
            self._full_name_encrypted = None
    
    @hybrid_property
    def background(self):
        """Decrypt and return the background"""
        if self._background_encrypted:
            return encryption_manager.decrypt(self._background_encrypted)
        return None
    
    @background.setter
    def background(self, value):
        """Encrypt and store the background"""
        if value:
            self._background_encrypted = encryption_manager.encrypt(value)
        else:
            self._background_encrypted = None
    
    def __repr__(self):
        return f"<Client(id={self.id}, uuid={self.uuid}, age={self.age})>" 