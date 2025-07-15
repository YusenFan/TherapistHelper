from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.models import Client
from app.schemas.client import ClientCreate, ClientUpdate


class ClientCRUD:
    
    def create(self, db: Session, *, obj_in: ClientCreate) -> Client:
        """Create a new client with encrypted sensitive data"""
        db_obj = Client(
            age=obj_in.age,
            gender=obj_in.gender,
            custom_gender=obj_in.custom_gender,
        )
        
        # Set encrypted fields using hybrid properties
        db_obj.full_name = obj_in.full_name
        db_obj.background = obj_in.background
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get(self, db: Session, id: int) -> Optional[Client]:
        """Get client by ID"""
        return db.query(Client).filter(Client.id == id).first()
    
    def get_by_uuid(self, db: Session, uuid: str) -> Optional[Client]:
        """Get client by UUID"""
        return db.query(Client).filter(Client.uuid == uuid).first()
    
    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Client]:
        """Get multiple clients with pagination"""
        return db.query(Client).offset(skip).limit(limit).all()
    
    def update(self, db: Session, *, db_obj: Client, obj_in: ClientUpdate) -> Client:
        """Update client with new data"""
        update_data = obj_in.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, *, id: int) -> Optional[Client]:
        """Delete client by ID"""
        obj = db.query(Client).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj
    
    def count(self, db: Session) -> int:
        """Get total count of clients"""
        return db.query(Client).count()


# Global CRUD instance
client_crud = ClientCRUD() 