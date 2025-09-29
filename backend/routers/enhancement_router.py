import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import gc
import torch
from models.enhancement_models import EnhancementRequest, EnhancementResponse
from services.enhancement_service import ImageEnhancer, download_model_if_needed

router = APIRouter()

@router.post("/enhance", response_model=EnhancementResponse)
async def enhance_image(
    file: UploadFile = File(...),
    scale: int = Form(4),
    tile: int = Form(0)
):
    """
    Enhance an uploaded image using Real-ESRGAN - EXACT SAME FUNCTIONALITY
    """

    enhancer = None  # Define enhancer here to access in finally block

    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            return EnhancementResponse(
                success=False,
                message="Enhancement failed",
                error="Uploaded file is not an image"
            )
        
        # Read uploaded file
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            return EnhancementResponse(
                success=False,
                message="Enhancement failed",
                error="Uploaded file is empty"
            )
        
        # Download model if needed - EXACT SAME LOGIC
        model_path = download_model_if_needed(scale)
        if not model_path:
            return EnhancementResponse(
                success=False,
                message="Enhancement failed",
                error="Failed to download or locate model"
            )
        
        # Initialize enhancer with EXACT SAME parameters
        print("Initializing Real-ESRGAN enhancer...")
        enhancer = ImageEnhancer(model_path=model_path, scale=scale, tile=tile)
        
        # Enhance the image - EXACT SAME PROCESSING
        print(f"Enhancing image: {file.filename}")
        original, enhanced = enhancer.enhance_image_from_bytes(image_bytes)
        
        if enhanced is not None:
            # Convert enhanced image to base64
            enhanced_base64 = enhancer.numpy_to_base64(enhanced)
            
            if enhanced_base64:
                return EnhancementResponse(
                    success=True,
                    message="Image enhanced successfully",
                    original_dimensions=f"{original.shape[1]}x{original.shape[0]}",
                    enhanced_dimensions=f"{enhanced.shape[1]}x{enhanced.shape[0]}",
                    enhanced_image_base64=enhanced_base64
                )
            else:
                return EnhancementResponse(
                    success=False,
                    message="Enhancement failed",
                    error="Failed to convert enhanced image to base64"
                )
        else:
            return EnhancementResponse(
                success=False,
                message="Enhancement failed",
                error="Image processing failed"
            )
            
    except Exception as e:
        print(f"Error: {e}")
        return EnhancementResponse(
            success=False,
            message="Enhancement failed",
            error=str(e)
        )
    finally:
        # ADD THIS CLEANUP BLOCK
        if enhancer is not None:
            enhancer.clear_memory()
        # Force additional cleanup
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

@router.get("/info")
async def get_enhancement_info():
    """Get information about available enhancement options"""
    return {
        "scale_options": [2, 4, 8],
        "default_tile": 0,
        "supported_formats": ["PNG", "JPG", "JPEG"],
        "models_available": {
            "2x": "RealESRGAN_x2plus.pth",
            "4x": "RealESRGAN_x4plus.pth", 
            "8x": "realesr-general-x4v3.pth"
        }
    }