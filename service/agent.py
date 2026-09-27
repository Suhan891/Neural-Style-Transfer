from utils.model import Encoder, Decoder
from utils.utils import adaptive_instance_normalisation
from config import setting
import torch
from torchvision import transforms
from PIL import Image
from typing import Optional, cast

class AgentModel:
    def __init__(self) -> None:
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.encoder_model = Encoder(setting.VGG_PATH).to(self.device)
        self.decoder_model = Decoder().to(self.device)
        self.transforms = transforms.Compose([
            transforms.Resize(512),
            transforms.ToTensor()
        ])
        self._initialisations()
    
    def _initialisations(self):
        self.decoder_model.load_state_dict(torch.load(setting.TRAINED_MODEL,map_location=self.device, weights_only=True)["model"])
        self.encoder_model.eval()
        self.decoder_model.eval()
        
    def generate_image(self, content_image: Image.Image, style_image: Image.Image, alpha: Optional[float] = 1.0) -> Image.Image :
        
        transformed = cast(torch.Tensor, self.transforms(content_image))
        content = transformed.unsqueeze(0).to(self.device)
        
        transformed = cast(torch.Tensor, self.transforms(style_image))
        style = transformed.unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            content_feat = self.encoder_model(content, is_test= True)
            style_feat = self.encoder_model(style, is_test=True)
            
            stylized_feat = adaptive_instance_normalisation(content_feat, style_feat)
            
            alpha_value = 1.0 if alpha is None else alpha
            stylized_feats = alpha_value * stylized_feat + (1.0 - alpha_value) * content_feat
            
            stylized_image = self.decoder_model(stylized_feats)
        
        image = stylized_image.cpu().clone()
        image = image.squeeze(0)
        image = image.clamp(0, 1)
        image = transforms.ToPILImage()(image)
        
        return image
        