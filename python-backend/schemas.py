from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime, date

class UserBase(BaseModel):
    username: str
    email: str
    is_developer: bool = False
    is_admin: bool = False

class UserCreate(UserBase):
    password: str
    
    # Temporär deaktiviert für Testing
    # @validator('birth_date')
    # def validate_birth_date(cls, v, values):
    #     """Validiere Geburtsdatum für USK-Compliance"""
    #     if v is not None:
    #         today = date.today()
    #         age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
    #         
    #         # Mindestalter 6 Jahre für USK-Compliance
    #         if age < 6:
    #             raise ValueError('Mindestalter 6 Jahre erforderlich (USK-Compliance)')
    #         
    #         # Geburtsdatum nicht in der Zukunft
    #         if v > today:
    #             raise ValueError('Geburtsdatum kann nicht in der Zukunft liegen')
    #             
    #         # Realistisches Maximalalter (150 Jahre)
    #         if age > 150:
    #             raise ValueError('Geburtsdatum zu weit in der Vergangenheit')
    #     
    #     # Für User und Entwickler ist Geburtsdatum erforderlich (außer Admin)
    #     is_admin = values.get('is_admin', False)
    #     if not is_admin and v is None:
    #         raise ValueError('Geburtsdatum ist für User und Entwickler erforderlich (USK-Compliance)')
    #         
    #     return v
    
    # Temporär deaktiviert für Testing  
    # @validator('birth_year')
    # def validate_birth_year_legacy(cls, v, values):
    #     """Legacy-Validator für Geburtsjahr (falls birth_date nicht gesetzt)"""
    #     birth_date = values.get('birth_date')
    #     if birth_date is None and v is not None:
    #         current_year = datetime.now().year
    #         if v < 1900 or v > current_year - 6:
    #             raise ValueError(f'Geburtsjahr muss zwischen 1900 und {current_year - 6} liegen')
    #     return v

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    is_developer: Optional[bool] = None
    is_admin: Optional[bool] = None
    avatar_url: Optional[str] = None
    birth_year: Optional[int] = None  # Deprecated
    birth_date: Optional[date] = None
    
    @validator('birth_date')
    def validate_birth_date_update(cls, v):
        """Validiere Geburtsdatum bei Updates"""
        if v is not None:
            today = date.today()
            age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
            
            if age < 6:
                raise ValueError('Mindestalter 6 Jahre erforderlich (USK-Compliance)')
            if v > today:
                raise ValueError('Geburtsdatum kann nicht in der Zukunft liegen')
            if age > 150:
                raise ValueError('Geburtsdatum zu weit in der Vergangenheit')
        return v

class User(UserBase):
    id: int
    is_active: bool
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
