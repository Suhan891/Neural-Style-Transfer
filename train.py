import argparse
import torch
from pathlib import Path
import os

def pass_arguments():
    parser = argparse.ArgumentParser()
    
    parser.add_argument('--content_dir', type=str, default=os.getenv('CONTENT_DIR'),
                        help='Location of content dataset')
    parser.add_argument('--style_dir', type=str, default=os.getenv('STYLE_DIR'),
                        help='Location of style dataset')
    parser.add_argument('--vgg', type=str, default=os.getenv('VGG_PATH'),
                        help='Location of pre-trained VGG')
    parser.add_argument('--experiment', type=str, default='experiment1',
                        help='Name of experiment')
        
    return parser.parse_args()

def main():
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    args = pass_arguments()
    
    save_dir = Path('experiments') / args.experiment;
    save_dir.mkdir(parents=True, exist_ok=True)
    
    with open(save_dir / 'args.txt', 'w') as f:
        for name, location in vars(args).items():
            f.write(f"{name}: {location}\n")
    
if __name__ == "__main__":
    main()
    