import os
import cv2
import torch
import urllib.request
import base64
import numpy as np
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer
from realesrgan.archs.srvgg_arch import SRVGGNetCompact
import gc

class ImageEnhancer:
    def __init__(self, model_path=None, scale=4, tile=0, tile_pad=10, pre_pad=0):
        """
        Initialize the Real-ESRGAN image enhancer
        
        Args:
            model_path: Path to the pre-trained model
            scale: Upscaling factor (2, 4, or 8)
            tile: Tile size for processing large images (0 for no tiling)
            tile_pad: Padding for tiles
            pre_pad: Pre-padding size
        """
        self.scale = scale
        
        # Determine model path if not provided
        if model_path is None:
            model_path = 'weights/RealESRGAN_x4plus.pth'
            
        # Initialize the model based on scale
        if scale == 2:
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=2)
        elif scale == 4:
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
        elif scale == 8:
            model = SRVGGNetCompact(num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=16, upscale=8, act_type='prelu')
        
        # Initialize the enhancer - EXACT SAME CONFIGURATION AS ORIGINAL
        self.enhancer = RealESRGANer(
            scale=scale,
            model_path=model_path,
            model=model,
            tile=tile,
            tile_pad=tile_pad,
            pre_pad=pre_pad,
            half=True if torch.cuda.is_available() else False  # Use half precision if GPU available
        )
        
    def enhance_image_from_bytes(self, image_bytes):
        """
        Enhance the input image using Real-ESRGAN - EXACT SAME LOGIC AS ORIGINAL
        
        Args:
            image_bytes: Image bytes data
            
        Returns:
            original_img, enhanced_img: Original and enhanced images as numpy arrays
        """
        try:
            # Convert bytes to numpy array (same as reading from file)
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
            if img is None:
                raise ValueError("Could not decode image from bytes")
            
            print(f"Original image shape: {img.shape}")
            
            # Enhance the image - EXACT SAME PROCESSING
            enhanced_img, _ = self.enhancer.enhance(img)
            
            print(f"Enhanced image shape: {enhanced_img.shape}")
            
            return img, enhanced_img
            
        except Exception as e:
            print(f"Error during image enhancement: {e}")
            return None, None

    def numpy_to_base64(self, img_np):
        """Convert numpy array to base64 string preserving original colors"""
        try:
            # Keep BGR format for OpenCV compatibility (same as original)
            # Encode to PNG to preserve quality
            success, encoded_image = cv2.imencode('.png', img_np)
            if success:
                base64_string = base64.b64encode(encoded_image).decode('utf-8')
                return f"data:image/png;base64,{base64_string}"
            else:
                raise ValueError("Failed to encode image")
        except Exception as e:
            print(f"Error converting image to base64: {e}")
            return None

    def clear_memory(self):
        print("Clearing memory ...")
        """Clear GPU memory after processing"""
        try:
            if hasattr(self, 'enhancer'):
                # Clear the enhancer model from GPU
                if hasattr(self.enhancer, 'model'):
                    self.enhancer.model = None
                
                # Clear any other GPU tensors
                if hasattr(self.enhancer, 'output'):
                    self.enhancer.output = None
            
            # Force garbage collection
            gc.collect()
            
            # Clear PyTorch cache
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                print("GPU memory cleared successfully")
            else:
                print("CPU memory cleared successfully")
                
        except Exception as e:
            print(f"Error clearing memory: {e}")

def download_model_if_needed(scale):
    """Download the right Real-ESRGAN model if not present - EXACT SAME AS ORIGINAL"""
    os.makedirs("weights", exist_ok=True)

    if scale == 2:
        model_url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth"
        model_path = "weights/RealESRGAN_x2plus.pth"
    elif scale == 4:
        model_url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
        model_path = "weights/RealESRGAN_x4plus.pth"
    elif scale == 8:
        # General v3 model works for 4x and 8x
        model_url = "https://huggingface.co/ai-forever/Real-ESRGAN/resolve/main/RealESRGAN_x8.pth?download=true"
        model_path = "weights/RealESRGAN_x8.pth"
    else:
        raise ValueError(f"Unsupported scale {scale}")

    if not os.path.exists(model_path):
        print(f"Downloading model for scale {scale}...")
        try:
            urllib.request.urlretrieve(model_url, model_path)
            print("Model downloaded successfully!")
        except Exception as e:
            print(f"Error downloading model: {e}")
            print("Download manually from:")
            print(model_url)
            return None
    return model_path