import argparse
import torch
from torch.utils.data import DataLoader
from dotenv import load_dotenv
from pathlib import Path
import os
from utils.utils import ImageDataset, get_transform, adaptive_instance_normalisation, calc_mean_std
from utils.model import Encoder, Decoder
from torch import optim
from tqdm import tqdm
from torchvision.utils import save_image

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
        default=os.getenv("VGG_PATH","public/vgg_normalised.pth"),
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
    parser.add_argument(
        "--style_size", type=int, default=512, help="Size of style image"
    )
    parser.add_argument("--batch_size", type=int, default=2, help="Batch Size")
    parser.add_argument("--crop", action="store_true", default=True, help="Crop image")
    parser.add_argument('--lr', type=float, default=1e-4,
                            help='Learning rate')
    parser.add_argument('--lr_decay', type=float, default=5e-5,
                        help='Learning rate decay')
    parser.add_argument('--wt_decay', type=float, default=0.01,
                            help='Weight decay')
    parser.add_argument('--epochs', type=int, default=100,
                                help='Epochs')
    parser.add_argument('--content_weight', type=float, default=1.0,
                        help='Content weight')
    parser.add_argument('--style_weight', type=float, default=5,
                        help='Style weight')
    parser.add_argument('--log_interval', type=int, default=1,
                        help='Log interval')
    parser.add_argument('--save_interval', type=int, default=2,
                        help='Save interval')
    
    parser.add_argument('--resume', action='store_true', default=False,
                        help='Resume training')
    
    parser.add_argument('--decoder_path', type=str, default=None,
                        help='Path to decoder checkpoint')
    
    parser.add_argument('--optimizer_path', type=str, default=None,
                        help='Path to optimizer checkpoint')
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
    
    if args.resume:
        decoder.load_state_dict(torch.load(args.decoder_path, map_location=device, weights_only=True))
        optimizer.load_state_dict(torch.load(args.optimizer_path, map_location=device, weights_only=True))
        
    scheduler = optim.lr_scheduler.LambdaLR(
        optimizer=optimizer, lr_lambda=lambda epoch: 1.0 / (1.0 + args.lr_decay * epoch) # Learning rate get updated with progress for each epoch
    )
    
    print("Training...")
    
    mse_loss = torch.nn.MSELoss()
    
    encoder.eval() # As we would not train encoder , so keeping it only 
    
    running_loss = None
    running_content_loss = None
    running_style_loss = None
    
    for epoch in range(args.epochs):
        progress_bar = tqdm(zip(content_dataloader, style_dataloader), total=min(len(content_dataloader), len(style_dataloader))) # Effictively handles 
        
        running_loss = 0
        running_content_loss = 0
        running_style_loss = 0
        
        g = None
        content_batch = None
        style_batch = None
        
        for content_batch, style_batch in progress_bar:
            
            content_batch = content_batch.to(device)
            style_batch = style_batch.to(device)
            
            c_feats = encoder(content_batch)
            s_feats = encoder(style_batch)
            
            # Sent to adian based on encoded image of content and style image
            t = adaptive_instance_normalisation(c_feat=c_feats[-1], s_feat=s_feats[-1]) # Sent the last as all previos are for loss handling
            
            g = decoder(t) # On decoder layer from Adian
            
            g_feats = encoder(g) # Last encoder layer , after receiving the Decoder => Generated Image
            
            # Starting loss for updating decoder , as encoder is completely frozen with updations
            
            # Content Loss from (Encoded of decoded image - Adian Image) and also multiplied with content weights
            loss_c = mse_loss(g_feats[-1], t) * args.content_weight # Here used t instead of original as on reasearch papaer said thsat model perform better
            
            loss_s = 0
            for g_feat, s_feat in zip(g_feats, s_feats):
                g_mean, g_std = calc_mean_std(g_feat)
                s_mean, s_std = calc_mean_std(s_feat)
                
                loss_s += mse_loss(g_mean, s_mean) + mse_loss(g_std, s_std)
            loss_s = loss_s * args.style_weight
            
            loss = loss_c + loss_s
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            progress_bar.set_description(f'Loss:{loss.item():4f}, Content Loss: {loss_c.item():4f}, Style Loss: {loss_s.item():4f}')

            running_loss += loss.item()
            running_content_loss += loss_c.item()
            running_style_loss += loss_s.item()
            
        
        scheduler.step()
        
        num_batches = min(len(content_dataloader), len(style_dataloader))
        running_loss /= num_batches
        running_content_loss /= num_batches
        running_style_loss /= num_batches

        if (epoch+1) % args.log_interval == 0:
            tqdm.write(f'Iter {epoch+1}: Loss:{running_loss:4f}, Content Loss: {running_content_loss:4f}, Style Loss: {running_style_loss:4f}')
            
        if (epoch + 1) % args.log_interval == 0 and g is not None and style_batch is not None and content_batch is not None:
            torch.save(decoder.state_dict(), save_dir / f'decoder_{epoch+1}.pth')
            torch.save(optimizer.state_dict(), save_dir / f'optimizer_{epoch+1}.pth')

            with torch.no_grad():
                output = torch.cat([content_batch, style_batch, g], dim=0)
                save_image(output, save_dir / f'output_{epoch+1}.png', nrow=args.batch_size)
            


if __name__ == "__main__":
    main()
