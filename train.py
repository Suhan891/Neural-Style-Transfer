import argparse
import torch
from torch.utils.data import DataLoader
from dotenv import load_dotenv
from pathlib import Path
import os
from utils.utils import ImageDataset, get_transform
from utils.model import Encoder, Decoder
from torch import optim

load_dotenv()


def pass_arguments():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--content_dir",
        type=str,
        default=os.getenv("CONTENT_DIR"),
        help="Location of content dataset",
    )
    parser.add_argument(
        "--style_dir",
        type=str,
        default=os.getenv("STYLE_DIR"),
        help="Location of style dataset",
    )
    parser.add_argument(
        "--vgg",
        type=str,
        default=os.getenv("VGG_PATH"),
        help="Location of pre-trained VGG",
    )  # Taking the available weights on pth
    parser.add_argument(
        "--experiment", type=str, default="experiment1", help="Name of experiment"
    )
    parser.add_argument(
        "--final_size", type=int, default=256, help="Size of final image"
    )
    parser.add_argument(
        "--content_size", type=int, default=512, help="Size of content image"
    )
    parser.add_argument('--lr', type=float, default=1e-4,
                        help='Learning rate')
    parser.add_argument('--lr_decay', type=float, default=5e-5,
                        help='Learning rate decay')
    parser.add_argument('--wt_decay', type=float, default=0.01,
                            help='Weight decay')
    parser.add_argument(
        "--style_size", type=int, default=512, help="Size of style image"
    )
    parser.add_argument("--batch_size", type=int, default=32, help="Batch Size")
    parser.add_argument("--crop", action="store_true", default=True, help="Crop image")
    return parser.parse_args()


def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    args = pass_arguments()

    save_dir = Path("experiments") / args.experiment
    save_dir.mkdir(parents=True, exist_ok=True)

    with open(save_dir / "args.txt", "w") as f:
        for name, location in vars(args).items():
            f.write(f"{name}: {location}\n")

    content_tansform = get_transform(args.content_size, args.crop, args.final_size)
    style_tansform = get_transform(args.style_size, args.crop, args.final_size)

    content_dataset = ImageDataset(args.content_dir, content_tansform)
    style_dataset = ImageDataset(args.style_dir, style_tansform)

    content_dataloader = DataLoader(
        content_dataset,
        shuffle=True,
        pin_memory=True,
        batch_size=args.batch_size,
        drop_last=True,
        num_workers=0,
    )
    style_dataloader = DataLoader(
        style_dataset,
        shuffle=True,
        pin_memory=True,
        batch_size=args.batch_size,
        drop_last=True,
        num_workers=0,
    )

    encoder = Encoder(args.vgg).to(device)
    decoder = Decoder().to(device)

    optimizer = optim.Adam(
        decoder.parameters(), lr=args.lr, weight_decay=args.wt_decay
    )  # Taken only decoder as encoder is frozen
    scheduler = optim.lr_scheduler.LambdaLR(
        optimizer=optimizer, lr_lambda=lambda epoch: 1.0 / (1.0 + args.lr_decay * epoch) # Learning rate get updated with time
    )


if __name__ == "__main__":
    main()
