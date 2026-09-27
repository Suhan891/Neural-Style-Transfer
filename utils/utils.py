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
            image = self.transform(image)
        return image
        
    def load_image(self, image_path: str):
        return Image.open(image_path).convert('RGB')
    
def get_transform(size: int, crop, final_size):
    transforms_list = []
    
    if size > 0:
        transforms_list.append(transforms.Resize(size))

    if crop:
        transforms_list.append(transforms.RandomCrop(final_size))
    else:
        transforms_list.append(transforms.Resize((final_size, final_size)))
    transforms_list.append(transforms.ToTensor())
    return transforms.Compose(transforms_list)

def adaptive_instance_normalisation(c_feat, s_feat):
    # [batch size, channels, h, w]
    size = c_feat.size()
    style_mean, style_std = calc_mean_std(s_feat)
    content_mean, content_std = calc_mean_std(c_feat)
    normalized_content_feat = (c_feat - content_mean.expand(size)) / content_std.expand(size) # (x-mean)/std
    return normalized_content_feat * style_std.expand(size) + style_mean.expand(size) # To expaand the mean and std to the size of content feature and then adding to normalized content feature

def calc_mean_std(feat, eps = 1e-5):
    # [base, Channel, height, width]
    size = feat.size()
    assert(len(size) == 4)
    batch_size, channel = size[:2] # Taking first 2
    # Calculating mean and standard deviation in 3 dimension and returning in 4 dimension 
    # Done base, channel, h, w to base, channel, h*w , and calculated such that all would come in a single row i.e. combining h and w from matrix to row
    feat_mean = feat.view(batch_size, channel, -1).mean(dim=2).view(batch_size, channel, 1, 1)
    feat_var = feat.view(batch_size, channel, -1).var(dim=2, unbiased=False) + eps
    feat_std = feat_var.sqrt().view(batch_size, channel, 1, 1)
    return feat_mean, feat_std
