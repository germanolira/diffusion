
"""
DENOISER DDPM MINI - versão PyTorch UNet (pra rodar local com GPU)
Mesma lógica, mas com UNet real - gera muito melhor
pip install torch torchvision opencv-python matplotlib
"""
import torch
import torch.nn as nn
import cv2
import numpy as np

class MiniUNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.enc1 = nn.Sequential(nn.Conv2d(3,32,3,padding=1), nn.ReLU(), nn.Conv2d(32,32,3,padding=1), nn.ReLU())
        self.pool = nn.MaxPool2d(2)
        self.enc2 = nn.Sequential(nn.Conv2d(32,64,3,padding=1), nn.ReLU(), nn.Conv2d(64,64,3,padding=1), nn.ReLU())
        self.up = nn.ConvTranspose2d(64,32,2,2)
        self.dec = nn.Sequential(nn.Conv2d(64,32,3,padding=1), nn.ReLU(), nn.Conv2d(32,3,3,padding=1))
        self.time_emb = nn.Embedding(16,32)  # embedding do t

    def forward(self, x, t):
        # x: [B,3,H,W], t: [B]
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        t_emb = self.time_emb(t).view(-1,32,1,1) * 0.1
        e1 = e1 + t_emb
        d = self.up(e2)
        d = torch.cat([d, e1], dim=1)
        return self.dec(d)

# Treino simplificado
def train():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = MiniUNet().to(device)
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    # carregar sua imagem 128
    img = cv2.imread("cyberpunk.png")
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (128,128))
    img = torch.from_numpy(img).float()/255.0
    img = img.permute(2,0,1).unsqueeze(0).to(device)  # [1,3,128,128]

    T=16
    betas = torch.linspace(1e-4, 0.02, T).to(device)
    alphas = 1-betas
    alpha_bar = torch.cumprod(alphas, dim=0)

    for step in range(1000):
        t = torch.randint(0,T,(1,)).to(device)
        ab = alpha_bar[t]
        eps = torch.randn_like(img)
        noisy = torch.sqrt(ab)*img + torch.sqrt(1-ab)*eps
        pred = model(noisy, t)
        loss = nn.functional.mse_loss(pred, eps)
        opt.zero_grad()
        loss.backward()
        opt.step()
        if step%100==0:
            print(f"step {step} loss {loss.item():.4f}")
    torch.save(model.state_dict(), "denoiser_unet.pt")

if __name__ == "__main__":
    train()
