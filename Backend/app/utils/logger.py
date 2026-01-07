from sqlalchemy.orm import Session
from .. import models
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DocProcessor")

def log_activity(db: Session, user_id: int, action: str, processing_id: int = None):
    try:
        log = models.ActivityLog(
            user_id=user_id, 
            action=action, 
            processing_id=processing_id
        )
        db.add(log)
        db.commit()
        logger.info(f"✅ Activity: User {user_id} -> {action}")
    except Exception as e:
        logger.error(f"❌ Log Failed: {e}")

def log_error(db: Session, user_id: int, context: str, error_msg: str, processing_id: int = None):
    try:
        err = models.ErrorLog(
            user_id=user_id,
            context=context,
            error_message=error_msg,
            processing_id=processing_id
        )
        db.add(err)
        db.commit()
        logger.error(f"❌ Error in {context}: {error_msg}")
    except Exception as e:
        logger.error(f"❌ Log Failed: {e}")