
"""
DENOISER DDPM MINI - versão sandbox (sklearn + OpenCV)
Treinado na sua imagem cyberpunk 128px
Igual ao que rodamos aqui: 1280 patches, MLP 256-128-64
"""
import cv2
import numpy as np
from sklearn.neural_network import MLPRegressor

# --- CONFIG ---
IMG_PATH = "cyberpunk.png"  # coloca sua imagem aqui
T = 16
BETAS = np.linspace(1e-4, 0.02, T)
ALPHAS = 1.0 - BETAS
ALPHA_BAR = np.cumprod(ALPHAS)
PS = 8
STRIDE = 8

def load_img(path, size=128):
    img = cv2.imread(path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (size,size), cv2.INTER_AREA)
    return img.astype(np.float32)/255.0

def extract_patches(img, ps=8, stride=8):
    patches = []
    for y in range(0, img.shape[0]-ps+1, stride):
        for x in range(0, img.shape[1]-ps+1, stride):
            patches.append(img[y:y+ps, x:x+ps, :])
    return np.array(patches)

def build_dataset(patches, alpha_bar, T, n_aug=5, seed=0):
    rng = np.random.RandomState(seed)
    X_list, y_list, t_list = [], [], []
    for _ in range(n_aug):
        for p in patches:
            t = rng.randint(0, T)
            ab = alpha_bar[t]
            eps = rng.randn(*p.shape)
            noisy = np.sqrt(ab)*p + np.sqrt(1-ab)*eps
            noisy = np.clip(noisy,0,1)
            X_list.append(noisy.reshape(-1))
            y_list.append(eps.reshape(-1))
            t_list.append(t / T)
    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.float32)
    X = np.concatenate([X, np.array(t_list)[:,None]], axis=1)
    return X, y

def denoise_rgb(noisy_img, mlp, t_idx, alpha_bar, T, ps=8, stride=4):
    H,W,C = noisy_img.shape
    acc = np.zeros((H,W,C), dtype=np.float32)
    cnt = np.zeros((H,W,1), dtype=np.float32)
    ab = alpha_bar[t_idx]
    t_norm = t_idx / T
    for y in range(0, H-ps+1, stride):
        for x in range(0, W-ps+1, stride):
            p = noisy_img[y:y+ps, x:x+ps, :].reshape(-1)
            inp = np.concatenate([p, [t_norm]])[None,:]
            pred_eps = mlp.predict(inp)[0].reshape(ps,ps,C)
            pred_clean = (noisy_img[y:y+ps, x:x+ps, :] - np.sqrt(1-ab)*pred_eps) / np.sqrt(ab)
            pred_clean = np.clip(pred_clean,0,1)
            acc[y:y+ps, x:x+ps, :] += pred_clean
            cnt[y:y+ps, x:x+ps, :] += 1
    return acc / np.maximum(cnt,1)

# --- TREINO ---
img = load_img(IMG_PATH, 128)
patches = extract_patches(img, PS, STRIDE)
print(f"patches: {patches.shape}")

X, y = build_dataset(patches, ALPHA_BAR, T, n_aug=5)
print(f"dataset X{X.shape} y{y.shape}")

mlp = MLPRegressor(hidden_layer_sizes=(256,128,64), activation='relu',
                   max_iter=500, batch_size=128, learning_rate='adaptive',
                   random_state=1)
mlp.fit(X, y)
print(f"treino finalizado: {mlp.n_iter_} iters, loss {mlp.loss_curve_[-1]:.4f}")

# --- GERAÇÃO a partir de ruído puro ---
rng = np.random.RandomState(7)
x = rng.randn(128,128,3).astype(np.float32)*0.8
for t in reversed(range(T)):
    x = denoise_rgb(x, mlp, t, ALPHA_BAR, T, ps=PS, stride=4)
    if t>0:
        ab_prev = ALPHA_BAR[t-1]
        eps = rng.randn(*x.shape).astype(np.float32)*0.25
        x = np.sqrt(ab_prev)*x + np.sqrt(1-ab_prev)*eps
        x = np.clip(x,0,1)

cv2.imwrite("generated_max.png", cv2.cvtColor((x*255).astype(np.uint8), cv2.COLOR_RGB2BGR))
print("salvo generated_max.png")
