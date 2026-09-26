from torch.utils.data import Dataset
from PIL import Image
import os
from torchvision import transforms

class ImageDataset(Dataset):
    def __init__(self, root:str, transform = None):
        self.root = root
        self.transform = transform
        self.files = os.listdir(root)
        self.files = [f for f in self.files if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    def __len__(self):
        return len(self.files)
    
    def __getitem__(self, index):
        image_path = os.path.join(self.root, self.files[index])
        image = self.load_image(image_path=image_path)
        if(self.transform):
            self.transform(image)
        return image
        
    def load_image(self, image_path: str):
        return Image.open(image_path).convert('RGB')
    
def get_transform(size: int, crop, final_size):
    transforms_list = []
    
    if size > 0:
        transforms_list.append(transforms.Resize(size))
    elif crop:
        transforms_list.append(transforms.RandomCrop(final_size))
    else:
        transforms_list.append(transforms.RandomCrop(final_size))
    transforms_list.append(transforms.ToTensor())
    return transforms.Compose(transforms_list)